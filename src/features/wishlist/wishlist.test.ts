// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { toBook } from "@/entities/book";
import { KAKAO_DOCUMENTS } from "@/test/kakao-documents";
import { parseWishlist, toggleWishlist, wishlistStore } from "./wishlist";

const [a, b, c] = KAKAO_DOCUMENTS.map(toBook);

describe("toggleWishlist", () => {
  it("없는 책은 맨 앞에 추가한다", () => {
    expect(toggleWishlist([a], b).map((book) => book.id)).toEqual([b.id, a.id]);
  });

  it("이미 있는 책은 제거하고 나머지 순서는 유지한다", () => {
    expect(toggleWishlist([a, b, c], b).map((book) => book.id)).toEqual([
      a.id,
      c.id,
    ]);
  });

  it("두 번 토글하면 책이 사라지고 원본 배열은 바뀌지 않는다", () => {
    const original = [a];
    const added = toggleWishlist(original, b);
    expect(toggleWishlist(added, b)).toEqual([a]);
    expect(original).toEqual([a]);
  });

  it("추가하는 책은 넘겨받은 스냅샷 그대로 저장한다", () => {
    const snapshot = { ...a, price: 1000 };
    const [saved] = toggleWishlist([], snapshot);
    expect(saved.price).toBe(1000);
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
      a,
      { id: "x" },
      null,
      { ...b, price: "1" },
      { ...c, url: undefined },
    ]);
    expect(parsed).toEqual([a]);
  });

  it("예전 형식(ISBN id, 추가 필드)은 url id로 바꾸고 추가 필드는 버린다", () => {
    const legacy = {
      ...a,
      id: "9788937434488",
      isbn13: "9788937434488",
      isbn10: "8937434482",
      publisher: "민음사",
      translators: ["양억관"],
      publishedAt: "2017-08-07T00:00:00.000+09:00",
      status: "정상판매",
    };
    const [parsed] = parseWishlist([legacy])!;
    expect(parsed).toEqual(a);
    expect(Object.keys(parsed).sort()).toEqual(BOOK_KEYS);
  });

  it("id가 없는 항목도 url로 id를 만들어 읽는다", () => {
    const withoutId: Partial<typeof a> = { ...a };
    delete withoutId.id;
    expect(parseWishlist([withoutId])).toEqual([a]);
  });

  it("같은 url이 여럿이면 처음 항목만 남긴다", () => {
    const first = { ...a, id: "old-1", price: 1 };
    const second = { ...a, id: "old-2", price: 2 };
    expect(parseWishlist([first, b, second])).toEqual([
      { ...first, id: a.url },
      b,
    ]);
  });
});

describe("wishlistStore", () => {
  beforeEach(() => {
    localStorage.clear();
    wishlistStore.set([]);
  });

  it("찜한 책은 localStorage에 저장되어 새로고침 뒤에도 읽힌다", () => {
    wishlistStore.update((list) => toggleWishlist(list, a));
    const raw: unknown = JSON.parse(
      localStorage.getItem("cdri-books:wishlist")!,
    );
    expect(parseWishlist(raw)).toEqual([a]);
  });

  it("저장되는 항목은 Book 필드만 가진다", () => {
    wishlistStore.update((list) => toggleWishlist(list, a));
    const raw = JSON.parse(localStorage.getItem("cdri-books:wishlist")!) as {
      id: string;
    }[];
    expect(raw).toHaveLength(1);
    expect(Object.keys(raw[0]).sort()).toEqual(BOOK_KEYS);
  });
});
