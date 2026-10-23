// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createStore } from "jotai/vanilla";
import { toBook } from "@/entities/book";
import { KAKAO_DOCUMENTS } from "@/test/kakao-documents";
import {
  parseWishlist,
  toggleWishlist,
  wishlistAtom,
  wishlistView,
} from "./wishlist";

const [bookA, bookB, bookC] = KAKAO_DOCUMENTS.map(toBook);

describe("toggleWishlist", () => {
  it("없는 책은 맨 앞에 추가한다", () => {
    expect(toggleWishlist([bookA], bookB).map((book) => book.id)).toEqual([
      bookB.id,
      bookA.id,
    ]);
  });

  it("이미 있는 책은 제거하고 나머지 순서는 유지한다", () => {
    expect(
      toggleWishlist([bookA, bookB, bookC], bookB).map((book) => book.id),
    ).toEqual([bookA.id, bookC.id]);
  });

  it("두 번 토글하면 책이 사라지고 원본 배열은 바뀌지 않는다", () => {
    const original = [bookA];
    const added = toggleWishlist(original, bookB);
    expect(toggleWishlist(added, bookB)).toEqual([bookA]);
    expect(original).toEqual([bookA]);
  });

  it("추가하는 책은 넘겨받은 스냅샷 그대로 저장한다", () => {
    const snapshot = { ...bookA, price: 1000 };
    const [saved] = toggleWishlist([], snapshot);
    expect(saved.price).toBe(1000);
  });
});

const bookIds = (books: { id: string }[]) => books.map((book) => book.id);

describe("wishlistView", () => {
  it("저장소를 읽기 전에는 보여 줄 것이 없다", () => {
    expect(wishlistView(undefined, undefined)).toBeUndefined();
    expect(wishlistView([bookA], undefined)).toBeUndefined();
  });

  it("snapshot이 없으면 저장된 목록을 그대로 보여 주고 결과 수도 같다", () => {
    const view = wishlistView(undefined, [bookA, bookB, bookC])!;
    expect(bookIds(view.rows)).toEqual(bookIds([bookA, bookB, bookC]));
    expect(view.wishedCount).toBe(3);
  });

  it("찜을 해제해도 행은 남고 결과 수만 줄어든다", () => {
    const snapshot = [bookA, bookB, bookC];
    const stored = toggleWishlist(snapshot, bookB);
    const view = wishlistView(snapshot, stored)!;
    expect(bookIds(view.rows)).toEqual(bookIds([bookA, bookB, bookC]));
    expect(view.wishedCount).toBe(2);
  });

  it("해제한 행을 다시 찜하면 결과 수가 돌아오고 행은 그대로다", () => {
    const snapshot = [bookA, bookB, bookC];
    const unwished = toggleWishlist(snapshot, bookB);
    const rewished = toggleWishlist(unwished, snapshot[1]);
    const view = wishlistView(snapshot, rewished)!;
    expect(bookIds(view.rows)).toEqual(bookIds(snapshot));
    expect(view.wishedCount).toBe(3);
    expect(bookIds(rewished)).toEqual([bookB.id, bookA.id, bookC.id]);
  });

  it("전부 해제해도 행은 남고 결과 수는 0이다", () => {
    const view = wishlistView([bookA, bookB], [])!;
    expect(view.rows).toHaveLength(2);
    expect(view.wishedCount).toBe(0);
  });

  it("처음부터 비어 있으면 행이 없다", () => {
    expect(wishlistView([], [])).toEqual({ rows: [], wishedCount: 0 });
  });

  it("다른 탭에서 찜이 바뀌면 결과 수만 따라가고 행은 그대로다", () => {
    const view = wishlistView([bookA, bookB], [bookC, bookA, bookB])!;
    expect(bookIds(view.rows)).toEqual(bookIds([bookA, bookB]));
    expect(view.wishedCount).toBe(3);
  });
});

const BOOK_KEYS = [
  "authors",
  "contents",
  "id",
  "price",
  "salePrice",
  "thumbnail",
  "title",
  "url",
];

describe("parseWishlist", () => {
  it("배열이 아니면 null이다", () => {
    expect(parseWishlist({ id: "x" })).toBeNull();
    expect(parseWishlist("x")).toBeNull();
  });

  it("형식이 깨진 항목만 버리고 나머지는 남긴다", () => {
    const parsed = parseWishlist([
      bookA,
      { id: "x" },
      null,
      { ...bookB, price: "1" },
      { ...bookC, url: undefined },
    ]);
    expect(parsed).toEqual([bookA]);
  });

  it("예전 형식(ISBN id, 추가 필드)은 url id로 바꾸고 추가 필드는 버린다", () => {
    const legacy = {
      ...bookA,
      id: "9788937434488",
      isbn13: "9788937434488",
      isbn10: "8937434482",
      publisher: "민음사",
      translators: ["양억관"],
      publishedAt: "2017-08-07T00:00:00.000+09:00",
      status: "정상판매",
    };
    const [parsed] = parseWishlist([legacy])!;
    expect(parsed).toEqual(bookA);
    expect(Object.keys(parsed).sort()).toEqual(BOOK_KEYS);
  });

  it("id가 없는 항목도 url로 id를 만들어 읽는다", () => {
    const withoutId: Partial<typeof bookA> = { ...bookA };
    delete withoutId.id;
    expect(parseWishlist([withoutId])).toEqual([bookA]);
  });

  it("같은 url이 여럿이면 처음 항목만 남긴다", () => {
    const first = { ...bookA, id: "old-1", price: 1 };
    const second = { ...bookA, id: "old-2", price: 2 };
    expect(parseWishlist([first, bookB, second])).toEqual([
      { ...first, id: bookA.url },
      bookB,
    ]);
  });
});

describe("wishlistAtom", () => {
  beforeEach(() => localStorage.clear());

  function toggleInNewStore(book: typeof bookA) {
    const store = createStore();
    store.sub(wishlistAtom, () => {});
    store.set(wishlistAtom, (wishlist) => toggleWishlist(wishlist ?? [], book));
    return store;
  }

  it("찜한 책은 localStorage에 저장되어 새 store에서도 읽힌다", () => {
    toggleInNewStore(bookA);
    const store = createStore();
    store.sub(wishlistAtom, () => {});
    expect(store.get(wishlistAtom)).toEqual([bookA]);
  });

  it("저장되는 항목은 Book 필드만 가진다", () => {
    toggleInNewStore(bookA);
    const raw = JSON.parse(localStorage.getItem("cdri-books:wishlist")!) as {
      id: string;
    }[];
    expect(raw).toHaveLength(1);
    expect(Object.keys(raw[0]).sort()).toEqual(BOOK_KEYS);
  });

  it("예전 형식으로 저장된 찜은 읽을 때 정리된다", () => {
    localStorage.setItem(
      "cdri-books:wishlist",
      JSON.stringify([
        { ...bookA, id: "9788937434488", isbn13: "9788937434488" },
      ]),
    );
    const store = createStore();
    store.sub(wishlistAtom, () => {});
    expect(store.get(wishlistAtom)).toEqual([bookA]);
  });
});
