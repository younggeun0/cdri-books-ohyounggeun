import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/PageTitle";
import { BookSearchView } from "@/features/book-search/components/BookSearchView";

export const metadata: Metadata = { title: "도서 검색" };

export default function Home() {
  return (
    <>
      <PageTitle>도서 검색</PageTitle>
      {/* useSearchParams의 URL은 요청 시점에야 정해져서, Suspense 밖에서 쓰면 prerender가 막힌다. */}
      <Suspense fallback={<SearchFallback />}>
        <BookSearchView />
      </Suspense>
    </>
  );
}

// 검색 입력 줄과 결과 수 줄의 높이를 그대로 잡아 두어, 클라이언트가 붙을 때 아래 내용이 밀리지 않게 한다.
function SearchFallback() {
  return (
    <>
      <div className="mt-4 h-11 md:h-[50px]" />
      <div className="mt-6 h-6" />
    </>
  );
}
