import nodemailer from "nodemailer";
import { env } from "../config/env";

const smtp =
  env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS.replace(/\s+/g, "") },
      })
    : null;

/**
 * Email delivery, in order of preference:
 * 1. SMTP (e.g. Gmail with an app password)  2. Brevo HTTP API  3. dev: print to the console.
 */
export async function sendMail(to: string, subject: string, text: string) {
  if (smtp) {
    await smtp.sendMail({ from: `"PawRescue" <${env.MAIL_FROM || env.SMTP_USER}>`, to, subject, text });
    return { delivered: true as const };
  }
  if (env.BREVO_API_KEY && env.MAIL_FROM) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { email: env.MAIL_FROM, name: "PawRescue" }, to: [{ email: to }], subject, textContent: text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error("Email could not be sent");
    return { delivered: true as const };
  }
  console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
  return { delivered: false as const };
}
