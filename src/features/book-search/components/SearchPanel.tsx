"use client";

import { toSearchQueryString } from "../search-params";
import { useBookSearchParams } from "../useBookSearchParams";
import { DetailSearchPopover } from "./DetailSearchPopover";
import { SearchBox } from "./SearchBox";

// 전체 검색과 상세 검색은 동시에 쓸 수 없어서 bookSearchParams.target 하나로 어느 쪽 검색인지 정한다.
// 두 입력은 검색할 때마다, 그리고 뒤로가기로 bookSearchParams가 바뀔 때마다 key로 다시 만들어 반대쪽 입력을 비우고 조건을 복원한다.
export function SearchPanel() {
  const [bookSearchParams, search, searchCount] = useBookSearchParams();
  const detailSearch =
    bookSearchParams.target === "all"
      ? null
      : { target: bookSearchParams.target, query: bookSearchParams.query };
  const remountKey = `${toSearchQueryString(bookSearchParams)}:${searchCount}`;

  return (
    <div className="mt-4 flex items-start gap-2 md:gap-4">
      <SearchBox
        key={`all:${remountKey}`}
        initialQuery={detailSearch ? "" : bookSearchParams.query}
        onSearch={(query) => search({ query, target: "all" })}
      />
      <div className="flex h-11 shrink-0 items-center md:h-[50px]">
        <DetailSearchPopover
          key={`detail:${remountKey}`}
          initialDetailSearch={detailSearch ?? { target: "title", query: "" }}
          onSearch={search}
        />
      </div>
    </div>
  );
}
