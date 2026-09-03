import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { allowRoles } from "../authorization.js";
import { writeAuditEvent } from "../audit.js";
import { sql } from "../db.js";
import { inspectHouseImage, maxHouseImageBytes } from "../media.js";

const idParams = z.object({ id: z.string().uuid() });

export async function mediaRoutes(app: FastifyInstance) {
  app.get("/api/v1/media/houses/:id", async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return reply.code(404).send({ error: "Image not found" });
    const [media] = await sql<{ content_type: "image/png" | "image/jpeg" | "image/webp"; bytes: Buffer; content_hash: string }[]>`
      SELECT m.content_type, m.bytes, m.content_hash
      FROM house_media m WHERE m.house_id = ${params.data.id}
    `;
    if (!media) return reply.code(404).send({ error: "Image not found" });
    const etag = `"${media.content_hash}"`;
    if (request.headers["if-none-match"] === etag) return reply.code(304).send();
    return reply
      .header("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
      .header("Content-Security-Policy", "sandbox")
      .header("ETag", etag)
      .header("X-Content-Type-Options", "nosniff")
      .type(media.content_type)
      .send(media.bytes);
  });

  app.post("/api/v1/admin/houses/:id/media", {
    preHandler: allowRoles("admin"),
    config: { rateLimit: { max: 15, timeWindow: "1 minute" } }
  }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid house id" });
    const file = await request.file();
    if (!file || file.fieldname !== "image") return reply.code(400).send({ error: "Provide one image file" });
    const bytes = await file.toBuffer();
    const image = inspectHouseImage(bytes);
    if (!image) return reply.code(400).send({ error: "Use a PNG, JPEG or WebP image no larger than 2 MB" });
    const actor = request.user;
    const [house] = await sql<{ id: string }[]>`
      SELECT id FROM houses WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
    `;
    if (!house) return reply.code(404).send({ error: "House not found" });
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    const iconUrl = `/api/v1/media/houses/${house.id}`;
    await sql.begin(async (transaction) => {
      await transaction`
        INSERT INTO house_media (house_id, content_type, bytes, content_hash, updated_at)
        VALUES (${house.id}, ${image.contentType}, ${bytes}, ${contentHash}, now())
        ON CONFLICT (house_id) DO UPDATE SET
          content_type = EXCLUDED.content_type, bytes = EXCLUDED.bytes,
          content_hash = EXCLUDED.content_hash, updated_at = now()
      `;
      await transaction`UPDATE houses SET icon_url = ${iconUrl} WHERE id = ${house.id}`;
    });
    await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "house.image_uploaded", targetType: "house", targetId: house.id, metadata: { contentType: image.contentType, bytes: bytes.length } });
    return reply.code(201).send({ iconUrl });
  });

  app.delete("/api/v1/admin/houses/:id/media", { preHandler: allowRoles("admin") }, async (request, reply) => {
    const params = idParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid house id" });
    const actor = request.user;
    const [house] = await sql<{ id: string }[]>`
      SELECT id FROM houses WHERE id = ${params.data.id} AND school_id = ${actor.schoolId}
    `;
    if (!house) return reply.code(404).send({ error: "House not found" });
    await sql.begin(async (transaction) => {
      await transaction`DELETE FROM house_media WHERE house_id = ${house.id}`;
      await transaction`UPDATE houses SET icon_url = NULL WHERE id = ${house.id}`;
    });
    await writeAuditEvent({ schoolId: actor.schoolId, actorId: actor.id, action: "house.image_removed", targetType: "house", targetId: house.id });
    return reply.code(204).send();
  });
}
