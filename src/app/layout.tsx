import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Providers } from "./providers";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: {
    default: "CERTICOS BOOKS",
    template: "%s | CERTICOS BOOKS",
  },
  description: "카카오 도서 검색 API로 책을 검색하고 찜하는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="text-text-primary flex min-h-full flex-col bg-white">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-8 pb-16 md:pt-[100px]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
