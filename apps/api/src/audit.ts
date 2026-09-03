import { sql } from "./db.js";
import type postgres from "postgres";

export async function writeAuditEvent(input: {
  schoolId: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const metadata = JSON.parse(JSON.stringify(input.metadata ?? {})) as postgres.JSONValue;
  await sql`
    INSERT INTO audit_events (school_id, actor_id, action, target_type, target_id, metadata)
    VALUES (${input.schoolId}, ${input.actorId ?? null}, ${input.action}, ${input.targetType},
      ${input.targetId ?? null}, ${sql.json(metadata)})
  `;
}
