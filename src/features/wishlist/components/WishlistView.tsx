"use client";

import { EmptyState } from "@/components/EmptyState";
import { ResultCount } from "@/components/ResultCount";
import {
  BookList,
  BookListSkeleton,
} from "@/features/book-list/components/BookList";
import { useWishlistView } from "../wishlist";

export function WishlistView() {
  const { view, isWished, toggleWish } = useWishlistView();

  return (
    <>
      {/* 저장소를 읽기 전에도 같은 요소로 남아야 aria-live가 처음 결과 수를 읽어 준다. */}
      <ResultCount label="찜한 책" count={view?.wishedCount ?? null} />
      {/* 저장소를 읽기 전에는 빈 상태 대신 스켈레톤을 둔다. */}
      {!view ? (
        <BookListSkeleton />
      ) : view.rows.length === 0 ? (
        <EmptyState message="찜한 책이 없습니다." />
      ) : (
        <BookList
          books={view.rows}
          isWished={isWished}
          onToggleWish={toggleWish}
        />
      )}
    </>
  );
}
