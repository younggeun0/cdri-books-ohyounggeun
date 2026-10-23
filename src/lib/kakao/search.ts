import type { BookTarget } from "@/entities/book";
import { kakaoBookResponseSchema, type KakaoBookResponse } from "./schema";

const KAKAO_BOOK_SEARCH_URL = "https://dapi.kakao.com/v3/search/book";
/** 한 페이지에 받는 책 수다. */
const PAGE_SIZE = 10;
/**
 * 카카오 요청 제한 시간(ms)이다.
 * 서버 렌더가 카카오 응답을 기다리므로, 카카오가 응답하지 않으면 화면이 스켈레톤에 멈춘다. 3초가 지나면 요청을 끊고 오류로 처리한다. 실측 응답은 수십 ms였다.
 */
const TIMEOUT_MS = 3000;

interface KakaoBookSearchRequest {
  query: string;
  target?: BookTarget;
  page: number;
}

/**
 * 카카오 호출 실패를 사용자 문구와 /api/books 응답 상태로 바꾼 오류다.
 * status는 카카오의 응답 코드가 아니라 /api/books가 그대로 내려줄 HTTP 상태다.
 */
export class KakaoApiError extends Error {
  constructor(
    /** 사용자에게 그대로 보여 줄 한국어 문구다. */
    message: string,
    readonly status: number,
    /** 429일 때 카카오가 준 Retry-After 헤더 원문. 클라이언트가 재시도 지연으로 쓴다. */
    readonly retryAfter?: string,
  ) {
    super(message);
  }
}

/**
 * 카카오 응답 코드를 그대로 노출하지 않고, 사용자가 할 수 있는 행동 기준으로 문구와 상태를 정한다.
 * 401과 403은 키 문제라 500, 429는 Retry-After와 함께 429, 나머지는 모두 502가 된다.
 */
function toKakaoApiError(status: number, retryAfter?: string) {
  if (status === 401 || status === 403) {
    return new KakaoApiError("카카오 API 키가 올바르지 않습니다.", 500);
  }
  if (status === 429) {
    return new KakaoApiError(
      "검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
      429,
      retryAfter,
    );
  }
  return new KakaoApiError(
    "도서 검색 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
    502,
  );
}

/**
 * 카카오 책 검색 API를 한 번 호출하고, 검증한 원본 응답을 돌려준다. 재시도는 하지 않는다.
 *
 * 실패는 모두 {@link KakaoApiError}로 던진다.
 * - KAKAO_REST_API_KEY가 없거나, 카카오가 401 또는 403을 주면 500
 * - 카카오가 429를 주면 429. Retry-After 원문을 retryAfter에 담는다.
 * - 3초 안에 응답이 없으면 504
 * - 응답을 받기 전에 네트워크 오류가 나면 502. toKakaoApiError(503)로 부르지만 503은 401, 403, 429가 아니라서 502가 된다.
 * - 그 밖의 실패 응답, JSON이 아니거나 스키마와 다른 응답이면 502
 *
 * target을 생략하면 카카오의 전체 검색이 된다.
 */
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw error instanceof DOMException && error.name === "TimeoutError"
      ? new KakaoApiError(
          "도서 검색 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.",
          504,
        )
      : toKakaoApiError(503);
  });
  if (!res.ok) {
    throw toKakaoApiError(
      res.status,
      res.headers.get("Retry-After") ?? undefined,
    );
  }
  // 형태가 다른 응답(스키마 변경, 프록시가 준 HTML 등)이 변환 단계에서 터지지 않도록 여기서 막는다.
  const parsed = kakaoBookResponseSchema.safeParse(
    await res.json().catch(() => null),
  );
  if (!parsed.success) throw toKakaoApiError(502);
  return parsed.data;
}
