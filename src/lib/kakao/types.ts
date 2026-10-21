// 카카오 책 검색 API(v3/search/book)의 원본 응답 모양. UI에서 직접 import하지 않고 entities/book.ts의 변환을 거친다.

export interface KakaoBookDocument {
  title: string;
  contents: string;
  url: string;
  // "ISBN10 ISBN13" 공백 구분. 한쪽만 있을 수 있다.
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  sale_price: number;
  thumbnail: string;
  status: string;
}

export interface KakaoBookMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

export interface KakaoBookResponse {
  meta: KakaoBookMeta;
  documents: KakaoBookDocument[];
}

// 카카오는 page를 50까지만 받는다. 그 이후에는 is_end가 false여도 더 받을 수 없다.
export const KAKAO_MAX_PAGE = 50;

export const KAKAO_BOOK_TARGETS = ["title", "person", "publisher"] as const;
export type KakaoBookTarget = (typeof KAKAO_BOOK_TARGETS)[number];

export function isKakaoBookTarget(value: string): value is KakaoBookTarget {
  return (KAKAO_BOOK_TARGETS as readonly string[]).includes(value);
}

export interface KakaoBookSearchRequest {
  query: string;
  target?: KakaoBookTarget;
  page: number;
  size?: number;
}
