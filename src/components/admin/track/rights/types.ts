// Types shared by rights subcomponents

export type Share = {
  id?: string;
  role: "WRITER" | "PUBLISHER";
  name: string;
  sharePct: number | null;
  ipiNumber?: string | null;
  pro?: string | null;
  caeNumber?: string | null;
  sortOrder?: number | null;
};

export type MasterShare = {
  id?: string;
  name: string;
  sharePct: number | null;
  contact?: string | null;
  notes?: string | null;
  sortOrder?: number | null;
};
