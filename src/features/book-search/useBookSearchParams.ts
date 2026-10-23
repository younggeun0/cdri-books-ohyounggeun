"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { BookSearchParams } from "@/entities/book";
import { parseSearchParams, toSearchQueryString } from "./search-params";

// router.push는 서버 렌더를 거쳐서, 서버의 카카오 조회가 끝날 때까지 이전 화면이 그대로 남는다.
// 검색은 클라이언트 캐시로 처리하고 URL만 바꾼다. push여야 뒤로가기가 이전 검색 조건을 되살린다.
function pushSearchParams(next: BookSearchParams) {
  window.history.pushState(null, "", `/?${toSearchQueryString(next)}`);
}

export function useBookSearchParams() {
  const searchParams = useSearchParams();
  const params = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  return [params, pushSearchParams] as const;
}
