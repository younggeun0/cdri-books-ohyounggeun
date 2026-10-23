import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css의 @theme 토큰이다. 등록하지 않으면 text-caption(크기)과 text-white(색)을 같은 그룹으로 보고 하나를 지운다.
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
