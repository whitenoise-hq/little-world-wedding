// 방명록 연속 작성 제한. 같은 IP는 10분에 3번까지.
// 1단계용 메모리 구현이라 서버 인스턴스마다 따로 센다. Supabase 연결 시 DB 기반으로 바꾼다.

const WINDOW_MS = 10 * 60_000
const MAX = 3

const g = globalThis as typeof globalThis & { __lwwRate?: Map<string, number[]> }
const hits = (g.__lwwRate ??= new Map())

export function allow(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}
