import type { NextRequest } from "next/server";
import { BOOK_TARGETS, isBookTarget } from "@/entities/book";
import { searchBookPage } from "@/features/book-search/server";
import { KakaoApiError } from "@/lib/kakao/search";
import { KAKAO_MAX_PAGE } from "@/lib/kakao/types";

function badRequest(message: string) {
  return Response.json({ message }, { status: 400 });
}

/**
 * 브라우저가 부르는 도서 검색 API다. 카카오 키를 브라우저에 노출하지 않도록 서버에서 카카오를 대신 부른다.
 * searchParams를 읽는 GET은 Cache Components에서 prerender되지 않고 요청 시점에 실행된다.
 *
 * - query(필수, trim 후 비어 있으면 안 됨), target(title, person, publisher 중 하나, 생략하면 전체 검색), page(1부터 50까지의 정수, 기본 1)를 받는다.
 * - 입력이 잘못되면 400과 { message }를 돌려준다.
 * - 성공하면 BookPage JSON을 돌려준다.
 * - 카카오 호출이 실패하면 KakaoApiError의 status와 { message }를 돌려준다. 429에 Retry-After가 있으면 헤더로 그대로 전달한다.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const query = params.get("query")?.trim();
  if (!query) return badRequest("query는 필수입니다.");

  const target = params.get("target");
  if (target !== null && !isBookTarget(target)) {
    return badRequest(
      `target은 ${BOOK_TARGETS.join(", ")} 중 하나여야 합니다.`,
    );
  }

  const page = Number(params.get("page") ?? "1");
  if (!Number.isInteger(page) || page < 1 || page > KAKAO_MAX_PAGE) {
    return badRequest(`page는 1부터 ${KAKAO_MAX_PAGE} 사이의 정수여야 합니다.`);
  }

  try {
    return Response.json(
      await searchBookPage({ query, target: target ?? "all" }, page),
    );
  } catch (error) {
    if (!(error instanceof KakaoApiError)) throw error;
    return Response.json(
      { message: error.message },
      {
        status: error.status,
        headers: error.retryAfter ? { "Retry-After": error.retryAfter } : {},
      },
    );
  }
}
