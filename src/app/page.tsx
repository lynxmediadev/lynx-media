export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center
                 bg-background-light text-textcolor-light
                 dark:bg-background-dark dark:text-textcolor-dark
                 transition-colors duration-500"
    >
      <h1 className="text-4xl font-bold mb-6">Lynx Media</h1>
      <p>Haz clic en el botón arriba a la derecha para cambiar de tema</p>
    </main>
  );
}
