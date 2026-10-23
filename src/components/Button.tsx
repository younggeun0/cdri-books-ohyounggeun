import type { ComponentPropsWithRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const variants = cva(
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
        // 상세검색 팝업의 36px 버튼. 너비는 호출부가 정한다.
        xs: "text-body2 h-9",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

// cva는 className을 이어 붙이기만 하므로 호출부 클래스가 variant 클래스와 충돌하면 cn으로 정리한다.
export function buttonVariants({
  className,
  ...props
}: NonNullable<Parameters<typeof variants>[0]>) {
  return cn(variants(props), className);
}

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
