import type { KakaoBookDocument, KakaoBookResponse } from "@/lib/kakao/schema";
import { KAKAO_MAX_PAGE } from "@/lib/kakao/types";

export interface Book {
  id: string;
  title: string;
  contents: string;
  url: string;
  isbn13: string | null;
  isbn10: string | null;
  publishedAt: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  salePrice: number | null;
  thumbnail: string | null;
  status: string;
}

export interface BookPage {
  books: Book[];
  totalCount: number;
  isEnd: boolean;
  page: number;
}

export const BOOK_TARGETS = ["title", "person", "publisher"] as const;
export type BookTarget = (typeof BOOK_TARGETS)[number];

export function isBookTarget(value: string): value is BookTarget {
  return (BOOK_TARGETS as readonly string[]).includes(value);
}

export type SearchTarget = "all" | BookTarget;

export const SEARCH_TARGET_LABEL = {
  title: "제목",
  person: "저자명",
  publisher: "출판사",
} satisfies Record<BookTarget, string>;

export interface BookSearchParams {
  query: string;
  target: SearchTarget;
}

// ISBN 형식이 아닌 토큰이 섞여도 isbn10으로 오인하지 않도록 길이가 아닌 형식으로 판별한다.
function splitIsbn(raw: string) {
  const tokens = raw.split(/\s+/).filter(Boolean);
  return {
    isbn10: tokens.find((token) => /^\d{9}[\dX]$/.test(token)) ?? null,
    isbn13: tokens.find((token) => /^\d{13}$/.test(token)) ?? null,
  };
}

export function toBook(doc: KakaoBookDocument): Book {
  const { isbn10, isbn13 } = splitIsbn(doc.isbn);
  return {
    id: isbn13 ?? isbn10 ?? doc.url,
    title: doc.title,
    contents: doc.contents,
    url: doc.url,
    isbn13,
    isbn10,
    publishedAt: doc.datetime,
    authors: doc.authors,
    publisher: doc.publisher,
    translators: doc.translators,
    price: doc.price,
    // 판매가가 없으면 카카오는 -1을 보낸다(문서에는 없고 실제 응답으로 확인). 0 이하를 모두 "없음"으로 본다.
    salePrice: doc.sale_price > 0 ? doc.sale_price : null,
    thumbnail: doc.thumbnail === "" ? null : doc.thumbnail,
    status: doc.status,
  };
}

export function toBookPage(res: KakaoBookResponse, page: number): BookPage {
  return {
    books: res.documents.map(toBook),
    totalCount: res.meta.total_count,
    isEnd: res.meta.is_end || page >= KAKAO_MAX_PAGE,
    page,
  };
}
