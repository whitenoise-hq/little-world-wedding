// 화면·월드 규격. 근거는 docs/ART_GUIDE.md 1장.
export const VIEW_WIDTH = 114
export const VIEW_HEIGHT = 227
export const PIXEL_SCALE = 3
export const WORLD_WIDTH = 200
export const WORLD_HEIGHT = 340

export const WALK_SPEED = 40 // 초당 픽셀
export const ENTER_RADIUS = 12 // 장소 들어가기 판정 반경
export const MAX_FPS = 30

export const OUTLINE = '#2a1a2e'

// 4×4 Bayer 디더링 행렬. 값 ÷ 16이 0~1 임계값이다.
export const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const
