"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { BookSearchParams } from "@/entities/book";
import { bookSearchOptions } from "./queries";
import { parseSearchParams, toSearchQueryString } from "./search-params";

/**
 * URL의 검색 조건과, 그 조건으로 검색을 실행하는 함수를 함께 돌려준다.
 *
 * search는 조건이 바뀌면 서버 렌더 없이 history에 URL을 쌓는다. 조건이 같으면 URL은 두고 결과를 1페이지부터 다시 받는다.
 * 어느 쪽이든 검색 횟수를 1 늘리고 창을 맨 위로 스크롤한다.
 *
 * @returns [현재 검색 조건, search, 검색 횟수]. 검색 횟수는 입력창의 key로 써서 검색할 때마다 입력창을 다시 만든다.
 */
export function useBookSearchParams() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const bookSearchParams = useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );
  // URL이 같아도 검색할 때마다 입력창을 다시 만들 수 있도록 검색 횟수를 센다.
  const [searchCount, setSearchCount] = useState(0);

  const search = useCallback(
    (nextBookSearchParams: BookSearchParams) => {
      // 직접 입력한 URL은 인코딩이 다를 수 있어서(공백이 %20 또는 +) 문자열이 아니라 해석한 조건끼리 비교한다.
      const currentBookSearchParams = parseSearchParams(
        new URLSearchParams(window.location.search),
      );
      const nextQueryString = toSearchQueryString(nextBookSearchParams);
      if (nextQueryString === toSearchQueryString(currentBookSearchParams)) {
        // pushState는 같은 URL도 history에 쌓는다. 같은 조건의 재검색은 URL을 두고 결과만 1페이지부터 다시 받는다.
        void queryClient.resetQueries({
          queryKey: bookSearchOptions(nextBookSearchParams).queryKey,
        });
      } else {
        // router.push는 서버 렌더를 거쳐 카카오 조회가 끝날 때까지 이전 화면이 남는다. URL만 바꾸고 클라이언트가 조회한다.
        window.history.pushState(null, "", `/?${nextQueryString}`);
      }
      setSearchCount((count) => count + 1);
      window.scrollTo({ top: 0 });
    },
    [queryClient],
  );

  return [bookSearchParams, search, searchCount] as const;
}
