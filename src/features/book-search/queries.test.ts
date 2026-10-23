import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BookSearchError,
  bookSearchRetryDelay,
  fetchBookPage,
  shouldRetryBookSearch,
} from "./queries";

const bookSearchParams = { query: "노르웨이", target: "all" } as const;

function stubFetch(response: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      response instanceof Error
        ? Promise.reject(response)
        : Promise.resolve(response),
    ),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("재시도 규칙", () => {
  const bookSearchError = (status: number, retryAfterMs?: number) =>
    new BookSearchError("x", status, retryAfterMs);

  it("400은 재시도하지 않는다", () => {
    expect(shouldRetryBookSearch(0, bookSearchError(400))).toBe(false);
  });

  it("429는 두 번까지 재시도한다", () => {
    expect(shouldRetryBookSearch(0, bookSearchError(429))).toBe(true);
    expect(shouldRetryBookSearch(1, bookSearchError(429))).toBe(true);
    expect(shouldRetryBookSearch(2, bookSearchError(429))).toBe(false);
  });

  it.each([500, 502, 0])("%i는 한 번만 재시도한다", (status) => {
    expect(shouldRetryBookSearch(0, bookSearchError(status))).toBe(true);
    expect(shouldRetryBookSearch(1, bookSearchError(status))).toBe(false);
  });

  it("서버가 8초를 넘는 대기를 요구하면 재시도하지 않는다", () => {
    expect(shouldRetryBookSearch(0, bookSearchError(429, 8000))).toBe(true);
    expect(shouldRetryBookSearch(0, bookSearchError(429, 9000))).toBe(false);
  });

  it("취소처럼 BookSearchError가 아닌 오류는 재시도하지 않는다", () => {
    expect(
      shouldRetryBookSearch(0, new DOMException("aborted", "AbortError")),
    ).toBe(false);
  });

  it("지연은 Retry-After가 있으면 그 값을, 없으면 8초까지 지수로 늘린다", () => {
    expect(bookSearchRetryDelay(0, bookSearchError(429, 3000))).toBe(3000);
    expect(bookSearchRetryDelay(0, bookSearchError(429))).toBe(1000);
    expect(bookSearchRetryDelay(1, bookSearchError(429))).toBe(2000);
    expect(bookSearchRetryDelay(5, bookSearchError(429))).toBe(8000);
  });
});

describe("fetchBookPage", () => {
  it("성공하면 서버가 준 BookPage를 그대로 돌려준다", async () => {
    const bookPage = { books: [], totalCount: 0, isEnd: true, page: 1 };
    stubFetch(Response.json(bookPage));
    await expect(fetchBookPage(bookSearchParams, 1)).resolves.toEqual(bookPage);
  });

  it("오류 body의 message를 사용자 문구로 쓰고 status와 Retry-After를 담는다", async () => {
    stubFetch(
      Response.json(
        { message: "검색 요청이 많습니다." },
        { status: 429, headers: { "Retry-After": "3" } },
      ),
    );
    await expect(fetchBookPage(bookSearchParams, 1)).rejects.toMatchObject({
      message: "검색 요청이 많습니다.",
      status: 429,
      retryAfterMs: 3000,
    });
  });

  it.each([
    ["message가 없는 JSON", Response.json({ error: "x" }, { status: 500 })],
    [
      "message가 문자열이 아닌 JSON",
      Response.json({ message: 1 }, { status: 500 }),
    ],
    ["JSON이 아닌 body", new Response("<html>", { status: 500 })],
  ])("%s이면 일반 문구로 바꾼다", async (_, response) => {
    stubFetch(response);
    const caught = await fetchBookPage(bookSearchParams, 1).catch(
      (e: unknown) => e,
    );
    expect(caught).toBeInstanceOf(BookSearchError);
    expect(caught).toMatchObject({
      message: "도서 검색에 실패했습니다. (500)",
      status: 500,
      retryAfterMs: undefined,
    });
  });

  it("해석할 수 없는 Retry-After는 무시한다", async () => {
    stubFetch(
      Response.json(
        { message: "m" },
        { status: 429, headers: { "Retry-After": "soon" } },
      ),
    );
    await expect(fetchBookPage(bookSearchParams, 1)).rejects.toMatchObject({
      retryAfterMs: undefined,
    });
  });

  it("네트워크 실패는 status 0 오류로 바꾼다", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    await expect(fetchBookPage(bookSearchParams, 1)).rejects.toMatchObject({
      message: "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      status: 0,
    });
  });

  it("취소된 요청의 오류는 그대로 던진다", async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException("aborted", "AbortError");
    stubFetch(abortError);
    await expect(
      fetchBookPage(bookSearchParams, 1, controller.signal),
    ).rejects.toBe(abortError);
  });
});
