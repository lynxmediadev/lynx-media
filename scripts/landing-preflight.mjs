#!/usr/bin/env node

import { config as loadEnv } from "dotenv";

loadEnv({ path: "apps/landing/.env.local", quiet: true });
loadEnv({ path: "apps/landing/.env", quiet: true });
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const errors = [];
const warnings = [];

const dbUrl = (process.env.LANDING_DATABASE_URL || "").trim();
const publicUrl = (process.env.LANDING_PUBLIC_URL || "").trim();
const provider = (process.env.LANDING_CONTACT_EMAIL_PROVIDER || "console").trim().toLowerCase();
const notifyEmail = (process.env.LANDING_CONTACT_NOTIFY_EMAIL || "").trim();
const fromEmail = (
  process.env.LANDING_CONTACT_FROM_EMAIL ||
  process.env.AUTH_EMAIL_FROM ||
  ""
).trim();
const brevoKey = (
  process.env.LANDING_BREVO_API_KEY ||
  process.env.BREVO_API_KEY ||
  ""
).trim();
const autoReply = (process.env.LANDING_CONTACT_SEND_AUTOREPLY || "0").trim();

if (!dbUrl) {
  errors.push("Falta LANDING_DATABASE_URL.");
} else if (!dbUrl.startsWith("postgresql://")) {
  errors.push("LANDING_DATABASE_URL debe ser una URL PostgreSQL válida.");
}

if (!publicUrl) {
  warnings.push("LANDING_PUBLIC_URL no está definido. En local puede funcionar, pero en deploy conviene fijarlo.");
} else if (!/^https?:\/\//.test(publicUrl)) {
  errors.push("LANDING_PUBLIC_URL debe incluir protocolo (http:// o https://).");
}

if (!notifyEmail) {
  warnings.push("LANDING_CONTACT_NOTIFY_EMAIL está vacío. No habrá notificación interna.");
}

if (!["console", "brevo"].includes(provider)) {
  errors.push(
    `LANDING_CONTACT_EMAIL_PROVIDER inválido: "${provider}". Usa "console" o "brevo".`,
  );
}

if (provider === "brevo") {
  if (!brevoKey) errors.push("Falta LANDING_BREVO_API_KEY (o BREVO_API_KEY fallback).");
  if (!fromEmail) errors.push("Falta LANDING_CONTACT_FROM_EMAIL (o AUTH_EMAIL_FROM fallback).");
}

if (!["0", "1"].includes(autoReply)) {
  errors.push('LANDING_CONTACT_SEND_AUTOREPLY debe ser "0" o "1".');
}

if (autoReply === "1" && provider === "console") {
  warnings.push("Auto-reply activo con provider console: se verá en logs pero no enviará correo real.");
}

console.log("Landing preflight");
console.log(`- provider=${provider}`);
console.log(`- autoreply=${autoReply}`);
console.log(`- notify_email=${notifyEmail ? "set" : "empty"}`);
console.log(`- from_email=${fromEmail ? "set" : "empty"}`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nOK: configuración Landing válida.");
