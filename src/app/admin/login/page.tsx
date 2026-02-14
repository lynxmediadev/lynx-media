// src/app/admin/login/page.tsx
/**
 * /admin/login — GET: login principal por cuenta (email/password),
 * con fallback legacy por clave admin mientras dura la migración.
 */
import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";
export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function Page({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const err = firstValue(params.err);
  const message =
    err === "1"
      ? "Credenciales inválidas."
      : err === "missing"
        ? "Completa email y password."
        : err === "unverified"
          ? "Debes verificar tu email antes de ingresar al panel."
        : err === "rate_limited"
          ? "Demasiados intentos. Espera un momento e inténtalo nuevamente."
        : undefined;

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Ingreso al panel</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Accede con tu cuenta ADMIN/STAFF. Legacy por clave seguirá disponible temporalmente.
      </p>
      <form method="POST" action="/admin/login/submit" className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Email</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Password</label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Clave legacy (temporal)</label>
          <input
            type="password"
            name="legacy_key"
            autoComplete="off"
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
        <AuthTurnstileField />
        <button className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          Entrar
        </button>
      </form>
    </main>
  );
}
