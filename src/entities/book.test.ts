import { describe, expect, it } from "vitest";
import type { KakaoBookDocument } from "@/lib/kakao/schema";
import { toBook, toBookPage } from "./book";

const kakaoDocument: KakaoBookDocument = {
  title: "노르웨이의 숲",
  contents: "소개",
  url: "https://example.com/book/1",
  authors: ["무라카미 하루키"],
  price: 13300,
  sale_price: 11970,
  thumbnail: "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=1",
};

describe("toBook", () => {
  it("id는 카카오 url이다", () => {
    expect(toBook(kakaoDocument).id).toBe(kakaoDocument.url);
  });

  it("UI가 쓰는 필드만 담는다", () => {
    expect(Object.keys(toBook(kakaoDocument)).sort()).toEqual(
      [
        "authors",
        "contents",
        "id",
        "price",
        "salePrice",
        "thumbnail",
        "title",
        "url",
      ].sort(),
    );
  });

  it.each([-1, 0])("sale_price가 %i이면 salePrice는 null이다", (salePrice) => {
    expect(
      toBook({ ...kakaoDocument, sale_price: salePrice }).salePrice,
    ).toBeNull();
  });

  it("sale_price가 양수면 그대로 salePrice가 된다", () => {
    expect(toBook(kakaoDocument).salePrice).toBe(11970);
  });

  it("빈 썸네일은 null, 값이 있으면 그대로 둔다", () => {
    expect(toBook({ ...kakaoDocument, thumbnail: "" }).thumbnail).toBeNull();
    expect(toBook(kakaoDocument).thumbnail).toBe(
      "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=1",
    );
  });
});

describe("toBookPage", () => {
  it("meta와 요청 페이지 번호를 BookPage로 옮긴다", () => {
    const page = toBookPage(
      {
        meta: { total_count: 23, pageable_count: 23, is_end: false },
        documents: [kakaoDocument],
      },
      2,
    );
    expect(page).toMatchObject({ totalCount: 23, isEnd: false, page: 2 });
    expect(page.books).toHaveLength(1);
    expect(page.books[0].title).toBe("노르웨이의 숲");
  });

  it("카카오가 is_end를 false로 줘도 50페이지는 마지막 페이지다", () => {
    const meta = { total_count: 1354, pageable_count: 1000, is_end: false };
    expect(toBookPage({ meta, documents: [] }, 49).isEnd).toBe(false);
    expect(toBookPage({ meta, documents: [] }, 50).isEnd).toBe(true);
  });
});
