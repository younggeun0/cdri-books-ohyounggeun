import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * 하이드레이션이 끝났는지 알려 준다. 서버 렌더와 하이드레이션 첫 렌더는 false, 그 직후 클라이언트 렌더부터 true다.
 * 서버 HTML과 첫 클라이언트 렌더를 같게 둔 채, 브라우저에서만 알 수 있는 값(화면 크기, 스크롤 위치)에 따라 그리기를 바꿀 때 쓴다.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
