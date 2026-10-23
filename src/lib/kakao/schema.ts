import * as z from "zod/mini";

// 카카오 책 검색 API(v3/search/book)의 원본 응답 모양. UI에서 직접 import하지 않고 서버에서 entities/book.ts의 변환을 거친다.
// 카카오가 필드를 추가해도 깨지지 않도록 strict가 아닌 object를 쓰고, 변환이 읽는 필드만 검증한다.
const kakaoBookDocumentSchema = z.object({
  title: z.string(),
  contents: z.string(),
  url: z.string(),
  authors: z.array(z.string()),
  price: z.number(),
  sale_price: z.number(),
  thumbnail: z.string(),
});

export const kakaoBookResponseSchema = z.object({
  meta: z.object({
    total_count: z.number(),
    pageable_count: z.number(),
    is_end: z.boolean(),
  }),
  documents: z.array(kakaoBookDocumentSchema),
});

export type KakaoBookDocument = z.infer<typeof kakaoBookDocumentSchema>;
export type KakaoBookResponse = z.infer<typeof kakaoBookResponseSchema>;
