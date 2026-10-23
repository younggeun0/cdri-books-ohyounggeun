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
  initialDetailSearch: DetailSearchValue;
  onSearch: (value: DetailSearchValue) => void;
}

export function DetailSearchPopover({
  initialDetailSearch,
  onSearch,
}: DetailSearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(initialDetailSearch.target);
  const [query, setQuery] = useState(initialDetailSearch.query);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogId = useId();
  const popoverDismissProps = useDismiss<HTMLDivElement>(open, (reason) => {
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
    <div {...popoverDismissProps} className="relative">
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
                onChange={(selectedTarget) => {
                  setTarget(selectedTarget);
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-${index}`;
  const expanded = activeIndex !== null;
  const dismissProps = useDismiss<HTMLDivElement>(expanded, () =>
    setActiveIndex(null),
  );

  function expand() {
    setActiveIndex(BOOK_TARGETS.indexOf(value));
  }

  function chooseTarget(target: BookTarget) {
    setActiveIndex(null);
    onChange(target);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (activeIndex === null) {
      if (!SELECT_OPEN_KEYS.has(event.key)) return;
      event.preventDefault();
      expand();
      return;
    }
    const direction = TARGET_MOVES[event.key];
    if (direction) {
      event.preventDefault();
      setActiveIndex(
        moveIndex(activeIndex, BOOK_TARGETS.length, direction, false),
      );
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseTarget(BOOK_TARGETS[activeIndex]);
    }
  }

  return (
    <div {...dismissProps} className="relative w-[100px] shrink-0">
      <div
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={expanded ? optionId(activeIndex) : undefined}
        aria-label={`검색 조건 ${SEARCH_TARGET_LABEL[value]}`}
        onClick={() => (expanded ? setActiveIndex(null) : expand())}
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
        {BOOK_TARGETS.map((optionTarget, index) => (
          <li
            key={optionTarget}
            id={optionId(index)}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => chooseTarget(optionTarget)}
            className={`text-body2 aria-selected:bg-light-gray flex h-[30px] cursor-pointer items-center px-1 ${
              optionTarget === value
                ? "text-text-primary"
                : "text-text-subtitle"
            }`}
          >
            {SEARCH_TARGET_LABEL[optionTarget]}
          </li>
        ))}
      </ul>
    </div>
  );
}
