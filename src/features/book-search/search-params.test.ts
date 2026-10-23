import { describe, expect, it } from "vitest";
import { parseSearchParams, toSearchQueryString } from "./search-params";

const parseQueryString = (queryString: string) =>
  parseSearchParams(new URLSearchParams(queryString));

describe("parseSearchParams", () => {
  it("query와 target을 읽는다", () => {
    expect(parseQueryString("query=한강&target=person")).toEqual({
      query: "한강",
      target: "person",
    });
  });

  it("target이 없거나 알 수 없으면 전체 검색으로 처리한다", () => {
    expect(parseQueryString("query=무라카미")).toEqual({
      query: "무라카미",
      target: "all",
    });
    expect(parseQueryString("query=무라카미&target=isbn")).toEqual({
      query: "무라카미",
      target: "all",
    });
    expect(parseQueryString("query=무라카미&target=all")).toEqual({
      query: "무라카미",
      target: "all",
    });
  });

  it("앞뒤 공백을 지운다", () => {
    expect(parseQueryString("query=%20%20한강%20").query).toBe("한강");
  });

  it("검색어가 비어 있으면 target과 상관없이 빈 전체 검색이다", () => {
    const empty = { query: "", target: "all" };
    expect(parseQueryString("")).toEqual(empty);
    expect(parseQueryString("query=")).toEqual(empty);
    expect(parseQueryString("query=%20&target=title")).toEqual(empty);
    expect(parseQueryString("target=title")).toEqual(empty);
  });
});

describe("toSearchQueryString", () => {
  it("전체 검색은 target을 생략한다", () => {
    expect(toSearchQueryString({ query: "무라카미", target: "all" })).toBe(
      "query=%EB%AC%B4%EB%9D%BC%EC%B9%B4%EB%AF%B8",
    );
  });

  it("상세 검색은 target을 붙인다", () => {
    expect(toSearchQueryString({ query: "한강", target: "person" })).toContain(
      "&target=person",
    );
  });

  it("parse와 왕복해도 같은 조건이다", () => {
    const bookSearchParams = { query: "a&b=c d", target: "publisher" } as const;
    expect(
      parseSearchParams(
        new URLSearchParams(toSearchQueryString(bookSearchParams)),
      ),
    ).toEqual(bookSearchParams);
  });
});
