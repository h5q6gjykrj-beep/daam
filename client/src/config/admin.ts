export const ADMIN_EMAILS = ["w.qq89@hotmail.com"];

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());
}
