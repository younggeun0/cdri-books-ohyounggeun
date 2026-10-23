import * as z from "zod/mini";
import type { KakaoBookDocument, KakaoBookResponse } from "@/lib/kakao/schema";
import { KAKAO_MAX_PAGE } from "@/lib/kakao/types";

// 찜 목록이 localStorage에 저장하고 다시 읽는 모양이기도 하다. UI가 쓰는 필드만 둔다.
export const bookSchema = z.object({
  // 카카오 url. ISBN은 같은 검색 결과 안에서도 겹치는 경우가 있어(같은 책 반복, 같은 ISSN의 다른 호) id로 쓰지 않는다.
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  contents: z.string(),
  url: z.string(),
  price: z.number(),
  salePrice: z.nullable(z.number()),
  thumbnail: z.nullable(z.string()),
});

export type Book = z.infer<typeof bookSchema>;

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

export function toBook(doc: KakaoBookDocument): Book {
  return {
    id: doc.url,
    title: doc.title,
    authors: doc.authors,
    contents: doc.contents,
    url: doc.url,
    price: doc.price,
    // 판매가가 없으면 카카오는 -1을 보낸다(문서에는 없고 실제 응답으로 확인). 0 이하를 모두 "없음"으로 본다.
    salePrice: doc.sale_price > 0 ? doc.sale_price : null,
    thumbnail: doc.thumbnail === "" ? null : doc.thumbnail,
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
