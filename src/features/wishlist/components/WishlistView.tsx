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

  // 저장소를 읽기 전에는 빈 상태 대신 스켈레톤을 둔다.
  if (!view) return <BookListSkeleton />;

  return (
    <>
      <ResultCount label="찜한 책" count={view.wishedCount} />
      {view.rows.length === 0 ? (
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
