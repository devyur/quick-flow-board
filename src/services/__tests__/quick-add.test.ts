import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "../quick-add";

describe("parseQuickAdd", () => {
  it("returns a plain title untouched", () => {
    expect(parseQuickAdd("Buy milk")).toEqual({
      title: "Buy milk",
      tags: [],
      priority: "none",
      column: null,
    });
  });

  it("extracts tags, priority and column", () => {
    expect(parseQuickAdd("Fix login #work #urgent !high @todo")).toEqual({
      title: "Fix login",
      tags: ["work", "urgent"],
      priority: "high",
      column: "todo",
    });
  });

  it("ignores an unknown priority token and keeps it in the title", () => {
    const result = parseQuickAdd("Ship it !yesterday");
    expect(result.priority).toBe("none");
    expect(result.title).toBe("Ship it !yesterday");
  });

  it("deduplicates tags and lowercases them", () => {
    expect(parseQuickAdd("Note #Idea #idea").tags).toEqual(["idea"]);
  });
});
