import { env } from "../config/env";

/**
 * Sends email through Brevo's HTTP API (free tier, no SMTP library needed).
 * Without BREVO_API_KEY (local dev) the message is printed to the server console instead.
 */
export async function sendMail(to: string, subject: string, text: string) {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) {
    console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false as const };
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { email: env.MAIL_FROM, name: "PawRescue" }, to: [{ email: to }], subject, textContent: text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error("Brevo send failed", res.status, await res.text().catch(() => ""));
    throw new Error("Email could not be sent");
  }
  return { delivered: true as const };
}
