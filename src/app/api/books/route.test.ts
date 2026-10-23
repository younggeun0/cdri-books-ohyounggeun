import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KAKAO_DOCUMENTS } from "@/test/kakao-documents";
import { GET } from "./route";

// 실제 패키지는 Next 번들러가 해석하므로 vitest에서는 빈 모듈로 대신한다.
vi.mock("server-only", () => ({}));

function stubKakao(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function booksRequest(queryString: string) {
  return new NextRequest(`http://localhost/api/books?${queryString}`);
}

beforeEach(() => vi.stubEnv("KAKAO_REST_API_KEY", "test-key"));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /api/books", () => {
  it("카카오 응답을 BookPage로 바꿔 돌려준다", async () => {
    stubKakao(
      Response.json({
        meta: { total_count: 1, pageable_count: 1, is_end: true },
        documents: [KAKAO_DOCUMENTS[0]],
      }),
    );

    const response = await GET(
      booksRequest(`query=${encodeURIComponent("노르웨이")}&page=2`),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ totalCount: 1, isEnd: true, page: 2 });
    expect(body.books[0]).toMatchObject({
      id: KAKAO_DOCUMENTS[0].url,
      title: "노르웨이의 숲",
      salePrice: 15300,
    });
    expect(body).not.toHaveProperty("meta");
  });

  it("카카오 응답의 형태가 다르면 502와 사용자 문구를 돌려준다", async () => {
    stubKakao(
      Response.json({
        meta: { total_count: 1, is_end: true },
        documents: [{ title: "필드가 빠진 책" }],
      }),
    );

    const response = await GET(booksRequest("query=a"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message:
        "도서 검색 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
    });
  });

  it("카카오가 Retry-After를 주면 429 응답에 그대로 싣는다", async () => {
    stubKakao(
      new Response(null, { status: 429, headers: { "Retry-After": "5" } }),
    );

    const response = await GET(booksRequest("query=a"));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("5");
  });

  it("Retry-After가 없으면 429 응답에도 싣지 않는다", async () => {
    stubKakao(new Response(null, { status: 429 }));

    const response = await GET(booksRequest("query=a"));

    expect(response.status).toBe(429);
    expect(response.headers.has("Retry-After")).toBe(false);
  });

  it("query가 없으면 카카오를 부르지 않고 400을 돌려준다", async () => {
    const fetchMock = stubKakao(Response.json({}));

    const response = await GET(booksRequest("page=1"));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
