// ================================================
// File: prisma.config.ts
// Título: Configuración oficial de Prisma (CLI)
// Descripción: Declara la ruta del schema y el comando de seed.
// Qué hace: Reemplaza la configuración de package.json#prisma.
// Peras y manzanas: “El botón de ‘sembrar’ vive aquí, no en package.json.”
// ================================================
import "dotenv/config";                 // Carga las variables de .env para el CLI
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Ruta de tu schema Prisma (explícita por claridad)
  schema: path.join("prisma", "schema.prisma"),

  // Configuración de migraciones: declaramos el comando de seed
  migrations: {
    seed: "tsx prisma/seed.ts",         // Usa tu script TS de seed (B2)
    // path: path.join("prisma", "migrations"), // Opcional, si quisieras fijar otra carpeta
  },
});
