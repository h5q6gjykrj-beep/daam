/**
 * ⚠️ SUPER ADMIN CONFIGURATION
 * 
 * العربية:
 * قم بتغيير بريد المشرف العام من هنا فقط.
 * هذا هو البريد الوحيد المسموح له بالدخول إلى لوحة الإدارة (/admin).
 * لا تعدّل أي مكان آخر في الكود.
 * 
 * English:
 * Change the Super Admin email(s) here ONLY.
 * These emails are the only ones allowed to access the Admin Dashboard (/admin).
 * Do NOT modify admin access logic anywhere else.
 */

export const ADMIN_EMAILS = [
  "w.qq89@hotmail.com"
];

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
  );
}
