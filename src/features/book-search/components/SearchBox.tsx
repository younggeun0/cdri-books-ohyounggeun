"use client";

import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { useAtom } from "jotai";
import { CloseIcon, SearchIcon } from "@/components/icons";
import {
  addSearchHistory,
  removeSearchHistory,
  searchHistoryAtom,
} from "@/features/search-history/history";

interface SearchBoxProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ initialQuery, onSearch }: SearchBoxProps) {
  const [stored, setHistory] = useAtom(searchHistoryAtom);
  const history = stored ?? [];
  const [value, setValue] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = focused && history.length > 0;

  function search(raw: string) {
    const query = raw.trim();
    if (query === "") return;
    setValue(query);
    setHistory((prev) => addSearchHistory(prev ?? [], query));
    onSearch(query);
    // 키보드로 기록 항목에서 실행한 경우에도 목록이 닫히도록 포커스 상태를 직접 내린다.
    setFocused(false);
    inputRef.current?.blur();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    search(value);
  }

  // 기록 항목으로 포커스가 옮겨가는 경우는 닫지 않는다.
  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") setFocused(false);
      }}
      className="relative h-11 min-w-0 flex-1 md:h-[50px] md:w-[480px] md:flex-none"
    >
      <div
        className={`bg-light-gray absolute inset-x-0 top-0 z-20 overflow-hidden ${
          open ? "rounded-3xl" : "rounded-full"
        }`}
      >
        <div className="flex h-11 items-center gap-3 px-3.5 md:h-[50px]">
          <SearchIcon className="text-text-primary size-6 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            aria-label="도서 검색어"
            placeholder="검색어를 입력하세요"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onClick={() => setFocused(true)}
            className="text-caption placeholder:text-text-subtitle min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
        {open && (
          // 마우스로 항목을 누를 때 입력창이 blur되어 목록이 먼저 닫히지 않도록 막는다.
          <ul
            aria-label="검색 기록"
            onMouseDown={(event) => event.preventDefault()}
            className="pb-3"
          >
            {history.map((item) => (
              <li
                key={item}
                className="flex h-10 items-center pr-3.5 pl-[50px]"
              >
                <button
                  type="button"
                  onClick={() => search(item)}
                  className="text-body2 text-text-subtitle min-w-0 flex-1 truncate text-left"
                >
                  {item}
                </button>
                <button
                  type="button"
                  aria-label={`${item} 검색 기록 삭제`}
                  onClick={() =>
                    setHistory((prev) => removeSearchHistory(prev ?? [], item))
                  }
                  className="text-text-primary shrink-0 p-0.5"
                >
                  <CloseIcon className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
