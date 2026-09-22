# Leonardo V Academy Houses — System Administrator Guide

This guide describes how to install, configure, monitor and hand over the production service to the school.

## What is included

The production stack uses Docker Compose and contains:

- a web application;
- an API service;
- PostgreSQL for school data;
- Redis for short-lived sessions and rate limiting;
- Caddy, which provides HTTPS and routes browser requests;
- an automated local database-backup service.

The services are designed to run on one Linux server. The database is not exposed to the public internet; only HTTPS ports 80 and 443 are published.

## Before installation

Prepare the following:

1. A supported Linux server with Docker Engine and the Docker Compose plugin.
2. A school-owned domain or subdomain, for example `houses.school.edu`.
3. DNS A/AAAA records for that domain pointing to the server.
4. Open inbound TCP ports 80 and 443.
5. A school-controlled mailbox or email service for password-recovery messages.
6. A password manager for the production secrets.

Do not use the presentation accounts or passwords in production.

## Install the application

1. Copy this whole folder to a protected directory on the server, for example `/opt/lva-houses`.
2. Do not copy `node_modules`, build output, logs, or local `.env` files from a development computer.
3. Change into the application directory.
4. Copy `.env.production.example` to `.env.production`.
5. Set the values described below. Keep `.env.production` readable only by the system administrator.
6. Start the stack:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

The API applies database migrations automatically when it starts. The first build may take several minutes.

## Configure `.env.production`

Set every placeholder before the first launch.

| Setting | Required value |
| --- | --- |
| `APP_DOMAIN` | The school domain, without `https://` |
| `WEB_ORIGIN` | `https://` followed by the same domain |
| `POSTGRES_PASSWORD` | A unique, password-manager-generated database password |
| `JWT_ACCESS_SECRET` | A unique random secret, at least 48 characters |
| `BOOTSTRAP_TOKEN` | A different unique random secret, at least 48 characters |
| `SCHOOL_SLUG` | A stable internal school identifier, for example `leonardo-v-academy-houses` |
| `EMAIL_PROVIDER` | `resend` after email delivery is configured; keep `disabled` only during initial technical setup |
| `EMAIL_FROM` | A verified school-owned sender address |
| `PASSWORD_RESET_URL` | `https://` followed by the domain and `/reset-password` |

Generate secrets with a password manager or a secure system tool. Never put the real `.env.production` file in Git, email, screenshots, or a shared chat.

## Enable password recovery

The recommended method is a school-owned domain verified with Resend:

1. Verify the domain in the school’s Resend account.
2. Create an API key limited to sending mail.
3. Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` in `.env.production`.
4. Restart the application:

```bash
docker compose -f docker-compose.production.yml up -d
```

5. Open the sign-in page and send one password-reset email to a test account.

Students then reset passwords themselves through **Forgot your password?**. The system administrator should not need to handle routine password requests.

## First-time setup and handover

1. Visit `https://your-school-domain/setup` after the service is healthy.
2. Enter the school name and create the first school administrator account.
3. Enter the one-time bootstrap token from `.env.production`.
4. Sign in as that administrator and immediately create at least one additional active school administrator.
5. Store the bootstrap token and all production secrets in the school’s password manager.
6. Give the school administrators ownership of their own user accounts, houses, categories and staff accounts.

The application prevents removal of the final active administrator. The school should nevertheless keep two active administrator accounts at all times.

## Verify the installation

After launch, check:

```bash
docker compose -f docker-compose.production.yml ps
curl -fsS https://your-school-domain/health
```

Expected result: every container reports healthy and the health endpoint succeeds.

Then test these user journeys with temporary school accounts:

1. Student sign-in and sign-out.
2. Teacher awards points with a reason.
3. Student sees the new points and achievement history.
4. Administrator can add a user and assign a student to a house.
5. Password-reset email arrives and completes successfully.

## Routine operations

### View service status and logs

```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=200 api web caddy
```

### Update to a reviewed release

1. Back up the database first.
2. Replace the application source with the reviewed release.
3. Review any new environment settings.
4. Rebuild and restart:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

5. Confirm `/health`, sign-in and an administrator workflow.

### Backup and recovery

The built-in backup service creates PostgreSQL dumps in the `backups-data` Docker volume and removes backups older than the configured retention period. It does **not** protect against loss of the entire server.

At least once per day, copy the newest encrypted backup to school-controlled storage outside the application server. Test a restoration before relying on any backup process.

To list available backups:

```bash
docker compose -f docker-compose.production.yml exec backup sh -lc 'ls -lh /backups'
```

For a recovery exercise, stop the application, restore into a separate test database first, verify the result, then follow the school’s approved recovery procedure.

## Security and privacy checklist

- Keep Docker, the host operating system and the application images updated.
- Restrict SSH access to authorised school administrators; use key-based authentication.
- Keep production secrets in the school password manager only.
- Do not expose PostgreSQL or Redis ports to the internet.
- Use a school domain with HTTPS; Caddy obtains and renews certificates automatically once DNS and ports are correct.
- Review who holds administrator access at least once per term.
- Export or delete school data only under the school’s own privacy and retention policy.

## Troubleshooting

| Symptom | First check |
| --- | --- |
| The site does not open | DNS record, ports 80/443, then `docker compose ... ps` |
| The health check fails | `docker compose ... logs --tail=200 api web caddy` |
| Password reset does not arrive | Email-provider settings, verified sender domain, spam folder, API logs |
| A user cannot sign in | Account is active, correct email/username, then use password recovery |
| A student cannot receive points | Confirm the student is active and assigned to a house; confirm the category is active |
