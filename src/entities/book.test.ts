import { describe, expect, it } from "vitest";
import type { KakaoBookDocument } from "@/lib/kakao/schema";
import { toBook, toBookPage } from "./book";

const base: KakaoBookDocument = {
  title: "노르웨이의 숲",
  contents: "소개",
  url: "https://example.com/book/1",
  isbn: "8937461811 9788937461811",
  datetime: "2017-12-20T00:00:00.000+09:00",
  authors: ["무라카미 하루키"],
  publisher: "민음사",
  translators: ["양억관"],
  price: 13300,
  sale_price: 11970,
  thumbnail: "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=1",
  status: "정상판매",
};

describe("toBook", () => {
  it("ISBN 10자리와 13자리를 나눠 담고 id는 13자리를 쓴다", () => {
    const book = toBook(base);
    expect(book.isbn10).toBe("8937461811");
    expect(book.isbn13).toBe("9788937461811");
    expect(book.id).toBe("9788937461811");
  });

  it("앞에 공백이 붙은 13자리 단독 ISBN을 읽는다", () => {
    const book = toBook({ ...base, isbn: " 9788937461811" });
    expect(book.isbn13).toBe("9788937461811");
    expect(book.isbn10).toBeNull();
  });

  it("10자리만 있으면 id로 10자리를 쓴다", () => {
    const book = toBook({ ...base, isbn: "8937461811" });
    expect(book.isbn13).toBeNull();
    expect(book.id).toBe("8937461811");
  });

  it("ISBN이 없으면 url을 id로 쓴다", () => {
    const book = toBook({ ...base, isbn: "" });
    expect(book.isbn10).toBeNull();
    expect(book.isbn13).toBeNull();
    expect(book.id).toBe(base.url);
  });

  it("ISBN이 아닌 관리번호(K로 시작)는 ISBN으로 취급하지 않는다", () => {
    const book = toBook({ ...base, isbn: "K432532836 9791191114461" });
    expect(book.isbn10).toBeNull();
    expect(book.isbn13).toBe("9791191114461");
  });

  it.each([-1, 0])("sale_price가 %i이면 salePrice는 null이다", (salePrice) => {
    expect(toBook({ ...base, sale_price: salePrice }).salePrice).toBeNull();
  });

  it("sale_price가 양수면 그대로 salePrice가 된다", () => {
    expect(toBook(base).salePrice).toBe(11970);
  });

  it("빈 썸네일은 null, 값이 있으면 그대로 둔다", () => {
    expect(toBook({ ...base, thumbnail: "" }).thumbnail).toBeNull();
    expect(toBook(base).thumbnail).toBe(
      "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=1",
    );
  });
});

describe("toBookPage", () => {
  it("meta와 요청 페이지 번호를 BookPage로 옮긴다", () => {
    const page = toBookPage(
      {
        meta: { total_count: 23, pageable_count: 23, is_end: false },
        documents: [base],
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
