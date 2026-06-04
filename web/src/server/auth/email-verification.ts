const BYPASS_EMAILS = new Set(
  (process.env.EMAIL_VERIFICATION_BYPASS ?? "savapley@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isEmailVerifiedForAuth(user: {
  email: string;
  emailVerifiedAt: Date | null;
}): boolean {
  if (user.emailVerifiedAt) return true;
  return BYPASS_EMAILS.has(user.email.toLowerCase());
}
