import { atomWithStorage } from "jotai/utils";
import * as z from "zod/mini";
import { validatedJSONStorage } from "@/lib/validated-storage";

/** 저장하는 최근 검색어 수의 상한이다. */
export const MAX_SEARCH_HISTORY = 8;

/**
 * 검색어를 최근 검색 목록 맨 앞에 넣는다. 앞뒤 공백을 지운 값으로 저장하고, 같은 검색어가 있으면 앞으로 옮긴다.
 * maxCount개를 넘으면 오래된 것부터 버린다. 공백뿐인 검색어는 무시하고 history를 그대로 돌려준다.
 *
 * @example
 * addSearchHistory(["a", "b"], " b "); // ["b", "a"]
 */
export function addSearchHistory(
  history: string[],
  query: string,
  maxCount = MAX_SEARCH_HISTORY,
): string[] {
  const trimmed = query.trim();
  if (trimmed === "") return history;
  return [
    trimmed,
    ...history.filter((savedQuery) => savedQuery !== trimmed),
  ].slice(0, maxCount);
}

/** 목록에서 query와 정확히 같은 항목을 지운다. query의 공백은 정리하지 않는다. */
export function removeSearchHistory(
  history: string[],
  query: string,
): string[] {
  return history.filter((savedQuery) => savedQuery !== query);
}

const searchHistorySchema = z.pipe(
  z.array(z.string()),
  z.transform((history) =>
    [...new Set(history.map((query) => query.trim()).filter(Boolean))].slice(
      0,
      MAX_SEARCH_HISTORY,
    ),
  ),
);

/**
 * localStorage에서 읽은 최근 검색 목록을 검증한다. 앞에서부터 MAX_SEARCH_HISTORY개만 남긴다.
 * 검색어는 화면에서 React key로 쓰므로, addSearchHistory가 지키는 규칙(앞뒤 공백 없음, 빈 검색어 없음, 중복 없음)을 읽을 때도 다시 맞춘다. 중복이면 앞의 것을 남긴다.
 * 문자열이 아닌 항목이 하나라도 있으면 목록 전체를 버리고 null을 돌려준다.
 */
export function parseSearchHistory(raw: unknown): string[] | null {
  const parsed = searchHistorySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** 최근 검색어 목록이다. 저장소를 읽기 전(서버 렌더 포함)에는 undefined다. */
export const searchHistoryAtom = atomWithStorage<string[] | undefined>(
  "cdri-books:search-history",
  undefined,
  validatedJSONStorage(parseSearchHistory, []),
);
