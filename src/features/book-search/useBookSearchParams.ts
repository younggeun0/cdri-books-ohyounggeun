"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { BookSearchParams } from "@/entities/book";
import { bookSearchOptions } from "./queries";
import { parseSearchParams, toSearchQueryString } from "./search-params";

export function useBookSearchParams() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const params = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  // URL이 같아도 검색할 때마다 입력창을 다시 만들 수 있도록 검색 횟수를 센다.
  const [searchCount, setSearchCount] = useState(0);

  const search = useCallback(
    (next: BookSearchParams) => {
      // 직접 입력한 URL은 인코딩이 다를 수 있어서(공백이 %20 또는 +) 문자열이 아니라 해석한 조건끼리 비교한다.
      const current = parseSearchParams(
        new URLSearchParams(window.location.search),
      );
      const qs = toSearchQueryString(next);
      if (qs === toSearchQueryString(current)) {
        // pushState는 같은 URL도 history에 쌓는다. 같은 조건의 재검색은 URL을 두고 결과만 1페이지부터 다시 받는다.
        void queryClient.resetQueries({
          queryKey: bookSearchOptions(next).queryKey,
        });
      } else {
        // router.push는 서버 렌더를 거쳐 카카오 조회가 끝날 때까지 이전 화면이 남는다. URL만 바꾸고 클라이언트가 조회한다.
        window.history.pushState(null, "", `/?${qs}`);
      }
      setSearchCount((count) => count + 1);
      window.scrollTo({ top: 0 });
    },
    [queryClient],
  );

  return [params, search, searchCount] as const;
}
