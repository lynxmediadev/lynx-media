type VerifyEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = (await searchParams) ?? {};
  const token = firstValue(params.token);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Verificación de email</h1>
      <p className="text-sm text-muted-foreground">
        En v1 el registro es por invitación y la cuenta queda validada al completar el alta.
      </p>
      {token ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Token recibido: <span className="font-mono">{token.slice(0, 12)}...</span>
        </p>
      ) : null}
      <a href="/auth/login" className="mt-5 inline-block rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
        Ir a login
      </a>
    </main>
  );
}

