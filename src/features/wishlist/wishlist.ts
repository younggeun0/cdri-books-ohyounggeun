import { useCallback, useMemo } from "react";
import type { Book } from "@/entities/book";
import { createPersistentStore } from "@/lib/persistent-store";

// 찜은 누른 시점의 책 스냅샷을 저장한다. API 결과가 나중에 바뀌어도 목록은 그대로 보여야 한다.
export function toggleWishlist(list: Book[], book: Book): Book[] {
  return list.some((item) => item.id === book.id)
    ? list.filter((item) => item.id !== book.id)
    : [book, ...list];
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

// localStorage는 외부 입력이라, 렌더에서 바로 쓰는 필드까지 검증해 깨진 항목은 버린다.
function isBook(value: unknown): value is Book {
  if (typeof value !== "object" || value === null) return false;
  const book = value as Record<string, unknown>;
  return (
    typeof book.id === "string" &&
    typeof book.title === "string" &&
    typeof book.url === "string" &&
    typeof book.contents === "string" &&
    typeof book.price === "number" &&
    (book.salePrice === null || typeof book.salePrice === "number") &&
    (book.thumbnail === null || typeof book.thumbnail === "string") &&
    isStringArray(book.authors)
  );
}

export function parseWishlist(raw: unknown): Book[] | null {
  return Array.isArray(raw) ? raw.filter(isBook) : null;
}

export const wishlistStore = createPersistentStore<Book[]>(
  "cdri-books:wishlist",
  [],
  parseWishlist,
);

const toggle = (book: Book) =>
  wishlistStore.update((list) => toggleWishlist(list, book));

export function useWishlist() {
  const books = wishlistStore.useValue();
  const wishedIds = useMemo(
    () => new Set(books.map((book) => book.id)),
    [books],
  );
  const isWished = useCallback((id: string) => wishedIds.has(id), [wishedIds]);
  return { books, isWished, toggle };
}
