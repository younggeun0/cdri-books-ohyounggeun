import { describe, expect, it } from "vitest";
import { toBook } from "@/entities/book";
import { KAKAO_DOCUMENTS } from "@/test/kakao-documents";
import { formatWon, getDisplayPrice } from "./price";

const discounted = toBook(KAKAO_DOCUMENTS[0]);
const noSale = toBook(KAKAO_DOCUMENTS.find((doc) => doc.sale_price === -1)!);

describe("getDisplayPrice", () => {
  it("할인가가 있으면 접힌 상태에 보일 가격은 할인가다", () => {
    expect(getDisplayPrice(discounted)).toEqual({
      listPrice: 17000,
      salePrice: 15300,
      displayPrice: 15300,
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
