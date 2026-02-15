export default function LandingHomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section style={{ maxWidth: 720, width: "100%" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>
          Lynx Media
        </p>
        <h1 style={{ marginTop: 8, marginBottom: 8, fontSize: "2rem", lineHeight: 1.1 }}>
          Landing en construcción
        </h1>
        <p style={{ opacity: 0.85 }}>
          Esta app corresponde al proyecto público de marca. La implementación
          funcional de secciones y formulario de contacto se realizará en las
          siguientes fases del plan de migración.
        </p>
      </section>
    </main>
  );
}

