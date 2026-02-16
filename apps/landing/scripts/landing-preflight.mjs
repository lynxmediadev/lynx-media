#!/usr/bin/env node

import { config as loadEnv } from "dotenv";
import { Resolver } from "node:dns/promises";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });
loadEnv({ path: "apps/landing/.env.local", quiet: true });
loadEnv({ path: "apps/landing/.env", quiet: true });

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
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

const normalizeEmail = (value) => (value || "").trim().toLowerCase();
const emailDomain = (value) => {
  const normalized = normalizeEmail(value);
  const atIndex = normalized.lastIndexOf("@");
  return atIndex >= 0 ? normalized.slice(atIndex + 1) : "";
};

async function getTxtRecords(hostname) {
  try {
    const records = await resolver.resolveTxt(hostname);
    return records.map((chunk) => chunk.join("")).filter(Boolean);
  } catch {
    return [];
  }
}

async function getCnameRecords(hostname) {
  try {
    return await resolver.resolveCname(hostname);
  } catch {
    return [];
  }
}

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

  const normalizedFrom = normalizeEmail(fromEmail);
  const normalizedNotify = normalizeEmail(notifyEmail);
  if (normalizedFrom && normalizedNotify && normalizedFrom === normalizedNotify) {
    warnings.push(
      "LANDING_CONTACT_NOTIFY_EMAIL es igual a LANDING_CONTACT_FROM_EMAIL. Esto puede subir la probabilidad de spam en la notificación interna.",
    );
  }

  const fromDomain = emailDomain(fromEmail);
  if (fromDomain) {
    const domainTxt = (await getTxtRecords(fromDomain)).map((record) => record.toLowerCase());
    const spfRecord = domainTxt.find((record) => record.startsWith("v=spf1"));
    if (!spfRecord) {
      warnings.push(
        `No se encontró SPF en ${fromDomain}. Recomendado: v=spf1 include:_spf.google.com include:spf.brevo.com -all`,
      );
    } else if (!spfRecord.includes("include:spf.brevo.com")) {
      warnings.push(
        `SPF de ${fromDomain} no incluye Brevo (include:spf.brevo.com).`,
      );
    }

    const dmarcRecords = await getTxtRecords(`_dmarc.${fromDomain}`);
    if (!dmarcRecords.some((record) => record.toLowerCase().startsWith("v=dmarc1"))) {
      warnings.push(`No se encontró registro DMARC válido en _dmarc.${fromDomain}.`);
    }

    const dkimCandidates = [
      `sib._domainkey.${fromDomain}`,
      `mail._domainkey.${fromDomain}`,
      `brevo1._domainkey.${fromDomain}`,
      `brevo2._domainkey.${fromDomain}`,
    ];
    const dkimChecks = await Promise.all(
      dkimCandidates.map(async (hostname) => ({
        hostname,
        txtRecords: await getTxtRecords(hostname),
        cnameRecords: await getCnameRecords(hostname),
      })),
    );
    const hasBrevoDkim = dkimChecks.some((entry) =>
      entry.txtRecords.some((record) => record.toLowerCase().includes("v=dkim1")) ||
      entry.cnameRecords.length > 0
    );
    if (!hasBrevoDkim) {
      warnings.push(
        `No se detectó DKIM de Brevo en ${dkimCandidates.join(" / ")}.`,
      );
    }
  }
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
