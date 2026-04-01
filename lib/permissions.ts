/**
 * Role hierarchy:
 *   SUPERADMIN > ADMIN > custom roles (permission-based)
 *
 * Only SUPERADMIN can:
 *   - Create / edit / delete employees
 *   - Create / edit / delete departments
 *   - Create / edit / delete roles & permissions
 *   - Assign roles to employees
 *
 * ADMIN retains full access to all other operations.
 */

/** Accounts with SUPERADMIN role — for reference only; enforcement is via DB role. */
export const SUPERADMIN_EMAILS = [
  'greenagetechnologies@gmail.com',
  'coderstriangle@gmail.com',
  'info.promiseudo@gmail.com',
  'uche@greenagetech.com',
];

/** True only for the product-owner superadmin role. */
export function isSuperAdmin(role: string | undefined): boolean {
  return role === 'SUPERADMIN';
}

/** True for any elevated admin (SUPERADMIN or ADMIN). */
export function isAdminOrSuperAdmin(role: string | undefined): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN';
}
