import type {
  KakaoBookDocument,
  KakaoBookResponse,
  KakaoBookTarget,
} from "@/lib/kakao/types";

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

export type SearchTarget = "all" | KakaoBookTarget;

export const SEARCH_TARGET_LABEL = {
  title: "제목",
  person: "저자명",
  publisher: "출판사",
} satisfies Record<KakaoBookTarget, string>;

export interface BookSearchParams {
  query: string;
  target: SearchTarget;
}

// 카카오는 ISBN이 없는 책에 "K432532836" 같은 10자 관리번호를 isbn 칸에 넣기도 하므로 길이만으로 판별하지 않는다.
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
    // 할인가가 없을 때 실제 API는 -1을 보낸다(문서에는 명시 없음). 0 이하는 모두 "없음"으로 본다.
    salePrice: doc.sale_price > 0 ? doc.sale_price : null,
    thumbnail: doc.thumbnail === "" ? null : doc.thumbnail,
    status: doc.status,
  };
}

export function toBookPage(res: KakaoBookResponse, page: number): BookPage {
  return {
    books: res.documents.map(toBook),
    totalCount: res.meta.total_count,
    isEnd: res.meta.is_end,
    page,
  };
}
