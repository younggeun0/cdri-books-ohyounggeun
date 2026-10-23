import { isBookTarget, type BookSearchParams } from "@/entities/book";

// URL은 사용자가 직접 고칠 수 있는 입력이라, 잘못된 target과 빈 검색어는 여기서 전체 검색의 기본값으로 정리한다.
export function parseSearchParams(sp: {
  get: (name: string) => string | null;
}): BookSearchParams {
  const query = sp.get("query")?.trim() ?? "";
  if (query === "") return { query: "", target: "all" };
  const target = sp.get("target");
  return {
    query,
    target: target !== null && isBookTarget(target) ? target : "all",
  };
}

export function toSearchQueryString({
  query,
  target,
}: BookSearchParams): string {
  const sp = new URLSearchParams({ query });
  if (target !== "all") sp.set("target", target);
  return sp.toString();
}
