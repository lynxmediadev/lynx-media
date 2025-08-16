// src/app/page.tsx
import { getAllPosts } from "@/mocks/postsService";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1d1a20] to-[#000000] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Lynx Media 🎬
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex max-w-xs flex-col gap-2 rounded-xl bg-white/10 p-4"
            >
              <h3 className="text-2xl font-bold">{post.title}</h3>
              <p className="text-lg">{post.content}</p>
              <span className="text-sm text-gray-400">
                {post.createdAt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
