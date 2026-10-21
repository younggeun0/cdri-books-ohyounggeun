"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const active = usePathname() === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "decoration-primary underline decoration-1 underline-offset-[6px]"
          : undefined
      }
    >
      {children}
    </Link>
  );
}
