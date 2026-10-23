import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
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

// 찜 화면은 처음 그린 목록(snapshot)을 붙잡고, 결과 수만 저장소의 현재 값을 따른다.
// 그래서 해제한 책도 행으로 남고, 다시 찜하면 같은 행이 하트를 되찾는다.
export function wishlistView(
  snapshot: Book[] | undefined,
  stored: Book[] | undefined,
): { rows: Book[]; count: number } | undefined {
  if (!stored) return undefined;
  return { rows: snapshot ?? stored, count: stored.length };
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

// 라우트가 보이는 동안만 true다. cacheComponents에서는 다른 페이지로 이동해도 이 라우트가 언마운트되지 않고 Activity로 숨겨진다.
// 숨겨질 때 구독이 해제되고 다시 보일 때 재구독하므로, subscribe 호출이 곧 "보임" 신호다.
function useShown() {
  const [store] = useState(() => {
    let shown = false;
    return {
      subscribe: (onChange: () => void) => {
        shown = true;
        onChange();
        return () => {
          shown = false;
          onChange();
        };
      },
      get: () => shown,
    };
  });
  return useSyncExternalStore(store.subscribe, store.get, () => false);
}

// 찜 화면 전용이다. 라우트가 보일 때마다 snapshot을 새로 잡는다.
export function useWishlistView() {
  const { books, isWished, toggle } = useWishlist();
  // useWishlist의 구독 effect가 먼저 실행되어 저장소를 다시 읽은 뒤에 shown이 켜진다. 순서를 바꾸면 이전 방문의 값으로 snapshot을 잡을 수 있다.
  const shown = useShown();
  const [snapshot, setSnapshot] = useState<Book[]>();

  // 숨기는 순간에 새로 잡으면 숨겨진 사이의 찜 변경이 빠지므로, 숨길 때는 비우기만 하고 잡는 것은 다시 보일 때(shown)로 미룬다.
  useEffect(() => () => setSnapshot(undefined), []);

  const view = shown ? wishlistView(snapshot, books) : undefined;
  if (view && !snapshot) setSnapshot(view.rows);

  return { view, isWished, toggle };
}
