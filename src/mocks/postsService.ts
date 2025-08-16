
// Paso 3 — Crear un "servicio de mock"
// Para simular una API, crea src/mocks/postsService.ts:
// CUANDO MIGRE A LA DATABASE REAL: Reemplazar con Prisma

// src/mocks/postsService.ts
import { mockPosts, type Post } from "./posts";

// Simula obtener todos los posts
export async function getAllPosts(): Promise<Post[]> {
  return mockPosts;
}

// Simula obtener un post por ID
export async function getPostById(id: number): Promise<Post | undefined> {
  return mockPosts.find((post) => post.id === id);
}
