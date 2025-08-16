// Snippet de ejemplo para renderizar posts o items en una grilla responsiva.
// Úsalo como base para mostrar canciones, compositores u otros elementos.

import React from "react";

type SnippetPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

export function ExampleGrid({ posts }: { posts: SnippetPost[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex max-w-xs flex-col gap-2 rounded-xl bg-white/10 p-4"
        >
          <h3 className="text-2xl font-bold">{post.title}</h3>
          <p className="text-lg">{post.content}</p>
          <span className="text-sm text-gray-400">{post.createdAt}</span>
        </div>
      ))}
    </div>
  );
}
