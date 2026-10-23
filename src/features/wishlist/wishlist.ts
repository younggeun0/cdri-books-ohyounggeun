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

// snapshot은 찜 화면에 들어온 순간의 찜 목록을 복사해 둔 배열이다.
// 화면의 행은 이 복사본을 그대로 보여 주고, 결과 수만 저장소의 현재 찜 목록 길이를 따른다.
// 그래서 하트를 눌러 찜을 해제해도 저장소에서만 빠지고 행은 남는다. 다시 누르면 같은 행의 하트가 채워진다.
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

// 찜 화면 전용이다. 사용자가 찜 화면에 들어올 때마다(라우트가 다시 보일 때마다) 그 시점의 찜 목록을 snapshot으로 새로 복사한다.
export function useWishlistView() {
  const { books, isWished, toggle } = useWishlist();
  // 반드시 useWishlist 뒤에 선언한다. 훅의 effect는 선언 순서대로 실행되므로, 이렇게 두면 useWishlist가 저장소를 다시 읽은 다음에 shown이 true가 된다.
  // 순서가 바뀌면 shown이 먼저 true가 되어, 저장소를 다시 읽기 전의 값(이전 방문 때의 목록)이 snapshot으로 복사될 수 있다.
  const shown = useShown();
  const [snapshot, setSnapshot] = useState<Book[]>();

  // 다른 페이지로 이동해 이 라우트가 숨겨지면 snapshot을 비운다. 새 복사본은 다시 보일 때(shown이 true일 때) 만든다.
  // 숨겨지는 순간에 바로 복사하면, 숨겨져 있는 동안 검색 화면에서 바꾼 찜이 다음 방문 때 반영되지 않는다.
  useEffect(() => () => setSnapshot(undefined), []);

  const view = shown ? wishlistView(snapshot, books) : undefined;
  if (view && !snapshot) setSnapshot(view.rows);

  return { view, isWished, toggle };
}
