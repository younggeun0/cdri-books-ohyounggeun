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

const LABEL = "도서 검색 결과";

type SearchScreen =
  | { kind: "idle" | "loading" | "empty" }
  | { kind: "error"; message: string }
  | { kind: "results"; totalCount: number; books: Book[] };

function useSearchScreen(params: BookSearchParams) {
  const search = useBookSearch(params);
  const { data, error } = search;

  // 다음 페이지만 실패했다면 이미 받은 목록은 남겨 둔다. 화면 전체를 에러로 바꾸지 않는다.
  let screen: SearchScreen;
  if (params.query.trim() === "") screen = { kind: "idle" };
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
  return { screen, search };
}

// 첫 진입 뒤의 검색은 서버를 거치지 않고 URL만 바뀌므로, 검색 조건은 props가 아니라 URL에서 직접 읽는다.
export function BookSearchResults() {
  const [params] = useBookSearchParams();
  const { screen, search } = useSearchScreen(params);
  const { isWished, toggle } = useWishlist();

  switch (screen.kind) {
    case "idle":
    case "empty":
      return (
        <>
          <ResultCount label={LABEL} count={0} />
          <EmptyState message="검색된 결과가 없습니다." />
        </>
      );
    case "loading":
      return <BookSearchResultsSkeleton />;
    case "error":
      return (
        <div role="alert" className="mt-16 flex flex-col items-center gap-4">
          <p className="text-caption text-text-secondary">{screen.message}</p>
          <Button size="md" onClick={() => search.refetch()}>
            다시 시도
          </Button>
        </div>
      );
    case "results":
      return (
        <>
          <ResultCount label={LABEL} count={screen.totalCount} />
          <BookList
            books={screen.books}
            isWished={isWished}
            onToggleWish={toggle}
          />
          {/* 가상 목록은 전체 높이를 차지하므로 그 뒤의 센티널이 실제 목록 끝에 놓인다. */}
          {/* 다음 페이지가 실패한 채로 트리거를 켜 두면 실패한 요청을 끝없이 다시 보낸다. */}
          {search.hasNextPage && !search.isFetchNextPageError && (
            <InfiniteScrollTrigger
              enabled={!search.isFetchingNextPage}
              onLoadMore={search.fetchNextPage}
            />
          )}
          {search.isFetchingNextPage && (
            <p
              role="status"
              className="text-body2 text-text-subtitle flex items-center justify-center gap-2 py-6"
            >
              <span
                aria-hidden="true"
                className="border-gray border-t-primary size-4 animate-spin rounded-full border-2"
              />
              불러오는 중
            </p>
          )}
          {search.isFetchNextPageError && (
            <div role="alert" className="flex flex-col items-center gap-3 py-6">
              <p className="text-body2 text-text-subtitle">
                다음 페이지를 불러오지 못했습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => search.fetchNextPage()}
              >
                다시 시도
              </Button>
            </div>
          )}
        </>
      );
  }
}

export function BookSearchResultsSkeleton() {
  return (
    <>
      {/* 결과 수 줄이 나중에 생기면서 목록이 밀리지 않도록 같은 높이를 미리 잡는다. */}
      <div aria-hidden="true" className="mt-6 h-6" />
      <BookListSkeleton />
    </>
  );
}
