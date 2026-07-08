import nodemailer from "nodemailer";
import { env } from "../config/env";

function getTransport() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.emailFrom) {
    throw new Error("Envio de e-mail não configurado. Preencha SMTP_HOST, SMTP_USER, SMTP_PASS e EMAIL_FROM.");
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
}

export async function sendVerificationCode(email: string, code: string, purpose: "register" | "reset") {
  const title = purpose === "register" ? "Confirme seu e-mail" : "Redefinição de senha";
  const description = purpose === "register"
    ? "Use este código para concluir seu cadastro no DENARIUS."
    : "Use este código para redefinir sua senha no DENARIUS.";

  await getTransport().sendMail({
    from: env.emailFrom,
    to: email,
    subject: `${code} — ${title}`,
    text: `${description}\n\nCódigo: ${code}\n\nEle expira em 10 minutos. Se você não solicitou isso, ignore este e-mail.`,
    html: `
      <div style="margin:0;background:#f5f6f7;padding:32px;font-family:Arial,sans-serif;color:#171717">
        <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px">
          <p style="margin:0 0 28px;font-size:18px;font-weight:700">DENARIUS</p>
          <h1 style="margin:0 0 12px;font-size:24px">${title}</h1>
          <p style="margin:0;color:#6b7280;line-height:1.6">${description}</p>
          <p style="margin:28px 0;padding:18px;background:#111827;border-radius:8px;color:#fff;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px">${code}</p>
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5">O código expira em 10 minutos. Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      </div>
    `,
  });
}
