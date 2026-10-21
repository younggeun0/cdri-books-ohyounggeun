import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { ResultCount } from "@/components/ResultCount";

export const metadata: Metadata = { title: "내가 찜한 책" };

export default function WishlistPage() {
  return (
    <>
      <PageTitle>내가 찜한 책</PageTitle>
      <ResultCount label="찜한 책" count={0} />
      <EmptyState message="찜한 책이 없습니다." />
    </>
  );
}
