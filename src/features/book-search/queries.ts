import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import * as z from "zod/mini";
import type { BookPage, BookSearchParams } from "@/entities/book";

/**
 * 도서 검색의 TanStack Query 키다. 서버 prefetch와 브라우저 조회가 이 키로 같은 캐시 항목을 쓴다.
 * search 키에는 query를 trim한 조건을 넣어야 한다. {@link bookSearchOptions}가 그렇게 만든다.
 */
export const bookKeys = {
  all: ["books"] as const,
  search: (bookSearchParams: BookSearchParams) =>
    [...bookKeys.all, "search", bookSearchParams] as const,
};

/** 브라우저에서 /api/books 조회가 실패했을 때 던지는 오류다. message는 화면에 그대로 보여 준다. */
export class BookSearchError extends Error {
  constructor(
    message: string,
    /** 네트워크 실패처럼 응답이 없으면 0이다. */
    readonly status: number,
    /** 응답의 Retry-After를 ms로 바꾼 값이다. 없거나 해석할 수 없으면 undefined다. */
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

const errorBodySchema = z.object({ message: z.string() });

/** 재시도 전 대기 시간의 상한(ms)이다. 429의 Retry-After가 이보다 길면 재시도하지 않고, 지수 백오프도 이 값을 넘지 않는다. */
const MAX_RETRY_DELAY_MS = 8000;

/**
 * Retry-After 헤더를 ms로 바꾼다.
 * /api/books는 카카오가 준 Retry-After 원문을 그대로 전달한다. 초 단위 숫자만 해석하고, HTTP 날짜처럼 숫자가 아닌 값은 undefined로 둔다.
 */
function parseRetryAfterMs(header: string | null) {
  const seconds = header?.trim() ? Number(header) : NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

/**
 * 도서 검색의 TanStack Query retry 정책이다.
 * - 429는 Retry-After가 8초 이하이거나 없을 때 2번까지 재시도한다.
 * - 네트워크 실패(status 0)와 5xx는 1번 재시도한다.
 * - 그 밖의 오류(400 등)와 취소는 재시도하지 않는다.
 *
 * @param failureCount 첫 실패에서 0이다.
 * @example
 * shouldRetryBookSearch(0, new BookSearchError("", 429, 3000)); // true
 * shouldRetryBookSearch(0, new BookSearchError("", 429, 9000)); // false
 * shouldRetryBookSearch(1, new BookSearchError("", 502)); // false
 */
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

/**
 * 재시도 전 대기 시간(ms)이다. Retry-After가 있으면 그 값을 쓰고, 없으면 1초에서 시작해 두 배씩 늘리되 8초를 넘지 않는다.
 *
 * @example
 * bookSearchRetryDelay(0, new BookSearchError("", 429, 3000)); // 3000
 * bookSearchRetryDelay(0, new BookSearchError("", 502)); // 1000
 * bookSearchRetryDelay(1, new BookSearchError("", 502)); // 2000
 */
export function bookSearchRetryDelay(failureCount: number, error: Error) {
  const retryAfterMs =
    error instanceof BookSearchError ? error.retryAfterMs : undefined;
  return retryAfterMs ?? Math.min(1000 * 2 ** failureCount, MAX_RETRY_DELAY_MS);
}

/**
 * 브라우저에서 /api/books를 불러 검색 결과 한 페이지를 받는다.
 * 실패 응답은 body의 message를 담은 {@link BookSearchError}로 던진다. body에 message가 없으면 "도서 검색에 실패했습니다. (status)"를 쓴다.
 * 네트워크 실패는 status 0의 BookSearchError로 던진다.
 * signal로 취소된 요청은 원래 오류를 그대로 던진다.
 */
export async function fetchBookPage(
  { query, target }: BookSearchParams,
  page: number,
  signal?: AbortSignal,
): Promise<BookPage> {
  const apiSearchParams = new URLSearchParams({
    query: query.trim(),
    page: String(page),
  });
  if (target !== "all") apiSearchParams.set("target", target);

  const response = await fetch(`/api/books?${apiSearchParams}`, {
    signal,
  }).catch((error: unknown) => {
    // 취소는 TanStack Query가 처리하도록 그대로 던지고, 네트워크 실패만 사용자 문구로 바꾼다.
    if (signal?.aborted) throw error;
    throw new BookSearchError(
      "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      0,
    );
  });
  if (!response.ok) {
    const errorBody = errorBodySchema.safeParse(
      await response.json().catch(() => null),
    );
    throw new BookSearchError(
      errorBody.success
        ? errorBody.data.message
        : `도서 검색에 실패했습니다. (${response.status})`,
      response.status,
      parseRetryAfterMs(response.headers.get("Retry-After")),
    );
  }
  // 같은 배포의 우리 서버가 BookPage 모양을 보장하므로 성공 응답은 검증하지 않는다.
  return response.json();
}

/**
 * 도서 검색의 무한 조회 옵션이다. 1페이지부터 받고, 마지막 페이지의 isEnd가 true면 더 받지 않는다.
 * 검색어가 비어 있으면 조회하지 않는다.
 *
 * @param fetchPage 페이지 조회 함수다. 서버 prefetch는 카카오를 직접 부르는 함수로 바꿔 넣는다.
 */
export const bookSearchOptions = (
  bookSearchParams: BookSearchParams,
  fetchPage: typeof fetchBookPage = fetchBookPage,
) => {
  // 앞뒤 공백만 다른 입력이 서로 다른 캐시 항목이 되지 않도록 키를 만들기 전에 한 번만 정리한다.
  const normalized = {
    ...bookSearchParams,
    query: bookSearchParams.query.trim(),
  };
  return infiniteQueryOptions({
    queryKey: bookKeys.search(normalized),
    queryFn: ({ pageParam, signal }) =>
      fetchPage(normalized, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.isEnd ? undefined : lastPage.page + 1,
    enabled: normalized.query.length > 0,
    retry: shouldRetryBookSearch,
    retryDelay: bookSearchRetryDelay,
  });
};

/** 검색 조건에 맞는 결과를 페이지 단위로 불러오는 훅이다. 조건은 {@link bookSearchOptions}가 정리한다. */
export function useBookSearch(bookSearchParams: BookSearchParams) {
  return useInfiniteQuery(bookSearchOptions(bookSearchParams));
}
