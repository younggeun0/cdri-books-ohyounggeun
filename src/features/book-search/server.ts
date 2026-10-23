import "server-only";
import { toBookPage } from "@/entities/book";
import type { BookSearchParams } from "@/entities/book";
import { searchBooks } from "@/lib/kakao/search";
import { bookSearchOptions } from "./queries";

// 키와 페이징은 클라이언트와 같은 옵션을 그대로 쓰고, 서버에서는 해석되지 않는 상대 경로(/api/books) 대신 Kakao를 직접 부르는 queryFn만 바꾼다.
export const serverBookSearchOptions = (params: BookSearchParams) => {
  const options = bookSearchOptions(params);
  const { query, target } = options.queryKey[2];
  return {
    ...options,
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      toBookPage(
        await searchBooks({
          query,
          target: target === "all" ? undefined : target,
          page: pageParam,
        }),
        pageParam,
      ),
  };
};
