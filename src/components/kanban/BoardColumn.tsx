import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import type { Card as CardType, Column, Tag } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { COLUMN_ACCENT, COLUMN_COLORS } from "./constants";
import { CardTile } from "./CardTile";

export interface BoardColumnProps {
  column: Column;
  cards: CardType[];
  tags: Tag[];
  canDelete: boolean;
  quickAddValue: string;
  onQuickAddChange: (value: string) => void;
  onQuickAddSubmit: () => void;
  onRename: (name: string) => void;
  onRecolor: (color: Column["color"]) => void;
  onToggleCollapse: () => void;
  onDelete: () => void;
  onOpenCard: (card: CardType) => void;
  onToggleComplete: (card: CardType) => void;
  onDuplicateCard: (card: CardType) => void;
  onArchiveToggle: (card: CardType) => void;
  onDeleteCard: (card: CardType) => void;
  /** Drag state wiring */
  draggingCardId: string | null;
  dropTarget: { columnId: string; index: number } | null;
  onCardDragStart: (card: CardType) => void;
  onHoverCard: (columnId: string, index: number) => void;
  onHoverColumnEnd: (columnId: string, count: number) => void;
  onDropInColumn: (columnId: string) => void;
}

export function BoardColumn({
  column,
  cards,
  tags,
  canDelete,
  quickAddValue,
  onQuickAddChange,
  onQuickAddSubmit,
  onRename,
  onRecolor,
  onToggleCollapse,
  onDelete,
  onOpenCard,
  onToggleComplete,
  onDuplicateCard,
  onArchiveToggle,
  onDeleteCard,
  draggingCardId,
  dropTarget,
  onCardDragStart,
  onHoverCard,
  onHoverColumnEnd,
  onDropInColumn,
}: BoardColumnProps) {
  const [renaming, setRenaming] = useState(false);
  const isDropColumn = dropTarget?.columnId === column.id;

  if (column.collapsed) {
    return (
      <section className="flex h-fit w-12 shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface p-2">
        <Button size="icon" variant="ghost" className="size-8" aria-label={`Expand ${column.name}`} onClick={onToggleCollapse}>
          <ChevronRight className="size-4" />
        </Button>
        <span className={cn("size-2 rounded-full", COLUMN_ACCENT[column.color])} />
        <span className="[writing-mode:vertical-rl] text-xs font-medium text-surface-foreground">
          {column.name} · {cards.length}
        </span>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-2xl bg-surface p-2.5 transition",
        isDropColumn && "ring-2 ring-ring/50",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onHoverColumnEnd(column.id, cards.length);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropInColumn(column.id);
      }}
    >
      <header className="flex items-center gap-1.5 px-1 pb-2">
        <Button size="icon" variant="ghost" className="size-6" aria-label={`Collapse ${column.name}`} onClick={onToggleCollapse}>
          <ChevronDown className="size-4" />
        </Button>
        <span className={cn("size-2 rounded-full", COLUMN_ACCENT[column.color])} />
        {renaming ? (
          <Input
            autoFocus
            defaultValue={column.name}
            className="h-7"
            onBlur={(e) => {
              onRename(e.target.value);
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="font-display flex-1 truncate text-left text-sm font-semibold"
          >
            {column.name}
          </button>
        )}
        <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">{cards.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`${column.name} actions`} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Color</DropdownMenuLabel>
            <div className="flex gap-1.5 px-2 pb-2 pt-1">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Column color ${color}`}
                  onClick={() => onRecolor(color)}
                  className={cn(
                    "size-5 rounded-full ring-offset-2 ring-offset-popover",
                    COLUMN_ACCENT[color],
                    column.color === color ? "ring-2 ring-ring" : "ring-0",
                  )}
                />
              ))}
            </div>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
                  <Trash2 className="size-4" /> Delete column
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="scrollbar-slim flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-0.5">
        {cards.map((card, index) => (
          <CardTile
            key={card.id}
            card={card}
            tags={tags}
            onOpen={() => onOpenCard(card)}
            onToggleComplete={() => onToggleComplete(card)}
            onDuplicate={() => onDuplicateCard(card)}
            onArchiveToggle={() => onArchiveToggle(card)}
            onDelete={() => onDeleteCard(card)}
            isDragging={draggingCardId === card.id}
            dropHint={
              isDropColumn && dropTarget?.index === index
                ? "before"
                : isDropColumn && dropTarget?.index === index + 1 && index === cards.length - 1
                  ? "after"
                  : null
            }
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", card.id);
              onCardDragStart(card);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const after = e.clientY - rect.top > rect.height / 2;
              onHoverCard(column.id, after ? index + 1 : index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropInColumn(column.id);
            }}
          />
        ))}
        {cards.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-2 py-6 text-center text-xs text-muted-foreground">
            Drop a card here
          </p>
        )}
      </div>

      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          onQuickAddSubmit();
        }}
      >
        <Input
          value={quickAddValue}
          onChange={(e) => onQuickAddChange(e.target.value)}
          placeholder="Add card  #tag !high"
          className="h-8 bg-card"
          aria-label={`Add a card to ${column.name}`}
        />
        <Button type="submit" size="icon" variant="secondary" className="size-8" aria-label={`Add card to ${column.name}`}>
          <Plus className="size-4" />
        </Button>
      </form>
    </section>
  );
}
