import crypto from "node:crypto";
import prisma from "@/lib/prisma";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getErrorMessage(err: string) {
  if (err === "missing") return "Completa todos los campos.";
  if (err === "password") return "La password debe tener al menos 8 caracteres.";
  if (err === "invite") return "El token de invitación no es válido o expiró.";
  if (err === "exists") return "Ya existe una cuenta con ese email.";
  if (err === "email") return "El email no coincide con la invitación.";
  if (err === "rate_limited") return "Demasiados intentos. Espera unos minutos.";
  return "";
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export default async function AuthRegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const err = firstValue(params.err);
  const token = firstValue(params.token);
  const inviteEmail = token
    ? (
        await prisma.inviteToken.findFirst({
          where: {
            tokenHash: hashToken(token),
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          select: { email: true },
        })
      )?.email ?? ""
    : "";
  const hasValidInvite = Boolean(inviteEmail);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Crear cuenta</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Registro habilitado por invitación para mantener control de accesos.
      </p>

      <form
        method="POST"
        action="/auth/register/submit"
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Token invitación</label>
          <input
            type="text"
            name="token"
            required
            defaultValue={token}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {token && !hasValidInvite ? (
          <p className="text-xs text-destructive">
            El token en la URL no es válido o ya expiró. Genera una invitación nueva.
          </p>
        ) : null}
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Nombre</label>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {hasValidInvite ? (
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Email invitado</label>
            <input
              type="email"
              value={inviteEmail}
              readOnly
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-muted-foreground"
            />
            <input type="hidden" name="email" value={inviteEmail} />
          </div>
        ) : (
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
        )}
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Password</label>
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {err ? <p className="text-xs text-destructive">{getErrorMessage(err)}</p> : null}
        <button
          disabled={token.length > 0 && !hasValidInvite}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}
