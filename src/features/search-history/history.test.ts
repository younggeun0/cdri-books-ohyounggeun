import { describe, expect, it } from "vitest";
import {
  addSearchHistory,
  parseSearchHistory,
  removeSearchHistory,
} from "./history";

describe("addSearchHistory", () => {
  it("새 검색어를 맨 앞에 둔다", () => {
    expect(addSearchHistory(["a"], "b")).toEqual(["b", "a"]);
  });

  it("이미 있는 검색어는 중복 없이 맨 앞으로 옮긴다", () => {
    expect(addSearchHistory(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
  });

  it("앞뒤 공백을 지우고, 빈 검색어는 무시한다", () => {
    expect(addSearchHistory(["a"], "  b ")).toEqual(["b", "a"]);
    expect(addSearchHistory(["a"], " a ")).toEqual(["a"]);
    expect(addSearchHistory(["a"], "   ")).toEqual(["a"]);
  });

  it("최대 개수를 넘으면 가장 오래된 것부터 지운다", () => {
    const fullHistory = ["8", "7", "6", "5", "4", "3", "2", "1"];
    expect(addSearchHistory(fullHistory, "9")).toEqual([
      "9",
      "8",
      "7",
      "6",
      "5",
      "4",
      "3",
      "2",
    ]);
    expect(addSearchHistory(["b", "a"], "c", 2)).toEqual(["c", "b"]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const history = ["a", "b"];
    addSearchHistory(history, "b");
    expect(history).toEqual(["a", "b"]);
  });
});

describe("removeSearchHistory", () => {
  it("해당 검색어만 지운다", () => {
    expect(removeSearchHistory(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("없는 검색어면 그대로 둔다", () => {
    expect(removeSearchHistory(["a"], "x")).toEqual(["a"]);
  });
});

describe("parseSearchHistory", () => {
  it("문자열 배열만 받아들인다", () => {
    expect(parseSearchHistory(["a", "b"])).toEqual(["a", "b"]);
    expect(parseSearchHistory([1, "a"])).toBeNull();
    expect(parseSearchHistory({ a: 1 })).toBeNull();
    expect(parseSearchHistory(null)).toBeNull();
  });

  it("저장된 값의 공백, 빈 검색어, 중복을 addSearchHistory와 같은 규칙으로 정리한다", () => {
    expect(parseSearchHistory([" react ", "react", " ", "vue"])).toEqual([
      "react",
      "vue",
    ]);
  });

  it("저장된 값이 최대 개수를 넘으면 앞에서 8개만 읽는다", () => {
    const stored = Array.from({ length: 10 }, (_, i) => String(i));
    expect(parseSearchHistory(stored)).toEqual(stored.slice(0, 8));
  });
});
