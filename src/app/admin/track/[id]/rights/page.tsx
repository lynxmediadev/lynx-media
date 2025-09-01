// src/app/admin/track/[id]/rights/page.tsx
import { db } from "@/server/db";
import RightsForm from "../rights/rights-form.client";

type PageProps = { params: { id: string } };

export default async function RightsPage({ params }: PageProps) {
  const track = await db.track.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      artist: true,
      licenseType: true,
      territories: true,
      term: true,
      mediaBuy: true,
      mfn: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
      master: true,
      restrictions: true,     // text[]
      publishingSplit: true,  // JSON o TEXT según tu schema
    },
  });

  if (!track) return <div className="p-6">Track no encontrado.</div>;

  const publishingSplitStr =
    track.publishingSplit != null
      ? typeof track.publishingSplit === "string"
        ? track.publishingSplit
        : JSON.stringify(track.publishingSplit, null, 2)
      : "";

  // text[] → muestra como líneas
  const restrictionsStr = Array.isArray(track.restrictions)
    ? (track.restrictions as string[]).join("\n")
    : String(track.restrictions ?? "");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Rights · {track.title}</h1>
      <RightsForm
        track={{
          id: track.id,
          licenseType: track.licenseType ?? "",
          territories: track.territories ?? "",
          term: track.term ?? "",
          mediaBuy: track.mediaBuy ?? "",
          mfn: !!track.mfn,
          contentIdEnrolled: !!track.contentIdEnrolled,
          contentIdAdmin: track.contentIdAdmin ?? "",
          contentIdWhitelist: track.contentIdWhitelist ?? "",
          master: track.master ?? "",
          restrictionsStr,      // ← textarea
          publishingSplitStr,   // ← textarea (JSON)
        }}
      />
    </div>
  );
}
