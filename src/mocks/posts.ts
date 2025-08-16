// src/mocks/posts.ts

export type Post = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

export const mockPosts: Post[] = [
  {
    id: 1,
    title: "Primer post de prueba",
    content: "Este es el contenido de un post de prueba para el mock.",
    createdAt: "2025-08-16",
  },
  {
    id: 2,
    title: "Otro post falso",
    content: "Así es como puedes trabajar el diseño sin base de datos.",
    createdAt: "2025-08-17",
  },
];
