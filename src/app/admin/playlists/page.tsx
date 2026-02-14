import { AdminListEmptyState, AdminListHeader, AdminListShell, AdminStatusBadge } from "@/components/admin/list-kit";

export default function Page() {
  return (
    <section>
      <AdminListShell className="bg-card/80 backdrop-blur">
        <AdminListHeader
          title="Playlists"
          subtitle="Gestión de playlists editoriales y colecciones de catálogo"
          count={<AdminStatusBadge>Módulo en implementación</AdminStatusBadge>}
        />
        <AdminListEmptyState message="Aún no hay lista operativa de playlists. Esta vista quedó preparada para usar List Kit al habilitar datos." />
      </AdminListShell>
    </section>
  );
}
