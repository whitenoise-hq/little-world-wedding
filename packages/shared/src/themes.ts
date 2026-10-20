export const THEME_IDS = ['space', 'village'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const THEME_LABELS: Record<ThemeId, string> = {
  space: '우주',
  village: '마을',
}
