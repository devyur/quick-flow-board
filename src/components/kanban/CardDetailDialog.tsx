import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, CopyPlus, Plus, Trash2, X } from "lucide-react";
import type { Board, Card, CardColor, CardPatch, Priority } from "@/services";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CARD_COLORS, PRIORITIES, PRIORITY_LABEL, swatchClass } from "./constants";
import { DrawingCanvas } from "./DrawingCanvas";

interface CardDetailDialogProps {
  card: Card | null;
  board: Board;
  onClose: () => void;
  onPatch: (id: string, patch: CardPatch) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchiveToggle: (id: string, archived: boolean) => void;
  onCreateTag: (name: string, cardId: string) => void;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
}

export function CardDetailDialog({
  card,
  board,
  onClose,
  onPatch,
  onDelete,
  onDuplicate,
  onArchiveToggle,
  onCreateTag,
}: CardDetailDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newTag, setNewTag] = useState("");
  const [sketching, setSketching] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setSketching(false);
  }, [card?.id, card?.title, card?.description]);

  if (!card) return null;
  const id = card.id;
  const patch = (p: CardPatch) => onPatch(id, p);
  const done = card.checklist.filter((i) => i.done).length;

  const attachImage = async (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    patch({ imageDataUrl: await fileToDataUrl(file) });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-y-auto sm:max-w-3xl"
        onPaste={(e) => {
          const file = Array.from(e.clipboardData.files)[0];
          if (file) void attachImage(file);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const file = Array.from(e.dataTransfer.files)[0];
          if (file) {
            e.preventDefault();
            void attachImage(file);
          }
        }}
      >
        <DialogHeader className="pb-3">
          <DialogTitle className="sr-only">Card details</DialogTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== card.title && patch({ title: title.trim() })}
            className="font-display h-auto border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
          />
          <p className="text-xs text-muted-foreground">
            In {board.columns.find((c) => c.id === card.columnId)?.name} · created{" "}
            {new Date(card.createdAt).toLocaleDateString()} · edited{" "}
            {new Date(card.updatedAt).toLocaleString()}
          </p>
        </DialogHeader>

        {sketching ? (
          <DrawingCanvas
            initial={card.drawingDataUrl}
            onClose={() => setSketching(false)}
            onSave={(dataUrl) => {
              patch({ drawingDataUrl: dataUrl });
              setSketching(false);
            }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-[1fr_15rem]">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => description !== card.description && patch({ description })}
                  placeholder="Write anything worth remembering…"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Checklist</Label>
                  {card.checklist.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {done} / {card.checklist.length} completed
                    </span>
                  )}
                </div>
                {card.checklist.length > 0 && (
                  <Progress value={(done / card.checklist.length) * 100} className="h-1.5" />
                )}
                <ul className="space-y-1">
                  {card.checklist.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={(checked) =>
                          patch({
                            checklist: card.checklist.map((i) =>
                              i.id === item.id ? { ...i, done: Boolean(checked) } : i,
                            ),
                          })
                        }
                      />
                      <Input
                        defaultValue={item.text}
                        onBlur={(e) =>
                          patch({
                            checklist: card.checklist.map((i) =>
                              i.id === item.id ? { ...i, text: e.target.value } : i,
                            ),
                          })
                        }
                        className={cn("h-8 border-0 bg-transparent px-1 shadow-none focus-visible:bg-muted", item.done && "line-through text-muted-foreground")}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label="Delete item"
                        onClick={() => patch({ checklist: card.checklist.filter((i) => i.id !== item.id) })}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newItem.trim()) return;
                    patch({
                      checklist: [
                        ...card.checklist,
                        { id: `chk_${Date.now()}`, text: newItem.trim(), done: false },
                      ],
                    });
                    setNewItem("");
                  }}
                >
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add an item and press Enter"
                    className="h-8"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    <Plus className="size-4" />
                  </Button>
                </form>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Image</Label>
                  {card.imageDataUrl ? (
                    <div className="space-y-2">
                      <a href={card.imageDataUrl} target="_blank" rel="noreferrer">
                        <img
                          src={card.imageDataUrl}
                          alt={`Attachment on ${card.title}`}
                          className="h-32 w-full rounded-lg border border-border object-cover"
                        />
                      </a>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}>
                          Replace
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => patch({ imageDataUrl: null })}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition hover:bg-muted"
                    >
                      <Plus className="size-4" />
                      Upload, drop or paste an image
                    </button>
                  )}
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void attachImage(e.target.files?.[0])}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Sketch</Label>
                  {card.drawingDataUrl ? (
                    <div className="space-y-2">
                      <img
                        src={card.drawingDataUrl}
                        alt={`Sketch on ${card.title}`}
                        className="h-32 w-full rounded-lg border border-border bg-white object-contain"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSketching(true)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => patch({ drawingDataUrl: null })}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSketching(true)}
                      className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition hover:bg-muted"
                    >
                      <Plus className="size-4" />
                      Draw a quick sketch
                    </button>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4 rounded-xl bg-surface p-3">
              <div className="space-y-1.5">
                <Label>Column</Label>
                <Select value={card.columnId} onValueChange={(value) => patch({ columnId: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {board.columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={card.priority} onValueChange={(value) => patch({ priority: value as Priority })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="due">Due date</Label>
                <Input
                  id="due"
                  type="date"
                  value={card.dueDate ?? ""}
                  onChange={(e) => patch({ dueDate: e.target.value || null })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CARD_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      onClick={() => patch({ color: color as CardColor })}
                      className={cn(
                        "size-6 rounded-full ring-offset-2 ring-offset-surface transition",
                        swatchClass(color),
                        card.color === color ? "ring-2 ring-ring" : "ring-0",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {board.tags.map((tag) => {
                    const active = card.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          patch({
                            tagIds: active
                              ? card.tagIds.filter((t) => t !== tag.id)
                              : [...card.tagIds, tag.id],
                          })
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", swatchClass(tag.color))} />#{tag.name}
                      </button>
                    );
                  })}
                </div>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !newTag.trim()) return;
                    e.preventDefault();
                    onPatch(id, { tagIds: card.tagIds });
                    window.dispatchEvent(
                      new CustomEvent("kanban:create-tag", {
                        detail: { name: newTag.trim(), cardId: id },
                      }),
                    );
                    setNewTag("");
                  }}
                  placeholder="New tag + Enter"
                  className="h-8"
                />
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={card.completed}
                    onCheckedChange={(checked) => patch({ completed: Boolean(checked) })}
                  />
                  Completed
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => onDuplicate(id)}>
                    <CopyPlus className="size-3.5" /> Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onArchiveToggle(id, !card.archived);
                      onClose();
                    }}
                  >
                    {card.archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                    {card.archived ? "Restore" : "Archive"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      onDelete(id);
                      onClose();
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
