import { AlertCircle, CalendarDays, CheckCircle2, CopyPlus, GripVertical, Image as ImageIcon, ListChecks, MoreHorizontal, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { checklistProgress, isOverdue, type Card as CardType, type Tag } from "@/services";
import { cardTintClass, swatchClass } from "./constants";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CardTileProps {
  card: CardType;
  tags: Tag[];
  onOpen: () => void;
  onToggleComplete: () => void;
  onDuplicate: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  dropHint: "before" | "after" | null;
}

const priorityStyles: Record<string, string> = {
  low: "swatch-blue",
  medium: "swatch-yellow",
  high: "swatch-red",
};

export function CardTile({
  card,
  tags,
  onOpen,
  onToggleComplete,
  onDuplicate,
  onArchiveToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dropHint,
}: CardTileProps) {
  const progress = checklistProgress(card);
  const overdue = isOverdue(card);
  const cardTags = tags.filter((t) => card.tagIds.includes(t.id));

  return (
    <div
      className={cn(
        "group relative",
        dropHint === "before" && "before:absolute before:-top-1 before:left-0 before:h-0.5 before:w-full before:rounded-full before:bg-primary",
        dropHint === "after" && "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-primary",
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <article
        draggable
        onDragStart={onDragStart}
        onClick={onOpen}
        className={cn(
          "cursor-pointer rounded-xl border p-2.5 shadow-card transition hover:shadow-lift",
          cardTintClass(card.color),
          card.completed && "opacity-70",
          isDragging && "opacity-40",
        )}
      >
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          <h3
            className={cn(
              "flex-1 text-sm leading-snug font-medium",
              card.completed && "line-through decoration-1",
            )}
          >
            {card.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label="Card actions"
              className="rounded-md p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted group-hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={onOpen}>
                <Pencil className="size-4" /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleComplete}>
                <CheckCircle2 className="size-4" />
                {card.completed ? "Mark incomplete" : "Mark completed"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicate}>
                <CopyPlus className="size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onArchiveToggle}>
                {card.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                {card.archived ? "Restore" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(card.imageDataUrl || card.drawingDataUrl) && (
          <img
            src={card.imageDataUrl ?? card.drawingDataUrl!}
            alt={`Attachment on ${card.title}`}
            className="mt-2 h-24 w-full rounded-lg border border-border/60 object-cover"
            loading="lazy"
          />
        )}

        {(cardTags.length > 0 ||
          card.priority !== "none" ||
          card.dueDate ||
          progress.total > 0 ||
          card.imageDataUrl) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {card.priority !== "none" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">
                <span className={cn("size-1.5 rounded-full", priorityStyles[card.priority])} />
                {card.priority}
              </span>
            )}
            {cardTags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5">
                <span className={cn("size-1.5 rounded-full", swatchClass(tag.color))} />#{tag.name}
              </span>
            ))}
            {progress.total > 0 && (
              <span className="inline-flex items-center gap-1">
                <ListChecks className="size-3" />
                {progress.done}/{progress.total}
              </span>
            )}
            {card.dueDate && (
              <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
                {overdue ? <AlertCircle className="size-3" /> : <CalendarDays className="size-3" />}
                {card.dueDate}
              </span>
            )}
            {card.imageDataUrl && <ImageIcon className="size-3" />}
          </div>
        )}
      </article>
    </div>
  );
}
