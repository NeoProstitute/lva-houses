import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { allowRoles, authenticate } from "../authorization.js";
import { writeAuditEvent } from "../audit.js";
import { sql } from "../db.js";

const awardInput = z.object({
  studentId: z.string().uuid(),
  categoryId: z.string().uuid(),
  points: z.coerce.number().int().min(1).max(10000),
  reason: z.string().trim().min(3).max(500)
});
const idParams = z.object({ id: z.string().uuid() });

export async function awardRoutes(app: FastifyInstance) {
  app.get("/api/v1/awards/mine", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user;
    const condition = user.role === "student"
      ? sql`a.student_id = ${user.id}`
      : user.role === "teacher"
        ? sql`a.awarded_by = ${user.id}`
        : sql`true`;
    const awards = await sql`
      SELECT a.id, a.points, a.reason, a.created_at AS "createdAt", a.reversal_of AS "reversalOf",
        c.name AS "categoryName", student.name AS "studentName", teacher.name AS "awardedByName",
        h.name AS "houseName", h.color AS "houseColor"
      FROM point_awards a
      JOIN point_categories c ON c.id = a.category_id
      JOIN users student ON student.id = a.student_id
      JOIN users teacher ON teacher.id = a.awarded_by
      JOIN houses h ON h.id = a.house_id
      WHERE a.school_id = ${user.schoolId} AND ${condition}
      ORDER BY a.created_at DESC LIMIT 100
    `;
    const [balance] = user.role === "student"
      ? await sql<{ total: number }[]>`SELECT COALESCE(SUM(points), 0)::int AS total FROM point_awards WHERE student_id = ${user.id}`
      : [{ total: 0 }];
    const categorySummary = user.role === "student"
      ? await sql<Array<{ id: string; name: string; totalPoints: number; awardCount: number }>>`
          SELECT c.id, c.name, COALESCE(SUM(a.points), 0)::int AS "totalPoints", COUNT(a.id)::int AS "awardCount"
          FROM point_categories c
          LEFT JOIN point_awards a ON a.category_id = c.id AND a.student_id = ${user.id}
          WHERE c.school_id = ${user.schoolId} AND c.is_active = true
          GROUP BY c.id, c.name
          ORDER BY "totalPoints" DESC, c.name ASC
        `
      : [];
    return reply.send({ awards, totalPoints: balance.total, categorySummary });
  });

  app.post("/api/v1/awards", {
    preHandler: allowRoles("teacher", "admin"),
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } }
  }, async (request, reply) => {
    const parsed = awardInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Check the points, category and reason", details: parsed.error.flatten() });
    const { studentId, categoryId, points, reason } = parsed.data;
    const user = request.user;
    const award = await sql.begin(async (tx) => {
      const [student] = await tx<{ id: string; house_id: string | null }[]>`
        SELECT id, house_id FROM users
        WHERE id = ${studentId} AND school_id = ${user.schoolId} AND role = 'student' AND is_active = true
      `;
      if (!student?.house_id) throw new Error("STUDENT_NOT_FOUND");
      const [category] = await tx<{ id: string; max_points: number }[]>`
        SELECT id, max_points FROM point_categories
        WHERE id = ${categoryId} AND school_id = ${user.schoolId} AND is_active = true
      `;
      if (!category) throw new Error("CATEGORY_NOT_FOUND");
      if (points > category.max_points) throw new Error("CATEGORY_MAX_EXCEEDED");
      const [created] = await tx`
        INSERT INTO point_awards (school_id, student_id, house_id, category_id, awarded_by, points, reason)
        VALUES (${user.schoolId}, ${student.id}, ${student.house_id}, ${category.id}, ${user.id}, ${points}, ${reason})
        RETURNING id, points, created_at AS "createdAt"
      `;
      return created;
    }).catch((error: Error) => {
      if (["STUDENT_NOT_FOUND", "CATEGORY_NOT_FOUND", "CATEGORY_MAX_EXCEEDED"].includes(error.message)) return { error: error.message };
      throw error;
    });
    if ("error" in award) {
      const message = award.error === "STUDENT_NOT_FOUND" ? "Student not found or not assigned to a house"
        : award.error === "CATEGORY_NOT_FOUND" ? "Category not found" : "This category has a lower point limit";
      return reply.code(400).send({ error: message });
    }
    await writeAuditEvent({ schoolId: user.schoolId, actorId: user.id, action: "award.created", targetType: "point_award", targetId: award.id, metadata: { points } });
    return reply.code(201).send({ award });
  });

  app.post("/api/v1/awards/:id/reverse", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid award id" });
    const user = request.user;
    const reversal = await sql.begin(async (tx) => {
      const [original] = await tx<{ id: string; student_id: string; house_id: string; category_id: string; points: number }[]>`
        SELECT id, student_id, house_id, category_id, points
        FROM point_awards WHERE id = ${parsed.data.id} AND school_id = ${user.schoolId} AND reversal_of IS NULL
      `;
      if (!original) throw new Error("AWARD_NOT_FOUND");
      const [existing] = await tx<{ id: string }[]>`SELECT id FROM point_awards WHERE reversal_of = ${original.id}`;
      if (existing) throw new Error("ALREADY_REVERSED");
      const [created] = await tx`
        INSERT INTO point_awards (school_id, student_id, house_id, category_id, awarded_by, points, reason, reversal_of)
        VALUES (${user.schoolId}, ${original.student_id}, ${original.house_id}, ${original.category_id}, ${user.id},
          ${-original.points}, 'Administrative correction', ${original.id})
        RETURNING id, points, created_at AS "createdAt"
      `;
      return created;
    }).catch((error: Error) => {
      if (["AWARD_NOT_FOUND", "ALREADY_REVERSED"].includes(error.message)) return { error: error.message };
      throw error;
    });
    if ("error" in reversal) return reply.code(reversal.error === "AWARD_NOT_FOUND" ? 404 : 409).send({ error: reversal.error === "AWARD_NOT_FOUND" ? "Award not found" : "This award has already been reversed" });
    await writeAuditEvent({ schoolId: user.schoolId, actorId: user.id, action: "award.reversed", targetType: "point_award", targetId: parsed.data.id, metadata: { reversalId: reversal.id } });
    return reply.code(201).send({ reversal });
  });
}
