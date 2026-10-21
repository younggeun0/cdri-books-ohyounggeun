"use client";

import type { Book } from "@/entities/book";
import { BookListItem } from "./BookListItem";
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger";

interface BookListProps {
  books: Book[];
  isWished: (id: string) => boolean;
  onToggleWish: (book: Book) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function BookList({
  books,
  isWished,
  onToggleWish,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: BookListProps) {
  return (
    <>
      <ul className="mt-9">
        {books.map((book) => (
          <BookListItem
            key={book.id}
            book={book}
            wished={isWished(book.id)}
            onToggleWish={onToggleWish}
          />
        ))}
      </ul>
      {hasNextPage && (
        <InfiniteScrollTrigger
          enabled={!isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      )}
      {isFetchingNextPage && (
        <p
          role="status"
          className="text-body2 text-text-subtitle flex items-center justify-center gap-2 py-6"
        >
          <span
            aria-hidden="true"
            className="border-gray border-t-primary size-4 animate-spin rounded-full border-2"
          />
          불러오는 중
        </p>
      )}
    </>
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
