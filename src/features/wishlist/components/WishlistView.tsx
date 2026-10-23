"use client";

import { EmptyState } from "@/components/EmptyState";
import { ResultCount } from "@/components/ResultCount";
import { useHydrated } from "@/lib/use-hydrated";
import {
  BookList,
  BookListSkeleton,
} from "@/features/book-list/components/BookList";
import { useWishlist } from "../wishlist";

export function WishlistView() {
  const hydrated = useHydrated();
  const { books, isWished, toggle } = useWishlist();

  // 서버와 하이드레이션 첫 렌더는 저장소를 읽을 수 없어 빈 목록으로 보이므로, 그동안은 빈 상태 대신 스켈레톤을 둔다.
  if (!hydrated) return <BookListSkeleton />;

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
