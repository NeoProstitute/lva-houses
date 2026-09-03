import * as argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { allowRoles, authenticate } from "../authorization.js";
import { writeAuditEvent } from "../audit.js";
import { canRemoveActiveAdmin, removesActiveAdmin } from "../admin-protection.js";
import { sql } from "../db.js";
import { passwordInput } from "../password.js";
import { roles } from "../types.js";

const createUserInput = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,30}$/),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: passwordInput,
  role: z.enum(roles),
  houseId: z.string().uuid().nullable().optional()
});
const updateUserInput = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,30}$/).optional(),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()).optional(),
  password: passwordInput.optional(),
  role: z.enum(roles).optional(),
  houseId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional()
}).refine((input) => Object.keys(input).length > 0, "Provide a change");
const houseInput = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  meaning: z.string().trim().max(80).optional(),
  symbol: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional()
});
const categoryInput = z.object({
  name: z.string().trim().min(1).max(80),
  maxPoints: z.coerce.number().int().min(1).max(10000)
});
const updateCategoryInput = categoryInput.partial().extend({ isActive: z.boolean().optional() })
  .refine((input) => Object.keys(input).length > 0, "Provide a change");
const idParams = z.object({ id: z.string().uuid() });

class LastActiveAdminError extends Error {
  constructor() {
    super("At least one active administrator is required");
  }
}

function invalid(reply: { code: (status: number) => { send: (body: unknown) => unknown } }, details: unknown) {
  return reply.code(400).send({ error: "Check the supplied information", details });
}

