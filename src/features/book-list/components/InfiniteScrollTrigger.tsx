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
  const ref = useRef<HTMLDivElement>(null);
  const loadMore = useEffectEvent(onLoadMore);

  // enabled가 다시 켜질 때마다 옵저버를 새로 만든다. 새 페이지가 붙은 뒤에도 센티널이 화면 안이면 초기 콜백으로 이어서 불러온다.
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}
