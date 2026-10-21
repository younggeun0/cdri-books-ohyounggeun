import { describe, expect, it } from "vitest";
import { searchMockBooks } from "./mock";

describe("searchMockBooks", () => {
  it("검색 결과를 10개씩 나누고 마지막 페이지에서만 is_end가 true다", () => {
    const pages = [1, 2, 3].map((page) =>
      searchMockBooks({ query: "무라카미", target: "person", page }),
    );
    expect(pages.map((p) => p.documents.length)).toEqual([10, 10, 3]);
    expect(pages.map((p) => p.meta.is_end)).toEqual([false, false, true]);
    expect(pages[0].meta.total_count).toBe(23);
  });

  it("범위를 넘어선 페이지는 빈 목록과 is_end true를 돌려준다", () => {
    const res = searchMockBooks({
      query: "무라카미",
      target: "person",
      page: 9,
    });
    expect(res.documents).toEqual([]);
    expect(res.meta.is_end).toBe(true);
  });

  it("target이 person이면 저자만, title이면 제목만, publisher면 출판사만 본다", () => {
    const person = searchMockBooks({
      query: "하루키",
      target: "person",
      page: 1,
    });
    const title = searchMockBooks({
      query: "하루키",
      target: "title",
      page: 1,
    });
    const publisher = searchMockBooks({
      query: "하루키",
      target: "publisher",
      page: 1,
    });
    expect(
      person.documents.every((d) => d.authors.includes("무라카미 하루키")),
    ).toBe(true);
    expect(title.documents.map((d) => d.title)).toEqual(["하루키를 읽는 시간"]);
    expect(publisher.documents).toEqual([]);
  });

  it("출판사 검색은 해당 출판사의 책만 돌려준다", () => {
    const res = searchMockBooks({
      query: "창비",
      target: "publisher",
      page: 1,
    });
    expect(res.documents.length).toBeGreaterThan(0);
    expect(res.documents.every((d) => d.publisher === "창비")).toBe(true);
  });

  it("target이 없으면 제목, 저자, 출판사 어디든 맞는 책을 모두 찾는다", () => {
    const res = searchMockBooks({ query: "하루키", page: 1, size: 100 });
    const titles = res.documents.map((d) => d.title);
    expect(titles).toContain("노르웨이의 숲");
    expect(titles).toContain("하루키를 읽는 시간");
  });

  it("대소문자를 구분하지 않는다", () => {
    const res = searchMockBooks({ query: "1q84", target: "title", page: 1 });
    expect(res.documents.map((d) => d.title)).toEqual(["1Q84 1"]);
  });

  it("일치하는 책이 없으면 빈 결과다", () => {
    const res = searchMockBooks({ query: "존재하지않는책", page: 1 });
    expect(res.documents).toEqual([]);
    expect(res.meta).toEqual({
      total_count: 0,
      pageable_count: 0,
      is_end: true,
    });
  });
});
