import { describe, expect, it } from "vitest";
import { moveIndex } from "./listbox";

describe("moveIndex", () => {
  it("강조가 없으면 next는 첫 항목, prev는 마지막 항목으로 간다", () => {
    expect(moveIndex(-1, 3, "next", true)).toBe(0);
    expect(moveIndex(-1, 3, "prev", true)).toBe(2);
    expect(moveIndex(-1, 3, "prev", false)).toBe(2);
  });

  it("wrap이면 끝에서 반대쪽 끝으로 돈다", () => {
    expect(moveIndex(2, 3, "next", true)).toBe(0);
    expect(moveIndex(0, 3, "prev", true)).toBe(2);
  });

  it("wrap이 아니면 끝에서 멈춘다", () => {
    expect(moveIndex(2, 3, "next", false)).toBe(2);
    expect(moveIndex(0, 3, "prev", false)).toBe(0);
  });

  it("first와 last는 양 끝으로 간다", () => {
    expect(moveIndex(1, 3, "first", false)).toBe(0);
    expect(moveIndex(1, 3, "last", false)).toBe(2);
  });

  it("항목이 없으면 -1이다", () => {
    expect(moveIndex(-1, 0, "next", true)).toBe(-1);
    expect(moveIndex(0, 0, "last", false)).toBe(-1);
  });
});
