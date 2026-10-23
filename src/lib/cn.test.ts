import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("글자 크기 토큰과 색 클래스를 함께 유지한다", () => {
    expect(cn("text-caption", "text-white")).toBe("text-caption text-white");
    expect(cn("text-white", "text-body2-bold")).toBe(
      "text-white text-body2-bold",
    );
  });

  it("글자 크기 토큰끼리는 뒤의 것만 남긴다", () => {
    expect(cn("text-caption", "text-body2")).toBe("text-body2");
  });

  it("색 토큰끼리는 뒤의 것만 남긴다", () => {
    expect(cn("bg-primary", "bg-light-gray")).toBe("bg-light-gray");
    expect(cn("text-text-subtitle", "text-white")).toBe("text-white");
    expect(cn("border-text-subtitle", "border-primary")).toBe("border-primary");
  });

  it("같은 속성의 일반 유틸리티는 뒤의 것만 남긴다", () => {
    expect(cn("h-12", "h-10")).toBe("h-10");
  });

  it("조건부 값과 falsy 값을 clsx처럼 처리한다", () => {
    expect(
      cn("h-12", false, undefined, { "w-full": true, "px-4": false }),
    ).toBe("h-12 w-full");
  });

  it("variant가 다른 반응형 클래스는 서로 덮어쓰지 않는다", () => {
    expect(cn("h-10 lg:h-12", "lg:h-9")).toBe("h-10 lg:h-9");
  });
});
