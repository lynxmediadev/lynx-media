/**
 * Wrapper de ruta histórica: /admin/track/new
 * Comparte el mismo flujo unificado que /admin/uploads para no romper enlaces.
 */
import AdminTrackIngestPage from "../../_components/admin-track-ingest-page";

export default function AdminCreateTrackPage() {
  return <AdminTrackIngestPage />;
}
