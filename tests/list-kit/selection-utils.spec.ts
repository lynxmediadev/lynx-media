import { describe, expect, it } from "vitest";
import { allSelected, selectAllOrNone, toggleSelection } from "../../src/components/admin/list-kit/selection-utils";

describe("list-kit/selection-utils", () => {
  it("toggleSelection adds and removes id", () => {
    const added = toggleSelection(["a", "b"], "c");
    expect(added).toEqual(["a", "b", "c"]);

    const removed = toggleSelection(added, "b");
    expect(removed).toEqual(["a", "c"]);
  });

  it("selectAllOrNone returns ids when checked and empty when unchecked", () => {
    expect(selectAllOrNone(["1", "2"], true)).toEqual(["1", "2"]);
    expect(selectAllOrNone(["1", "2"], false)).toEqual([]);
  });

  it("allSelected validates full selection correctly", () => {
    expect(allSelected(["1", "2"], ["1", "2"])).toBe(true);
    expect(allSelected(["1"], ["1", "2"])).toBe(false);
    expect(allSelected([], [])).toBe(false);
  });
});

