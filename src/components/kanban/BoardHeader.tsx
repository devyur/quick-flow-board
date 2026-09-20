import { useRef, useState } from "react";
import { Archive, Download, Filter, Plus, RotateCcw, Search, Upload, X } from "lucide-react";
import type { Board, BoardFilters, Priority } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, swatchClass } from "./constants";

interface BoardHeaderProps {
  board: Board;
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
  onRenameBoard: (name: string) => void;
  onAddColumn: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
  visibleCount: number;
  totalCount: number;
}

export function BoardHeader({
  board,
  filters,
  onFiltersChange,
  onRenameBoard,
  onAddColumn,
  onExport,
  onImport,
  onReset,
  visibleCount,
  totalCount,
}: BoardHeaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState(false);

  const set = <K extends keyof BoardFilters>(key: K, value: BoardFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  const activeFilters =
    filters.tagIds.length +
    (filters.priority !== "any" ? 1 : 0) +
    (filters.completion !== "any" ? 1 : 0) +
    (filters.dueOnly ? 1 : 0);

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
      {renaming ? (
        <Input
          autoFocus
          defaultValue={board.name}
          className="h-9 w-56 text-lg font-semibold"
          onBlur={(e) => {
            onRenameBoard(e.target.value);
            setRenaming(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      ) : (
        <button
          type="button"
          onClick={() => setRenaming(true)}
          className="font-display text-lg font-semibold tracking-tight"
        >
          {board.name}
        </button>
      )}
      <span className="text-xs text-muted-foreground">
        {visibleCount} of {totalCount} cards
      </span>

      <div className="relative ml-auto w-full max-w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Search cards…"
          aria-label="Search cards"
          className="h-9 bg-card pl-8 pr-8"
        />
        {filters.query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => set("query", "")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant={activeFilters ? "default" : "secondary"} size="sm">
            <Filter className="size-4" />
            Filters{activeFilters ? ` (${activeFilters})` : ""}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-4">
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {board.tags.map((tag) => {
                const active = filters.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      set(
                        "tagIds",
                        active
                          ? filters.tagIds.filter((t) => t !== tag.id)
                          : [...filters.tagIds, tag.id],
                      )
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
              {board.tags.length === 0 && (
                <p className="text-xs text-muted-foreground">No tags yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={filters.priority} onValueChange={(v) => set("priority", v as Priority | "any")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any priority</SelectItem>
                {(["none", "low", "medium", "high"] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={filters.completion}
              onValueChange={(v) => set("completion", v as BoardFilters["completion"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center justify-between text-sm">
            Only cards with a due date
            <Switch checked={filters.dueOnly} onCheckedChange={(v) => set("dueOnly", v)} />
          </label>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() =>
              onFiltersChange({
                ...filters,
                query: "",
                tagIds: [],
                priority: "any",
                completion: "any",
                dueOnly: false,
              })
            }
          >
            Clear filters
          </Button>
        </PopoverContent>
      </Popover>

      <Button
        variant={filters.showArchived ? "default" : "secondary"}
        size="sm"
        onClick={() => set("showArchived", !filters.showArchived)}
      >
        <Archive className="size-4" />
        {filters.showArchived ? "Archived" : "Active"}
      </Button>

      <Button variant="secondary" size="sm" onClick={onAddColumn}>
        <Plus className="size-4" /> Column
      </Button>

      <Button variant="ghost" size="icon" aria-label="Export board" onClick={onExport}>
        <Download className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Import board" onClick={() => fileInput.current?.click()}>
        <Upload className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Reset board" onClick={onReset}>
        <RotateCcw className="size-4" />
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onImport(await file.text());
          e.target.value = "";
        }}
      />
    </header>
  );
}
