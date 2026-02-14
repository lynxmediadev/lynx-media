import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const ok = firstValue(params.ok);
  const err = firstValue(params.err);
  const debugLink = firstValue(params.debugLink);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Restablecer password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ingresa tu email y te enviaremos un enlace de recuperación.
      </p>

      <form
        method="POST"
        action="/auth/forgot-password/submit"
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Email</label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {ok === "sent" ? (
          <p className="text-xs text-emerald-600">
            Si el email existe, enviamos un enlace para restablecer la password.
          </p>
        ) : null}
        {err === "rate_limited" ? (
          <p className="text-xs text-destructive">
            Demasiados intentos. Espera unos minutos antes de volver a intentar.
          </p>
        ) : null}
        {err === "captcha" ? (
          <p className="text-xs text-destructive">Valida el captcha para continuar.</p>
        ) : null}

        <AuthTurnstileField />
        <button className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          Enviar enlace
        </button>
      </form>

      {debugLink ? (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          <p className="mb-1 font-medium">Modo desarrollo (sin proveedor de email):</p>
          <a href={debugLink} className="break-all underline">
            {debugLink}
          </a>
        </div>
      ) : null}
    </main>
  );
}
