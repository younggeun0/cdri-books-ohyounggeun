import * as z from "zod/mini";
import type { KakaoBookDocument, KakaoBookResponse } from "@/lib/kakao/schema";
import { KAKAO_MAX_PAGE } from "@/lib/kakao/types";

/**
 * 화면이 쓰는 책 한 권의 모양이다. 카카오 응답은 서버에서 {@link toBook}을 거쳐 이 모양이 된다.
 * 찜 목록이 localStorage에 저장하고 다시 읽는 모양이기도 하다. UI가 쓰는 필드만 둔다.
 */
export const bookSchema = z.object({
  /** 카카오 url. ISBN은 같은 검색 결과 안에서도 겹치는 경우가 있어(같은 책 반복, 같은 ISSN의 다른 호) id로 쓰지 않는다. */
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  contents: z.string(),
  url: z.string(),
  price: z.number(),
  salePrice: z.nullable(z.number()),
  thumbnail: z.nullable(z.string()),
});

/**
 * 화면이 쓰는 책 한 권이다. 필드 설명은 {@link bookSchema}에 있다.
 * 판매가가 없으면 salePrice는 null이고, 표지가 없으면 thumbnail은 null이다.
 */
export type Book = z.infer<typeof bookSchema>;

/** 검색 결과 한 페이지다. 카카오의 meta를 화면이 쓰는 이름으로 바꿔 담는다. */
export interface BookPage {
  books: Book[];
  /** 검색 조건에 맞는 전체 책 수다. 이 페이지의 books 길이가 아니다. */
  totalCount: number;
  /** 더 받을 페이지가 없으면 true다. 카카오가 is_end를 false로 줘도 50페이지에서는 true다. */
  isEnd: boolean;
  /** 1부터 시작하는 페이지 번호다. */
  page: number;
}

/** 상세 검색에서 고를 수 있는 카카오 target 값이다. 전체 검색("all")은 target을 보내지 않는다. */
export const BOOK_TARGETS = ["title", "person", "publisher"] as const;
export type BookTarget = (typeof BOOK_TARGETS)[number];

/** URL이나 쿼리 문자열에서 읽은 값이 카카오 target으로 쓸 수 있는 값인지 확인한다. */
export function isBookTarget(value: string): value is BookTarget {
  return (BOOK_TARGETS as readonly string[]).includes(value);
}

/** "all"은 전체 검색이고, 나머지는 상세 검색에서 고른 카카오 target이다. */
export type SearchTarget = "all" | BookTarget;

export const SEARCH_TARGET_LABEL = {
  title: "제목",
  person: "저자명",
  publisher: "출판사",
} satisfies Record<BookTarget, string>;

/** 검색 한 번의 조건이다. URL, 쿼리 키, /api/books 요청이 모두 이 값에서 만들어진다. */
export interface BookSearchParams {
  query: string;
  target: SearchTarget;
}

/**
 * 카카오 문서 하나를 {@link Book}으로 바꾼다.
 * id는 카카오 url이다. 판매가가 0 이하이면 salePrice를, 썸네일이 빈 문자열이면 thumbnail을 null로 둔다.
 */
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

/**
 * 카카오 응답 한 페이지를 {@link BookPage}로 바꾼다.
 * 카카오는 page를 50까지만 받으므로, 50페이지 이상이면 is_end와 관계없이 isEnd를 true로 둔다.
 *
 * @param page 요청한 페이지 번호다. 카카오 응답에는 페이지 번호가 없어서 호출부가 넘긴다.
 */
export function toBookPage(res: KakaoBookResponse, page: number): BookPage {
  return {
    books: res.documents.map(toBook),
    totalCount: res.meta.total_count,
    isEnd: res.meta.is_end || page >= KAKAO_MAX_PAGE,
    page,
  };
}
