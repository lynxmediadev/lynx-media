// // ================================================
// // File: src/app/api/uploads/sign/route.ts
// // Título: API para firmar subidas (POST /api/uploads/sign)
// // Descripción: Recibe {fileName, contentType} y devuelve URL firmada para subir directo al bucket.
// // Qué hace: Permite que el front suba un archivo sin pasar por el servidor (solo firmamos).
// // Peras y manzanas: “Te doy un papel que dice ‘puedes subir este archivo aquí’ por 5 minutos.”
// // ================================================
// import { type NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import { signUpload } from "@/lib/storage/s3";

// const inputSchema = z.object({
//   fileName: z.string().min(1),
//   contentType: z.string().min(1),
//   prefix: z.string().min(1).optional(),
// });

// export async function POST(req: NextRequest) {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//   const json = await req.json();
//   const parsed = inputSchema.safeParse(json);
//   if (!parsed.success) {
//     return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
//   }
//   const { fileName, contentType, prefix } = parsed.data;
//   const signed = await signUpload({ fileName, contentType, prefix });
//   return NextResponse.json(signed, { status: 200 });
// }


// ================================================
// File: src/app/api/uploads/sign/route.ts
// Título: Stub de firma de subida (desactivado en Fase B)
// Descripción: Devuelve 501 Not Implemented mientras no tengamos S3/R2 configurado.
// Qué hace: Evita que Next compile dependencias de AWS y rompa la app.
// Peras y manzanas: “La puerta de la bodega está cerrada por ahora,
//                    pero el resto del edificio funciona perfecto.”
// ================================================
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not Implemented: storage signing disabled in Phase B" },
    { status: 501 }
  );
}
