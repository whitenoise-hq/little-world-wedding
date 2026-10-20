// 정해진 순서로 나오는 난수 (배경 장식 배치용). Math.random을 쓰지 않는다.
export function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// 방명록 글 id → 위치·색을 정하는 해시 (FNV-1a). 다시 들어와도 같은 값이 나온다.
export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619)
  return h >>> 0
}