export async function administrationRoutes(app: FastifyInstance) {
  app.get("/api/v1/categories", { preHandler: authenticate }, async (request, reply) => {
    const categories = await sql`
      SELECT id, name, max_points AS "maxPoints"
      FROM point_categories WHERE school_id = ${request.user.schoolId} AND is_active = true ORDER BY name
    `;
    return reply.send({ categories });
  });

  app.get("/api/v1/students", { preHandler: allowRoles("teacher", "admin") }, async (request, reply) => {
    const students = await sql`
      SELECT u.id, u.name, u.house_id AS "houseId", h.name AS "houseName", h.color AS "houseColor"
      FROM users u JOIN houses h ON h.id = u.house_id
      WHERE u.school_id = ${request.user.schoolId} AND u.role = 'student' AND u.is_active = true
      ORDER BY h.name, u.name
    `;
    return reply.send({ students });
  });

  app.get("/api/v1/admin/users", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const users = await sql`
      SELECT u.id, u.name, u.username, u.email, u.role, u.is_active AS "isActive", u.house_id AS "houseId",
        h.name AS "houseName", u.created_at AS "createdAt"
      FROM users u LEFT JOIN houses h ON h.id = u.house_id
      WHERE u.school_id = ${request.user.schoolId}
      ORDER BY u.role, u.name
    `;
    return reply.send({ users });
  });

  app.post("/api/v1/admin/users", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const parsed = createUserInput.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error.flatten());
    const input = parsed.data;
    const user = request.user;
    if (input.role !== "student" && input.houseId) return reply.code(400).send({ error: "Only students can be assigned to a house" });
    if (input.role === "student" && !input.houseId) return reply.code(400).send({ error: "A student must be assigned to a house" });
    if (input.houseId) {
      const [house] = await sql<{ id: string }[]>`SELECT id FROM houses WHERE id = ${input.houseId} AND school_id = ${user.schoolId}`;
      if (!house) return reply.code(400).send({ error: "House not found" });
    }
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    try {
      const [created] = await sql`
        INSERT INTO users (school_id, house_id, name, username, email, role, password_hash)
        VALUES (${user.schoolId}, ${input.houseId ?? null}, ${input.name}, ${input.username}, ${input.email}, ${input.role}, ${passwordHash})
        RETURNING id, name, username, email, role, house_id AS "houseId", is_active AS "isActive"
      `;
      await writeAuditEvent({ schoolId: user.schoolId, actorId: user.id, action: "user.created", targetType: "user", targetId: created.id, metadata: { role: created.role } });
      return reply.code(201).send({ user: created });
    } catch (error: unknown) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") return reply.code(409).send({ error: "That email or username already belongs to this school" });
      throw error;
    }
  });

  app.patch("/api/v1/admin/users/:id", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    const parsed = updateUserInput.safeParse(request.body);
    if (!params.success) return invalid(reply, params.error.flatten());
    if (!parsed.success) return invalid(reply, parsed.error.flatten());
    const input = parsed.data;
    const actor = request.user;
    const [existing] = await sql<{ id: string; role: "student" | "teacher" | "admin"; house_id: string | null; is_active: boolean }[]>`
      SELECT id, role, house_id, is_active FROM users WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
    `;
    if (!existing) return reply.code(404).send({ error: "User not found" });
    if (params.data.id === actor.id && input.isActive === false) return reply.code(400).send({ error: "You cannot deactivate your own account" });
    const requestedRole = input.role ?? existing.role;
    const requestedHouse = input.houseId === undefined ? existing.house_id : input.houseId;
    const nextHouseId = requestedRole === "student" ? requestedHouse : null;
    if (requestedRole === "student" && !nextHouseId) {
      return reply.code(400).send({ error: "A student must be assigned to a house" });
    }
    if (nextHouseId) {
      const [house] = await sql<{ id: string }[]>`SELECT id FROM houses WHERE id = ${nextHouseId} AND school_id = ${actor.schoolId}`;
      if (!house) return reply.code(400).send({ error: "House not found" });
    }
    const passwordHash = input.password ? await argon2.hash(input.password, { type: argon2.argon2id }) : null;
    try {
      const updated = await sql.begin(async (tx) => {
        // Lock the edited account, then lock every active administrator before
        // changing a role or active state. This makes the last-admin guard safe
        // even if two administrators submit conflicting edits at the same time.
        const [lockedExisting] = await tx<{ role: "student" | "teacher" | "admin"; is_active: boolean }[]>`
          SELECT role, is_active FROM users
          WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
          FOR UPDATE
        `;
        if (!lockedExisting) throw new Error("User not found");
        const lockedRequestedRole = input.role ?? lockedExisting.role;
        const lockedRequestedActive = input.isActive ?? lockedExisting.is_active;
        const changeRemovesAdmin = removesActiveAdmin({
          existingRole: lockedExisting.role,
          existingActive: lockedExisting.is_active,
          requestedRole: lockedRequestedRole,
          requestedActive: lockedRequestedActive
        });
        if (changeRemovesAdmin) {
          const activeAdmins = await tx<{ id: string }[]>`
            SELECT id FROM users
            WHERE school_id = ${actor.schoolId} AND role = 'admin' AND is_active = true
            FOR UPDATE
          `;
          if (!canRemoveActiveAdmin(activeAdmins.length, {
            existingRole: lockedExisting.role,
            existingActive: lockedExisting.is_active,
            requestedRole: lockedRequestedRole,
            requestedActive: lockedRequestedActive
          })) throw new LastActiveAdminError();
        }
        const [result] = await tx`
          UPDATE users SET
            name = COALESCE(${input.name ?? null}, name),
            username = COALESCE(${input.username ?? null}, username),
            email = COALESCE(${input.email ?? null}, email),
            password_hash = COALESCE(${passwordHash}, password_hash),
            role = COALESCE(${input.role ?? null}::user_role, role),
            house_id = ${nextHouseId}::uuid,
            is_active = COALESCE(${input.isActive ?? null}, is_active), updated_at = now()
          WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
          RETURNING id, name, username, email, role, house_id AS "houseId", is_active AS "isActive"
        `;
        if (input.password) await tx`UPDATE refresh_sessions SET revoked_at = now() WHERE user_id = ${result.id} AND revoked_at IS NULL`;
        return result;
      });
      await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "user.updated", targetType: "user", targetId: updated.id, metadata: { passwordReset: Boolean(input.password) } });
      return reply.send({ user: updated });
    } catch (error: unknown) {
      if (error instanceof LastActiveAdminError) return reply.code(400).send({ error: error.message });
      if (typeof error === "object" && error && "code" in error && error.code === "23505") return reply.code(409).send({ error: "That email or username already belongs to this school" });
      throw error;
    }
  });

  app.get("/api/v1/admin/houses", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const houses = await sql`
      SELECT id, name, color, icon_url AS "iconUrl", meaning, symbol, description FROM houses WHERE school_id = ${request.user.schoolId} ORDER BY name
    `;
    return reply.send({ houses });
  });

  app.post("/api/v1/admin/houses", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const parsed = houseInput.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error.flatten());
    const actor = request.user;
    try {
      const [house] = await sql`
        INSERT INTO houses (school_id, name, color, meaning, symbol, description)
        VALUES (${actor.schoolId}, ${parsed.data.name}, ${parsed.data.color}, ${parsed.data.meaning ?? ""}, ${parsed.data.symbol ?? ""}, ${parsed.data.description ?? ""})
        RETURNING id, name, color, icon_url AS "iconUrl", meaning, symbol, description
      `;
      await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "house.created", targetType: "house", targetId: house.id });
      return reply.code(201).send({ house });
    } catch (error: unknown) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") return reply.code(409).send({ error: "House names must be unique" });
      throw error;
    }
  });

  app.patch("/api/v1/admin/houses/:id", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    const parsed = houseInput.partial().refine((value) => Object.keys(value).length > 0).safeParse(request.body);
    if (!params.success) return invalid(reply, params.error.flatten());
    if (!parsed.success) return invalid(reply, parsed.error.flatten());
    const actor = request.user;
    const [house] = await sql`
      UPDATE houses SET
          name = COALESCE(${parsed.data.name ?? null}, name),
          color = COALESCE(${parsed.data.color ?? null}, color),
          meaning = COALESCE(${parsed.data.meaning ?? null}, meaning),
          symbol = COALESCE(${parsed.data.symbol ?? null}, symbol),
          description = COALESCE(${parsed.data.description ?? null}, description)
      WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
        RETURNING id, name, color, icon_url AS "iconUrl", meaning, symbol, description
    `;
    if (!house) return reply.code(404).send({ error: "House not found" });
    await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "house.updated", targetType: "house", targetId: house.id });
    return reply.send({ house });
  });

  app.get("/api/v1/admin/categories", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const categories = await sql`
      SELECT id, name, max_points AS "maxPoints", is_active AS "isActive"
      FROM point_categories WHERE school_id = ${request.user.schoolId} ORDER BY name
    `;
    return reply.send({ categories });
  });

  app.post("/api/v1/admin/categories", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const parsed = categoryInput.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error.flatten());
    const actor = request.user;
    try {
      const [category] = await sql`
        INSERT INTO point_categories (school_id, name, max_points)
        VALUES (${actor.schoolId}, ${parsed.data.name}, ${parsed.data.maxPoints})
        RETURNING id, name, max_points AS "maxPoints", is_active AS "isActive"
      `;
      await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "category.created", targetType: "point_category", targetId: category.id });
      return reply.code(201).send({ category });
    } catch (error: unknown) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") return reply.code(409).send({ error: "Category names must be unique" });
      throw error;
    }
  });

  app.patch("/api/v1/admin/categories/:id", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    const parsed = updateCategoryInput.safeParse(request.body);
    if (!params.success) return invalid(reply, params.error.flatten());
    if (!parsed.success) return invalid(reply, parsed.error.flatten());
    const actor = request.user;
    const [category] = await sql`
      UPDATE point_categories SET
        name = COALESCE(${parsed.data.name ?? null}, name),
        max_points = COALESCE(${parsed.data.maxPoints ?? null}, max_points),
        is_active = COALESCE(${parsed.data.isActive ?? null}, is_active)
      WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
      RETURNING id, name, max_points AS "maxPoints", is_active AS "isActive"
    `;
    if (!category) return reply.code(404).send({ error: "Category not found" });
    await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "category.updated", targetType: "point_category", targetId: category.id });
    return reply.send({ category });
  });
}
