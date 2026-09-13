import type { Board, Card, Priority } from "./types";

export interface BoardFilters {
  query: string;
  tagIds: string[];
  priority: Priority | "any";
  completion: "any" | "completed" | "incomplete";
  dueOnly: boolean;
  showArchived: boolean;
}

export const emptyFilters: BoardFilters = {
  query: "",
  tagIds: [],
  priority: "any",
  completion: "any",
  dueOnly: false,
  showArchived: false,
};

export function isOverdue(card: Card, today = new Date()): boolean {
  if (!card.dueDate || card.completed) return false;
  const due = new Date(`${card.dueDate}T23:59:59`);
  return due.getTime() < today.getTime();
}

export function filterCards(board: Board, filters: BoardFilters): Card[] {
  const query = filters.query.trim().toLowerCase();
  const tagNames = new Map(board.tags.map((t) => [t.id, t.name.toLowerCase()]));

  return board.cards.filter((card) => {
    if (card.archived !== filters.showArchived) return false;
    if (filters.priority !== "any" && card.priority !== filters.priority) return false;
    if (filters.completion === "completed" && !card.completed) return false;
    if (filters.completion === "incomplete" && card.completed) return false;
    if (filters.dueOnly && !card.dueDate) return false;
    if (filters.tagIds.length && !filters.tagIds.every((id) => card.tagIds.includes(id))) return false;
    if (query) {
      const haystack = [
        card.title,
        card.description,
        ...card.tagIds.map((id) => tagNames.get(id) ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function checklistProgress(card: Card): { done: number; total: number } {
  return {
    done: card.checklist.filter((i) => i.done).length,
    total: card.checklist.length,
  };
}
