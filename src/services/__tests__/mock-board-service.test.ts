import { describe, expect, it } from "vitest";
import { createMockBoardService } from "../mock-board-service";
import { createMemoryStore } from "../storage";

const svc = () => createMockBoardService({ store: createMemoryStore() });

describe("mock board service", () => {
  it("seeds a default board with columns and cards", async () => {
    const board = await svc().getBoard();
    expect(board.columns.length).toBeGreaterThanOrEqual(4);
    expect(board.cards.length).toBeGreaterThan(0);
    expect(board.columns.map((c) => c.position)).toEqual([0, 1, 2, 3]);
  });

  it("persists across service instances sharing a store", async () => {
    const store = createMemoryStore();
    const a = createMockBoardService({ store });
    const first = await a.getBoard();
    await a.createCard({ title: "Persisted", columnId: first.columns[0].id });

    const b = createMockBoardService({ store });
    const board = await b.getBoard();
    expect(board.cards.some((c) => c.title === "Persisted")).toBe(true);
  });

  it("creates, updates and deletes cards", async () => {
    const service = svc();
    let board = await service.getBoard();
    const col = board.columns[0]!.id;

    board = await service.createCard({ title: "  New task  ", columnId: col });
    const card = board.cards.find((c) => c.title === "New task")!;
    expect(card).toBeDefined();

    board = await service.updateCard(card.id, { description: "notes", priority: "high" });
    const updated = board.cards.find((c) => c.id === card.id)!;
    expect(updated.description).toBe("notes");
    expect(updated.priority).toBe("high");

    board = await service.deleteCard(card.id);
    expect(board.cards.some((c) => c.id === card.id)).toBe(false);
  });

  it("moves a card to another column at the requested index", async () => {
    const service = svc();
    let board = await service.getBoard();
    const [from, to] = board.columns as [typeof board.columns[0], typeof board.columns[0]];
    board = await service.createCard({ title: "A", columnId: to.id });
    board = await service.createCard({ title: "B", columnId: to.id });
    const moved = board.cards.find((c) => c.columnId === from.id)!;

    board = await service.moveCard(moved.id, to.id, 1);
    const ordered = board.cards
      .filter((c) => c.columnId === to.id)
      .sort((a, b) => a.position - b.position)
      .map((c) => c.title);

    expect(ordered[1]).toBe(moved.title);
    expect(ordered.map((_, i) => i)).toEqual([0, 1, 2, 3]);
  });

  it("reorders cards within a column", async () => {
    const service = svc();
    let board = await service.getBoard();
    const col = board.columns[0]!.id;
    board = await service.createCard({ title: "One", columnId: col });
    board = await service.createCard({ title: "Two", columnId: col });
    const two = board.cards.find((c) => c.title === "Two")!;

    board = await service.moveCard(two.id, col, 0);
    const titles = board.cards
      .filter((c) => c.columnId === col)
      .sort((a, b) => a.position - b.position)
      .map((c) => c.title);
    expect(titles[0]).toBe("Two");
  });

  it("duplicates a card with fresh ids", async () => {
    const service = svc();
    let board = await service.getBoard();
    const source = board.cards.find((c) => c.checklist.length > 0)!;
    board = await service.duplicateCard(source.id);
    const copy = board.cards.find((c) => c.title === `${source.title} (copy)`)!;
    expect(copy.id).not.toBe(source.id);
    expect(copy.checklist[0]!.id).not.toBe(source.checklist[0]!.id);
  });

  it("archives and restores cards", async () => {
    const service = svc();
    let board = await service.getBoard();
    const card = board.cards[0]!;
    board = await service.setCardArchived(card.id, true);
    expect(board.cards.find((c) => c.id === card.id)!.archived).toBe(true);
    board = await service.setCardArchived(card.id, false);
    expect(board.cards.find((c) => c.id === card.id)!.archived).toBe(false);
  });

  it("deletes a column and moves its cards to a target column", async () => {
    const service = svc();
    let board = await service.getBoard();
    const [first, second] = board.columns as [typeof board.columns[0], typeof board.columns[0]];
    const movedCount = board.cards.filter((c) => c.columnId === first.id).length;
    const before = board.cards.filter((c) => c.columnId === second.id).length;

    board = await service.deleteColumn(first.id, {
      action: "move-cards",
      targetColumnId: second.id,
    });

    expect(board.columns.some((c) => c.id === first.id)).toBe(false);
    expect(board.cards.filter((c) => c.columnId === second.id).length).toBe(before + movedCount);
  });

  it("deletes a column together with its cards", async () => {
    const service = svc();
    let board = await service.getBoard();
    const target = board.columns[2]!;
    board = await service.deleteColumn(target.id, { action: "delete-cards" });
    expect(board.cards.some((c) => c.columnId === target.id)).toBe(false);
  });

  it("keeps at least one column", async () => {
    const service = svc();
    let board = await service.getBoard();
    for (const col of board.columns) {
      board = await service.deleteColumn(col.id, { action: "delete-cards" });
    }
    expect(board.columns.length).toBe(1);
  });

  it("reorders columns", async () => {
    const service = svc();
    const board = await service.getBoard();
    const ids = board.columns.map((c) => c.id);
    const reordered = [ids[3]!, ids[0]!, ids[1]!, ids[2]!];
    const next = await service.reorderColumns(reordered);
    expect(next.columns.map((c) => c.id)).toEqual(reordered);
  });

  it("creates unique tags and removes them from cards", async () => {
    const service = svc();
    let board = await service.getBoard();
    const tagCount = board.tags.length;
    board = await service.createTag("#Work");
    expect(board.tags.length).toBe(tagCount);

    board = await service.createTag("research");
    const tag = board.tags.find((t) => t.name === "research")!;
    const card = board.cards[0]!;
    board = await service.updateCard(card.id, { tagIds: [tag.id] });
    board = await service.deleteTag(tag.id);
    expect(board.cards.find((c) => c.id === card.id)!.tagIds).not.toContain(tag.id);
  });

  it("exports and imports board JSON", async () => {
    const service = svc();
    const json = await service.exportBoard();
    const fresh = createMockBoardService({ store: createMemoryStore() });
    const imported = await fresh.importBoard(json);
    expect(imported.cards.length).toBe(JSON.parse(json).cards.length);
    await expect(fresh.importBoard("{}")).rejects.toThrow();
  });

  it("resets back to the seeded board", async () => {
    const service = svc();
    let board = await service.getBoard();
    board = await service.deleteCard(board.cards[0]!.id);
    const reset = await service.reset();
    expect(reset.cards.length).toBeGreaterThan(board.cards.length);
  });
});
