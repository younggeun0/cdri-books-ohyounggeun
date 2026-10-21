import type { NextRequest } from "next/server";
import { searchBooks } from "@/lib/kakao/search";
import { KAKAO_BOOK_TARGETS, type KakaoBookTarget } from "@/lib/kakao/types";

const MAX_PAGE = 50;
function isTarget(value: string): value is KakaoBookTarget {
  return (KAKAO_BOOK_TARGETS as readonly string[]).includes(value);
}

function badRequest(message: string) {
  return Response.json({ message }, { status: 400 });
}

// searchParams를 읽는 GET은 Cache Components에서 prerender되지 않고 요청 시점에 실행된다.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const query = params.get("query")?.trim();
  if (!query) return badRequest("query는 필수입니다.");

  const target = params.get("target");
  if (target !== null && !isTarget(target)) {
    return badRequest(
      `target은 ${KAKAO_BOOK_TARGETS.join(", ")} 중 하나여야 합니다.`,
    );
  }

  const page = Math.min(
    Math.max(Number.parseInt(params.get("page") ?? "1", 10) || 1, 1),
    MAX_PAGE,
  );

  const result = await searchBooks({
    query,
    target: target ?? undefined,
    page,
  });
  return Response.json(result);
}
