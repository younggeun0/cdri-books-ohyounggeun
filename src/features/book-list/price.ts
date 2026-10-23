import type { Book } from "@/entities/book";

/** 책 한 권의 가격 표시 정보다. 금액 단위는 원이다. */
export interface DisplayPrice {
  /** 정가다. */
  listPrice: number;
  /** 판매가다. 카카오가 판매가를 주지 않으면 null이다. */
  salePrice: number | null;
  /** 대표로 보여 줄 가격이다. 판매가가 있으면 판매가, 없으면 정가다. */
  displayPrice: number;
}

/**
 * 책의 정가와 판매가로 화면에 보여 줄 가격을 정한다.
 *
 * @example
 * getDisplayPrice({ ...book, price: 15000, salePrice: 13500 }); // { listPrice: 15000, salePrice: 13500, displayPrice: 13500 }
 * getDisplayPrice({ ...book, price: 15000, salePrice: null }); // { listPrice: 15000, salePrice: null, displayPrice: 15000 }
 */
export function getDisplayPrice({ price, salePrice }: Book): DisplayPrice {
  return { listPrice: price, salePrice, displayPrice: salePrice ?? price };
}

/**
 * 금액을 천 단위 쉼표와 "원"을 붙인 문자열로 만든다.
 *
 * @example
 * formatWon(15000); // "15,000원"
 */
export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}
