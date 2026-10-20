export const THEME_IDS = ['space', 'village'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const THEME_LABELS: Record<ThemeId, string> = {
  space: '우주',
  village: '마을',
}

// 테마별 UI 색. docs/ART_GUIDE.md 6장. 게임 밖 UI(인트로·모달·버튼)에 쓴다.
// taglineColor: 게임 화면 왼쪽 위 테마 문구 색 (픽셀 폰트)
export const THEME_UI: Record<ThemeId, { accent: string; introBg: string; tagline: string; taglineColor: string }> = {
  space: { accent: '#4b4590', introBg: '#15132b', tagline: 'OUR LITTLE PLANET', taglineColor: '#a99ad6' },
  village: { accent: '#2f6b5e', introBg: '#1d3a33', tagline: 'OUR LITTLE VILLAGE', taglineColor: '#bfe8a0' },
}
