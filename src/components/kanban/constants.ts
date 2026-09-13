import type { CardColor, ColumnColor, Priority } from "@/services";

export const CARD_COLORS: CardColor[] = [
  "default",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "gray",
];

export const COLUMN_COLORS: ColumnColor[] = ["slate", "amber", "sky", "green", "violet", "rose"];

export const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  none: "No priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** Maps a semantic card color to the tint utility defined in styles.css. */
export function cardTintClass(color: CardColor): string {
  return color === "default" ? "bg-card border-border" : `card-tint-${color}`;
}

export function swatchClass(color: CardColor): string {
  return color === "default" ? "bg-muted" : `swatch-${color}`;
}

export const COLUMN_ACCENT: Record<ColumnColor, string> = {
  slate: "swatch-gray",
  amber: "swatch-yellow",
  sky: "swatch-blue",
  green: "swatch-green",
  violet: "swatch-purple",
  rose: "swatch-red",
};
