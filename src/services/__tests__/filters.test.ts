import { describe, expect, it } from "vitest";
import { checklistProgress, emptyFilters, filterCards, isOverdue } from "../filters";
import type { Board, Card } from "../types";

const card = (over: Partial<Card>): Card => ({
  id: over.id ?? "c1",
  columnId: "col1",
  title: "Card",
  description: "",
  imageDataUrl: null,
  drawingDataUrl: null,
  tagIds: [],
  priority: "none",
  dueDate: null,
  checklist: [],
  color: "default",
  completed: false,
  archived: false,
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const board = (cards: Card[]): Board => ({
  id: "b",
  name: "Board",
  columns: [{ id: "col1", name: "To Do", color: "slate", position: 0, collapsed: false }],
  cards,
  tags: [{ id: "t1", name: "work", color: "blue" }],
});

describe("filterCards", () => {
  it("hides archived cards by default", () => {
    const result = filterCards(board([card({ id: "a" }), card({ id: "b", archived: true })]), emptyFilters);
    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("shows only archived cards when requested", () => {
    const result = filterCards(board([card({ id: "a" }), card({ id: "b", archived: true })]), {
      ...emptyFilters,
      showArchived: true,
    });
    expect(result.map((c) => c.id)).toEqual(["b"]);
  });

  it("searches title, description and tag names", () => {
    const cards = [
      card({ id: "a", title: "Design system" }),
      card({ id: "b", description: "sketch the design" }),
      card({ id: "c", tagIds: ["t1"] }),
      card({ id: "d", title: "Unrelated" }),
    ];
    expect(filterCards(board(cards), { ...emptyFilters, query: "design" }).map((c) => c.id)).toEqual([
      "a",
      "b",
    ]);
    expect(filterCards(board(cards), { ...emptyFilters, query: "work" }).map((c) => c.id)).toEqual(["c"]);
  });

  it("filters by priority, completion, tag and due date", () => {
    const cards = [
      card({ id: "a", priority: "high" }),
      card({ id: "b", completed: true }),
      card({ id: "c", tagIds: ["t1"] }),
      card({ id: "d", dueDate: "2026-03-01" }),
    ];
    expect(filterCards(board(cards), { ...emptyFilters, priority: "high" }).map((c) => c.id)).toEqual(["a"]);
    expect(filterCards(board(cards), { ...emptyFilters, completion: "completed" }).map((c) => c.id)).toEqual(["b"]);
    expect(filterCards(board(cards), { ...emptyFilters, tagIds: ["t1"] }).map((c) => c.id)).toEqual(["c"]);
    expect(filterCards(board(cards), { ...emptyFilters, dueOnly: true }).map((c) => c.id)).toEqual(["d"]);
  });
});

describe("isOverdue", () => {
  const today = new Date("2026-05-10T12:00:00.000Z");
  it("flags past due dates", () => {
    expect(isOverdue(card({ dueDate: "2026-05-09" }), today)).toBe(true);
  });
  it("ignores today, future dates and completed cards", () => {
    expect(isOverdue(card({ dueDate: "2026-05-10" }), today)).toBe(false);
    expect(isOverdue(card({ dueDate: "2026-06-01" }), today)).toBe(false);
    expect(isOverdue(card({ dueDate: "2026-01-01", completed: true }), today)).toBe(false);
  });
});

describe("checklistProgress", () => {
  it("counts done items", () => {
    const progress = checklistProgress(
      card({
        checklist: [
          { id: "1", text: "a", done: true },
          { id: "2", text: "b", done: false },
          { id: "3", text: "c", done: true },
        ],
      }),
    );
    expect(progress).toEqual({ done: 2, total: 3 });
  });
});
