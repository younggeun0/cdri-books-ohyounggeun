import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { PageTitle } from "@/components/PageTitle";
import {
  BookSearchResults,
  BookSearchResultsSkeleton,
} from "@/features/book-search/components/BookSearchResults";
import { SearchPanel } from "@/features/book-search/components/SearchPanel";
import { parseSearchParams } from "@/features/book-search/search-params";
import { serverBookSearchOptions } from "@/features/book-search/server";

export const metadata: Metadata = { title: "도서 검색" };

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <PageTitle>도서 검색</PageTitle>
      {/* URL은 요청 시점에야 정해져서, Suspense 밖에서 읽으면 정적 셸이 막힌다. */}
      {/* 검색창은 카카오 응답을 기다리지 않도록 결과와 다른 경계에 둔다. */}
      <Suspense fallback={<div className="mt-4 h-11 md:h-[50px]" />}>
        <SearchPanel />
      </Suspense>
      <Suspense fallback={<BookSearchResultsSkeleton />}>
        <PrefetchedResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// 직접 접속과 새로고침에서만 렌더된다. 그 뒤의 검색은 URL만 바꾸고 클라이언트가 조회한다.
async function PrefetchedResults({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const params = parseSearchParams(searchParamsGetter(await searchParams));
  if (params.query === "") return <BookSearchResults />;

  // partialPrefetching이 켜져 있으면 Next가 요청마다 이 트리를 런타임 prefetch용으로 한 번 더 prerender한다.
  // 그 prerender에서는 카카오 fetch가 멈춰 있고, 조회가 먼저 실패하면 TanStack Query의 Date.now()가 prerender 에러를 낸다.
  // connection()에서 그 prerender를 멈춰 조회를 실제 요청 렌더에서 한 번만 돌린다.
  await connection();
  const queryClient = new QueryClient();
  // 실패해도 prefetch는 던지지 않는다. 실패한 쿼리는 dehydrate에 담기지 않아서 클라이언트가 직접 다시 조회한다.
  await queryClient
    .infiniteQuery(serverBookSearchOptions(params))
    .catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookSearchResults />
    </HydrationBoundary>
  );
}

// 같은 키가 반복되면 클라이언트의 useSearchParams.get과 같게 첫 값을 쓴다.
function searchParamsGetter(
  record: Record<string, string | string[] | undefined>,
) {
  return {
    get: (name: string) => {
      const value = record[name];
      return (Array.isArray(value) ? value[0] : value) ?? null;
    },
  };
}
