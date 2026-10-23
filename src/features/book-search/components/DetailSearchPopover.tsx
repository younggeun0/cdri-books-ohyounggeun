"use client";

import {
  useId,
  useRef,
  useState,
  type SubmitEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/Button";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import {
  BOOK_TARGETS,
  SEARCH_TARGET_LABEL,
  type BookTarget,
} from "@/entities/book";
import { ARROW_MOVES, moveIndex, type ListMove } from "../listbox";
import { useDismiss } from "../useDismiss";

const TARGET_MOVES: Partial<Record<string, ListMove>> = {
  ...ARROW_MOVES,
  Home: "first",
  End: "last",
};

const SELECT_OPEN_KEYS = new Set(["ArrowDown", "ArrowUp", "Enter", " "]);

export interface DetailSearchValue {
  target: BookTarget;
  query: string;
}

interface DetailSearchPopoverProps {
  initial: DetailSearchValue;
  onSearch: (value: DetailSearchValue) => void;
}

export function DetailSearchPopover({
  initial,
  onSearch,
}: DetailSearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(initial.target);
  const [query, setQuery] = useState(initial.query);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogId = useId();
  const popover = useDismiss<HTMLDivElement>(open, (reason) => {
    if (reason === "escape") close();
    else setOpen(false);
  });

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed === "") {
      inputRef.current?.focus();
      return;
    }
    setOpen(false);
    onSearch({ target, query: trimmed });
  }

  return (
    <div {...popover} className="relative">
      <Button
        ref={toggleRef}
        variant="outline"
        size="xs"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={() => setOpen((prev) => !prev)}
        className="h-[35px] w-[72px]"
      >
        상세검색
      </Button>
      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="상세검색"
          className="absolute top-full right-0 z-30 mt-2 w-[min(360px,calc(100vw-32px))] rounded-lg bg-white px-6 py-9 shadow-[0_4px_14px_rgba(0,0,0,0.15)] md:right-auto md:left-1/2 md:-translate-x-1/2"
        >
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              aria-label="상세검색 닫기"
              onClick={close}
              className="text-text-subtitle absolute top-2 right-2 p-0.5"
            >
              <CloseIcon className="size-5" />
            </button>
            <div className="flex items-end gap-2">
              <TargetSelect
                value={target}
                onChange={(item) => {
                  setTarget(item);
                  inputRef.current?.focus();
                }}
              />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                aria-label="상세검색어"
                placeholder="검색어 입력"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="text-body2 placeholder:text-text-subtitle border-primary h-8 min-w-0 flex-1 border-b bg-transparent outline-none"
              />
            </div>
            <Button type="submit" size="xs" className="mt-4 w-full">
              검색하기
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

interface TargetSelectProps {
  value: BookTarget;
  onChange: (value: BookTarget) => void;
}

// APG select-only combobox. 팝업과 함께 unmount되므로 다시 열면 항상 닫힌 상태로 시작한다.
function TargetSelect({ value, onChange }: TargetSelectProps) {
  // null이면 목록이 닫힌 상태다.
  const [active, setActive] = useState<number | null>(null);
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-${index}`;
  const expanded = active !== null;
  const dismiss = useDismiss<HTMLDivElement>(expanded, () => setActive(null));

  function expand() {
    setActive(BOOK_TARGETS.indexOf(value));
  }

  function choose(item: BookTarget) {
    setActive(null);
    onChange(item);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (active === null) {
      if (!SELECT_OPEN_KEYS.has(event.key)) return;
      event.preventDefault();
      expand();
      return;
    }
    const move = TARGET_MOVES[event.key];
    if (move) {
      event.preventDefault();
      setActive(moveIndex(active, BOOK_TARGETS.length, move, false));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(BOOK_TARGETS[active]);
    }
  }

  return (
    <div {...dismiss} className="relative w-[100px] shrink-0">
      <div
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={expanded ? optionId(active) : undefined}
        aria-label={`검색 조건 ${SEARCH_TARGET_LABEL[value]}`}
        onClick={() => (expanded ? setActive(null) : expand())}
        onKeyDown={handleKeyDown}
        className="text-body2-bold border-gray flex h-8 w-full cursor-pointer items-center justify-between border-b"
      >
        {SEARCH_TARGET_LABEL[value]}
        <ChevronIcon direction="down" className="text-text-subtitle size-4" />
      </div>
      {/* 항목을 눌러도 포커스가 조건 선택에 남아야 포커스 이탈로 닫히지 않는다. */}
      <ul
        id={listboxId}
        role="listbox"
        aria-label="검색 조건"
        hidden={!expanded}
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-x-0 top-full z-10 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
      >
        {BOOK_TARGETS.map((item, index) => (
          <li
            key={item}
            id={optionId(index)}
            role="option"
            aria-selected={index === active}
            onClick={() => choose(item)}
            className={`text-body2 aria-selected:bg-light-gray flex h-[30px] cursor-pointer items-center px-1 ${
              item === value ? "text-text-primary" : "text-text-subtitle"
            }`}
          >
            {SEARCH_TARGET_LABEL[item]}
          </li>
        ))}
      </ul>
    </div>
  );
}
