import type { KakaoBookDocument } from "@/lib/kakao/schema";

// 실제 카카오 응답에서 관찰한 형태(할인가 있음, 판매가 없음 -1, 표지 없음)를 본뜬 테스트 데이터다.
// 저자, 표지 등 나머지 값은 테스트용이며 실제 도서 정보와 다르다.
export const KAKAO_DOCUMENTS = [
  {
    title: "노르웨이의 숲",
    contents: "무라카미 하루키의 대표작.",
    url: "https://search.daum.net/search?w=bookpage&bookId=1467038",
    authors: ["무라카미 하루키"],
    price: 17000,
    sale_price: 15300,
    thumbnail: "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=1",
  },
  {
    title: "야한 겨울",
    contents: "판매가가 없는 책.",
    url: "https://search.daum.net/search?w=bookpage&bookId=6559452",
    authors: ["한강"],
    price: 3300,
    sale_price: -1,
    thumbnail: "",
  },
  {
    title: "직업으로서의 소설가",
    contents: "소설가로서의 이야기.",
    url: "https://search.daum.net/search?w=bookpage&bookId=1091012",
    authors: ["무라카미 하루키"],
    price: 16800,
    sale_price: 15120,
    thumbnail: "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=2",
  },
] satisfies KakaoBookDocument[];
