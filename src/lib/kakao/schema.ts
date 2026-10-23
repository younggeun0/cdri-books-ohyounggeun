import * as z from "zod/mini";

/**
 * 카카오 책 검색 API(v3/search/book) 응답의 documents 한 건을 검증하는 스키마다. entities/book.ts의 toBook이 읽는 필드만 검증한다.
 * 카카오가 필드를 추가해도 깨지지 않도록 strict가 아닌 object를 쓴다.
 */
const kakaoBookDocumentSchema = z.object({
  title: z.string(),
  contents: z.string(),
  url: z.string(),
  authors: z.array(z.string()),
  price: z.number(),
  /** 판매가가 없으면 -1이다. 문서에는 없고 실제 응답으로 확인했다. */
  sale_price: z.number(),
  /** 표지가 없으면 빈 문자열이다. */
  thumbnail: z.string(),
});

/** 카카오 책 검색 응답 전체의 모양이다. 서버가 응답을 받자마자 이 스키마로 검증한다. */
export const kakaoBookResponseSchema = z.object({
  meta: z.object({
    /** 검색 조건에 맞는 전체 문서 수다. */
    total_count: z.number(),
    pageable_count: z.number(),
    /** 카카오가 판단한 마지막 페이지 여부다. 50페이지 제한은 반영하지 않는다. */
    is_end: z.boolean(),
  }),
  documents: z.array(kakaoBookDocumentSchema),
});

/** 카카오 원본 문서 한 건이다. 화면에서는 entities/book.ts의 toBook으로 바꾼 Book을 쓴다. */
export type KakaoBookDocument = z.infer<typeof kakaoBookDocumentSchema>;
/** 검증을 통과한 카카오 원본 응답이다. 서버에서 BookPage로 바꾼 뒤에만 화면에 넘긴다. */
export type KakaoBookResponse = z.infer<typeof kakaoBookResponseSchema>;
