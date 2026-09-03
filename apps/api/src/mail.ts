import { env } from "./env.js";

export const passwordRecoveryEnabled = env.EMAIL_PROVIDER === "resend";

function resetUrl(token: string) {
  const url = new URL(env.PASSWORD_RESET_URL ?? `${env.WEB_ORIGIN}/reset-password`);
  url.searchParams.set("token", token);
  return url.toString();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  })[character] ?? character);
}

export async function sendPasswordResetEmail(recipient: string, name: string, token: string) {
  if (!passwordRecoveryEnabled) return false;
  const link = resetUrl(token);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [recipient],
        subject: "Reset your Leonardo V Academy Houses password",
        text: `Hello ${name},\n\nUse this one-time link to reset your password: ${link}\n\nThe link expires in 20 minutes. If you did not request it, you can safely ignore this email.`,
        html: `<p>Hello ${escapeHtml(name)},</p><p>Use this one-time link to reset your password:</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 20 minutes. If you did not request it, you can safely ignore this email.</p>`
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}
