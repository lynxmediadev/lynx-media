import { requireRole } from "@/lib/account-auth/guards";

type AdminAccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function errorMessage(err: string) {
  if (err === "missing") return "Completa los tres campos de password.";
  if (err === "password") return "La nueva password debe tener al menos 8 caracteres.";
  if (err === "mismatch") return "La confirmación de password no coincide.";
  if (err === "invalid_current") return "La password actual no es correcta.";
  if (err === "rate_limited") return "Demasiados intentos. Espera unos minutos.";
  return err ? "No se pudo actualizar la password." : "";
}

export default async function AdminAccountPage({ searchParams }: AdminAccountPageProps) {
  const user = await requireRole(["ADMIN", "STAFF"], { redirectTo: "/admin/login" });
  if (!user) return null;

  const params = (await searchParams) ?? {};
  const ok = firstValue(params.ok).trim();
  const err = firstValue(params.err).trim();
  const errMsg = errorMessage(err);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la seguridad de tu cuenta de administración.
        </p>
      </header>

      {ok === "password_changed" ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Password actualizada. Se cerraron sesiones anteriores.
        </p>
      ) : null}

      {errMsg ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errMsg}
        </p>
      ) : null}

      <div className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Datos de sesión
        </h2>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Rol</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Nombre</dt>
            <dd>{user.name ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cambiar password
        </h2>
        <form
          method="POST"
          action="/auth/change-password/submit"
          className="grid gap-3 md:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">
              Password actual
            </label>
            <input
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">
              Nueva password
            </label>
            <input
              type="password"
              name="newPassword"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">
              Repetir password
            </label>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
              Actualizar password
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

