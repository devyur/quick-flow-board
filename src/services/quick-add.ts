import type { Priority } from "./types";

export interface QuickAddResult {
  title: string;
  tags: string[];
  priority: Priority;
  column: string | null;
}

const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];

/**
 * Parses quick-add syntax: "Fix login #work !high @todo".
 * Unknown tokens are kept in the title.
 */
export function parseQuickAdd(input: string): QuickAddResult {
  const tags: string[] = [];
  let priority: Priority = "none";
  let column: string | null = null;

  const words = input.split(/\s+/).filter(Boolean);
  const rest: string[] = [];

  for (const word of words) {
    if (word.length > 1 && word.startsWith("#")) {
      const tag = word.slice(1).toLowerCase();
      if (!tags.includes(tag)) tags.push(tag);
      continue;
    }
    if (word.length > 1 && word.startsWith("!")) {
      const value = word.slice(1).toLowerCase() as Priority;
      if (PRIORITIES.includes(value)) {
        priority = value;
        continue;
      }
    }
    if (word.length > 1 && word.startsWith("@")) {
      column = word.slice(1).toLowerCase();
      continue;
    }
    rest.push(word);
  }

  return { title: rest.join(" ").trim(), tags, priority, column };
}
