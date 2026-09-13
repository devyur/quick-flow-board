export type Priority = "none" | "low" | "medium" | "high";

export type CardColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "gray";

export type ColumnColor = "slate" | "amber" | "sky" | "green" | "violet" | "rose";

export interface Tag {
  id: string;
  name: string;
  color: CardColor;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Column {
  id: string;
  name: string;
  color: ColumnColor;
  position: number;
  collapsed: boolean;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  imageDataUrl: string | null;
  drawingDataUrl: string | null;
  tagIds: string[];
  priority: Priority;
  dueDate: string | null;
  checklist: ChecklistItem[];
  color: CardColor;
  completed: boolean;
  archived: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  cards: Card[];
  tags: Tag[];
}

export type NewCardInput = {
  title: string;
  columnId: string;
  description?: string;
  tagIds?: string[];
  priority?: Priority;
  color?: CardColor;
  dueDate?: string | null;
};

export type CardPatch = Partial<Omit<Card, "id" | "createdAt" | "updatedAt" | "position">>;

export type DeleteColumnStrategy =
  | { action: "delete-cards" }
  | { action: "move-cards"; targetColumnId: string };
