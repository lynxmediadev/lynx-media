import { formatExpiry, shellTemplate } from "@/lib/account-auth/email/templates/shared";

type BuildInviteEmailInput = {
  registerUrl: string;
  role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT";
  expiresAt: Date;
};

export function buildInviteEmail(input: BuildInviteEmailInput) {
  const expires = formatExpiry(input.expiresAt);
  const subject = "Invitación de acceso · Lynx Media";
  const intro = `Recibiste una invitación para crear tu cuenta (${input.role}) en Lynx Media.`;

  const html = shellTemplate({
    title: "Invitación de acceso",
    intro,
    ctaLabel: "Crear cuenta",
    ctaUrl: input.registerUrl,
    footerLines: [
      `Rol asignado: ${input.role}`,
      `Expira: ${expires}`,
      "Si no solicitaste este acceso, ignora este correo.",
    ],
  });

  const text = [
    "Invitación de acceso · Lynx Media",
    "",
    intro,
    `Rol asignado: ${input.role}`,
    `Expira: ${expires}`,
    "",
    `Crear cuenta: ${input.registerUrl}`,
    "",
    "Si no solicitaste este acceso, ignora este correo.",
  ].join("\n");

  return { subject, html, text };
}
