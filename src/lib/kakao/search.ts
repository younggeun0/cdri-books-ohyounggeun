import type { KakaoBookResponse, KakaoBookSearchRequest } from "./types";

const KAKAO_BOOK_SEARCH_URL = "https://dapi.kakao.com/v3/search/book";
const PAGE_SIZE = 10;

export class KakaoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// 카카오 응답 코드를 그대로 노출하지 않고, 사용자가 할 수 있는 행동 기준으로 문구와 상태를 정한다.
function toKakaoApiError(status: number) {
  if (status === 401 || status === 403) {
    return new KakaoApiError("카카오 API 키가 올바르지 않습니다.", 500);
  }
  if (status === 429) {
    return new KakaoApiError(
      "검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
      429,
    );
  }
  return new KakaoApiError(
    "도서 검색 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
    502,
  );
}

export async function searchBooks({
  query,
  target,
  page,
}: KakaoBookSearchRequest): Promise<KakaoBookResponse> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new KakaoApiError("카카오 API 키가 설정되지 않았습니다.", 500);
  }

  const url = new URL(KAKAO_BOOK_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(PAGE_SIZE));
  if (target) url.searchParams.set("target", target);

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  }).catch(() => {
    throw toKakaoApiError(503);
  });
  if (!res.ok) throw toKakaoApiError(res.status);
  return res.json();
}
