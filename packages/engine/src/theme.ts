import type { ThemeId } from '@lww/shared'

// 엔진은 테마를 모른다. 테마가 이 형태로 그림·장소·이동 범위를 넘긴다.
// 2단계에서 엔진을 구현하며 채운다.

export type PlaceId = 'home' | 'photo' | 'guestbook'

export interface Point {
  x: number
  y: number
}

export interface Place extends Point {
  id: PlaceId
  label: string // 들어가기 버튼과 모달 제목에 쓰는 이름 (예: 집, 정원, 낚시터)
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Theme {
  id: ThemeId
  start: Point
  places: Record<PlaceId, Place>
  obstacles: Rect[]
  // 이동 가능 여부 (월드 경계, 바다 등). 장애물 사각형은 엔진이 따로 검사한다.
  walkable(x: number, y: number): boolean
  // 자동 이동 경로. 직선으로 못 가는 곳은 경유지를 넣는다.
  route(from: Point, to: PlaceId): Point[]
}
