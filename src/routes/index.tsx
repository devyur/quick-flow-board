import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  boardService,
  emptyFilters,
  filterCards,
  parseQuickAdd,
  type BoardFilters,
  type Card as CardType,
} from "@/services";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardColumn } from "@/components/kanban/BoardColumn";
import { BoardHeader } from "@/components/kanban/BoardHeader";
import { CardDetailDialog } from "@/components/kanban/CardDetailDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mini Kanban — organize tasks in seconds" },
      {
        name: "description",
        content:
          "A tiny drag-and-drop Kanban board for tasks, notes and quick sketches. Open it and organize your thoughts in seconds.",
      },
      { property: "og:title", content: "Mini Kanban — organize tasks in seconds" },
      {
        property: "og:description",
        content: "Drag-and-drop columns, quick-add syntax, checklists and sketches in one small board.",
      },
    ],
  }),
  component: BoardPage,
});

interface DropTarget {
  columnId: string;
  index: number;
}

function BoardPage() {
  const { board, isLoading, act } = useBoardData();
  const [filters, setFilters] = useState<BoardFilters>(emptyFilters);
  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({});
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const visibleCards = useMemo(
    () => (board ? filterCards(board, filters) : []),
    [board, filters],
  );

  if (isLoading || !board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-board text-sm text-muted-foreground">
        Loading your board…
      </div>
    );
  }

  const openCard = board.cards.find((c) => c.id === openCardId) ?? null;

  const cardsFor = (columnId: string) =>
    visibleCards
      .filter((c) => c.columnId === columnId)
      .sort((a, b) => a.position - b.position);

  const submitQuickAdd = (columnId: string) => {
    const raw = quickAdd[columnId] ?? "";
    const parsed = parseQuickAdd(raw);
    if (!parsed.title) return;

    const targetColumn = parsed.column
      ? (board.columns.find((c) => c.name.toLowerCase() === parsed.column) ?? null)
      : null;
    const tagIds = parsed.tags
      .map((name) => board.tags.find((t) => t.name.toLowerCase() === name)?.id)
      .filter((id): id is string => Boolean(id));
    const unknownTags = parsed.tags.filter(
      (name) => !board.tags.some((t) => t.name.toLowerCase() === name),
    );

    act(async () => {
      for (const name of unknownTags) await boardService.createTag(name);
      const withTags = unknownTags.length
        ? (await boardService.getBoard()).tags
            .filter((t) => parsed.tags.includes(t.name.toLowerCase()))
            .map((t) => t.id)
        : tagIds;
      return boardService.createCard({
        title: parsed.title,
        columnId: targetColumn?.id ?? columnId,
        priority: parsed.priority,
        tagIds: withTags,
      });
    });
    setQuickAdd((prev) => ({ ...prev, [columnId]: "" }));
  };

  const finishDrop = (columnId: string) => {
    const cardId = draggingCardId;
    const target = dropTarget;
    setDraggingCardId(null);
    setDropTarget(null);
    if (!cardId) return;

    const dropIndex = target && target.columnId === columnId ? target.index : cardsFor(columnId).length;
    const columnCards = cardsFor(columnId);
    const anchor = columnCards[dropIndex];
    const dragged = board.cards.find((c) => c.id === cardId);
    if (!dragged) return;
    // Translate the filtered index into a real board position.
    const realIndex = anchor
      ? anchor.position - (dragged.columnId === columnId && dragged.position < anchor.position ? 1 : 0)
      : board.cards.filter((c) => c.columnId === columnId).length;
    act(() => boardService.moveCard(cardId, columnId, Math.max(0, realIndex)));
  };

  const addColumn = () => act(() => boardService.createColumn("New column"));

  return (
    <div className="flex h-screen flex-col bg-board">
      <BoardHeader
        board={board}
        filters={filters}
        onFiltersChange={setFilters}
        onRenameBoard={(name) => act(() => boardService.renameBoard(name))}
        onAddColumn={addColumn}
        onExport={async () => {
          const json = await boardService.exportBoard();
          const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
          const link = document.createElement("a");
          link.href = url;
          link.download = `${board.name.replace(/\s+/g, "-").toLowerCase()}.json`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Board exported");
        }}
        onImport={(json) =>
          act(async () => {
            try {
              const next = await boardService.importBoard(json);
              toast.success("Board imported");
              return next;
            } catch {
              toast.error("That file isn't a valid board export");
              return boardService.getBoard();
            }
          })
        }
        onReset={() => {
          if (!window.confirm("Reset the board to the starter cards?")) return;
          act(() => boardService.reset());
        }}
        visibleCount={visibleCards.length}
        totalCount={board.cards.filter((c) => c.archived === filters.showArchived).length}
      />

      <main className="scrollbar-slim flex flex-1 gap-3 overflow-x-auto p-4">
        {board.columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            cards={cardsFor(column.id)}
            tags={board.tags}
            canDelete={board.columns.length > 1}
            quickAddValue={quickAdd[column.id] ?? ""}
            onQuickAddChange={(value) => setQuickAdd((prev) => ({ ...prev, [column.id]: value }))}
            onQuickAddSubmit={() => submitQuickAdd(column.id)}
            onRename={(name) => act(() => boardService.updateColumn(column.id, { name }))}
            onRecolor={(color) => act(() => boardService.updateColumn(column.id, { color }))}
            onToggleCollapse={() =>
              act(() => boardService.updateColumn(column.id, { collapsed: !column.collapsed }))
            }
            onDelete={() => {
              const target = board.columns.find((c) => c.id !== column.id);
              const hasCards = board.cards.some((c) => c.columnId === column.id);
              const move =
                hasCards && target
                  ? window.confirm(`Move this column's cards to "${target.name}"? Cancel deletes them.`)
                  : false;
              act(() =>
                boardService.deleteColumn(
                  column.id,
                  move && target
                    ? { action: "move-cards", targetColumnId: target.id }
                    : { action: "delete-cards" },
                ),
              );
            }}
            onOpenCard={(card) => setOpenCardId(card.id)}
            onToggleComplete={(card) =>
              act(() => boardService.updateCard(card.id, { completed: !card.completed }))
            }
            onDuplicateCard={(card) => act(() => boardService.duplicateCard(card.id))}
            onArchiveToggle={(card) =>
              act(() => boardService.setCardArchived(card.id, !card.archived))
            }
            onDeleteCard={(card) => act(() => boardService.deleteCard(card.id))}
            draggingCardId={draggingCardId}
            dropTarget={dropTarget}
            onCardDragStart={(card: CardType) => setDraggingCardId(card.id)}
            onHoverCard={(columnId, index) => setDropTarget({ columnId, index })}
            onHoverColumnEnd={(columnId, count) =>
              setDropTarget((prev) =>
                prev && prev.columnId === columnId ? prev : { columnId, index: count },
              )
            }
            onDropInColumn={finishDrop}
          />
        ))}

        <button
          type="button"
          onClick={addColumn}
          className="h-fit w-56 shrink-0 rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition hover:bg-surface"
        >
          + Add column
        </button>
      </main>

      <CardDetailDialog
        card={openCard}
        board={board}
        onClose={() => setOpenCardId(null)}
        onPatch={(id, patch) => act(() => boardService.updateCard(id, patch))}
        onDelete={(id) => act(() => boardService.deleteCard(id))}
        onDuplicate={(id) => act(() => boardService.duplicateCard(id))}
        onArchiveToggle={(id, archived) => act(() => boardService.setCardArchived(id, archived))}
        onCreateTag={(name, cardId) =>
          act(async () => {
            await boardService.createTag(name);
            const next = await boardService.getBoard();
            const tag = next.tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
            const card = next.cards.find((c) => c.id === cardId);
            if (!tag || !card || card.tagIds.includes(tag.id)) return next;
            return boardService.updateCard(cardId, { tagIds: [...card.tagIds, tag.id] });
          })
        }
      />
    </div>
  );
}
