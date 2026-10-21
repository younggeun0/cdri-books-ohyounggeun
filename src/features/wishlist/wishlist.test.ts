// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { toBook } from "@/entities/book";
import { BOOK_FIXTURES } from "@/lib/kakao/fixtures/books";
import { parseWishlist, toggleWishlist, wishlistStore } from "./wishlist";

const [a, b, c] = BOOK_FIXTURES.map(toBook);

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

describe("parseWishlist", () => {
  it("배열이 아니면 null이다", () => {
    expect(parseWishlist({ id: "x" })).toBeNull();
    expect(parseWishlist("x")).toBeNull();
  });

  it("형식이 깨진 항목만 버리고 나머지는 남긴다", () => {
    const parsed = parseWishlist([a, { id: "x" }, null, { ...b, price: "1" }]);
    expect(parsed).toEqual([a]);
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
});
