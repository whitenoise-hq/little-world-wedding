// 신랑·신부 스프라이트 7×11. 표기법은 docs/ART_GUIDE.md 4장.
// 신랑은 항상 왼쪽, 신부는 항상 오른쪽. 걷기 2번째 프레임은 아래 두 줄만 바꾼다.

export const CHARACTER_PALETTE: Record<string, string> = {
  k: '#2a1a2e',
  n: '#2a2030',
  N: '#7a4a30',
  s: '#f2c29a',
  w: '#f4efe6',
  u: '#2f3b62',
  r: '#d04a3a',
  p: '#f29bb5',
  y: '#f6c85f',
  g: '#c9c6c0',
}

export const GROOM = ['.kkkkk.', 'knnnnnk', 'knsssnk', 'ksksksk', 'ksssssk', '.kwrwk.', 'kuuwuuk', 'kuuwuuk', 'kuuuuuk', '.kn.nk.', '.kk.kk.']
export const BRIDE = ['.kykyk.', 'kNNNNNk', 'kNsssNk', 'kskskNk', 'ksssssk', '.kwwwk.', 'kwwpwwk', 'kwwwwwk', 'kwwwwwk', 'kgwwwgk', '.kkkkk.']
export const GROOM_STEP_LEGS = ['..knk..', '..kkk..']

// 걷기 2번째 프레임
export const withLegs = (sprite: string[], legs: string[]) => [...sprite.slice(0, sprite.length - legs.length), ...legs]
