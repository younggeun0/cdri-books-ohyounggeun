import { atomWithStorage } from "jotai/utils";
import { z } from "zod";
import { validatedJSONStorage } from "@/lib/validated-storage";

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

const searchHistorySchema = z
  .array(z.string())
  .transform((list) => list.slice(0, MAX_SEARCH_HISTORY));

export function parseSearchHistory(raw: unknown): string[] | null {
  const parsed = searchHistorySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const searchHistoryAtom = atomWithStorage<string[] | undefined>(
  "cdri-books:search-history",
  undefined,
  validatedJSONStorage(parseSearchHistory, []),
);
