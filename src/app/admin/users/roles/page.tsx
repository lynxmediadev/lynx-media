import { requireRole } from "@/lib/account-auth/guards";

const matrix = [
  {
    permission: "Acceso a /admin",
    admin: "Si",
    staff: "Si",
    creator: "No",
  },
  {
    permission: "Crear/editar tracks globales",
    admin: "Si",
    staff: "Si",
    creator: "No (solo propios en /creator)",
  },
  {
    permission: "Borrar tracks",
    admin: "Si",
    staff: "Si",
    creator: "Solo propios (v1 creator panel)",
  },
  {
    permission: "Ver requests globales",
    admin: "Si",
    staff: "Si",
    creator: "No",
  },
  {
    permission: "Ver requests de su material",
    admin: "Si",
    staff: "Si",
    creator: "Si (/creator/requests)",
  },
  {
    permission: "Gestionar usuarios/roles",
    admin: "Si",
    staff: "No",
    creator: "No",
  },
];

export default async function RoleMatrixPage() {
  const user = await requireRole(["ADMIN"], { redirectTo: "/admin/tracks" });
  if (!user) return null;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Matriz de atribuciones por rol</h1>
        <p className="text-sm text-muted-foreground">
          Referencia v1 para validar permisos de ADMIN, STAFF y CREATOR.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Atribución</th>
              <th className="px-3 py-2 text-left font-medium">ADMIN</th>
              <th className="px-3 py-2 text-left font-medium">STAFF</th>
              <th className="px-3 py-2 text-left font-medium">CREATOR</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.permission} className="border-t border-border">
                <td className="px-3 py-2">{row.permission}</td>
                <td className="px-3 py-2">{row.admin}</td>
                <td className="px-3 py-2">{row.staff}</td>
                <td className="px-3 py-2">{row.creator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

