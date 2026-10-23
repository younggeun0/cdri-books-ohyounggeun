"use client";

import { useEffect, useEffectEvent, useRef } from "react";

interface InfiniteScrollTriggerProps {
  enabled: boolean;
  onLoadMore: () => void;
}

export function InfiniteScrollTrigger({
  enabled,
  onLoadMore,
}: InfiniteScrollTriggerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useEffectEvent(onLoadMore);

  // enabled가 다시 켜질 때마다 옵저버를 새로 만든다. 새 페이지가 붙은 뒤에도 센티널이 화면 안이면 초기 콜백으로 이어서 불러온다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled]);

  return <div ref={sentinelRef} aria-hidden="true" className="h-px" />;
}
