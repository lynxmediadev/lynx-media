/**
 * Wrapper de ruta histórica: /admin/uploads
 * Ahora reutiliza el flujo unificado de ingesta + creación de Track.
 */
import AdminTrackIngestPage from "../_components/admin-track-ingest-page";

export default function AdminUploadsPage() {
  return <AdminTrackIngestPage />;
}
