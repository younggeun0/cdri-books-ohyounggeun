"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import {
  BOOK_TARGETS,
  SEARCH_TARGET_LABEL,
  type BookTarget,
} from "@/entities/book";

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
  const [selectOpen, setSelectOpen] = useState(false);
  const [target, setTarget] = useState(initial.target);
  const [query, setQuery] = useState(initial.query);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const node = event.target as Node;
      if (!rootRef.current?.contains(node)) setOpen(false);
      else if (!selectRef.current?.contains(node)) setSelectOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (selectOpen) {
        setSelectOpen(false);
      } else {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, selectOpen]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function handleSubmit(event: FormEvent) {
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
    <div ref={rootRef} className="relative">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={() => {
          setOpen((prev) => !prev);
          // 바깥 클릭이나 Esc로 닫힌 팝업이 셀렉트가 열린 채로 다시 열리지 않게 한다.
          setSelectOpen(false);
        }}
        className="text-body2 text-text-subtitle border-text-subtitle h-[35px] w-[72px] rounded-lg border bg-white"
      >
        상세검색
      </button>
      {open && (
        <form
          id={dialogId}
          role="dialog"
          aria-label="상세검색"
          onSubmit={handleSubmit}
          className="absolute top-full right-0 z-30 mt-2 w-[min(360px,calc(100vw-32px))] rounded-lg bg-white px-6 py-9 shadow-[0_4px_14px_rgba(0,0,0,0.15)] md:right-auto md:left-1/2 md:-translate-x-1/2"
        >
          <button
            type="button"
            aria-label="상세검색 닫기"
            onClick={close}
            className="text-text-subtitle absolute top-2 right-2 p-0.5"
          >
            <CloseIcon className="size-5" />
          </button>
          <div className="flex items-end gap-2">
            <div ref={selectRef} className="relative w-[100px] shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={selectOpen}
                aria-label={`검색 조건 ${SEARCH_TARGET_LABEL[target]}`}
                onClick={() => setSelectOpen((prev) => !prev)}
                className="text-body2-bold border-gray flex h-8 w-full items-center justify-between border-b text-left"
              >
                {SEARCH_TARGET_LABEL[target]}
                <ChevronIcon
                  direction="down"
                  className="text-text-subtitle size-4"
                />
              </button>
              {selectOpen && (
                <ul
                  role="listbox"
                  aria-label="검색 조건"
                  className="absolute inset-x-0 top-full z-10 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
                >
                  {BOOK_TARGETS.filter((item) => item !== target).map(
                    (item) => (
                      <li key={item} role="option" aria-selected={false}>
                        <button
                          type="button"
                          onClick={() => {
                            setTarget(item);
                            setSelectOpen(false);
                            inputRef.current?.focus();
                          }}
                          className="text-body2 text-text-subtitle h-[30px] w-full px-1 text-left"
                        >
                          {SEARCH_TARGET_LABEL[item]}
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
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
          <button
            type="submit"
            className="text-body2 bg-primary mt-4 h-9 w-full rounded-lg text-white"
          >
            검색하기
          </button>
        </form>
      )}
    </div>
  );
}
