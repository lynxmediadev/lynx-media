import { notFound, redirect } from "next/navigation";
import CatalogClient from "@/app/catalog/CatalogClient";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/account-auth/guards";
import { fetchPlaylistCatalogTracks } from "@/lib/catalog/fetchPlaylistTracks";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function resolvePlaylist(key: string) {
  return prisma.playlist.findFirst({
    where: {
      OR: [{ publicId: key }, { slug: key }, { id: key }],
    },
    select: {
      id: true,
      publicId: true,
      slug: true,
      name: true,
      description: true,
      visibility: true,
      status: true,
      ownerUserId: true,
      embedEnabled: true,
      isAutoAllTracks: true,
      sharedWith: {
        select: { userId: true, canEdit: true },
      },
    },
  });
}

function canViewPlaylist(params: {
  visibility: "PRIVATE" | "INTERNAL" | "PUBLIC";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  ownerUserId?: string | null;
  viewerIds: string[];
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const { visibility, status, ownerUserId, viewerIds, user } = params;
  const role = user?.role ?? null;
  const userId = user?.id ?? null;

  const isOwner = Boolean(userId && ownerUserId && userId === ownerUserId);
  const isAdminOrStaff = role === "ADMIN" || role === "STAFF";
  const isViewer = Boolean(userId && viewerIds.includes(userId));

  if (isAdminOrStaff || isOwner || isViewer) return true;
  if (visibility === "PUBLIC" && status === "PUBLISHED") return true;
  return false;
}

export async function generateMetadata({ params }: RouteContext) {
  const { id } = await params;
  const playlist = await resolvePlaylist(id);
  if (!playlist) return {};
  const canonical = `/playlist/${playlist.publicId || playlist.slug || playlist.id}`;
  return {
    title: `${playlist.name} · Playlist`,
    description:
      playlist.description || "Playlist pública de tracks curados en Lynx.",
    alternates: { canonical },
    robots:
      playlist.visibility === "PUBLIC" && playlist.status === "PUBLISHED"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PlaylistPublicPage({ params, searchParams }: RouteContext) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const embed = (first(sp?.embed) ?? "").trim() === "1";
  const playlist = await resolvePlaylist(id);
  if (!playlist) notFound();

  const user = await getCurrentUser();
  const canView = canViewPlaylist({
    visibility: playlist.visibility,
    status: playlist.status,
    ownerUserId: playlist.ownerUserId,
    viewerIds: playlist.sharedWith.map((viewer) => viewer.userId),
    user,
  });

  if (!canView) {
    if (!user) {
      redirect(`/auth/login?next=${encodeURIComponent(`/playlist/${id}`)}`);
    }
    notFound();
  }

  const tracks = await fetchPlaylistCatalogTracks({
    playlistId: playlist.id,
    ownerUserId: playlist.ownerUserId,
    isAutoAllTracks: playlist.isAutoAllTracks,
    limit: 200,
  });

  return (
    <CatalogClient
      tracks={tracks}
      title={playlist.name}
      subtitle={
        playlist.description ||
        "Playlist compartida desde el dashboard de administración."
      }
      eyebrow="Playlist"
      categories={[]}
      compact={embed}
      hideHeader={embed}
    />
  );
}
