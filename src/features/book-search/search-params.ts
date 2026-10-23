import { isBookTarget, type BookSearchParams } from "@/entities/book";

/**
 * URL 검색 파라미터를 검색 조건으로 읽는다.
 * URL은 사용자가 직접 고칠 수 있는 입력이라, 잘못된 target과 빈 검색어는 여기서 전체 검색의 기본값으로 정리한다.
 * query는 앞뒤 공백을 지운다. 검색어가 비어 있으면 target도 "all"로 둔다.
 *
 * @param sp URLSearchParams, Next의 useSearchParams 결과처럼 get만 있으면 된다.
 * @example
 * parseSearchParams(new URLSearchParams("query=%20react%20&target=foo"));
 * // { query: "react", target: "all" }
 */
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

/**
 * 검색 조건을 URL 쿼리 문자열로 만든다. 앞의 "?"는 붙이지 않는다. 전체 검색이면 target을 넣지 않는다.
 * {@link parseSearchParams}로 다시 읽으면 같은 조건이 나온다.
 *
 * @example
 * toSearchQueryString({ query: "react", target: "title" }); // "query=react&target=title"
 * toSearchQueryString({ query: "react", target: "all" }); // "query=react"
 */
export function toSearchQueryString({
  query,
  target,
}: BookSearchParams): string {
  const sp = new URLSearchParams({ query });
  if (target !== "all") sp.set("target", target);
  return sp.toString();
}
