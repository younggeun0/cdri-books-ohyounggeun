import { describe, expect, it } from "vitest";
import { toBook } from "@/entities/book";
import { BOOK_FIXTURES } from "@/lib/kakao/fixtures/books";
import { formatWon, getDisplayPrice } from "./price";

const discounted = toBook(BOOK_FIXTURES[0]);
const noSale = toBook(BOOK_FIXTURES.find((doc) => doc.sale_price === -1)!);

describe("getDisplayPrice", () => {
  it("할인가가 있으면 접힌 상태에 보일 가격은 할인가다", () => {
    expect(getDisplayPrice(discounted)).toEqual({
      listPrice: 13300,
      salePrice: 11970,
      displayPrice: 11970,
    });
  });

  it("할인가가 없으면 정가를 보이고 salePrice는 null로 남는다", () => {
    expect(getDisplayPrice(noSale)).toEqual({
      listPrice: noSale.price,
      salePrice: null,
      displayPrice: noSale.price,
    });
  });
});

describe("formatWon", () => {
  it("천 단위 쉼표와 원을 붙인다", () => {
    expect(formatWon(13300)).toBe("13,300원");
    expect(formatWon(900)).toBe("900원");
    expect(formatWon(1234567)).toBe("1,234,567원");
  });
});
