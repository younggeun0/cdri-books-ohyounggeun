import type { ComponentPropsWithRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

// 호출부는 너비와 배치 클래스만 덧붙이고 variant·size가 정한 클래스를 덮어쓰지 않으므로 tailwind-merge는 쓰지 않는다.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-lg",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white",
        secondary: "bg-light-gray text-text-secondary",
        outline: "border border-text-subtitle bg-white text-text-subtitle",
      },
      size: {
        // 시안의 115×48, 240×48 버튼. 너비는 호출부가 정한다.
        lg: "text-caption h-12",
        // 모바일 40, 데스크톱 48로 바뀌는 목록 항목 버튼.
        responsive: "text-caption h-10 lg:h-12",
        md: "text-body2 h-12 px-6",
        sm: "text-body2 h-10 px-4",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type ButtonProps = ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
