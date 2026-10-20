import type { ThemeId } from '@lww/shared'
import type { Painter } from './painter'

// 엔진은 테마를 모른다. 테마가 이 형태로 그림·장소·이동 범위·방명록 연출을 넘긴다.

export type PlaceId = 'home' | 'photo' | 'guestbook'

export interface Point {
  x: number
  y: number
}

export interface Place extends Point {
  id: PlaceId
  label: string // 들어가기 버튼과 모달 제목에 쓰는 이름 (예: 집, 정원, 낚시터)
}

export interface PlayerState extends Point {
  moving: boolean
  facingLeft: boolean
}

export interface Frame {
  t: number // 시작 후 흐른 초
  dt: number
  player: PlayerState
  camera: Point // 화면 왼쪽 위의 월드 좌표
  view: { w: number; h: number }
  focusingGuests: boolean // 새 방명록 연출 중 (카메라가 방명록 영역을 보는 중)
}

// y정렬 레이어에 들어갈 물체. y는 발밑 좌표.
export interface Drawable {
  y: number
  draw(p: Painter): void
}

export interface GuestEntry {
  id: string
  name: string
  message: string
}

// 방명록 글 하나 = 오브젝트 하나 (별, 물고기 등)
export interface GuestVisual<O = unknown> {
  create(entry: GuestEntry): O
  position(obj: O, t: number): Point
  hitRadius: number
  draw(p: Painter, obj: O, f: Frame, highlight: boolean): void
  // 새 글 연출: from에서 오브젝트 자리까지 duration초 동안 날아감. k는 0~1.
  spawn: { from: Point; duration: number; draw(p: Painter, obj: O, k: number, f: Frame): void; landed?(obj: O, f: Frame): void }
  // 새 글 연출 중 카메라가 볼 곳
  focus(obj: O, t: number): Point
}

export interface Theme {
  id: ThemeId
  world: { w: number; h: number }
  start: Point
  places: Record<PlaceId, Place>
  playerShadow: string
  blocked(x: number, y: number): boolean
  // 자동 이동 경로. 직선으로 못 가는 곳은 경유지를 넣는다.
  route(from: Point, to: PlaceId): Point[]
  // 움직이지 않는 배경. 시작할 때 월드 크기 캔버스에 한 번 그린다.
  drawBackground(p: Painter): void
  // 그리기 순서: 배경 → under → 방명록 오브젝트 → over → 새 글 연출 → y정렬(drawables + 캐릭터) → air
  drawUnder?(p: Painter, f: Frame): void
  drawOver?(p: Painter, f: Frame): void
  drawables(f: Frame): Drawable[]
  drawAir?(p: Painter, f: Frame): void
  guest: GuestVisual<any>
}
