export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#130b1d] to-[#020204] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Lynx Media
        </h1>
        <p className="text-lg text-center max-w-xl">
          Bienvenido a mi catálogo personal de música.  
          Aquí encontrarás piezas originales creadas para audiovisual, cine y música urbana.
        </p>
        {/* Aquí irán los futuros componentes, como About, MusicGrid, Contact, etc. */}
      </div>
    </main>
  );
}
