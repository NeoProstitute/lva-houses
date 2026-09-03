import type { Role } from "./types.js";

/**
 * A school must never lose its last active administrator through the normal
 * administration UI. The database count is locked in the route before this
 * decision is applied, so concurrent edits cannot bypass the safeguard.
 */
export function removesActiveAdmin(input: {
  existingRole: Role;
  existingActive: boolean;
  requestedRole: Role;
  requestedActive: boolean;
}) {
  return input.existingRole === "admin"
    && input.existingActive
    && (input.requestedRole !== "admin" || !input.requestedActive);
}

export function canRemoveActiveAdmin(activeAdminCount: number, input: {
  existingRole: Role;
  existingActive: boolean;
  requestedRole: Role;
  requestedActive: boolean;
}) {
  return !removesActiveAdmin(input) || activeAdminCount > 1;
}
