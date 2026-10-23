"use client";

import { EmptyState } from "@/components/EmptyState";
import { ResultCount } from "@/components/ResultCount";
import {
  BookList,
  BookListSkeleton,
} from "@/features/book-list/components/BookList";
import { useWishlist } from "../wishlist";

export function WishlistView() {
  const { books, isWished, toggle } = useWishlist();

  // 저장소를 읽기 전에는 빈 상태 대신 스켈레톤을 둔다.
  if (!books) return <BookListSkeleton />;

  return (
    <>
      <ResultCount label="찜한 책" count={books.length} />
      {books.length === 0 ? (
        <EmptyState message="찜한 책이 없습니다." />
      ) : (
        <BookList books={books} isWished={isWished} onToggleWish={toggle} />
      )}
    </>
  );
}
