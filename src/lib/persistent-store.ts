import { useSyncExternalStore } from "react";

export interface PersistentStore<T> {
  get: () => T;
  set: (next: T) => void;
  update: (fn: (prev: T) => T) => void;
  subscribe: (onStoreChange: () => void) => () => void;
  useValue: () => T;
}

// localStorage 값은 사용자가 지우거나 고칠 수 있는 외부 입력이라 읽을 때마다 parse로 검증한다.
export function createPersistentStore<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null,
): PersistentStore<T> {
  let cache: T | undefined;
  // 이 store를 구독 중인 컴포넌트들의 "다시 렌더해 달라" 콜백이다. useSyncExternalStore가 subscribe로 등록한다.
  // localStorage 변경은 React가 알아챌 수 없으므로, 값을 바꿀 때마다 이 콜백들을 직접 불러 화면을 새 값으로 맞춘다.
  const subscribers = new Set<() => void>();

  function read(): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (parse(JSON.parse(raw)) ?? fallback);
    } catch {
      return fallback;
    }
  }

  function get(): T {
    cache ??= read();
    return cache;
  }

  function set(next: T) {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 저장 공간이 없거나 막힌 환경에서도 현재 탭에서는 동작하도록 메모리 값은 유지한다.
    }
    notifySubscribers();
  }

  function notifySubscribers() {
    subscribers.forEach((onStoreChange) => onStoreChange());
  }

  function subscribe(onStoreChange: () => void) {
    subscribers.add(onStoreChange);
    // storage 이벤트는 다른 탭에서 바꿨을 때만 온다. 같은 탭의 변경은 notifySubscribers가 알린다.
    const onOtherTabChange = (event: StorageEvent) => {
      if (event.key !== key) return;
      cache = undefined;
      onStoreChange();
    };
    window.addEventListener("storage", onOtherTabChange);
    return () => {
      subscribers.delete(onStoreChange);
      window.removeEventListener("storage", onOtherTabChange);
    };
  }

  return {
    get,
    set,
    update: (fn) => set(fn(get())),
    subscribe,
    useValue: () => useSyncExternalStore(subscribe, get, () => fallback),
  };
}
