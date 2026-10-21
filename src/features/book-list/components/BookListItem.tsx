"use client";

import { useId, useState } from "react";
import type { Book } from "@/entities/book";
import { ChevronIcon, HeartFillIcon, HeartLineIcon } from "@/components/icons";
import { formatWon, getDisplayPrice } from "../price";

interface BookListItemProps {
  book: Book;
  wished: boolean;
  onToggleWish: (book: Book) => void;
}

const buttonBase =
  "text-caption inline-flex items-center justify-center rounded-lg";

function Cover({
  book,
  wished,
  onToggleWish,
  expanded,
}: BookListItemProps & { expanded: boolean }) {
  const size = expanded
    ? "h-[200px] w-[140px] md:h-[280px] md:w-[210px]"
    : "h-[68px] w-12";
  const heartSize = expanded ? "size-6" : "size-4";
  const Heart = wished ? HeartFillIcon : HeartLineIcon;

  return (
    <div className={`relative shrink-0 ${size}`}>
      {book.thumbnail ? (
        // 카카오 썸네일은 작은 외부 이미지라 next/image의 도메인 등록과 변환 이득이 없어 일반 img를 쓴다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.thumbnail}
          alt={`${book.title} 표지`}
          width={expanded ? 210 : 48}
          height={expanded ? 280 : 68}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <div className="bg-light-gray size-full" />
      )}
      <button
        type="button"
        aria-pressed={wished}
        aria-label={wished ? "찜 해제" : "찜하기"}
        onClick={() => onToggleWish(book)}
        className="absolute top-0 right-0 flex size-6 items-center justify-center"
      >
        <Heart
          className={`${heartSize} ${wished ? "text-red" : "text-white drop-shadow-[0_0_1px_rgb(0_0_0/0.45)]"}`}
        />
      </button>
    </div>
  );
}

function BuyLink({ url, className }: { url: string; className: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${buttonBase} bg-primary text-white ${className}`}
    >
      구매하기
    </a>
  );
}

function DetailToggle({
  expanded,
  controls,
  onClick,
  className,
}: {
  expanded: boolean;
  controls: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={`${buttonBase} bg-light-gray text-text-secondary gap-1 ${className}`}
    >
      상세보기
      <ChevronIcon direction={expanded ? "up" : "down"} className="size-3.5" />
    </button>
  );
}

export function BookListItem(props: BookListItemProps) {
  const { book } = props;
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const { listPrice, salePrice, displayPrice } = getDisplayPrice(book);
  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <li className="border-divider border-b">
      <div id={panelId}>
        {expanded ? (
          <div className="flex flex-col items-center gap-6 pt-6 pb-8 md:flex-row md:items-start md:gap-8 md:pt-6 md:pr-4 md:pb-10 md:pl-[54px]">
            <Cover {...props} expanded />
            <div className="w-full min-w-0 md:max-w-[360px] md:flex-1">
              <h2 className="text-title3 break-words">{book.title}</h2>
              <p className="text-body2 text-text-secondary mt-4">
                {book.authors.join(", ")}
              </p>
              {book.contents && (
                <>
                  <h3 className="text-body2-bold mt-4">책 소개</h3>
                  <p className="text-small mt-3 break-words whitespace-pre-line">
                    {book.contents}
                  </p>
                </>
              )}
            </div>
            <div className="flex w-full flex-col gap-6 self-stretch md:w-60 md:items-end md:justify-between">
              <DetailToggle
                expanded
                controls={panelId}
                onClick={toggleExpanded}
                className="h-10 w-full max-md:order-last md:h-12 md:w-[115px]"
              />
              <div className="flex flex-col gap-6 md:w-full">
                <dl className="flex flex-col gap-2 md:items-end">
                  <div className="flex items-baseline gap-2">
                    <dt className="text-small text-text-subtitle">원가</dt>
                    <dd
                      className={`text-title3 font-medium ${salePrice !== null ? "line-through" : ""}`}
                    >
                      {formatWon(listPrice)}
                    </dd>
                  </div>
                  {salePrice !== null && (
                    <div className="flex items-baseline gap-2">
                      <dt className="text-small text-text-subtitle">할인가</dt>
                      <dd className="text-title3">{formatWon(salePrice)}</dd>
                    </div>
                  )}
                </dl>
                <BuyLink url={book.url} className="h-12 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 py-4 md:items-center md:gap-12 md:pr-4 md:pl-12">
            <Cover {...props} expanded={false} />
            <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-14">
              <div className="min-w-0 md:flex md:flex-1 md:items-baseline md:gap-4">
                <h2 className="text-title3 line-clamp-2 break-words md:truncate">
                  {book.title}
                </h2>
                <p className="text-body2 text-text-secondary truncate md:max-w-[40%] md:shrink-0">
                  {book.authors.join(", ")}
                </p>
              </div>
              <p className="text-title3 md:min-w-24 md:shrink-0 md:text-right">
                {formatWon(displayPrice)}
              </p>
              <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
                <BuyLink url={book.url} className="h-10 md:h-12 md:w-[115px]" />
                <DetailToggle
                  expanded={false}
                  controls={panelId}
                  onClick={toggleExpanded}
                  className="h-10 md:h-12 md:w-[115px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
