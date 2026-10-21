import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { ResultCount } from "@/components/ResultCount";

export const metadata: Metadata = { title: "도서 검색" };

export default function Home() {
  return (
    <>
      <PageTitle>도서 검색</PageTitle>
      <ResultCount label="도서 검색 결과" count={0} />
      <EmptyState message="검색된 결과가 없습니다." />
    </>
  );
}
