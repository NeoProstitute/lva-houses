import { randomBytes, timingSafeEqual } from "node:crypto";
import * as argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { clearSessionCookies, createRefreshToken, hashToken, publicUser, refreshExpiry, setSessionCookies } from "../auth.js";
import { writeAuditEvent } from "../audit.js";
import { sql } from "../db.js";
import { env } from "../env.js";
import { configuredSchool } from "../school.js";
import type { AuthUser, Role } from "../types.js";
import { passwordInput } from "../password.js";
import { passwordRecoveryEnabled, sendPasswordResetEmail } from "../mail.js";

const emailInput = z.string().trim().email().max(254).transform((email) => email.toLowerCase());
const usernameInput = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,30}$/);

const credentials = z.object({
  login: z.string().trim().min(3).max(254).transform((login) => login.toLowerCase()),
  // Existing accounts may have been created before the strengthened policy.
  // Keep login compatible long enough for an administrator to rotate them.
  password: z.string().min(1).max(128)
});

const bootstrapInput = z.object({
  schoolName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  username: usernameInput,
  email: emailInput,
  password: passwordInput
});

const passwordResetRequestInput = z.object({ email: emailInput });
const passwordResetInput = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: passwordInput
});

type AccountRow = AuthUser & { password_hash: string; is_active: boolean };

