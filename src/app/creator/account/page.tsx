import { requireRole } from "@/lib/account-auth/guards";

type CreatorAccountPageProps = {
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
  if (err === "invalid") return "No se pudo generar un token de verificación válido.";
  if (err === "rate_limited") return "Demasiados intentos. Espera unos minutos.";
  if (err === "verify_send_failed") return "No se pudo enviar el correo de verificación.";
  return err ? "No se pudo actualizar la password." : "";
}

export default async function CreatorAccountPage({ searchParams }: CreatorAccountPageProps) {
  const user = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator/account" });
  if (!user) return null;

  const params = (await searchParams) ?? {};
  const ok = firstValue(params.ok).trim();
  const err = firstValue(params.err).trim();
  const debugLink = firstValue(params.debugLink).trim();
  const errMsg = errorMessage(err);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu seguridad de acceso y estado de verificación.
        </p>
      </header>

      {ok === "password_changed" ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Password actualizada. Se cerraron sesiones anteriores.
        </p>
      ) : null}
      {ok === "verify_sent" ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Correo de verificación enviado.
        </p>
      ) : null}
      {ok === "already" ? (
        <p className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Tu email ya estaba verificado.
        </p>
      ) : null}
      {ok === "email_verified" ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Email verificado correctamente.
        </p>
      ) : null}

      {errMsg ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errMsg}
        </p>
      ) : null}
      {debugLink ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          <p className="mb-1 font-medium">Modo desarrollo (provider console):</p>
          <a href={debugLink} className="break-all underline">
            {debugLink}
          </a>
        </div>
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
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Email verificado</dt>
            <dd>{user.emailVerifiedAt ? "Sí" : "Pendiente"}</dd>
          </div>
        </dl>
        {!user.emailVerifiedAt ? (
          <form method="POST" action="/auth/verify-email/send" className="mt-3">
            <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
              Enviar correo de verificación
            </button>
          </form>
        ) : null}
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
