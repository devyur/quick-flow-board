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

/**
 * The single backend boundary of the app. Every data read/write in the UI
 * goes through this interface, so the mock implementation can be swapped for
 * a real backend later without touching components.
 */
export interface BoardService {
  getBoard(): Promise<Board>;
  renameBoard(name: string): Promise<Board>;

  createColumn(name: string, color?: ColumnColor): Promise<Board>;
  updateColumn(id: string, patch: Partial<Pick<Column, "name" | "color" | "collapsed">>): Promise<Board>;
  deleteColumn(id: string, strategy: DeleteColumnStrategy): Promise<Board>;
  reorderColumns(orderedIds: string[]): Promise<Board>;

  createCard(input: NewCardInput): Promise<Board>;
  updateCard(id: string, patch: CardPatch): Promise<Board>;
  deleteCard(id: string): Promise<Board>;
  duplicateCard(id: string): Promise<Board>;
  moveCard(id: string, toColumnId: string, toIndex: number): Promise<Board>;
  setCardArchived(id: string, archived: boolean): Promise<Board>;

  createTag(name: string, color?: Tag["color"]): Promise<Board>;
  deleteTag(id: string): Promise<Board>;

  exportBoard(): Promise<string>;
  importBoard(json: string): Promise<Board>;
  reset(): Promise<Board>;
}

export type { Board, Card, Column, Tag };
