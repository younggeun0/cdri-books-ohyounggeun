// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "jotai/vanilla";
import { atomWithStorage } from "jotai/utils";
import { validatedJSONStorage } from "./validated-storage";

const parseNumbers = (raw: unknown) =>
  Array.isArray(raw) && raw.every((n) => typeof n === "number") ? raw : null;

const numbersAtom = (key = "k") =>
  atomWithStorage<number[] | undefined>(
    key,
    undefined,
    validatedJSONStorage(parseNumbers, []),
  );

// atomWithStorage는 구독(mount)될 때 저장소를 읽으므로, 화면에서 쓰는 것처럼 구독한 store를 돌려준다.
function mountInNewStore(atom: ReturnType<typeof numbersAtom>) {
  const store = createStore();
  const listener = vi.fn();
  store.sub(atom, listener);
  return { store, listener };
}

function otherTabWrites(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(
    new StorageEvent("storage", {
      key,
      newValue: value,
      storageArea: localStorage,
    }),
  );
}

describe("validatedJSONStorage", () => {
  beforeEach(() => localStorage.clear());

  it("구독 전에는 undefined, 구독하면 저장된 값이나 fallback을 읽는다", () => {
    localStorage.setItem("k", JSON.stringify([1]));
    const atom = numbersAtom();
    const store = createStore();
    expect(store.get(atom)).toBeUndefined();
    store.sub(atom, () => {});
    expect(store.get(atom)).toEqual([1]);
    const empty = numbersAtom("empty");
    expect(mountInNewStore(empty).store.get(empty)).toEqual([]);
  });

  it("저장한 값을 새 store에서도 읽는다", () => {
    const atom = numbersAtom();
    mountInNewStore(atom).store.set(atom, [1, 2]);
    expect(mountInNewStore(atom).store.get(atom)).toEqual([1, 2]);
  });

  it("깨진 JSON이나 형식이 다른 값은 기본값으로 대체한다", () => {
    localStorage.setItem("broken", "{not json");
    localStorage.setItem("wrong", JSON.stringify({ a: 1 }));
    const broken = numbersAtom("broken");
    const wrong = numbersAtom("wrong");
    expect(mountInNewStore(broken).store.get(broken)).toEqual([]);
    expect(mountInNewStore(wrong).store.get(wrong)).toEqual([]);
  });

  it("다른 탭에서 같은 키를 바꾸면 검증한 값으로 갱신한다", () => {
    const atom = numbersAtom();
    const { store, listener } = mountInNewStore(atom);

    otherTabWrites("k", JSON.stringify([9]));
    expect(store.get(atom)).toEqual([9]);

    otherTabWrites("k", JSON.stringify(["x"]));
    expect(store.get(atom)).toEqual([]);

    const callCountBefore = listener.mock.calls.length;
    otherTabWrites("other", JSON.stringify([1]));
    expect(listener).toHaveBeenCalledTimes(callCountBefore);
  });

  it("저장에 실패해도 현재 값은 바뀐다", () => {
    const atom = numbersAtom();
    const { store } = mountInNewStore(atom);
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    store.set(atom, [1]);
    expect(store.get(atom)).toEqual([1]);
  });
});
