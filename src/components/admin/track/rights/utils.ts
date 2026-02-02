import type { Share, MasterShare } from "./types";

export const sortByOrder = <T extends { sortOrder?: number | null; name?: string }>(
  a: T,
  b: T,
) => {
  const ao = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
  const bo = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  return (a.name ?? "").localeCompare(b.name ?? "");
};

export const applyRoleSortOrders = (list: Share[]) => {
  let w = 0;
  let p = 0;
  return list.map((s) => ({
    ...s,
    sortOrder: s.role === "WRITER" ? w++ : p++,
  }));
};

export const applyMasterOrders = (list: MasterShare[]) =>
  list.map((s, idx) => ({ ...s, sortOrder: idx }));

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));
