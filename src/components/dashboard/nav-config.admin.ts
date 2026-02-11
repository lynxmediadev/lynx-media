import {
  BriefcaseBusiness,
  ClipboardList,
  FolderKanban,
  Gavel,
  Home,
  Library,
  Music2,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  UserCircle2,
} from "lucide-react";

import type { DashboardSection } from "./types";

export const adminDashboardSections: DashboardSection[] = [
  {
    id: "general",
    label: "General",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin",
        icon: Home,
        section: "general",
        exact: true,
      },
      {
        id: "account",
        label: "Account",
        href: "/admin/account",
        icon: UserCircle2,
        section: "general",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "tracks",
        label: "Tracks",
        href: "/admin/tracks",
        icon: Music2,
        section: "workspace",
      },
      {
        id: "uploads",
        label: "Uploads",
        href: "/admin/uploads",
        icon: SlidersHorizontal,
        section: "workspace",
      },
      {
        id: "playlists",
        label: "Playlists",
        href: "/admin/playlists",
        icon: Library,
        section: "workspace",
      },
      {
        id: "sound-kits",
        label: "Sound Kits",
        href: "/admin/sound-kits",
        icon: FolderKanban,
        section: "workspace",
      },
      {
        id: "services",
        label: "Services",
        href: "/admin/services",
        icon: BriefcaseBusiness,
        section: "workspace",
      },
    ],
  },
  {
    id: "licensing",
    label: "Licensing",
    items: [
      {
        id: "licensing-requests",
        label: "Requests",
        href: "/admin/licensing",
        icon: ClipboardList,
        section: "licensing",
      },
      {
        id: "contracts",
        label: "Contracts",
        href: "/admin/contracts",
        icon: Gavel,
        section: "licensing",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "inbound-requests",
        label: "Contact Inbox",
        href: "/admin/requests",
        icon: ScrollText,
        section: "system",
      },
      {
        id: "audit-log",
        label: "Audit Log",
        href: "/admin/audit-log",
        icon: Shield,
        section: "system",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        section: "system",
      },
    ],
  },
];
