export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

/** Browser localStorage when available, otherwise an in-memory fallback (SSR/tests). */
export function createBrowserStore(): KeyValueStore {
  if (typeof window === "undefined" || !window.localStorage) return createMemoryStore();
  const ls = window.localStorage;
  return {
    get: (key) => {
      try {
        return ls.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        ls.setItem(key, value);
      } catch {
        /* quota / privacy mode — ignore */
      }
    },
    remove: (key) => {
      try {
        ls.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}
