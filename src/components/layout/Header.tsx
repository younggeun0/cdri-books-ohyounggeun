import Link from "next/link";
import { NavLink } from "./NavLink";

export function Header() {
  return (
    <header className="h-14 px-4 md:h-20 md:px-10">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between md:justify-start">
        <Link href="/" className="md:text-title1 text-lg font-bold">
          CERTICOS BOOKS
        </Link>
        <nav
          aria-label="주요 메뉴"
          className="md:text-body1 flex gap-4 text-[15px] leading-6 font-medium md:ml-16 md:gap-14 xl:ml-[400px]"
        >
          <NavLink href="/">도서 검색</NavLink>
          <NavLink href="/wishlist">내가 찜한 책</NavLink>
        </nav>
      </div>
    </header>
  );
}
