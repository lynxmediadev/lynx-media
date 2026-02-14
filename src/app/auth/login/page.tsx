import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AuthLoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const err = firstValue(params.err);
  const next = firstValue(params.next);

  const message =
    err === "missing"
      ? "Completa email y password."
      : err === "invalid"
        ? "Credenciales inválidas."
        : err === "unverified"
          ? "Debes verificar tu email antes de iniciar sesión."
        : err === "rate_limited"
          ? "Demasiados intentos. Espera un momento e inténtalo nuevamente."
      : undefined;
  const okMessage = firstValue(params.ok);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Accede con tu cuenta para administrar tu catálogo.
      </p>

      <form
        method="POST"
        action="/auth/login/submit"
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <input type="hidden" name="next" value={next} />
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
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Password</label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {message ? <p className="text-xs text-destructive">{message}</p> : null}
        {err === "unverified" ? (
          <a href="/auth/verify-email" className="text-xs underline">
            Reenviar verificación
          </a>
        ) : null}
        {err === "captcha" ? (
          <p className="text-xs text-destructive">Valida el captcha para continuar.</p>
        ) : null}
        {okMessage === "password_reset" ? (
          <p className="text-xs text-emerald-600">Password actualizada. Ya puedes iniciar sesión.</p>
        ) : null}
        <AuthTurnstileField />
        <button className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          Entrar
        </button>
      </form>

      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <p>
          Registro por invitación: usa el enlace de invitación recibido para crear cuenta.
        </p>
        <p>
          ¿Olvidaste tu password?{" "}
          <a href="/auth/forgot-password" className="underline">
            Restablecer password
          </a>
        </p>
      </div>
    </main>
  );
}
