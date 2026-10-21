import { setTimeout as sleep } from "node:timers/promises";
import { searchMockBooks } from "./mock";
import type { KakaoBookResponse, KakaoBookSearchRequest } from "./types";

const MOCK_LATENCY_MS = 300;

// 카카오 API 키 발급 후 이 함수 본문만 실제 fetch로 교체한다. 지연도 목업 전용이라 함께 사라진다.
export async function searchBooks(
  params: KakaoBookSearchRequest,
): Promise<KakaoBookResponse> {
  await sleep(MOCK_LATENCY_MS);
  return searchMockBooks(params);
}
