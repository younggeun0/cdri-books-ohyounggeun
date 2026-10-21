import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { ResultCount } from "@/components/ResultCount";
import { BookSearchSection } from "@/features/book-search/components/BookSearchSection";

export const metadata: Metadata = { title: "도서 검색" };

export default function Home() {
  return (
    <>
      <PageTitle>도서 검색</PageTitle>
      {/* useSearchParams의 URL은 요청 시점에야 정해져서, Suspense 밖에서 쓰면 prerender가 막힌다. */}
      <Suspense fallback={<div className="mt-4 h-11 md:h-[50px]" />}>
        <BookSearchSection />
      </Suspense>
      <ResultCount label="도서 검색 결과" count={0} />
      <EmptyState message="검색된 결과가 없습니다." />
    </>
  );
}
