export type ListFilterValue = string | number | boolean | null | undefined;

export function countActiveFilters(values: ListFilterValue[]) {
  return values.filter((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "boolean") return value;
    return false;
  }).length;
}

export function buildFilterQueryString(
  filters: Record<string, ListFilterValue>,
  persist: Record<string, ListFilterValue> = {},
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...persist, ...filters })) {
    if (value == null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      params.set(key, trimmed);
      continue;
    }
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

