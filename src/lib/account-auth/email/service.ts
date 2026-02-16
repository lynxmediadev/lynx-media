import "server-only";
import { buildInviteEmail } from "@/lib/account-auth/email/templates/invite";
import { buildResetPasswordEmail } from "@/lib/account-auth/email/templates/reset-password";
import { buildVerifyEmail } from "@/lib/account-auth/email/templates/verify-email";
import { sendAuthEmail } from "@/lib/account-auth/email";

export async function sendInviteEmail(input: {
  to: string;
  registerUrl: string;
  role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT";
  expiresAt: Date;
}) {
  const template = buildInviteEmail({
    registerUrl: input.registerUrl,
    role: input.role,
    expiresAt: input.expiresAt,
  });
  const result = await sendAuthEmail({
    kind: "invite",
    to: input.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  console.info("[auth:email] email_invite_sent", {
    provider: result.provider,
    to: input.to,
    role: input.role,
    messageId: result.messageId ?? null,
  });
  return result;
}

export async function sendResetPasswordEmail(input: {
  to: string;
  resetUrl: string;
  expiresAt: Date;
}) {
  const template = buildResetPasswordEmail({
    resetUrl: input.resetUrl,
    expiresAt: input.expiresAt,
  });
  const result = await sendAuthEmail({
    kind: "password_reset",
    to: input.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  console.info("[auth:email] email_reset_sent", {
    provider: result.provider,
    to: input.to,
    messageId: result.messageId ?? null,
  });
  return result;
}

export async function sendVerifyEmail(input: {
  to: string;
  verifyUrl: string;
  expiresAt: Date;
}) {
  const template = buildVerifyEmail({
    verifyUrl: input.verifyUrl,
    expiresAt: input.expiresAt,
  });
  const result = await sendAuthEmail({
    kind: "verify_email",
    to: input.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  console.info("[auth:email] email_verify_sent", {
    provider: result.provider,
    to: input.to,
    messageId: result.messageId ?? null,
  });
  return result;
}
