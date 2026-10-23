import { createJSONStorage } from "jotai/utils";

// jotai 3은 SyncStorage 타입을 내보내지 않아 createJSONStorage의 반환 타입에서 꺼낸다.
type SyncStorage<T> = ReturnType<typeof createJSONStorage<T>>;

/**
 * atomWithStorage에 넘기는, 읽을 때마다 값을 검증하는 localStorage JSON 저장소다.
 *
 * localStorage 값은 사용자가 지우거나 고칠 수 있는 외부 입력이다.
 * jotai의 JSON 저장소는 다른 탭의 변경을 getItem을 거치지 않고 바로 넘기므로, getItem과 subscribe 둘 다 parse를 거친다.
 * unstable_withStorageValidator는 getItem만 감싸고 타입 가드라 값을 정리(url로 id 재생성, 중복 제거)하지 못해 쓰지 않는다.
 * atom의 초기값은 undefined로 두고 "아직 저장소를 읽지 않음"을 뜻하게 한다. 없거나 깨진 값은 fallback으로 읽는다.
 * 저장이 실패해도 던지지 않는다.
 *
 * @param parse 저장된 JSON을 검증하고 정리한다. 받아들일 수 없으면 null을 돌려준다.
 * @param fallback 키가 없거나 parse가 null을 돌려줄 때 읽히는 값이다.
 */
export function validatedJSONStorage<T>(
  parse: (raw: unknown) => T | null,
  fallback: T,
): SyncStorage<T | undefined> {
  const json = createJSONStorage<unknown>();
  return {
    getItem: (key) => parse(json.getItem(key, null)) ?? fallback,
    setItem: (key, value) => {
      try {
        json.setItem(key, value);
      } catch {
        // 저장 공간이 없거나 막힌 환경에서도 현재 탭에서는 동작하도록 메모리 값은 유지한다.
      }
    },
    removeItem: json.removeItem,
    subscribe: (key, callback) =>
      json.subscribe?.(key, (raw) => callback(parse(raw) ?? fallback), null),
  };
}
