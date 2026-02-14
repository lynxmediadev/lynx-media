type VerifyEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = (await searchParams) ?? {};
  const ok = firstValue(params.ok);
  const err = firstValue(params.err);
  const debugLink = firstValue(params.debugLink);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Verificación de email</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Confirma tu email para dejar la cuenta con seguridad completa.
      </p>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        {ok === "verified" ? (
          <p className="text-xs text-emerald-600">Email verificado correctamente.</p>
        ) : null}
        {ok === "sent" || ok === "verify_sent" ? (
          <p className="text-xs text-emerald-600">Enviamos un correo de verificación.</p>
        ) : null}
        {ok === "already" ? (
          <p className="text-xs text-muted-foreground">Tu email ya estaba verificado.</p>
        ) : null}
        {err === "invalid" ? (
          <p className="text-xs text-destructive">Token inválido, expirado o ya utilizado.</p>
        ) : null}
        {err === "send_failed" || err === "verify_send_failed" ? (
          <p className="text-xs text-destructive">
            No pudimos enviar el correo. Intenta nuevamente en unos minutos.
          </p>
        ) : null}
        {err === "rate_limited" ? (
          <p className="text-xs text-destructive">
            Llegaste al límite de reenvíos. Intenta nuevamente en unos minutos.
          </p>
        ) : null}

        <form method="POST" action="/auth/verify-email/send">
          <button className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent">
            Reenviar verificación
          </button>
        </form>

        <a
          href="/auth/login"
          className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-center text-sm hover:bg-accent"
        >
          Ir a login
        </a>
      </div>

      {debugLink ? (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          <p className="mb-1 font-medium">Modo desarrollo (provider console):</p>
          <a href={debugLink} className="break-all underline">
            {debugLink}
          </a>
        </div>
      ) : null}
    </main>
  );
}
