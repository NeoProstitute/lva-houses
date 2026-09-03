# MVP launch checklist

## Completed in the current release

- Passwords use Argon2id hashes; raw passwords are never stored.
- Sessions use short-lived HTTP-only cookies and revocable refresh tokens.
- Password recovery uses one-time, 256-bit reset tokens. Only their SHA-256 hashes are stored; tokens expire after 20 minutes, are single-use, and revoke existing sessions after a successful reset.
- Login and recovery endpoints are rate-limited and avoid revealing whether an account exists.
- The last active school administrator cannot be deactivated or demoted.
- API role checks, audit events, input validation, security headers, TLS proxy configuration and production build checks are present.

## Required before real student data is used

1. **School-owned recovery email.** Create a school-owned Resend account, verify a school sending domain, set the recovery environment variables in the hosting dashboard, run migration `009_password_reset_tokens.sql`, then perform a real reset-email test with a test account.
2. **School ownership.** Create at least two staff-owned administrator accounts. The developer account must not be the only administrator or recovery contact.
3. **Protected infrastructure.** Use HTTPS, a managed PostgreSQL service or encrypted host disk, encrypted access-controlled off-site backups, a least-privilege database user, and unique secrets stored only in the host configuration.
4. **Recovery drill.** Practise restoring a backup and verify that a deactivated staff account cannot sign in.

## Next improvements

### Priority 1

- Add CSRF protection to cookie-authenticated state-changing endpoints.
- Add integration tests for password-reset request throttling, expiry, single use, delivery failure and session revocation.
- Add browser journeys for sign-in, all roles and password recovery, including Firefox in CI.

### Priority 2

- Add a school-facing help page for sign-in and password recovery.
- Document the admin handover, backup owner, email owner and incident contact inside the school.
- Add alerting for failed health checks and missed backups.

### Priority 3

- Consider Google Workspace or Microsoft 365 sign-in. It removes most password-reset work but requires school IT involvement.
- Add student point-notification preferences and export/reporting after the school validates the core workflow.

## Important security wording

No online system can truthfully be promised as impossible to hack. This project protects password and session secrets in the application; encryption of database disks and backups must be supplied by the chosen host and backup destination.
