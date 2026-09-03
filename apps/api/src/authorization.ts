import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "./types.js";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Authentication required" });
  }
}

export function allowRoles(...allowed: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await authenticate(request, reply);
    if (result) return result;
    if (!allowed.includes(request.user.role)) {
      return reply.code(403).send({ error: "You do not have permission for this action" });
    }
  };
}
