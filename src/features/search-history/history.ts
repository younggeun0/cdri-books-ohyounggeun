import { createPersistentStore } from "@/lib/persistent-store";

export const MAX_SEARCH_HISTORY = 8;

export function addSearchHistory(
  list: string[],
  query: string,
  max = MAX_SEARCH_HISTORY,
): string[] {
  const trimmed = query.trim();
  if (trimmed === "") return list;
  return [trimmed, ...list.filter((item) => item !== trimmed)].slice(0, max);
}

export function removeSearchHistory(list: string[], query: string): string[] {
  return list.filter((item) => item !== query);
}

export function parseSearchHistory(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === "string")) {
    return null;
  }
  return raw.slice(0, MAX_SEARCH_HISTORY);
}

export const searchHistoryStore = createPersistentStore<string[]>(
  "cdri-books:search-history",
  [],
  parseSearchHistory,
);
