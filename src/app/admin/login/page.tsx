// src/app/admin/login/page.tsx
/**
 * /admin/login — GET: muestra el formulario y postea a /admin/login/submit
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Ingreso al panel</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ingresa la clave de administrador para acceder al panel privado.
      </p>
      <form method="POST" action="/admin/login/submit" className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Clave</label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          Entrar
        </button>
      </form>
    </main>
  );
}
