export const THEME_IDS = ['space', 'village'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const THEME_LABELS: Record<ThemeId, string> = {
  space: '우주',
  village: '마을',
}

// 테마별 UI 색. docs/ART_GUIDE.md 6장.
export const THEME_UI: Record<ThemeId, { header: string; introBg: string; introAccent: string; tagline: string }> = {
  space: { header: '#2a2450', introBg: '#0b0a1e', introAccent: '#a99ad6', tagline: 'OUR LITTLE PLANET' },
  village: { header: '#1e4660', introBg: '#1f4a2a', introAccent: '#bfe8a0', tagline: 'OUR LITTLE VILLAGE' },
}
