import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { bookSchema, type Book } from "@/entities/book";
import { validatedJSONStorage } from "@/lib/validated-storage";

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

export const wishlistAtom = atomWithStorage<Book[] | undefined>(
  "cdri-books:wishlist",
  undefined,
  validatedJSONStorage(parseWishlist, []),
);

// books와 isWished는 atom의 마운트 effect가 저장소를 읽기 전까지(서버 렌더 포함) undefined다.
export function useWishlist() {
  const [books, setBooks] = useAtom(wishlistAtom);
  const wishedIds = useMemo(
    () => books && new Set(books.map((book) => book.id)),
    [books],
  );
  const isWished = useCallback((id: string) => wishedIds?.has(id), [wishedIds]);
  const toggle = useCallback(
    (book: Book) => setBooks((list) => toggleWishlist(list ?? [], book)),
    [setBooks],
  );
  return { books, isWished, toggle };
}
