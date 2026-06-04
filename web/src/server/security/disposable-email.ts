import domains from "disposable-email-domains";

const DISPOSABLE = new Set(domains.map((d) => d.toLowerCase()));

/** Common typosquat / temp providers not always in the list */
const EXTRA_BLOCKED = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "yopmail.com",
  "trashmail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
  "mintemail.com",
  "emailondeck.com",
]);

export function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).toLowerCase();
}

export function isDisposableEmail(email: string) {
  const domain = emailDomain(email);
  if (!domain) return false;
  return DISPOSABLE.has(domain) || EXTRA_BLOCKED.has(domain);
}
