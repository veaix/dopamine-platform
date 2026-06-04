import nodemailer from "nodemailer";

function mailFrom() {
  return (
    process.env.MAIL_FROM ??
    process.env.EMAIL_FROM ??
    "dopamine <noreply@dopamine.cfd>"
  );
}

function getTransporter() {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.resend.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER ?? "resend",
        pass: resendKey,
      },
    });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

async function sendViaResendApi(params: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const from = mailFrom();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[mail:resend]", res.status, body);
    return false;
  }
  return true;
}

export async function sendPlainEmail(params: { to: string; subject: string; text: string }) {
  if (process.env.RESEND_API_KEY) {
    const sent = await sendViaResendApi(params);
    if (sent) return { ok: true as const };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[mail:dev] to ${params.to}: ${params.subject}`);
    return { ok: true as const, dev: true };
  }

  await transporter.sendMail({
    from: mailFrom(),
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
  return { ok: true as const };
}

export async function sendCodeEmail(params: {
  to: string;
  code: string;
  purpose: "verify_email" | "reset_password";
}) {
  const title =
    params.purpose === "verify_email" ? "Код подтверждения email" : "Код для смены пароля";
  const text = `Ваш код: ${params.code}. Он действует 10 минут.`;

  if (process.env.RESEND_API_KEY) {
    const sent = await sendViaResendApi({ to: params.to, subject: title, text });
    if (sent) return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[mail:dev] ${params.purpose} code for ${params.to}: ${params.code}`);
    return;
  }

  await transporter.sendMail({
    from: mailFrom(),
    to: params.to,
    subject: title,
    text,
  });
}
