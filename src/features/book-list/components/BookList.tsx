"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Book } from "@/entities/book";
import { useHydrated } from "@/lib/use-hydrated";
import { BookListItem } from "./BookListItem";

interface BookListProps {
  books: Book[];
  isWished: (id: string) => boolean;
  onToggleWish: (book: Book) => void;
}

// 접힌 항목의 실측 최대 높이다. 1024px 미만은 세로로 쌓이고 제목이 두 줄까지 늘어 더 높다.
// 재기 전 추정이 실제보다 작으면 스크롤 중에 행이 잠깐 겹치므로 최댓값을 쓴다. 실제 높이는 measureElement가 다시 잰다.
const estimateRowHeight = () => (window.innerWidth >= 1024 ? 101 : 187);

export function BookList({ books, isWished, onToggleWish }: BookListProps) {
  const hydrated = useHydrated();
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  // 화면 밖으로 나가 언마운트된 항목이 다시 그려질 때 펼침 상태를 잃지 않도록 목록이 들고 있는다.
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const virtualizer = useWindowVirtualizer({
    count: books.length,
    estimateSize: estimateRowHeight,
    // 함수가 바뀌면 가상화가 전체 항목의 위치를 다시 계산하므로, 목록이 바뀔 때만 새로 만든다.
    getItemKey: useCallback((index: number) => books[index].id, [books]),
    overscan: 5,
    scrollMargin,
  });

  useLayoutEffect(() => {
    const measure = () => {
      const list = listRef.current;
      if (list) setScrollMargin(list.getBoundingClientRect().top + scrollY);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const toggleExpanded = useCallback(
    (id: string) =>
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );

  // 서버와 하이드레이션 첫 렌더는 스크롤 위치와 화면 크기를 모르므로 받은 항목(첫 페이지)을 모두 일반 흐름으로 그린다.
  // 그래서 서버 HTML과 첫 클라이언트 렌더가 같고, JS가 늦게 와도 추정 높이 때문에 항목이 겹쳐 보이지 않는다.
  const rows: { index: number; style?: CSSProperties }[] = hydrated
    ? virtualizer.getVirtualItems().map(({ index, start }) => ({
        index,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${start - scrollMargin}px)`,
        },
      }))
    : books.map((_, index) => ({ index }));

  return (
    <ul
      ref={listRef}
      className="relative mt-9"
      style={hydrated ? { height: virtualizer.getTotalSize() } : undefined}
    >
      {rows.map(({ index, style }) => {
        const book = books[index];
        return (
          <li
            key={book.id}
            ref={virtualizer.measureElement}
            data-index={index}
            className="border-divider border-b"
            style={style}
          >
            <BookListItem
              book={book}
              wished={isWished(book.id)}
              onToggleWish={onToggleWish}
              expanded={expandedIds.has(book.id)}
              onToggleExpanded={toggleExpanded}
            />
          </li>
        );
      })}
    </ul>
  );
}

const SKELETON_ROWS = 4;

export function BookListSkeleton() {
  return (
    <ul aria-busy="true" aria-label="목록을 불러오는 중" className="mt-9">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <li
          key={index}
          className="border-divider flex animate-pulse items-center gap-4 border-b py-4 lg:gap-12 lg:pr-4 lg:pl-12"
        >
          <div className="bg-light-gray h-[68px] w-12 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-light-gray h-5 w-2/3 rounded" />
            <div className="bg-light-gray h-4 w-1/3 rounded" />
          </div>
          <div className="bg-light-gray hidden h-12 w-[238px] rounded-lg lg:block" />
        </li>
      ))}
    </ul>
  );
}
