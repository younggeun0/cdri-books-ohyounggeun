import type { Book } from "@/entities/book";

export interface DisplayPrice {
  listPrice: number;
  salePrice: number | null;
  displayPrice: number;
}

export function getDisplayPrice({ price, salePrice }: Book): DisplayPrice {
  return { listPrice: price, salePrice, displayPrice: salePrice ?? price };
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}
