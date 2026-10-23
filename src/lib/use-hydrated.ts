import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** 서버 렌더와 하이드레이션 첫 렌더는 false, 그 직후 클라이언트 렌더부터 true라서 저장소 값을 읽기 전에 분기할 수 있다. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
