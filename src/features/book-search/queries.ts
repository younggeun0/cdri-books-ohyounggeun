import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { BookPage, BookSearchParams } from "@/entities/book";

export const bookKeys = {
  all: ["books"] as const,
  search: (params: BookSearchParams) =>
    [...bookKeys.all, "search", params] as const,
};

export class BookSearchError extends Error {
  constructor(
    message: string,
    // 네트워크 실패처럼 응답이 없으면 0이다.
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

const errorBodySchema = z.object({ message: z.string() });

const MAX_RETRY_DELAY_MS = 8000;

// 우리 서버는 Retry-After를 초 단위로만 준다.
function parseRetryAfterMs(header: string | null) {
  const seconds = header?.trim() ? Number(header) : NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

// failureCount는 첫 실패에서 0이다.
export function shouldRetryBookSearch(failureCount: number, error: Error) {
  // 취소처럼 응답 오류가 아닌 것은 재시도하지 않는다.
  if (!(error instanceof BookSearchError)) return false;
  if (error.status === 429) {
    // Retry-After가 8초를 넘으면 그동안 로딩 화면만 보이므로, 기다리지 않고 바로 오류 화면을 보여 준다.
    return failureCount < 2 && (error.retryAfterMs ?? 0) <= MAX_RETRY_DELAY_MS;
  }
  if (error.status === 0 || error.status >= 500) return failureCount < 1;
  return false;
}

export function bookSearchRetryDelay(failureCount: number, error: Error) {
  const retryAfterMs =
    error instanceof BookSearchError ? error.retryAfterMs : undefined;
  return retryAfterMs ?? Math.min(1000 * 2 ** failureCount, MAX_RETRY_DELAY_MS);
}

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
      throw new BookSearchError(
        "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
        0,
      );
    },
  );
  if (!res.ok) {
    const body = errorBodySchema.safeParse(await res.json().catch(() => null));
    throw new BookSearchError(
      body.success
        ? body.data.message
        : `도서 검색에 실패했습니다. (${res.status})`,
      res.status,
      parseRetryAfterMs(res.headers.get("Retry-After")),
    );
  }
  // 같은 배포의 우리 서버가 BookPage 모양을 보장하므로 성공 응답은 검증하지 않는다.
  return res.json();
}

export const bookSearchOptions = (
  params: BookSearchParams,
  fetchPage: typeof fetchBookPage = fetchBookPage,
) => {
  // 앞뒤 공백만 다른 입력이 서로 다른 캐시 항목이 되지 않도록 키를 만들기 전에 한 번만 정리한다.
  const normalized = { ...params, query: params.query.trim() };
  return infiniteQueryOptions({
    queryKey: bookKeys.search(normalized),
    queryFn: ({ pageParam, signal }) =>
      fetchPage(normalized, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.isEnd ? undefined : last.page + 1),
    enabled: normalized.query.length > 0,
    retry: shouldRetryBookSearch,
    retryDelay: bookSearchRetryDelay,
  });
};

export function useBookSearch(params: BookSearchParams) {
  return useInfiniteQuery(bookSearchOptions(params));
}
