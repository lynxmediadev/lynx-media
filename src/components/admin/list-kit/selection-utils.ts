export function toggleSelection(current: string[], id: string) {
  if (current.includes(id)) return current.filter((value) => value !== id);
  return [...current, id];
}

export function selectAllOrNone(ids: string[], checked: boolean) {
  return checked ? [...ids] : [];
}

export function allSelected(selected: string[], selectable: string[]) {
  if (selectable.length === 0) return false;
  const selectedSet = new Set(selected);
  return selectable.every((id) => selectedSet.has(id));
}

