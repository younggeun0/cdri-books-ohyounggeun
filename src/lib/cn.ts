import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** globals.css의 @theme 토큰이다. 등록하지 않으면 text-caption(크기)과 text-white(색)을 같은 그룹으로 보고 하나를 지운다. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "title1",
        "title2",
        "title3",
        "body1",
        "body2",
        "body2-bold",
        "caption",
        "small",
      ],
      color: [
        "primary",
        "red",
        "gray",
        "light-gray",
        "text-primary",
        "text-secondary",
        "text-subtitle",
        "divider",
      ],
    },
  },
});

/**
 * 조건부 클래스를 합치고, 같은 속성을 다루는 Tailwind 클래스가 겹치면 뒤에 온 것만 남긴다.
 * globals.css의 커스텀 토큰도 크기와 색을 구분해 처리한다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
