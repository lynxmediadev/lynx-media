// ================================================
// File: src/lib/db.ts
// Título: Cliente Prisma (con singleton en dev)
// Descripción: Expone un PrismaClient reutilizable (evita crear múltiples instancias en dev).
// Qué hace: Permite consultar/insertar datos en Postgres desde cualquier ruta/acción.
// Peras y manzanas: “Una única conexión para hablar con la base de datos.”
// ================================================
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
