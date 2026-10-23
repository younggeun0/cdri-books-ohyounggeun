export type ListMove = "next" | "prev" | "first" | "last";

export const ARROW_MOVES = {
  ArrowDown: "next",
  ArrowUp: "prev",
} as const satisfies Record<string, ListMove>;

// -1은 강조된 항목이 없는 상태다. 거기서 prev는 마지막 항목으로 간다.
export function moveIndex(
  current: number,
  count: number,
  move: ListMove,
  wrap: boolean,
): number {
  if (count === 0) return -1;
  const last = count - 1;
  switch (move) {
    case "first":
      return 0;
    case "last":
      return last;
    case "next":
      if (current < last) return current + 1;
      return wrap ? 0 : last;
    case "prev":
      if (current === -1) return last;
      if (current > 0) return current - 1;
      return wrap ? last : 0;
  }
}
