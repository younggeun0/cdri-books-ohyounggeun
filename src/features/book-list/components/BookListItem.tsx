"use client";

import { memo } from "react";
import type { Book } from "@/entities/book";
import { buttonVariants, Button } from "@/components/Button";
import { ChevronIcon, HeartFillIcon, HeartLineIcon } from "@/components/icons";
import { formatWon, getDisplayPrice } from "../price";

interface BookListItemProps {
  book: Book;
  /** undefined면 아직 찜 목록을 읽기 전이다. */
  wished: boolean | undefined;
  onToggleWish: (book: Book) => void;
}

function Cover({
  book,
  wished,
  onToggleWish,
  expanded,
}: BookListItemProps & { expanded: boolean }) {
  const coverSizeClass = expanded
    ? "h-[200px] w-[140px] lg:h-[280px] lg:w-[210px]"
    : "h-[68px] w-12";
  const heartSizeClass = expanded ? "size-6" : "size-4";
  const HeartIcon = wished ? HeartFillIcon : HeartLineIcon;
  // 찜 목록은 하이드레이션 뒤 마운트 effect에서 들어온다. 그 전에 그리면 찜한 책도 빈 하트로 보이므로,
  // 자리는 남긴 채 목록을 읽은 뒤에 보이게 한다.
  const isWishlistLoaded = wished !== undefined;

  return (
    <div className={`relative shrink-0 ${coverSizeClass}`}>
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
        aria-pressed={wished ?? false}
        aria-label={wished ? "찜 해제" : "찜하기"}
        onClick={() => onToggleWish(book)}
        className={`absolute top-0 right-0 flex size-6 items-center justify-center ${isWishlistLoaded ? "" : "invisible"}`}
      >
        <HeartIcon
          className={`${heartSizeClass} ${wished ? "text-red" : "text-white drop-shadow-[0_0_1px_rgb(0_0_0/0.45)]"}`}
        />
      </button>
    </div>
  );
}

function BuyLink({
  url,
  size,
  className,
}: {
  url: string;
  size: "lg" | "responsive";
  className: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ size, className })}
    >
      구매하기
    </a>
  );
}

// 접힌 행과 펼친 행은 배치가 통째로 바뀌어 접힌 상태에는 가리킬 내용 영역이 없으므로, aria-controls 없이 aria-expanded로만 알린다.
function DetailToggle({
  expanded,
  onClick,
  className,
}: {
  expanded: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <Button
      variant="secondary"
      size="responsive"
      aria-expanded={expanded}
      onClick={onClick}
      className={className}
    >
      상세보기
      <ChevronIcon direction={expanded ? "up" : "down"} className="size-3.5" />
    </Button>
  );
}

// 스크롤로 보이는 범위가 바뀔 때마다 목록이 다시 그려지므로, 이미 화면에 있던 행은 건너뛴다.
export const BookListItem = memo(function BookListItem({
  expanded,
  onToggleExpanded,
  ...coverProps
}: BookListItemProps & {
  expanded: boolean;
  onToggleExpanded: (id: string) => void;
}) {
  const { book } = coverProps;
  const { listPrice, salePrice, displayPrice } = getDisplayPrice(book);
  const toggleExpanded = () => onToggleExpanded(book.id);

  return (
    <div>
      {expanded ? (
        <div className="flex flex-col items-center gap-6 pt-6 pb-8 lg:flex-row lg:items-start lg:gap-8 lg:pt-6 lg:pr-4 lg:pb-10 lg:pl-[54px]">
          <Cover {...coverProps} expanded />
          <div className="w-full min-w-0 lg:max-w-[360px] lg:flex-1">
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
          <div className="flex w-full flex-col gap-6 self-stretch lg:w-60 lg:items-end lg:justify-between">
            <DetailToggle
              expanded
              onClick={toggleExpanded}
              className="w-full max-lg:order-last lg:w-[115px]"
            />
            <div className="flex flex-col gap-6 lg:w-full">
              <dl className="flex flex-col gap-2 lg:items-end">
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
              <BuyLink url={book.url} size="lg" className="w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 py-4 lg:items-center lg:gap-12 lg:pr-4 lg:pl-12">
          <Cover {...coverProps} expanded={false} />
          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:gap-14">
            <div className="min-w-0 lg:flex lg:flex-1 lg:items-baseline lg:gap-4">
              <h2 className="text-title3 line-clamp-2 break-words lg:truncate">
                {book.title}
              </h2>
              <p className="text-body2 text-text-secondary truncate lg:max-w-[40%] lg:shrink-0">
                {book.authors.join(", ")}
              </p>
            </div>
            <p className="text-title3 lg:min-w-24 lg:shrink-0 lg:text-right">
              {formatWon(displayPrice)}
            </p>
            <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
              <BuyLink
                url={book.url}
                size="responsive"
                className="lg:w-[115px]"
              />
              <DetailToggle
                expanded={false}
                onClick={toggleExpanded}
                className="lg:w-[115px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
