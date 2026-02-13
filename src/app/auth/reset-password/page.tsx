import { findValidPasswordResetToken } from "@/lib/account-auth/reset";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const token = firstValue(params.token).trim();
  const err = firstValue(params.err);
  const validToken = token ? await findValidPasswordResetToken(token) : null;
  const canReset = Boolean(validToken);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Nueva password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Define una nueva password para tu cuenta.
      </p>

      <form
        method="POST"
        action="/auth/reset-password/submit"
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <input type="hidden" name="token" value={token} />

        {canReset ? (
          <p className="text-xs text-muted-foreground">
            Cuenta: {validToken?.user.email}
          </p>
        ) : (
          <p className="text-xs text-destructive">
            Token inválido, usado o expirado.
          </p>
        )}

        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Password nueva</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Repetir password</label>
          <input
            type="password"
            name="passwordConfirm"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {err === "mismatch" ? (
          <p className="text-xs text-destructive">Las passwords no coinciden.</p>
        ) : null}
        {err === "password" ? (
          <p className="text-xs text-destructive">La password debe tener al menos 8 caracteres.</p>
        ) : null}
        {err === "invalid" ? (
          <p className="text-xs text-destructive">El token no es válido o ya expiró.</p>
        ) : null}
        {err === "rate_limited" ? (
          <p className="text-xs text-destructive">
            Demasiados intentos. Espera unos minutos antes de volver a intentar.
          </p>
        ) : null}

        <button
          disabled={!canReset}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Guardar password
        </button>
      </form>
    </main>
  );
}

