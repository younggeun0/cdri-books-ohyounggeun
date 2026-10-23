// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPersistentStore } from "./persistent-store";

const parseNumbers = (raw: unknown) =>
  Array.isArray(raw) && raw.every((n) => typeof n === "number") ? raw : null;

describe("createPersistentStore", () => {
  beforeEach(() => localStorage.clear());

  it("저장한 값을 새 스토어 인스턴스에서도 읽는다", () => {
    createPersistentStore<number[]>("k", [], parseNumbers).set([1, 2]);
    expect(
      createPersistentStore<number[]>("k", [], parseNumbers).get(),
    ).toEqual([1, 2]);
  });

  it("update는 이전 값을 받아 갱신하고 구독자에게 알린다", () => {
    const store = createPersistentStore<number[]>("k", [], parseNumbers);
    const onStoreChange = vi.fn();
    store.subscribe(onStoreChange);
    store.update((prev) => [...prev, 3]);
    expect(store.get()).toEqual([3]);
    expect(onStoreChange).toHaveBeenCalledTimes(1);
  });

  it("깨진 JSON이나 형식이 다른 값은 기본값으로 대체한다", () => {
    localStorage.setItem("broken", "{not json");
    localStorage.setItem("wrong", JSON.stringify({ a: 1 }));
    expect(
      createPersistentStore<number[]>("broken", [], parseNumbers).get(),
    ).toEqual([]);
    expect(
      createPersistentStore<number[]>("wrong", [], parseNumbers).get(),
    ).toEqual([]);
  });

  it("다른 탭에서 같은 키를 바꾸면 다시 읽고 구독자에게 알린다", () => {
    const store = createPersistentStore<number[]>("k", [], parseNumbers);
    store.set([1]);
    const onStoreChange = vi.fn();
    store.subscribe(onStoreChange);

    localStorage.setItem("k", JSON.stringify([9]));
    window.dispatchEvent(new StorageEvent("storage", { key: "k" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));

    expect(onStoreChange).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual([9]);
  });
});
