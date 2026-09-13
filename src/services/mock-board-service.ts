import type { BoardService } from "./board-service";
import { createBrowserStore, type KeyValueStore } from "./storage";
import type {
  Board,
  Card,
  CardPatch,
  Column,
  ColumnColor,
  DeleteColumnStrategy,
  NewCardInput,
  Tag,
} from "./types";

export const STORAGE_KEY = "mini-kanban:board:v1";

let counter = 0;
export function makeId(prefix = "id"): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

const now = () => new Date().toISOString();

export function createDefaultBoard(): Board {
  const columns: Column[] = [
    { id: makeId("col"), name: "Backlog", color: "slate", position: 0, collapsed: false },
    { id: makeId("col"), name: "To Do", color: "amber", position: 1, collapsed: false },
    { id: makeId("col"), name: "In Progress", color: "sky", position: 2, collapsed: false },
    { id: makeId("col"), name: "Done", color: "green", position: 3, collapsed: false },
  ];
  const tags: Tag[] = [
    { id: makeId("tag"), name: "work", color: "blue" },
    { id: makeId("tag"), name: "personal", color: "green" },
    { id: makeId("tag"), name: "urgent", color: "red" },
    { id: makeId("tag"), name: "idea", color: "purple" },
  ];

  const base = (over: Partial<Card> & { title: string; columnId: string; position: number }): Card => ({
    id: makeId("card"),
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
    createdAt: now(),
    updatedAt: now(),
    ...over,
  });

  const cards: Card[] = [
    base({
      title: "Sketch the new landing hero",
      columnId: columns[0].id,
      position: 0,
      description: "Rough shapes first, then refine.",
      tagIds: [tags[3].id],
      color: "purple",
    }),
    base({
      title: "Write weekly plan",
      columnId: columns[1].id,
      position: 0,
      priority: "medium",
      tagIds: [tags[0].id],
      checklist: [
        { id: makeId("chk"), text: "Review last week", done: true },
        { id: makeId("chk"), text: "Pick three priorities", done: false },
      ],
    }),
    base({
      title: "Fix drag-and-drop jitter",
      columnId: columns[2].id,
      position: 0,
      priority: "high",
      tagIds: [tags[0].id, tags[2].id],
      color: "orange",
    }),
    base({
      title: "Set up the board",
      columnId: columns[3].id,
      position: 0,
      completed: true,
    }),
  ];

  return { id: makeId("board"), name: "My Board", columns, cards, tags };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalize(board: Board): Board {
  board.columns = board.columns
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((c, i) => ({ ...c, position: i }));

  const byColumn = new Map<string, Card[]>();
  for (const col of board.columns) byColumn.set(col.id, []);
  for (const card of board.cards.slice().sort((a, b) => a.position - b.position)) {
    const bucket = byColumn.get(card.columnId);
    if (bucket) bucket.push(card);
  }
  board.cards = [...byColumn.values()].flatMap((cards) =>
    cards.map((card, i) => ({ ...card, position: i })),
  );
  return board;
}

export interface MockBoardServiceOptions {
  store?: KeyValueStore;
  /** Artificial latency in ms, mimicking a network round trip. */
  latency?: number;
  seed?: () => Board;
}

export function createMockBoardService(options: MockBoardServiceOptions = {}): BoardService {
  const store = options.store ?? createBrowserStore();
  const latency = options.latency ?? 0;
  const seed = options.seed ?? createDefaultBoard;

  const delay = () => (latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

  function read(): Board {
    const raw = store.get(STORAGE_KEY);
    if (!raw) {
      const board = normalize(seed());
      store.set(STORAGE_KEY, JSON.stringify(board));
      return board;
    }
    try {
      return normalize(JSON.parse(raw) as Board);
    } catch {
      const board = normalize(seed());
      store.set(STORAGE_KEY, JSON.stringify(board));
      return board;
    }
  }

  function write(board: Board): Board {
    const next = normalize(board);
    store.set(STORAGE_KEY, JSON.stringify(next));
    return clone(next);
  }

  async function mutate(fn: (board: Board) => void): Promise<Board> {
    await delay();
    const board = read();
    fn(board);
    return write(board);
  }

  return {
    async getBoard() {
      await delay();
      return clone(read());
    },

    renameBoard(name) {
      return mutate((b) => {
        b.name = name.trim() || b.name;
      });
    },

    createColumn(name, color: ColumnColor = "slate") {
      return mutate((b) => {
        b.columns.push({
          id: makeId("col"),
          name: name.trim() || "New column",
          color,
          position: b.columns.length,
          collapsed: false,
        });
      });
    },

    updateColumn(id, patch) {
      return mutate((b) => {
        const col = b.columns.find((c) => c.id === id);
        if (!col) return;
        Object.assign(col, patch);
        if (patch.name !== undefined) col.name = patch.name.trim() || col.name;
      });
    },

    deleteColumn(id, strategy: DeleteColumnStrategy) {
      return mutate((b) => {
        if (b.columns.length <= 1) return;
        b.columns = b.columns.filter((c) => c.id !== id);
        if (strategy.action === "delete-cards") {
          b.cards = b.cards.filter((c) => c.columnId !== id);
        } else {
          const target = b.columns.find((c) => c.id === strategy.targetColumnId);
          if (!target) {
            b.cards = b.cards.filter((c) => c.columnId !== id);
            return;
          }
          const max = b.cards.filter((c) => c.columnId === target.id).length;
          let offset = 0;
          for (const card of b.cards) {
            if (card.columnId === id) {
              card.columnId = target.id;
              card.position = max + offset++;
              card.updatedAt = now();
            }
          }
        }
      });
    },

    reorderColumns(orderedIds) {
      return mutate((b) => {
        b.columns.forEach((col) => {
          const idx = orderedIds.indexOf(col.id);
          if (idx >= 0) col.position = idx;
        });
      });
    },

    createCard(input: NewCardInput) {
      return mutate((b) => {
        const timestamp = now();
        const position = b.cards.filter((c) => c.columnId === input.columnId).length;
        b.cards.push({
          id: makeId("card"),
          columnId: input.columnId,
          title: input.title.trim() || "Untitled",
          description: input.description ?? "",
          imageDataUrl: null,
          drawingDataUrl: null,
          tagIds: input.tagIds ?? [],
          priority: input.priority ?? "none",
          dueDate: input.dueDate ?? null,
          checklist: [],
          color: input.color ?? "default",
          completed: false,
          archived: false,
          position,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });
    },

    updateCard(id, patch: CardPatch) {
      return mutate((b) => {
        const card = b.cards.find((c) => c.id === id);
        if (!card) return;
        Object.assign(card, patch);
        card.updatedAt = now();
      });
    },

    deleteCard(id) {
      return mutate((b) => {
        b.cards = b.cards.filter((c) => c.id !== id);
      });
    },

    duplicateCard(id) {
      return mutate((b) => {
        const card = b.cards.find((c) => c.id === id);
        if (!card) return;
        const copy: Card = {
          ...clone(card),
          id: makeId("card"),
          title: `${card.title} (copy)`,
          position: card.position + 0.5,
          createdAt: now(),
          updatedAt: now(),
        };
        copy.checklist = copy.checklist.map((item) => ({ ...item, id: makeId("chk") }));
        b.cards.push(copy);
      });
    },

    moveCard(id, toColumnId, toIndex) {
      return mutate((b) => {
        const card = b.cards.find((c) => c.id === id);
        if (!card) return;
        const target = b.columns.find((c) => c.id === toColumnId);
        if (!target) return;
        const sameColumn = card.columnId === toColumnId;
        const siblings = b.cards
          .filter((c) => c.columnId === toColumnId && c.id !== id)
          .sort((a, x) => a.position - x.position);
        const index = Math.max(0, Math.min(toIndex, siblings.length));
        siblings.splice(index, 0, card);
        card.columnId = toColumnId;
        siblings.forEach((c, i) => {
          c.position = i;
        });
        if (!sameColumn) card.updatedAt = now();
      });
    },

    setCardArchived(id, archived) {
      return mutate((b) => {
        const card = b.cards.find((c) => c.id === id);
        if (!card) return;
        card.archived = archived;
        card.updatedAt = now();
      });
    },

    createTag(name, color = "blue") {
      return mutate((b) => {
        const clean = name.trim().replace(/^#/, "");
        if (!clean) return;
        if (b.tags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) return;
        b.tags.push({ id: makeId("tag"), name: clean, color });
      });
    },

    deleteTag(id) {
      return mutate((b) => {
        b.tags = b.tags.filter((t) => t.id !== id);
        b.cards.forEach((c) => {
          c.tagIds = c.tagIds.filter((t) => t !== id);
        });
      });
    },

    async exportBoard() {
      await delay();
      return JSON.stringify(read(), null, 2);
    },

    async importBoard(json) {
      await delay();
      const parsed = JSON.parse(json) as Board;
      if (!parsed || !Array.isArray(parsed.columns) || !Array.isArray(parsed.cards)) {
        throw new Error("Invalid board file");
      }
      return write({
        id: parsed.id ?? makeId("board"),
        name: parsed.name ?? "Imported board",
        columns: parsed.columns,
        cards: parsed.cards,
        tags: parsed.tags ?? [],
      });
    },

    async reset() {
      await delay();
      store.remove(STORAGE_KEY);
      return clone(read());
    },
  };
}
