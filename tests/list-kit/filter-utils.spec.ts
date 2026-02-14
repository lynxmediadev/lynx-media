import { describe, expect, it } from "vitest";
import { buildFilterQueryString, countActiveFilters } from "../../src/components/admin/list-kit/filter-utils";

describe("list-kit/filter-utils", () => {
  it("countActiveFilters counts only meaningful values", () => {
    expect(countActiveFilters(["", "  ", "ADMIN", undefined, null, false, true, 0, 24])).toBe(4);
  });

  it("buildFilterQueryString serializes only active filter values", () => {
    const query = buildFilterQueryString({
      q: "  admin  ",
      role: "ADMIN",
      status: "",
      page: 2,
      per: 20,
      includeDisabled: false,
      includeArchived: true,
      blank: "   ",
    });
    expect(query).toBe("q=admin&role=ADMIN&page=2&per=20&includeArchived=1");
  });

  it("buildFilterQueryString supports persist values and filters overrides", () => {
    const query = buildFilterQueryString(
      { q: "lynx", page: 3 },
      { per: 50, role: "STAFF", q: "old" },
    );
    expect(query).toBe("per=50&role=STAFF&q=lynx&page=3");
  });
});
