import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { WishlistView } from "@/features/wishlist/components/WishlistView";

export const metadata: Metadata = { title: "내가 찜한 책" };

export default function WishlistPage() {
  return (
    <>
      <PageTitle>내가 찜한 책</PageTitle>
      <WishlistView />
    </>
  );
}
