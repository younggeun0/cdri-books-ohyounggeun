import { BOOK_FIXTURES } from "./fixtures/books";
import {
  KAKAO_BOOK_TARGETS,
  type KakaoBookDocument,
  type KakaoBookResponse,
  type KakaoBookSearchRequest,
  type KakaoBookTarget,
} from "./types";

const DEFAULT_SIZE = 10;

const searchableText: Record<
  KakaoBookTarget,
  (doc: KakaoBookDocument) => string[]
> = {
  title: (doc) => [doc.title],
  person: (doc) => doc.authors,
  publisher: (doc) => [doc.publisher],
};

export function searchMockBooks({
  query,
  target,
  page,
  size = DEFAULT_SIZE,
}: KakaoBookSearchRequest): KakaoBookResponse {
  const needle = query.toLowerCase();
  const targets = target ? [target] : KAKAO_BOOK_TARGETS;
  const matched = BOOK_FIXTURES.filter((doc) =>
    targets.some((t) =>
      searchableText[t](doc).some((text) =>
        text.toLowerCase().includes(needle),
      ),
    ),
  );
  const start = (page - 1) * size;
  return {
    meta: {
      total_count: matched.length,
      pageable_count: matched.length,
      is_end: start + size >= matched.length,
    },
    documents: matched.slice(start, start + size),
  };
}
