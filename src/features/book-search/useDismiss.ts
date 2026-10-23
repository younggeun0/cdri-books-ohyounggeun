import {
  useEffect,
  useEffectEvent,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

export type DismissReason = "escape" | "outside";

export function useDismiss<T extends HTMLElement>(
  open: boolean,
  onDismiss: (reason: DismissReason) => void,
) {
  const ref = useRef<T>(null);
  const lastInput = useRef<"pointer" | "key">("pointer");
  const dismissOutside = useEffectEvent(() => onDismiss("outside"));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) dismissOutside();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return {
    ref,
    onPointerDown() {
      lastInput.current = "pointer";
    },
    // React 핸들러로 두어야 안쪽 팝업(조건 선택)이 Esc를 먼저 받고 전파를 막을 수 있다.
    onKeyDown(event: KeyboardEvent<T>) {
      lastInput.current = "key";
      if (!open || event.key !== "Escape") return;
      event.stopPropagation();
      onDismiss("escape");
    },
    onBlur(event: FocusEvent<T>) {
      if (!open) return;
      const next = event.relatedTarget;
      // relatedTarget이 null이면 포커스가 body나 브라우저 UI로 갔다. 루트 안 빈 곳 클릭이면 유지하고,
      // 페이지 마지막 요소에서 Tab으로 나간 경우만 닫는다.
      const left = next
        ? !event.currentTarget.contains(next)
        : lastInput.current === "key";
      if (left) onDismiss("outside");
    },
  };
}
