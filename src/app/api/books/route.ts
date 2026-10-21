import type { NextRequest } from "next/server";
import { KakaoApiError, searchBooks } from "@/lib/kakao/search";
import {
  KAKAO_BOOK_TARGETS,
  KAKAO_MAX_PAGE,
  isKakaoBookTarget,
} from "@/lib/kakao/types";

function badRequest(message: string) {
  return Response.json({ message }, { status: 400 });
}

// searchParams를 읽는 GET은 Cache Components에서 prerender되지 않고 요청 시점에 실행된다.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const query = params.get("query")?.trim();
  if (!query) return badRequest("query는 필수입니다.");

  const target = params.get("target");
  if (target !== null && !isKakaoBookTarget(target)) {
    return badRequest(
      `target은 ${KAKAO_BOOK_TARGETS.join(", ")} 중 하나여야 합니다.`,
    );
  }

  const page = Number(params.get("page") ?? "1");
  if (!Number.isInteger(page) || page < 1 || page > KAKAO_MAX_PAGE) {
    return badRequest(`page는 1부터 ${KAKAO_MAX_PAGE} 사이의 정수여야 합니다.`);
  }

  try {
    const result = await searchBooks({
      query,
      target: target ?? undefined,
      page,
    });
    return Response.json(result);
  } catch (error) {
    if (!(error instanceof KakaoApiError)) throw error;
    return Response.json({ message: error.message }, { status: error.status });
  }
}