function safeEqual(first: string, second: string) {
  const left = Buffer.from(first);
  const right = Buffer.from(second);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function startSession(app: FastifyInstance, user: AuthUser) {
  const refreshToken = createRefreshToken();
  await sql`
    INSERT INTO refresh_sessions (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${hashToken(refreshToken)}, ${refreshExpiry()})
  `;
  return { accessToken: app.jwt.sign(user), refreshToken };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/bootstrap", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } }
  }, async (request, reply) => {
    const suppliedToken = request.headers["x-bootstrap-token"];
    if (typeof suppliedToken !== "string" || !safeEqual(suppliedToken, env.BOOTSTRAP_TOKEN)) {
      return reply.code(401).send({ error: "Invalid setup token" });
    }
    const parsed = bootstrapInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Check the setup details", details: parsed.error.flatten() });

    const existingSchool = await configuredSchool();
    if (existingSchool) {
      const [existingUser] = await sql<{ id: string }[]>`SELECT id FROM users WHERE school_id = ${existingSchool.id} LIMIT 1`;
      if (existingUser) return reply.code(409).send({ error: "Initial setup has already been completed" });
    }

    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const user = await sql.begin(async (tx) => {
      const [school] = existingSchool
        ? [existingSchool]
        : await tx<{ id: string; name: string; slug: string }[]>`
            INSERT INTO schools (name, slug) VALUES (${parsed.data.schoolName}, ${env.SCHOOL_SLUG})
            RETURNING id, name, slug
          `;
      if (!existingSchool) {
        await tx`
          INSERT INTO houses (school_id, name, color, meaning, symbol, description, icon_url) VALUES
            (${school.id}, 'Curiositas', '#FFDA61', 'Curiosity', 'Set of keys', 'Illumination begins with questions, discovery and the courage to unlock new knowledge.', '/house-emblems/curiositas-mark-v5.png'),
            (${school.id}, 'Humanitas', '#EE3F6C', 'Empathy', 'Hand', 'Empathy brings people together through care, understanding and shared humanity.', NULL),
            (${school.id}, 'Veritas', '#4677E6', 'Honesty', 'Mirror', 'Honesty asks us to reflect clearly, speak truthfully and act with integrity.', '/house-emblems/veritas-mark-v5.png'),
            (${school.id}, 'Sapientia', '#602889', 'Wisdom', 'Owl', 'Wisdom grows through thoughtful learning, perspective and purposeful choices.', '/house-emblems/sapientia-mark-v5.png')
        `;
        await tx`
          INSERT INTO point_categories (school_id, name, max_points) VALUES
            (${school.id}, 'Learning', 100),
            (${school.id}, 'Behaviour', 100),
            (${school.id}, 'Projects', 100),
            (${school.id}, 'Lesson participation', 100)
        `;
      }
      const [admin] = await tx<AuthUser[]>`
        INSERT INTO users (school_id, name, username, email, role, password_hash)
        VALUES (${school.id}, ${parsed.data.name}, ${parsed.data.username}, ${parsed.data.email}, 'admin', ${passwordHash})
        RETURNING id, school_id AS "schoolId", role, name
      `;
      return admin;
    });
    const session = await startSession(app, user);
    setSessionCookies(reply, session.accessToken, session.refreshToken);
    await writeAuditEvent({ schoolId: user.schoolId, actorId: user.id, action: "bootstrap.completed", targetType: "school", targetId: user.schoolId });
    return reply.code(201).send({ user: publicUser(user) });
  });

  app.post("/api/v1/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } }
  }, async (request, reply) => {
    const parsed = credentials.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Enter a valid email or username and password" });
    const school = await configuredSchool();
    if (!school) return reply.code(503).send({ error: "The school has not been set up yet" });
    const [account] = await sql<AccountRow[]>`
      SELECT id, school_id AS "schoolId", role, name, password_hash, is_active
      FROM users
      WHERE school_id = ${school.id} AND (email = ${parsed.data.login} OR username = ${parsed.data.login})
      LIMIT 1
    `;
    const validPassword = account ? await argon2.verify(account.password_hash, parsed.data.password) : false;
    if (!account || !account.is_active || !validPassword) {
      return reply.code(401).send({ error: "Email or password is not recognised" });
    }
    const user: AuthUser = { id: account.id, schoolId: account.schoolId, role: account.role as Role, name: account.name };
    const session = await startSession(app, user);
    setSessionCookies(reply, session.accessToken, session.refreshToken);
    await writeAuditEvent({ schoolId: user.schoolId, actorId: user.id, action: "auth.login", targetType: "user", targetId: user.id });
    return reply.send({ user: publicUser(user) });
  });

  app.get("/api/v1/auth/password-recovery", async (_request, reply) => {
    return reply.send({ enabled: passwordRecoveryEnabled });
  });

  app.post("/api/v1/auth/forgot-password", {
    // A school may share one public IP address. Per-account throttling below
    // protects inboxes without preventing an entire classroom from recovering
    // access during the same hour.
    config: { rateLimit: { max: 30, timeWindow: "1 hour" } }
  }, async (request, reply) => {
    if (!passwordRecoveryEnabled) return reply.code(503).send({ error: "Password recovery is not configured yet. Please contact your school administrator." });
    const parsed = passwordResetRequestInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Enter a valid school email address" });

    const school = await configuredSchool();
    if (!school) return reply.code(503).send({ error: "The school has not been set up yet" });
    const [account] = await sql<(AuthUser & { email: string; is_active: boolean; last_reset_at: Date | null })[]>`
      SELECT u.id, u.school_id AS "schoolId", u.role, u.name, u.email, u.is_active,
        (
          SELECT created_at FROM password_reset_tokens
          WHERE user_id = u.id AND created_at > now() - interval '15 minutes'
          ORDER BY created_at DESC LIMIT 1
        ) AS last_reset_at
      FROM users u
      WHERE u.school_id = ${school.id} AND u.email = ${parsed.data.email} LIMIT 1
    `;
    // Keep this response identical for unknown and inactive accounts to prevent account discovery.
    if (!account || !account.is_active) return reply.send({ message: "If that address belongs to an active account, a reset link has been sent." });
    // Do not turn password recovery into an inbox-spam tool. Keep the same
    // generic response so this also does not reveal whether the email exists.
    if (account.last_reset_at) return reply.send({ message: "If that address belongs to an active account, a reset link has been sent." });

    const token = randomBytes(32).toString("base64url");
    const issued = await sql.begin(async (tx) => {
      // Lock this user before checking the throttle and issuing a token. Two
      // simultaneous requests can otherwise send two valid reset links.
      const [lockedAccount] = await tx<{ id: string; is_active: boolean }[]>`
        SELECT id, is_active FROM users WHERE id = ${account.id} FOR UPDATE
      `;
      if (!lockedAccount?.is_active) return false;
      const [recentReset] = await tx<{ id: string }[]>`
        SELECT id FROM password_reset_tokens
        WHERE user_id = ${account.id} AND created_at > now() - interval '15 minutes'
        ORDER BY created_at DESC LIMIT 1
      `;
      if (recentReset) return false;
      await tx`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${account.id} AND used_at IS NULL`;
      await tx`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${account.id}, ${hashToken(token)}, now() + interval '20 minutes')
      `;
      return true;
    });
    if (!issued) return reply.send({ message: "If that address belongs to an active account, a reset link has been sent." });
    const delivered = await sendPasswordResetEmail(account.email, account.name, token);
    if (!delivered) {
      await sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${account.id} AND used_at IS NULL`;
      request.log.error({ userId: account.id }, "Password reset email delivery failed");
      return reply.code(503).send({ error: "Password recovery is temporarily unavailable. Please try again later." });
    }
    await writeAuditEvent({ schoolId: account.schoolId, actorId: account.id, action: "auth.password_reset_requested", targetType: "user", targetId: account.id });
    return reply.send({ message: "If that address belongs to an active account, a reset link has been sent." });
  });

  app.post("/api/v1/auth/reset-password", {
    config: { rateLimit: { max: 5, timeWindow: "1 hour" } }
  }, async (request, reply) => {
    const parsed = passwordResetInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Use a valid reset link and a stronger password", details: parsed.error.flatten() });
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const reset = await sql.begin(async (tx) => {
      // A reset token is strictly single-use, even if two browser requests
      // arrive at nearly the same moment.
      const [lockedReset] = await tx<(AuthUser & { reset_id: string })[]>`
        SELECT r.id AS reset_id, u.id, u.school_id AS "schoolId", u.role, u.name
        FROM password_reset_tokens r JOIN users u ON u.id = r.user_id
        WHERE r.token_hash = ${hashToken(parsed.data.token)} AND r.used_at IS NULL
          AND r.expires_at > now() AND u.is_active = true
        LIMIT 1 FOR UPDATE OF r
      `;
      if (!lockedReset) return null;
      await tx`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${lockedReset.id}`;
      await tx`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${lockedReset.id} AND used_at IS NULL`;
      await tx`UPDATE refresh_sessions SET revoked_at = now() WHERE user_id = ${lockedReset.id} AND revoked_at IS NULL`;
      return lockedReset;
    });
    if (!reset) return reply.code(400).send({ error: "This reset link is invalid or has expired. Request a new one." });
    await writeAuditEvent({ schoolId: reset.schoolId, actorId: reset.id, action: "auth.password_reset_completed", targetType: "user", targetId: reset.id });
    return reply.code(204).send();
  });

  app.post("/api/v1/auth/refresh", {
    config: { rateLimit: { max: 30, timeWindow: "15 minutes" } }
  }, async (request, reply) => {
    const token = request.cookies.school_refresh;
    if (!token) return reply.code(401).send({ error: "Session expired" });
    const [session] = await sql<(AuthUser & { session_id: string })[]>`
      SELECT s.id AS session_id, u.id, u.school_id AS "schoolId", u.role, u.name
      FROM refresh_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
        AND s.revoked_at IS NULL AND u.is_active = true
      LIMIT 1
    `;
    if (!session) {
      clearSessionCookies(reply);
      return reply.code(401).send({ error: "Session expired" });
    }
    await sql`UPDATE refresh_sessions SET revoked_at = now() WHERE id = ${session.session_id}`;
    const user: AuthUser = { id: session.id, schoolId: session.schoolId, role: session.role as Role, name: session.name };
    const nextSession = await startSession(app, user);
    setSessionCookies(reply, nextSession.accessToken, nextSession.refreshToken);
    return reply.send({ user: publicUser(user) });
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const token = request.cookies.school_refresh;
    if (token) await sql`UPDATE refresh_sessions SET revoked_at = now() WHERE token_hash = ${hashToken(token)}`;
    clearSessionCookies(reply);
    return reply.code(204).send();
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const [account] = await sql<{ is_active: boolean; house_id: string | null }[]>`
        SELECT is_active, house_id FROM users WHERE id = ${request.user.id} AND school_id = ${request.user.schoolId}
      `;
      if (!account?.is_active) throw new Error("inactive account");
      return reply.send({ user: { ...publicUser(request.user), houseId: account.house_id } });
    } catch {
      return reply.code(401).send({ error: "Session expired" });
    }
  });
}
