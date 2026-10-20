// 화면·월드 규격. 근거는 docs/ART_GUIDE.md 1장.
// 화면에 보이는 월드 크기. 세로 약 260픽셀이 보이게 배율을 잡고, 가로는 최소 114픽셀을 보장한다.
// 넓은 화면(태블릿)은 월드 가로(200)까지 더 보여주고, 그보다 넓으면 가운데 정렬한다.
export const VIEW_WIDTH = 114
export const TARGET_VIEW_HEIGHT = 260
export const WORLD_WIDTH = 200
export const WORLD_HEIGHT = 340

export const WALK_SPEED = 40 // 초당 픽셀
export const ENTER_RADIUS = 12 // 장소 들어가기 판정 반경
export const IDLE_FPS = 30 // 아무것도 움직이지 않을 때 (배터리). 움직이는 동안은 기기 주사율대로 그린다.

export const OUTLINE = '#2a1a2e'

// 4×4 Bayer 디더링 행렬. 값 ÷ 16이 0~1 임계값이다.
export const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const
