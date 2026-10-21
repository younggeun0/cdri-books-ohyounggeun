"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { BookSearchParams } from "@/entities/book";
import { parseSearchParams, toSearchQueryString } from "./search-params";

export function useBookSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  // push여야 뒤로가기가 이전 검색 조건을 되살린다.
  const setParams = useCallback(
    (next: BookSearchParams) => router.push(`/?${toSearchQueryString(next)}`),
    [router],
  );
  return [params, setParams] as const;
}
