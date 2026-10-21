import { useSyncExternalStore } from "react";

export interface PersistentStore<T> {
  get: () => T;
  set: (next: T) => void;
  update: (fn: (prev: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
  useValue: () => T;
}

// localStorage 값은 사용자가 지우거나 고칠 수 있는 외부 입력이라 읽을 때마다 parse로 검증한다.
export function createPersistentStore<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null,
): PersistentStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

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
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      cache = undefined;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
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
