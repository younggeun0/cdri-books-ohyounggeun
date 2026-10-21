import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import {
  toBookPage,
  type BookPage,
  type BookSearchParams,
} from "@/entities/book";
import type { KakaoBookResponse } from "@/lib/kakao/types";

export const bookKeys = {
  all: ["books"] as const,
  search: (params: BookSearchParams) =>
    [...bookKeys.all, "search", params] as const,
};

export async function fetchBookPage(
  { query, target }: BookSearchParams,
  page: number,
  signal?: AbortSignal,
): Promise<BookPage> {
  const search = new URLSearchParams({
    query: query.trim(),
    page: String(page),
  });
  if (target !== "all") search.set("target", target);

  const res = await fetch(`/api/books?${search}`, { signal }).catch(
    (error: unknown) => {
      // 취소는 TanStack Query가 처리하도록 그대로 던지고, 네트워크 실패만 사용자 문구로 바꾼다.
      if (signal?.aborted) throw error;
      throw new Error("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      body?.message ?? `도서 검색에 실패했습니다. (${res.status})`,
    );
  }
  return toBookPage((await res.json()) as KakaoBookResponse, page);
}

export const bookSearchOptions = (params: BookSearchParams) => {
  // 앞뒤 공백만 다른 입력이 서로 다른 캐시 항목이 되지 않도록 키를 만들기 전에 한 번만 정리한다.
  const normalized = { ...params, query: params.query.trim() };
  return infiniteQueryOptions({
    queryKey: bookKeys.search(normalized),
    queryFn: ({ pageParam, signal }) =>
      fetchBookPage(normalized, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.isEnd ? undefined : last.page + 1),
    enabled: normalized.query.length > 0,
  });
};

export function useBookSearch(params: BookSearchParams) {
  return useInfiniteQuery(bookSearchOptions(params));
}
