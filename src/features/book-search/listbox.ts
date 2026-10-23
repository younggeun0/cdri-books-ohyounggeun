/** 목록의 강조 항목을 옮기는 방향이다. */
export type ListMove = "next" | "prev" | "first" | "last";

/** 위아래 화살표 키를 이동 방향으로 바꾸는 표다. */
export const ARROW_MOVES = {
  ArrowDown: "next",
  ArrowUp: "prev",
} as const satisfies Record<string, ListMove>;

/**
 * 목록에서 강조할 다음 index를 계산한다.
 * -1은 강조된 항목이 없는 상태다. 거기서 prev는 마지막 항목으로 간다.
 * 항목이 없으면 항상 -1이다.
 *
 * @param shouldWrap true면 끝에서 next는 처음으로, 처음에서 prev는 끝으로 넘어간다. false면 끝에 머문다.
 */
export function moveIndex(
  currentIndex: number,
  itemCount: number,
  direction: ListMove,
  shouldWrap: boolean,
): number {
  if (itemCount === 0) return -1;
  const lastIndex = itemCount - 1;
  switch (direction) {
    case "first":
      return 0;
    case "last":
      return lastIndex;
    case "next":
      if (currentIndex < lastIndex) return currentIndex + 1;
      return shouldWrap ? 0 : lastIndex;
    case "prev":
      if (currentIndex === -1) return lastIndex;
      if (currentIndex > 0) return currentIndex - 1;
      return shouldWrap ? lastIndex : 0;
  }
}
