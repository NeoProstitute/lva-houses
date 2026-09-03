# School administrator handover

This guide is for Leonardo V Academy Houses staff, not the project developer.

## Before opening the system to students

1. Create **two active school-owned administrator accounts**. Use staff email addresses, not a developer's address.
2. Store the production environment secrets in the school's password manager. Do not send them in chat or email.
3. Make the school the owner of the password-recovery email service and verified sending domain.
4. Assign named staff owners for:
   - student and teacher accounts;
   - recovery email and domain renewal;
   - backups and restore testing;
   - hosting billing and security alerts.
5. Run a test password reset and a backup restore using test data.

## Routine responsibilities

- Create, deactivate and correct accounts through the Administrator portal.
- Keep each account's school email address current, because it is used for password recovery.
- Deactivate departed staff and students promptly instead of sharing accounts.
- Review the audit log when investigating point or account changes.
- Check backup success and health alerts weekly.

## When support is needed

The school administrator handles ordinary access problems first:

- forgotten passwords: use the **Forgot your password?** page;
- incorrect email address: correct it in the Administrator portal;
- inactive account: reactivate it in the Administrator portal.

Contact a developer only for a system outage, security incident, hosting problem or an agreed change request. Keep an internal record of the incident, affected account and time; never send passwords or reset links to a developer.

## Safe access rules

- Never share administrator accounts or passwords.
- Require a unique password for every account.
- Do not upload real student data to a demo or test environment.
- Keep the developer account optional; the school must be able to operate the system without it.
