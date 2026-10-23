import { afterEach, describe, expect, it, vi } from "vitest";
import { KakaoApiError, searchBooks } from "./search";

const okResponse = {
  meta: { total_count: 0, pageable_count: 0, is_end: true },
  documents: [],
};

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("searchBooks", () => {
  it("API 키를 KakaoAK 헤더로 보내고 페이지당 10개를 요청한다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    const fetchMock = stubFetch(Response.json(okResponse));

    await expect(
      searchBooks({ query: "한강", target: "person", page: 2 }),
    ).resolves.toEqual(okResponse);

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({
      query: "한강",
      page: "2",
      size: "10",
      target: "person",
    });
    expect(requestInit.headers).toEqual({ Authorization: "KakaoAK test-key" });
    expect(requestInit.signal).toBeInstanceOf(AbortSignal);
  });

  it("API 키가 없으면 카카오를 호출하지 않고 500 에러를 던진다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    const fetchMock = stubFetch(Response.json(okResponse));

    await expect(searchBooks({ query: "a", page: 1 })).rejects.toMatchObject({
      status: 500,
      message: "카카오 API 키가 설정되지 않았습니다.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, 500, "카카오 API 키가 올바르지 않습니다."],
    [429, 429, "검색 요청이 많습니다. 잠시 후 다시 시도해 주세요."],
    [
      500,
      502,
      "도서 검색 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
    ],
  ])(
    "카카오가 %i를 돌려주면 %i 상태와 사용자 문구로 바꾼다",
    async (kakaoStatus, status, message) => {
      vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
      stubFetch(new Response(null, { status: kakaoStatus }));

      const error = await searchBooks({ query: "a", page: 1 }).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(KakaoApiError);
      expect(error).toMatchObject({ status, message });
    },
  );

  it("429의 Retry-After 헤더를 에러에 담는다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    stubFetch(
      new Response(null, { status: 429, headers: { "Retry-After": "7" } }),
    );

    await expect(searchBooks({ query: "a", page: 1 })).rejects.toMatchObject({
      status: 429,
      retryAfter: "7",
    });
  });

  it.each([
    ["필수 필드가 빠진 응답", Response.json({ meta: {}, documents: [{}] })],
    [
      "documents가 배열이 아닌 응답",
      Response.json({ ...okResponse, documents: "x" }),
    ],
    ["JSON이 아닌 응답", new Response("<html>", { status: 200 })],
  ])("%s은 502 에러로 바꾼다", async (_, response) => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    stubFetch(response);

    const error = await searchBooks({ query: "a", page: 1 }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(KakaoApiError);
    expect(error).toMatchObject({
      status: 502,
      message:
        "도서 검색 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
    });
  });

  it("카카오에 연결하지 못하면 502 에러로 바꾼다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    stubFetch(new TypeError("fetch failed"));

    await expect(searchBooks({ query: "a", page: 1 })).rejects.toMatchObject({
      status: 502,
    });
  });

  it("카카오 응답이 제한 시간을 넘기면 504 에러로 바꾼다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    stubFetch(new DOMException("timed out", "TimeoutError"));

    await expect(searchBooks({ query: "a", page: 1 })).rejects.toMatchObject({
      status: 504,
      message:
        "도서 검색 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.",
    });
  });
});
