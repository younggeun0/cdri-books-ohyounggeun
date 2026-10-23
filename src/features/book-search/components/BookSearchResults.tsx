"use client";

import type { Book, BookSearchParams } from "@/entities/book";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ResultCount } from "@/components/ResultCount";
import {
  BookList,
  BookListSkeleton,
} from "@/features/book-list/components/BookList";
import { InfiniteScrollTrigger } from "@/features/book-list/components/InfiniteScrollTrigger";
import { useWishlist } from "@/features/wishlist/wishlist";
import { useBookSearch } from "../queries";
import { useBookSearchParams } from "../useBookSearchParams";

const RESULT_COUNT_LABEL = "도서 검색 결과";

/** 검색 결과 영역이 보여 줄 화면이다. 한 번에 하나만 보인다. */
type SearchScreen =
  | { kind: "idle" | "loading" | "empty" }
  | { kind: "error"; message: string }
  | { kind: "results"; totalCount: number; books: Book[] };

/**
 * 검색 조건과 조회 상태로 지금 보여 줄 화면을 정한다.
 * 검색어가 비면 idle, 받은 데이터 없이 실패하면 error, 아직 받는 중이면 loading, 전체 결과가 0건이면 empty다.
 *
 * @returns screen과 조회 결과(bookSearchQuery)다. bookSearchQuery는 재시도와 다음 페이지 조회에 쓴다.
 */
function useSearchScreen(bookSearchParams: BookSearchParams) {
  const bookSearchQuery = useBookSearch(bookSearchParams);
  const { data, error } = bookSearchQuery;

  // 다음 페이지만 실패했다면 이미 받은 목록은 남겨 둔다. 화면 전체를 에러로 바꾸지 않는다.
  let screen: SearchScreen;
  if (bookSearchParams.query.trim() === "") screen = { kind: "idle" };
  else if (!data && error) screen = { kind: "error", message: error.message };
  else if (!data) screen = { kind: "loading" };
  else if (data.pages[0].totalCount === 0) screen = { kind: "empty" };
  else {
    screen = {
      kind: "results",
      totalCount: data.pages[0].totalCount,
      books: data.pages.flatMap((page) => page.books),
    };
  }
  return { screen, bookSearchQuery };
}

/**
 * 검색 화면의 결과 영역이다. 결과 수, 책 목록, 무한 스크롤, 오류와 재시도를 그린다.
 * 첫 진입 뒤의 검색은 서버를 거치지 않고 URL만 바뀌므로, 검색 조건은 props가 아니라 URL에서 직접 읽는다.
 */
export function BookSearchResults() {
  const [bookSearchParams] = useBookSearchParams();
  const { screen, bookSearchQuery } = useSearchScreen(bookSearchParams);
  const { isWished, toggleWish } = useWishlist();

  return (
    <>
      {/* 상태가 바뀌어도 같은 요소로 남아야 aria-live가 결과 수 변화를 읽어 준다. */}
      <ResultCount label={RESULT_COUNT_LABEL} count={resultCount(screen)} />
      {renderScreen()}
    </>
  );

  function renderScreen() {
    switch (screen.kind) {
      case "idle":
      case "empty":
        return <EmptyState message="검색된 결과가 없습니다." />;
      case "loading":
        return <BookListSkeleton />;
      case "error":
        return (
          <div role="alert" className="mt-4 flex flex-col items-center gap-4">
            <p className="text-caption text-text-secondary">{screen.message}</p>
            <Button size="md" onClick={() => bookSearchQuery.refetch()}>
              다시 시도
            </Button>
          </div>
        );
      case "results":
        return (
          <>
            <BookList
              books={screen.books}
              isWished={isWished}
              onToggleWish={toggleWish}
            />
            {/* 가상 목록은 전체 높이를 차지하므로 그 뒤의 센티널이 실제 목록 끝에 놓인다. */}
            {/* 다음 페이지가 실패한 채로 트리거를 켜 두면 실패한 요청을 끝없이 다시 보낸다. */}
            {bookSearchQuery.hasNextPage &&
              !bookSearchQuery.isFetchNextPageError && (
                <InfiniteScrollTrigger
                  enabled={!bookSearchQuery.isFetchingNextPage}
                  onLoadMore={bookSearchQuery.fetchNextPage}
                />
              )}
            {bookSearchQuery.isFetchingNextPage && (
              <p
                role="status"
                className="text-body2 text-text-subtitle flex items-center justify-center gap-2 py-6"
              >
                <span
                  aria-hidden="true"
                  className="border-gray border-t-primary size-4 rounded-full border-2 motion-safe:animate-spin"
                />
                불러오는 중
              </p>
            )}
            {bookSearchQuery.isFetchNextPageError && (
              <div
                role="alert"
                className="flex flex-col items-center gap-3 py-6"
              >
                <p className="text-body2 text-text-subtitle">
                  다음 페이지를 불러오지 못했습니다.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bookSearchQuery.fetchNextPage()}
                >
                  다시 시도
                </Button>
              </div>
            )}
          </>
        );
    }
  }
}

/** 결과 수 줄에 보여 줄 값이다. 결과가 없거나 검색 전이면 0, 로딩과 오류처럼 아직 모르면 null이다. */
function resultCount(screen: SearchScreen) {
  if (screen.kind === "results") return screen.totalCount;
  if (screen.kind === "idle" || screen.kind === "empty") return 0;
  return null;
}

export function BookSearchResultsSkeleton() {
  return (
    <>
      <ResultCount label={RESULT_COUNT_LABEL} count={null} />
      <BookListSkeleton />
    </>
  );
}
