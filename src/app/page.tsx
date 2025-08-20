import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      {/* <div>
        <h1 className="text-4xl font-bold">Lynx Media</h1>
        <p className="max-w-xl text-lg">
          Bienvenido a la plataforma de gestión y producción audiovisual.
          Explora, organiza y activa tu marca con herramientas modernas.
        </p>
        <p className="font-display">dsaadsdsaads SADDSADASDJKFHDF</p>
        <p className="font-ui">dsaadsdsaads SADDSADASDJKFHDF</p>
        <p className="font-body">dsaadsdsaads SADDSADASDJKFHDF</p>
      </div> */}
      <Hero
      // Ejemplo: si quisieras personalizar desde aquí:
      // eyebrow="A MUSIC & LICENSING STUDIO"
      // headlineMain="Music"
      // headlineSub="for Picture"
      // description="Música y sonido para cine, TV, publicidad y nuevos medios."
      // projectTitle="Latest Reel"
      // projectCategory="Film / TV / Ads"
      // ctaText="Ver proyectos"
      // ctaHref="/projects"
      // backgroundImageUrl="/images/hero/lynx-hero.jpg"
      />
      <Gallery />


      {/* <section className="min-h-screen w-full py-10">
        <p className="">New block</p>
      </section> */}
      {/* <section className="bg-light min-h-screen w-full pt-5">
        <p className="text-dark">dsaadsdas</p>
      </section> */}

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
