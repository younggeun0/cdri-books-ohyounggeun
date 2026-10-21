"use client";

import { useBookSearchParams } from "../useBookSearchParams";
import { BookSearchResults } from "./BookSearchResults";
import { SearchPanel } from "./SearchPanel";

export function BookSearchView() {
  const [params, setParams] = useBookSearchParams();
  return (
    <>
      <SearchPanel params={params} onSearch={setParams} />
      <BookSearchResults params={params} />
    </>
  );
}
