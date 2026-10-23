import "server-only";
import {
  toBookPage,
  type BookPage,
  type BookSearchParams,
} from "@/entities/book";
import { searchBooks } from "@/lib/kakao/search";
import { bookSearchOptions } from "./queries";

/**
 * 카카오 응답을 BookPage로 바꾸는 유일한 곳이다. /api/books와 서버 prefetch가 함께 쓴다.
 * target이 "all"이면 카카오에 target을 보내지 않는다. 실패는 KakaoApiError로 그대로 던진다.
 */
export async function searchBookPage(
  { query, target }: BookSearchParams,
  page: number,
): Promise<BookPage> {
  return toBookPage(
    await searchBooks({
      query,
      target: target === "all" ? undefined : target,
      page,
    }),
    page,
  );
}

/**
 * 서버 prefetch용 검색 옵션이다. 쿼리 키는 브라우저의 bookSearchOptions와 같아서, prefetch한 결과를 브라우저가 그대로 이어 쓴다.
 * 서버에서는 해석되지 않는 상대 경로(/api/books) 대신 카카오를 직접 부르는 조회 함수를 넣는다.
 * 서버에서 재시도하면 그 대기 시간만큼 페이지 렌더가 늦어진다. 그래서 끄고, 실패하면 브라우저가 /api/books로 다시 조회하게 둔다.
 */
export const serverBookSearchOptions = (
  bookSearchParams: BookSearchParams,
) => ({
  ...bookSearchOptions(bookSearchParams, searchBookPage),
  retry: false,
});
