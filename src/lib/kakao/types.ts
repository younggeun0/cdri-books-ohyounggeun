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

export const KAKAO_BOOK_TARGETS = ["title", "person", "publisher"] as const;
export type KakaoBookTarget = (typeof KAKAO_BOOK_TARGETS)[number];

export interface KakaoBookSearchRequest {
  query: string;
  target?: KakaoBookTarget;
  page: number;
  size?: number;
}
