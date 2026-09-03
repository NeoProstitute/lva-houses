import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql } from "../db.js";
import { configuredSchool } from "../school.js";

const idParams = z.object({ id: z.string().uuid() });
const periodQuery = z.object({ period: z.enum(["week", "month", "term"]).default("week") });

function publicStudentName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "Student";
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
}

export async function houseRoutes(app: FastifyInstance) {
  app.get("/api/v1/houses/leaderboard", async (_request, reply) => {
    const school = await configuredSchool();
    if (!school) return reply.send({ school: null, houses: [], studentLeaders: [] });
    const houses = await sql`
      SELECT h.id, h.name, h.color, h.icon_url AS "iconUrl", h.meaning, h.symbol, h.description,
        COALESCE(SUM(a.points), 0)::int AS "totalPoints",
        COUNT(DISTINCT u.id)::int AS "studentCount"
      FROM houses h
      LEFT JOIN users u ON u.house_id = h.id AND u.role = 'student' AND u.is_active = true
      LEFT JOIN point_awards a ON a.house_id = h.id
      WHERE h.school_id = ${school.id}
      GROUP BY h.id
      ORDER BY "totalPoints" DESC, h.name ASC
    `;
    const studentRows = await sql<Array<{ name: string; houseName: string; houseColor: string; totalPoints: number }>>`
      SELECT u.name, h.name AS "houseName", h.color AS "houseColor",
        COALESCE(SUM(a.points), 0)::int AS "totalPoints"
      FROM users u
      JOIN houses h ON h.id = u.house_id
      LEFT JOIN point_awards a ON a.student_id = u.id
      WHERE u.school_id = ${school.id} AND u.role = 'student' AND u.is_active = true
      GROUP BY u.id, u.name, h.name, h.color
      ORDER BY "totalPoints" DESC, u.name ASC
      LIMIT 5
    `;
    const studentLeaders = studentRows.map((student) => ({ ...student, name: publicStudentName(student.name) }));
    return reply.send({ school: { name: school.name, slug: school.slug }, houses, studentLeaders });
  });

  app.get("/api/v1/houses/:id/history", async (request, reply) => {
    const params = idParams.safeParse(request.params);
    const query = periodQuery.safeParse(request.query);
    if (!params.success || !query.success) return reply.code(400).send({ error: "Invalid history request" });
    const school = await configuredSchool();
    if (!school) return reply.code(404).send({ error: "School not found" });
    const interval = query.data.period === "week" ? "week" : query.data.period === "month" ? "month" : "quarter";
    const [house] = await sql`
      SELECT id, name, color, icon_url AS "iconUrl", meaning, symbol, description
      FROM houses WHERE id = ${params.data.id} AND school_id = ${school.id}
    `;
    if (!house) return reply.code(404).send({ error: "House not found" });
    const rows = await sql`
      SELECT date_trunc(${interval}, created_at) AS period,
        SUM(points)::int AS "totalPoints", COUNT(*)::int AS "awardCount"
      FROM point_awards
      WHERE school_id = ${school.id} AND house_id = ${params.data.id}
      GROUP BY 1 ORDER BY 1 DESC LIMIT 24
    `;
    return reply.send({ house, period: query.data.period, history: rows });
  });
}
