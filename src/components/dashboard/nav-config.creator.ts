import {
  ClipboardList,
  Home,
  Music2,
  UserCircle2,
} from "lucide-react";

import type { DashboardSection } from "./types";

export const creatorDashboardSections: DashboardSection[] = [
  {
    id: "general",
    label: "General",
    items: [
      {
        id: "creator-overview",
        label: "Overview",
        href: "/creator",
        icon: Home,
        section: "general",
        exact: true,
      },
      {
        id: "creator-account",
        label: "Account",
        href: "/creator/account",
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
        id: "creator-tracks",
        label: "Tracks",
        href: "/creator/tracks",
        icon: Music2,
        section: "workspace",
      },
      {
        id: "creator-requests",
        label: "Requests",
        href: "/creator/requests",
        icon: ClipboardList,
        section: "workspace",
      },
    ],
  },
];
