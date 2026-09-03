export const roles = ["student", "teacher", "admin"] as const;
export type Role = (typeof roles)[number];

export type AuthUser = {
  id: string;
  schoolId: string;
  role: Role;
  name: string;
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}
