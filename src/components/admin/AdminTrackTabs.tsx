/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/admin/AdminTrackTabs.tsx                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Renderiza tabs de navegación para las fichas admin de un track.          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Es un componente presentacional simple; no tiene estado.                  │
 * │ - Marca el tab activo comparando la ruta actual con los href.               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";

type Tab = { href: string; label: string };
export default function AdminTrackTabs({
  id,
  active,
}: {
  id: string;
  active: "tech" | "rights" | "ids";
}) {
  const tabs: Tab[] = [
    { href: `/admin/track/${id}/tech`, label: "Tech" },
    { href: `/admin/track/${id}/rights`, label: "Rights" },
    { href: `/admin/track/${id}/ids`, label: "IDs" },
  ];

  return (
    <nav className="flex gap-2">
      {tabs.map((t) => {
        const isActive = t.href.includes(`/${active}`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded px-3 py-1.5 text-sm ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
