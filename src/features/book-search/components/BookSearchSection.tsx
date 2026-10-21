"use client";

import { useBookSearchParams } from "../useBookSearchParams";
import { SearchPanel } from "./SearchPanel";

export function BookSearchSection() {
  const [params, setParams] = useBookSearchParams();
  return <SearchPanel params={params} onSearch={setParams} />;
}
