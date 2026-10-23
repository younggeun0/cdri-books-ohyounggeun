import { useCallback, useMemo } from "react";
import { bookSchema, type Book } from "@/entities/book";
import { createPersistentStore } from "@/lib/persistent-store";

// 찜은 누른 시점의 책 스냅샷을 저장한다. API 결과가 나중에 바뀌어도 목록은 그대로 보여야 한다.
export function toggleWishlist(list: Book[], book: Book): Book[] {
  return list.some((item) => item.id === book.id)
    ? list.filter((item) => item.id !== book.id)
    : [book, ...list];
}

// id는 저장된 값을 믿지 않고 url에서 다시 만든다. 예전 ISBN 기반 id와 불필요한 필드는 읽는 순간 정리된다.
const storedBookSchema = bookSchema
  .omit({ id: true })
  .transform((book): Book => ({ id: book.url, ...book }));

// localStorage는 외부 입력이라, 깨진 항목은 버리고 같은 책(id)은 처음 것만 남긴다.
export function parseWishlist(raw: unknown): Book[] | null {
  if (!Array.isArray(raw)) return null;
  const books = new Map<string, Book>();
  for (const item of raw) {
    const parsed = storedBookSchema.safeParse(item);
    if (parsed.success && !books.has(parsed.data.id)) {
      books.set(parsed.data.id, parsed.data);
    }
  }
  return [...books.values()];
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
