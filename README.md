# Leonardo V Academy Houses

A production-minded foundation for a school house-points platform. It separates the public/role-aware web experience from a documented API and keeps a permanent, auditable ledger of point awards.

## About the project

Leonardo V Academy Houses helps a school recognise everyday contribution in a clear, fair and visible way. Its public dashboard shows the current house standings, each house's total points and the leading student, while personal portals give each student a calm view of their own progress and achievements.

The platform has three roles:

- **Students** can view their personal points, achievement history, category progress and house standings.
- **Teachers** can view students and award points with a specific reason in Learning, Behaviour, Projects or Lesson participation.
- **Administrators** manage accounts, houses, categories and house imagery, while keeping the system fair and consistent.

Every point award is written to an append-only ledger with its category, reason, recipient and staff member. Corrections are recorded as reversals rather than silent edits, so the school can always understand how a score changed.

## Chosen stack

- **Web:** Next.js App Router, React and TypeScript. It gives the public leaderboard fast server rendering and the staff portal an accessible, responsive application shell.
- **API:** Fastify and TypeScript. The API is separate from the web server, validated at its boundary, documented with OpenAPI, and can scale independently.
- **Data:** PostgreSQL is the source of truth; Redis provides shared rate limiting. Point changes are append-only ledger entries, with reversals instead of deletion.
- **Operations:** Docker Compose supplies local parity. Production should use a managed PostgreSQL service, managed Redis, TLS termination, daily encrypted backups, monitoring, and a CI deployment that runs migrations before application rollout.

## Start locally

1. Copy `.env.example` to `.env`, set `POSTGRES_PASSWORD`, and replace both long secrets.
2. Run `npm install` and `npm run db:migrate`.
3. Start the dependencies with `docker compose up -d postgres redis`.
4. In two terminals, run `npm run dev:api` and `npm run dev:web`, then open `http://localhost:3000`.
5. Use the one-time bootstrap form at `http://localhost:3000/setup` with `BOOTSTRAP_TOKEN` to create the first administrator.

The API health check is at `http://localhost:4000/health`; interactive API documentation is at `http://localhost:4000/docs` in development.

## Verification

- `npm test` checks API validation and security behaviour.
- `npm run typecheck` and `npm run build` validate the application build.
- With the local web server running, `npm run test:e2e` exercises the public dashboard, theme switcher, sign-in form and responsive layout in desktop and phone-sized Chromium and WebKit profiles. `npm run test:e2e:full` adds Firefox. If the local Firefox executable cannot start, run the Firefox project in CI or on a machine with a working Firefox runtime: `npx playwright test --project=firefox-desktop`.

## Production deployment and operations

1. Provision a Linux host with Docker Compose, a DNS record for the chosen domain and a protected off-site backup destination.
2. Copy `.env.production.example` to `.env.production`, set the real domain and generate unique secrets and database credentials with a password manager. Keep `COOKIE_SECURE=true` and `TRUST_PROXY=true`.
3. Deploy with `docker compose --env-file .env.production -f docker-compose.production.yml up -d --build`.
4. The bundled Caddy reverse proxy obtains and renews TLS certificates, exposes only ports 80 and 443, and keeps PostgreSQL, Redis and the API on the internal Docker network.
5. The backup service makes an immediate PostgreSQL custom-format dump, then repeats daily by default and removes local dumps older than 30 days. Copy `backups-data` to encrypted, access-controlled off-site storage and practise restores before launch.
6. Monitor `https://<your-domain>/health` externally. Docker health checks restart unhealthy containers according to the production restart policy; alert on any endpoint failure and on missing daily backups.

## Security decisions already present

- Argon2id password hashing, short-lived HTTP-only access cookies and opaque, server-revocable refresh sessions.
- Role checks are enforced on the API, not merely by hiding web controls.
- Strict origin allow-list, security headers, request-size cap, input validation and shared Redis-backed rate limits.
- No default administrator, password, JWT secret, or database credential is committed to the project.
- Users are deactivated rather than removed; corrections create linked reversing ledger entries and write audit events.
- House images are stored with the school data (PNG, JPEG or WebP; maximum 2 MB), have their binary signature checked server-side, and are served with cache and content-type protections. This avoids trusting arbitrary third-party image links.
- Passwords must be at least 14 characters and contain upper- and lower-case letters, a number and a symbol. Administrative password resets revoke all refresh sessions and are audited.

Before launch, add the school’s SSO/identity provider, a data-retention policy, accessibility review with real students, staff training, backups/restore drills, and an external security review. Set `COOKIE_SECURE=true` and `TRUST_PROXY=true` only when the API is reachable exclusively through a trusted TLS reverse proxy.
