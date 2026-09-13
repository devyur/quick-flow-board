import type { BoardService } from "./board-service";
import { createMockBoardService } from "./mock-board-service";

/**
 * Single app-wide service instance. Swap this for a real implementation
 * (server functions, Cloud, REST) without touching any component.
 */
export const boardService: BoardService = createMockBoardService({ latency: 60 });

export type { BoardService };
export * from "./types";
export { parseQuickAdd } from "./quick-add";
export { filterCards, emptyFilters, isOverdue, checklistProgress } from "./filters";
export type { BoardFilters } from "./filters";
