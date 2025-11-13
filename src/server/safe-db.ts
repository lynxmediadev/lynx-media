// src/server/safe-db.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/server/safe-db.ts                                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace (peras y manzanas)                                                │
 * │ - Expone un helper `getDbOrNull()` que intenta conectar Prisma (`db`) con  │
 * │   un timeout breve. Si falla (sin red, credenciales, etc.), devuelve null  │
 * │   en vez de reventar el render del server component.                        │
 * │ - En modo “offline” (env `DB_OPTIONAL=1`), permite continuar el render con  │
 * │   UI vacía + banner de advertencia (sin 500).                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Por qué                                                                     │
 * │ - Cuando Supabase/DB no responde, Prisma lanza PrismaClientInitialization   │
 * │   Error en la PRIMERA query. Este helper hace `$connect()` con timeout y    │
 * │   permite que la UI degrade con gracia (fall back).                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Cómo se usa                                                                 │
 * │ - Importa `getDbOrNull()` en páginas que consultan BD.                      │
 * │ - Llama `const conn = await getDbOrNull();`                                 │
 * │ - Si `conn === null`, usa arreglos vacíos y muestra un banner.              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { db } from "@/server/db";

// Tiempo máximo de espera para conectar (ms).
const CONNECT_TIMEOUT_MS = 1200;

// Permite render “sin DB” para desarrollo local.
const DB_OPTIONAL =
  process.env.DB_OPTIONAL === "1" || process.env.DB_OPTIONAL === "true";

/**
 * Intenta conectar Prisma con timeout. Si no logra, devuelve null (si DB_OPTIONAL)
 * o relanza el error (si DB_OPTIONAL=0).
 */
export async function getDbOrNull() {
  try {
    // Correr $connect() con timeout explícito.
    await Promise.race([
      db.$connect(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `DB connect timeout after ${CONNECT_TIMEOUT_MS}ms (safe-db)`,
              ),
            ),
          CONNECT_TIMEOUT_MS,
        ),
      ),
    ]);

    return db;
  } catch (err) {
    // En desarrollo, podemos continuar sin DB (UI vacía + banner).
    if (DB_OPTIONAL) {
      console.error("[safe-db] No se pudo conectar a la BD:", err);
      return null;
    }
    // En producción, relanza el error (prefiero fallar ruidoso).
    throw err;
  }
}
