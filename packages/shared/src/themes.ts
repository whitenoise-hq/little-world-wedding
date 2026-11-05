// ID는 영어 소문자 한 단어, 장소가 드러나게(docs/PLANNING.md 2장 "테마 ID 이름 규칙"). DB에 저장되므로 바꾸지 않는다.
export const THEME_IDS = ['space', 'village', 'airport', 'snowtown'] as const
export type ThemeId = (typeof THEME_IDS)[number]

// 홍보용 샘플(템플릿) 청첩장 주소. docs/PLANNING.md "샘플(템플릿) 청첩장".
export const TEMPLATE_SLUGS: Record<ThemeId, string> = {
  village: 'seavilla',
  space: 'marsland',
  airport: 'loveport',
  snowtown: 'snowbell',
}

export const THEME_LABELS: Record<ThemeId, string> = {
  space: '우주',
  village: '마을',
  airport: '공항',
  snowtown: '겨울 마을',
}

// 테마별 UI 색. docs/ART_GUIDE.md 6장. 게임 밖 UI(인트로·모달·버튼)에 쓴다.
// taglineColor: 게임 화면 왼쪽 위 테마 문구 색 (픽셀 폰트)
export const THEME_UI: Record<ThemeId, { accent: string; introBg: string; tagline: string; taglineColor: string }> = {
  space: { accent: '#4b4590', introBg: '#15132b', tagline: 'OUR LITTLE PLANET', taglineColor: '#a99ad6' },
  village: { accent: '#2f6b5e', introBg: '#1d3a33', tagline: 'OUR LITTLE VILLAGE', taglineColor: '#bfe8a0' },
  airport: { accent: '#2f5d8a', introBg: '#16263d', tagline: 'OUR LITTLE AIRPORT', taglineColor: '#b9dcf5' },
  snowtown: { accent: '#8c3242', introBg: '#3a1c24', tagline: 'OUR SNOWY VILLAGE', taglineColor: '#ffd9a8' },
}
