"use client";

import {
  useId,
  useRef,
  useState,
  type SubmitEvent,
  type KeyboardEvent,
} from "react";
import { useAtom } from "jotai";
import { CloseIcon, SearchIcon } from "@/components/icons";
import {
  addSearchHistory,
  removeSearchHistory,
  searchHistoryAtom,
} from "@/features/search-history/history";
import { ARROW_MOVES, moveIndex, type ListMove } from "../listbox";
import { useDismiss } from "../useDismiss";

// Home/End는 입력창 커서 이동에 남겨 둔다.
const HISTORY_MOVES: Partial<Record<string, ListMove>> = ARROW_MOVES;

interface SearchBoxProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ initialQuery, onSearch }: SearchBoxProps) {
  const [stored, setHistory] = useAtom(searchHistoryAtom);
  const history = stored ?? [];
  const [value, setValue] = useState(initialQuery);
  // null이면 목록이 닫힌 상태, -1이면 열렸지만 강조된 기록이 없는 상태다.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const open = activeIndex !== null && history.length > 0;
  // 강조된 기록을 지우면 목록이 줄어드니 남은 범위 안으로 당긴다.
  const active = open ? Math.min(activeIndex, history.length - 1) : -1;
  const dismiss = useDismiss<HTMLFormElement>(open, () => setActiveIndex(null));
  const optionId = (index: number) => `${listboxId}-${index}`;

  function expand() {
    setActiveIndex((prev) => prev ?? -1);
  }

  function search(raw: string) {
    const query = raw.trim();
    if (query === "") return;
    setValue(query);
    setHistory((prev) => addSearchHistory(prev ?? [], query));
    onSearch(query);
    setActiveIndex(null);
    inputRef.current?.blur();
  }

  function remove(item: string) {
    setHistory((prev) => removeSearchHistory(prev ?? [], item));
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    search(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 한글 조합을 확정하는 Enter가 강조된 기록 검색으로 이어지지 않게 한다.
    if (event.nativeEvent.isComposing) return;
    const move = HISTORY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      setActiveIndex(moveIndex(active, history.length, move, true));
      return;
    }
    if (active === -1) return;
    if (event.key === "Enter") {
      event.preventDefault();
      search(history[active]);
    } else if (event.key === "Delete") {
      event.preventDefault();
      remove(history[active]);
    }
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      {...dismiss}
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
            role="combobox"
            aria-label="도서 검색어"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="none"
            aria-activedescendant={active === -1 ? undefined : optionId(active)}
            placeholder="검색어를 입력하세요"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={expand}
            onClick={expand}
            onKeyDown={handleKeyDown}
            className="text-caption placeholder:text-text-subtitle min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
        {/* 항목을 눌러도 포커스가 입력창에 남아야 목록이 닫히지 않고 aria-activedescendant가 유효하다. */}
        <ul
          id={listboxId}
          role="listbox"
          aria-label="검색 기록"
          hidden={!open}
          onMouseDown={(event) => event.preventDefault()}
          className="pb-3"
        >
          {history.map((item, index) => (
            <li
              key={item}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              onClick={() => search(item)}
              className="aria-selected:bg-gray/50 flex h-10 cursor-pointer items-center pr-3.5 pl-[50px]"
            >
              <span className="text-body2 text-text-subtitle min-w-0 flex-1 truncate">
                {item}
              </span>
              {/* option 안에는 tabIndex=-1 버튼도 둘 수 없어(nested-interactive) 마우스 전용 span으로 둔다. 키보드는 Delete 키로 지운다. */}
              <span
                aria-hidden="true"
                onClick={(event) => {
                  event.stopPropagation();
                  remove(item);
                }}
                className="text-text-primary shrink-0 p-0.5"
              >
                <CloseIcon className="size-5" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
