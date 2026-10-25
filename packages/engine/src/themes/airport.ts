import { OUTLINE as K } from '../constants'
import type { Painter } from '../painter'
import { createRng, hashString } from '../random'
import type { Drawable, Frame, GuestVisual, Place, PlaceId, Theme } from '../theme'

// 공항 테마: 신혼여행을 떠나는 날의 공항 터미널 출국장.
// 위로 앞 유리벽 너머 도로, 아래로 탑승구 유리창 너머 계류장(신혼여행 여객기)과 활주로.
// 방명록은 탑승구, 글 하나 = 종이비행기 한 대. 색은 docs/ART_GUIDE.md 5장.

const W = 200
const H = 340
const NAVY = '#24324d'
const BLUE = '#3d5a80'
const GLASS = '#9cc3dd'
const FLOOR = '#e8e4dc'
const FLOOR_LINE = '#dcd7cd'
const WHITE = '#f2efe6'
const YELLOW = '#f6c85f'
const PINK = '#d9738e'
const PLANT = ['#1f4a2a', '#2f6d3a', '#4a9a48', '#6ac05a', '#9ae07a']
const BAGS = ['#d04a3a', '#2f8f8a', YELLOW, '#b48cf0', '#f29bb5']

// 구역 경계 (y)
const CARPET = 170 // 이 아래는 탑승구 카펫
const WINDOW = 210 // 탑승구 유리창. 이 아래는 바깥
const APRON = 222
const SERVICE_ROAD = 282
const RUNWAY = 290
const RUNWAY_END = 320
const JET_Y = 256 // 여객기 동체 가운데

const places: Record<PlaceId, Place> = {
  home: { id: 'home', label: '체크인 카운터', x: 53, y: 78 },
  photo: { id: 'photo', label: '포토존', x: 154, y: 94 },
  guestbook: { id: 'guestbook', label: '탑승구', x: 100, y: 204 },
}

const plants: [number, number][] = [
  [18, 92],
  [182, 150],
  [18, 160],
]
const columns: [number, number][] = [
  [36, 129],
  [164, 129],
]
const obstacles = [
  { x: 16, y: 44, w: 74, h: 22 }, // 체크인 카운터
  { x: 14, y: 70, w: 28, h: 3 }, // 차단봉
  { x: 64, y: 70, w: 28, h: 3 },
  { x: 126, y: 44, w: 56, h: 36 }, // 포토존 탑승권 판
  { x: 122, y: 76, w: 4, h: 4 }, // 풍선
  { x: 178, y: 84, w: 11, h: 12 }, // 캐리어
  { x: 72, y: 120, w: 5, h: 5 }, // 출발 안내판 기둥
  { x: 126, y: 120, w: 5, h: 5 },
  { x: 28, y: 98, w: 18, h: 10 }, // 안내 데스크
  { x: 148, y: 110, w: 30, h: 8 }, // 카트
  { x: 14, y: 176, w: 48, h: 7 }, // 대기 의자
  { x: 14, y: 192, w: 48, h: 7 },
  { x: 122, y: 176, w: 64, h: 7 },
  { x: 122, y: 192, w: 64, h: 7 },
  { x: 68, y: 197, w: 20, h: 9 }, // 탑승구 카운터
  ...columns.map(([x, y]) => ({ x: x - 5, y: y - 7, w: 10, h: 7 })),
  ...plants.map(([x, y]) => ({ x: x - 4, y: y - 4, w: 8, h: 5 })),
]

// ── 작은 픽셀 글자 (3×5, M·N·@·♥만 더 넓다). 안내판에만 쓴다 ──
const GLYPHS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  Y: ['101', '101', '010', '010', '010'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '7': ['111', '001', '010', '010', '010'],
  '9': ['111', '101', '111', '001', '110'],
  ':': ['0', '1', '0', '1', '0'],
  '-': ['00', '00', '11', '00', '00'],
  ' ': ['0', '0', '0', '0', '0'],
  '@': ['00100', '01110', '11111', '00100', '01110'], // 비행기
  '>': ['100', '010', '001', '010', '100'],
}
const textWidth = (s: string, scale = 1) => [...s].reduce((w, ch) => w + ((GLYPHS[ch]?.[0]!.length ?? 3) + 1) * scale, 0) - scale
function text(p: Painter, s: string, x: number, y: number, color: string, scale = 1) {
  let cx = Math.round(x)
  for (const ch of s) {
    const g = GLYPHS[ch]
    if (!g) {
      cx += 4 * scale
      continue
    }
    g.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '1') p.rect(cx + i * scale, y + j * scale, scale, scale, color)
    })
    cx += (g[0]!.length + 1) * scale
  }
}

// 채운 삼각형 (날개·꼬리날개)
function tri(p: Painter, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, color: string) {
  const edge = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
  const area = edge(ax, ay, bx, by, cx, cy)
  if (area === 0) return
  for (let y = Math.floor(Math.min(ay, by, cy)); y <= Math.ceil(Math.max(ay, by, cy)); y++) {
    for (let x = Math.floor(Math.min(ax, bx, cx)); x <= Math.ceil(Math.max(ax, bx, cx)); x++) {
      const e1 = edge(ax, ay, bx, by, x + 0.5, y + 0.5)
      const e2 = edge(bx, by, cx, cy, x + 0.5, y + 0.5)
      const e3 = edge(cx, cy, ax, ay, x + 0.5, y + 0.5)
      if (area > 0 ? e1 >= 0 && e2 >= 0 && e3 >= 0 : e1 <= 0 && e2 <= 0 && e3 <= 0) p.px(x, y, color)
    }
  }
}
type Pt = readonly [number, number]
function quad(p: Painter, pts: readonly [Pt, Pt, Pt, Pt], fill: string, outline?: string) {
  const [a, b, c, d] = pts
  tri(p, a[0], a[1], b[0], b[1], c[0], c[1], fill)
  tri(p, a[0], a[1], c[0], c[1], d[0], d[1], fill)
  if (outline) for (let i = 0; i < 4; i++) p.line(pts[i]![0], pts[i]![1], pts[(i + 1) % 4]![0], pts[(i + 1) % 4]![1], outline)
}
const mirror = (pts: readonly [Pt, Pt, Pt, Pt]) => pts.map(([x, y]) => [x, JET_Y * 2 - y] as const) as unknown as [Pt, Pt, Pt, Pt]

// 종이비행기 13×9, 코가 오른쪽. a 윗날개, f 접힌 선, b 아랫날개 (docs/ART_GUIDE.md 4장)
const PAPER = [
  'kk...........',
  'kakk.........',
  '.kaakk.......',
  '.kaaaakk.....',
  '..kaaaaaakk..',
  '..kfffffffffk',
  '..kbbbbbbkk..',
  '.kbbbkkk.....',
  '.kkk.........',
]
const PAPER_COLORS: [string, string, string][] = [
  ['#ffffff', '#c9d3e0', '#8e9bb0'],
  ['#ffe1ea', '#eaa7bb', '#b8708a'],
  ['#dcefff', '#9cc4ea', '#6a92bc'],
  ['#fff2c0', '#e6cf6e', '#b49a3a'],
  ['#dcf7e7', '#97d4b1', '#5f9f7c'],
  ['#eee4ff', '#bfa8ea', '#8b72bb'],
]
const DESTINATIONS: [string, string][] = [
  ['JEJU', '3'],
  ['PARIS', '5'],
  ['BALI', '2'],
  ['TOKYO', '9'],
  ['ROME', '4'],
]

interface PaperPlane {
  hx: number
  hy: number
  phase: number
  speed: number
  range: number
  colors: [string, string, string]
}

export function createAirportTheme(): Theme {
  const sparkles: { x: number; y: number; t0: number }[] = []

  const heart = (p: Painter, x: number, y: number) => {
    p.px(x - 1, y, '#f29bb5')
    p.px(x + 1, y, '#f29bb5')
    p.rect(x - 1, y + 1, 3, 1, '#f29bb5')
    p.px(x, y + 2, '#f29bb5')
  }

  const drawPaper = (p: Painter, x: number, y: number, right: boolean, colors: [string, string, string]) => {
    p.sprite(PAPER, { k: K, a: colors[0], b: colors[1], f: colors[2] }, Math.round(x) - 6, Math.round(y) - 4, !right)
  }

  const paperPos = (o: PaperPlane, t: number) => {
    const a = t * o.speed + o.phase
    return { x: o.hx + Math.sin(a) * o.range, y: o.hy + Math.sin(a * 2) * 2 + Math.sin(t * 1.3 + o.phase), right: Math.cos(a) > 0 }
  }

  const guest: GuestVisual<PaperPlane> = {
    create(entry) {
      const h = hashString(entry.id + entry.name)
      return {
        hx: 34 + (h % 132),
        hy: 236 + ((h >>> 9) % 72),
        phase: (h % 100) / 16,
        speed: 0.22 + ((h >>> 4) % 10) / 32,
        range: 12 + ((h >>> 12) % 22),
        colors: PAPER_COLORS[(h >>> 16) % PAPER_COLORS.length]!,
      }
    },
    position: (o, t) => paperPos(o, t),
    hitRadius: 8,
    draw(p, o, f, highlight) {
      const pos = paperPos(o, f.t)
      p.ellipse(Math.round(pos.x), Math.round(pos.y) + 11, 4, 1, 'rgba(30,35,45,.22)')
      drawPaper(p, pos.x, pos.y, pos.right, o.colors)
      if (highlight && Math.floor(f.t * 3) % 2) heart(p, pos.x, pos.y - 9)
    },
    spawn: {
      from: { x: 100, y: 214 },
      duration: 1.6,
      draw(p, o, k, f) {
        const from = this.from
        const to = paperPos(o, f.t)
        const right = to.x > from.x
        const e = 1 - (1 - k) ** 2
        const x = from.x + (to.x - from.x) * e
        const y = from.y + (to.y - from.y) * e - Math.sin(k * Math.PI) * 18
        for (let i = 1; i <= 3; i++) if ((Math.floor(f.t * 12) + i) % 2) p.px(x + (right ? -6 - i * 3 : 6 + i * 3), y + 1 + i, '#ffffff')
        drawPaper(p, x, y, right, o.colors)
      },
      landed(o, f) {
        const pos = paperPos(o, f.t)
        sparkles.push({ x: pos.x, y: pos.y, t0: f.t })
      },
    },
    focus: (o) => ({ x: o.hx, y: H }),
  }

  // ── 배경 (한 번만) ───────────────────────────
  function drawJet(p: Painter) {
    const half = (x: number) => (x < 62 ? 5 * Math.sqrt(Math.max(0, 1 - ((62 - x) / 12) ** 2)) : x > 138 ? 5 - ((x - 138) * 3) / 14 : 5)
    const wing = [[84, 251], [104, 251], [116, 232], [110, 232]] as const
    const stab = [[138, 251], [146, 251], [154, 241], [151, 241]] as const
    // 그림자
    const sh = 'rgba(40,40,50,.16)'
    for (const w of [wing, mirror(wing), stab, mirror(stab)]) quad(p, w.map(([x, y]) => [x + 4, y + 5] as const) as unknown as [Pt, Pt, Pt, Pt], sh)
    p.rect(54, JET_Y - 3, 98, 11, sh)
    // 날개와 엔진
    for (const w of [wing, mirror(wing)]) {
      quad(p, w, '#cfd4dc', K)
      p.line(w[1][0] - 2, w[1][1] + (w === wing ? -1 : 1), w[2][0] - 2, w[2][1] + (w === wing ? 1 : -1), '#b5bcc7')
    }
    for (const ey of [243, 269]) {
      p.rect(90, ey - 2, 10, 5, K)
      p.rect(91, ey - 1, 8, 3, '#8a919c')
      p.rect(91, ey - 1, 8, 1, '#a9b0bb')
      p.rect(90, ey - 1, 1, 3, '#3a3f48')
    }
    for (const s of [stab, mirror(stab)]) quad(p, s, '#cfd4dc', K)
    // 동체
    for (let x = 50; x <= 152; x++) {
      const h = half(x)
      const top = Math.round(JET_Y - h)
      const bot = Math.round(JET_Y + h)
      p.rect(x, top, 1, bot - top + 1, '#f7f7f4')
      if (bot > JET_Y + 2) p.rect(x, JET_Y + 2, 1, bot - JET_Y - 2, '#d6dbe3')
      p.px(x, top, K)
      p.px(x, bot, K)
    }
    p.rect(152, JET_Y - 2, 1, 5, K)
    // 조종석 창
    p.rect(54, JET_Y - 2, 2, 5, '#2f3b55')
    p.px(56, JET_Y - 3, '#2f3b55')
    p.px(56, JET_Y + 3, '#2f3b55')
    // 수직 꼬리날개 (위에서 보면 가는 띠)
    p.rect(138, JET_Y - 1, 14, 2, '#cfd4dc')
    p.line(138, JET_Y - 2, 151, JET_Y - 2, '#9aa3b0')
    text(p, 'JUST MARRIED', 70, JET_Y - 2, PINK)
    heart(p, 131, JET_Y - 1)
  }

  function drawBackground(p: Painter) {
    const r = createRng(17)

    // 바깥 도로 (위 차선은 왼쪽으로, 아래 차선은 오른쪽으로)와 보도
    p.rect(0, 0, W, 3, '#6a9a52')
    p.rect(0, 3, W, 15, '#50545c')
    for (let x = 2; x < W; x += 12) p.rect(x, 10, 6, 1, '#e8e4da')
    p.rect(0, 18, W, 6, '#c9c4ba')
    for (let x = 0; x < W; x += 8) p.rect(x, 18, 1, 6, '#bab5aa')

    // 앞 유리벽과 DEPARTURES 간판 (자동문은 움직이므로 drawUnder)
    p.rect(0, 24, W, 2, '#3a4150')
    p.rect(0, 26, W, 11, GLASS)
    for (let x = 0; x < W; x += 14) {
      p.rect(x, 26, 2, 11, '#4a5568')
      p.line(x + 4, 35, x + 9, 28, '#c9e2f2')
      p.line(x + 7, 35, x + 9, 32, '#c9e2f2')
    }
    p.rect(0, 37, W, 2, '#59606c')
    p.rect(0, 39, W, 1, '#3a4150')
    const sw = textWidth('@ DEPARTURES') + 6
    p.rect(100 - sw / 2 - 1, 15, sw + 2, 9, K)
    p.rect(100 - sw / 2, 16, sw, 7, YELLOW)
    text(p, '@ DEPARTURES', 100 - sw / 2 + 3, 17, K)

    // 출국장 바닥 타일과 앞 유리로 들어오는 빛
    p.rect(0, 40, W, CARPET - 40, FLOOR)
    for (let y = 40; y < CARPET; y += 10) p.rect(0, y, W, 1, FLOOR_LINE)
    for (let x = 0; x < W; x += 10) p.rect(x, 40, 1, CARPET - 40, FLOOR_LINE)
    for (let x = 2; x < W; x += 14)
      quad(
        p,
        [
          [x + 2, 40],
          [x + 13, 40],
          [x + 22, 58],
          [x + 11, 58],
        ],
        'rgba(255,255,255,.3)',
      )
    for (let i = 0; i < 16; i++) {
      const x = (r() * W) | 0
      const y = (64 + r() * 96) | 0
      p.line(x, y, x + 4, y - 4, '#f4f1ea')
    }

    // 포토존 레드카펫
    p.rect(138, 80, 32, 22, '#9a3a3a')
    p.rect(139, 80, 30, 21, '#b84a4a')
    p.rect(139, 80, 1, 21, '#e0b050')
    p.rect(168, 80, 1, 21, '#e0b050')

    // 탑승구 카펫과 가운데 통로
    p.rect(0, CARPET, W, WINDOW - CARPET, '#4f5d78')
    for (let y = CARPET; y < WINDOW; y++) for (let x = (y * 3) % 7; x < W; x += 7) p.px(x, y, '#57668a')
    p.rect(0, CARPET, W, 1, '#3c475e')
    p.rect(87, CARPET, 26, WINDOW - CARPET, FLOOR)
    for (let y = CARPET + 10; y < WINDOW; y += 10) p.rect(87, y, 26, 1, FLOOR_LINE)
    p.rect(100, CARPET, 1, WINDOW - CARPET, FLOOR_LINE)
    p.rect(86, CARPET, 1, WINDOW - CARPET, '#3c475e')
    p.rect(113, CARPET, 1, WINDOW - CARPET, '#3c475e')

    // ── 유리창 너머 ──
    // 계류장
    p.rect(0, WINDOW, W, SERVICE_ROAD - WINDOW, '#a7aaaf')
    for (let x = 0; x < W; x += 16) p.rect(x, APRON, 1, SERVICE_ROAD - APRON, '#9a9da2')
    for (let y = APRON + 16; y < SERVICE_ROAD; y += 16) p.rect(0, y, W, 1, '#9a9da2')
    for (let i = 0; i < 60; i++) p.px((r() * W) | 0, (APRON + r() * (SERVICE_ROAD - APRON)) | 0, '#9da0a5')
    p.rect(14, JET_Y, 176, 1, '#e6c140')
    p.rect(40, JET_Y - 6, 1, 13, '#e6c140')
    // 서비스 도로
    p.rect(0, SERVICE_ROAD, W, RUNWAY - SERVICE_ROAD, '#5a5e66')
    for (let x = 4; x < W; x += 10) p.rect(x, SERVICE_ROAD + 3, 5, 1, '#c9c6c0')
    // 활주로: 끝 표시(피아노 건반), 번호 09, 가운데 선, 접지 표시
    p.rect(0, RUNWAY, W, RUNWAY_END - RUNWAY, '#3b3f47')
    p.rect(0, RUNWAY + 1, W, 1, WHITE)
    p.rect(0, RUNWAY_END - 2, W, 1, WHITE)
    for (let y = RUNWAY + 4; y < RUNWAY_END - 4; y += 4) p.rect(5, y, 14, 2, WHITE)
    text(p, '09', 24, 300, WHITE, 2)
    for (let x = 44; x < W; x += 14) p.rect(x, 304, 8, 2, WHITE)
    for (const [x, w] of [
      [58, 10],
      [86, 8],
      [112, 6],
    ] as const) {
      p.rect(x, RUNWAY + 4, w, 2, WHITE)
      p.rect(x, RUNWAY_END - 6, w, 2, WHITE)
    }
    // 잔디
    p.rect(0, RUNWAY_END, W, H - RUNWAY_END, '#7aa860')
    for (let i = 0; i < 80; i++) p.px((r() * W) | 0, (RUNWAY_END + 1 + r() * (H - RUNWAY_END)) | 0, r() < 0.5 ? '#6a9a52' : '#8cbc6e')

    // 관제탑
    p.ellipse(18, 281, 11, 1, 'rgba(40,40,50,.18)')
    p.rect(9, 270, 14, 11, K)
    p.rect(10, 271, 12, 10, '#d8d4cc')
    p.rect(10, 271, 12, 1, '#ebe7df')
    p.rect(14, 276, 4, 5, '#5f8fb5')
    p.rect(12, 238, 8, 33, K)
    p.rect(13, 238, 6, 32, '#e3e0d8')
    p.rect(17, 238, 2, 32, '#c9c5bc')
    p.rect(5, 228, 22, 11, K)
    p.rect(6, 229, 20, 9, '#5f8fb5')
    p.rect(6, 229, 20, 1, GLASS)
    for (let x = 9; x < 26; x += 4) p.rect(x, 229, 1, 9, '#3a5a7a')
    p.rect(4, 225, 24, 4, K)
    p.rect(5, 226, 22, 2, '#4a4e58')
    p.rect(15, 220, 1, 5, '#6d7480')

    // 급유차와 고깔
    p.rect(162, 240, 28, 2, 'rgba(40,40,50,.18)')
    p.rect(159, 228, 23, 12, K)
    p.rect(160, 229, 21, 10, '#e3e5e9')
    p.rect(160, 229, 21, 2, '#f7f7f4')
    p.rect(160, 236, 21, 3, '#c9ccd1')
    p.rect(165, 232, 11, 2, '#2f8f8a')
    p.rect(181, 230, 8, 10, K)
    p.rect(182, 231, 6, 8, '#d04a3a')
    p.rect(186, 232, 2, 6, '#2f3b55')
    for (const x of [162, 176, 184]) p.rect(x, 240, 3, 1, K)
    for (const [x, y] of [
      [44, 249],
      [44, 263],
      [160, 256],
    ] as const) {
      p.px(x, y - 1, '#f08a3a')
      p.rect(x - 1, y, 3, 1, '#f08a3a')
      p.rect(x - 1, y + 1, 3, 1, K)
    }

    drawJet(p)

    // 탑승교: 탑승구 문에서 여객기 앞문까지 비스듬한 통로
    const [x0, y0, x1, y1] = [100, 225, 72, 246]
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0))
    for (let i = 0; i <= n; i++) p.rect(x0 + ((x1 - x0) * i) / n - 5, y0 + ((y1 - y0) * i) / n - 4, 10, 8, K)
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n
      const y = y0 + ((y1 - y0) * i) / n
      p.rect(x - 4, y - 3, 8, 6, i % 4 ? '#c9ccd1' : '#b0b4bb')
      p.rect(x - 4, y - 3, 8, 1, '#e3e5e9')
    }
    p.rect(85, 240, 5, 4, K)
    p.rect(86, 244, 1, 1, K)
    p.rect(89, 244, 1, 1, K)
    p.ellipse(100, 225, 6, 4, K)
    p.ellipse(100, 225, 5, 3, '#b9bdc4')
    p.rect(63, 243, 13, 9, K)
    p.rect(64, 244, 11, 7, '#d6d9de')
    p.rect(64, 244, 11, 1, '#eef0f2')

    // 컨베이어 차(뒷문)와 수하물 카트
    quad(
      p,
      [
        [118, 262],
        [124, 262],
        [134, 277],
        [128, 277],
      ],
      '#3a3f48',
      K,
    )
    p.rect(126, 274, 14, 6, K)
    p.rect(127, 275, 12, 4, YELLOW)
    for (let i = 0; i < 3; i++) {
      const x = 144 + i * 12
      p.rect(x, 272, 10, 8, K)
      p.rect(x + 1, 273, 8, 6, '#8a919c')
      p.rect(x + 2, 272, 3, 3, BAGS[i]!)
      p.rect(x + 5, 273, 3, 3, BAGS[i + 2]!)
      if (i) p.rect(x - 2, 276, 2, 1, K)
    }

    // 탑승구 유리창과 문
    p.rect(0, WINDOW, W, 1, K)
    p.rect(0, WINDOW + 1, W, 8, 'rgba(170,205,230,.55)')
    for (let x = 0; x < W; x += 16) {
      p.rect(x, WINDOW + 1, 1, 8, '#3a4150')
      p.line(x + 5, WINDOW + 7, x + 9, WINDOW + 2, 'rgba(255,255,255,.6)')
    }
    p.rect(0, WINDOW + 9, W, 2, '#59606c')
    p.rect(0, WINDOW + 11, W, 1, K)
    p.rect(92, WINDOW, 16, 13, K)
    p.rect(93, WINDOW + 1, 14, 11, '#6d7686')
    p.rect(93, WINDOW + 1, 14, 1, '#8a93a3')
    p.rect(100, WINDOW + 1, 1, 11, K)
  }

  // ── 움직이는 물체 ───────────────────────────
  const staff = (p: Painter, x: number, y: number, hair = '#2a2030') => {
    p.rect(x - 1, y - 1, 6, 8, K)
    p.rect(x, y, 4, 2, hair)
    p.rect(x, y + 2, 4, 2, '#f2c29a')
    p.rect(x - 1, y + 4, 6, 3, BLUE)
    p.px(x + 1, y + 4, '#ffffff')
    p.px(x + 2, y + 4, '#ffffff')
  }

  const drawCheckin = (p: Painter, t: number) => {
    p.rect(17, 40, 72, 9, K)
    p.rect(18, 41, 70, 7, NAVY)
    p.rect(19, 42, 5, 5, YELLOW)
    text(p, 'A', 20, 42, K)
    text(p, 'CHECK-IN', 53 - textWidth('CHECK-IN') / 2 + 3, 42, '#ffffff')
    // 수하물 벨트
    p.rect(16, 49, 74, 6, K)
    p.rect(17, 50, 72, 4, '#5b616c')
    const shift = Math.floor(t * 10)
    for (let x = 17; x < 89; x++) if ((x + shift) % 4 === 0) p.rect(x, 51, 1, 2, '#7a808b')
    for (let i = 0; i < 3; i++) {
      const bx = 17 + ((t * 10 + i * 25) % 66)
      p.rect(bx, 48, 7, 5, K)
      p.rect(bx + 1, 49, 5, 3, BAGS[i]!)
      p.rect(bx + 2, 47, 3, 1, K)
    }
    for (let i = 0; i < 3; i++) {
      const x = 20 + i * 24
      staff(p, x + 4, 50, ['#2a2030', '#7a4a30', '#3a2a20'][i])
      p.rect(x - 1, 56, 20, 10, K)
      p.rect(x, 57, 18, 3, '#eef0f2')
      p.rect(x, 60, 18, 5, BLUE)
      p.rect(x, 61, 18, 1, PINK)
      p.rect(x + 12, 53, 5, 4, K)
      p.rect(x + 13, 54, 3, 2, '#7fb0d8')
      if (i < 2) {
        p.rect(x + 19, 59, 5, 6, K)
        p.rect(x + 20, 60, 3, 4, '#a9b0bb')
        p.px(x + 21, 60, '#7af08a')
      }
    }
  }

  const drawStanchions = (p: Painter) => {
    const y = 73
    for (const row of [
      [16, 24, 32, 40],
      [66, 74, 82, 90],
    ]) {
      row.forEach((x, i) => {
        if (i < row.length - 1) p.rect(x + 2, y - 5, 6, 1, '#3d6fd0')
        p.rect(x, y - 6, 2, 6, '#9aa3b0')
        p.rect(x, y - 7, 2, 1, '#d9dde4')
        p.rect(x - 1, y, 4, 1, '#6d7480')
      })
    }
  }

  // 포토존: 커다란 탑승권 판
  const drawBoardingPass = (p: Painter) => {
    const x = 128
    const y = 46
    for (const lx of [134, 172]) {
      p.rect(lx - 1, y + 26, 4, 9, K)
      p.rect(lx, y + 26, 2, 8, '#9aa3b0')
    }
    p.rect(x - 1, y - 1, 54, 29, K)
    p.rect(x, y, 52, 27, '#fbfaf6')
    p.rect(x, y, 52, 7, BLUE)
    p.rect(x, y + 26, 52, 1, '#d9dde4')
    text(p, 'BOARDING @', x + 3, y + 1, '#ffffff')
    heart(p, x + 46, y + 2)
    text(p, 'ICN', x + 3, y + 10, NAVY, 2)
    text(p, '>', x + 26, y + 12, PINK)
    text(p, 'LOVE', x + 3, y + 21, PINK)
    text(p, '1A 1B', x + 22, y + 21, '#6b6b6b')
    // 절취선과 바코드
    for (let j = y + 8; j < y + 26; j += 2) p.px(x + 38, j, '#9aa3b0')
    for (let i = 0; i < 10; i++) if ((i * 7) % 3 !== 1) p.rect(x + 41 + i, y + 10, 1, 13, NAVY)
  }

  const drawBalloons = (p: Painter, bx: number, t: number, ph: number) => {
    const by = 80
    const set: [number, number, string][] = [
      [-3, -30, '#f29bb5'],
      [3, -32, '#ffffff'],
      [0, -25, YELLOW],
    ]
    set.forEach(([dx, dy, c], i) => {
      const x = bx + dx
      const y = by + dy + Math.round(Math.sin(t * 1.5 + ph + i * 2))
      p.line(x, y + 4, bx, by - 1, '#9aa3b0')
      p.ellipse(x, y, 3, 4, K)
      p.ellipse(x, y, 2, 3, c)
      p.px(x - 1, y - 2, '#ffffff')
    })
    p.rect(bx - 1, by - 1, 3, 2, K)
  }

  const drawSuitcases = (p: Painter) => {
    p.rect(178, 85, 10, 11, K)
    p.rect(179, 86, 8, 9, '#2f8f8a')
    p.rect(179, 86, 8, 1, '#4fb0aa')
    p.rect(181, 86, 1, 9, '#256f6b')
    p.rect(185, 86, 1, 9, '#256f6b')
    p.rect(179, 79, 8, 7, K)
    p.rect(180, 80, 6, 5, YELLOW)
    p.rect(182, 77, 2, 2, K)
    heart(p, 183, 81)
    p.px(180, 89, '#f29bb5')
    p.px(186, 92, '#ffffff')
  }

  // 출발 안내판: 위 줄은 신혼여행, 아래 줄은 몇 초마다 행선지가 넘어간다
  const drawDepartures = (p: Painter, t: number) => {
    const x = 64
    const y = 96
    p.rect(72, 118, 4, 7, K)
    p.rect(73, 118, 2, 6, '#4a4e58')
    p.rect(126, 118, 4, 7, K)
    p.rect(127, 118, 2, 6, '#4a4e58')
    p.rect(x, y, 72, 24, K)
    p.rect(x + 1, y + 1, 70, 22, '#2b2f38')
    p.rect(x + 2, y + 2, 68, 20, '#11151c')
    text(p, 'DEPARTURES', x + 4, y + 3, YELLOW)
    p.rect(x + 2, y + 9, 68, 1, '#2b2f38')
    text(p, '12:30', x + 4, y + 11, YELLOW)
    text(p, 'HONEYMOON', x + 24, y + 11, '#ffffff')
    text(p, '7', x + 64, y + 11, Math.floor(t * 2) % 2 ? '#7af08a' : YELLOW)
    const i = Math.floor(t / 4) % DESTINATIONS.length
    const [dest, gate] = DESTINATIONS[i]!
    text(p, '13:10', x + 4, y + 17, YELLOW)
    if (t % 4 < 0.3) {
      for (let c = 0; c < 6; c++) if ((hashString(String(Math.floor(t * 20) + c)) & 3) !== 0) p.rect(x + 24 + c * 4, y + 17, 3, 5, '#5b616c')
    } else text(p, dest, x + 24, y + 17, '#ffffff')
    text(p, gate, x + 64, y + 17, YELLOW)
  }

  const drawColumn = (p: Painter, x: number, y: number) => {
    p.ellipse(x, y + 1, 6, 1, 'rgba(40,40,50,.12)')
    p.rect(x - 5, y - 32, 10, 33, K)
    p.rect(x - 4, y - 32, 8, 32, '#f7f5f0')
    p.rect(x + 1, y - 32, 3, 32, FLOOR_LINE)
    p.rect(x - 4, y - 3, 8, 3, '#c9c4ba')
    p.rect(x - 3, y - 22, 6, 9, K)
    p.rect(x - 2, y - 21, 4, 7, '#b9dcf5')
    heart(p, x, y - 19)
  }

  const drawInfo = (p: Painter) => {
    p.rect(30, 86, 14, 8, K)
    p.rect(31, 87, 12, 6, '#2f6fb0')
    p.px(37, 88, '#ffffff')
    p.rect(37, 90, 1, 2, '#ffffff')
    p.rect(36, 94, 2, 4, '#4a4e58')
    staff(p, 35, 95, '#5a3a2a')
    p.rect(28, 100, 18, 8, K)
    p.rect(29, 101, 16, 3, '#eef0f2')
    p.rect(29, 104, 16, 3, BLUE)
  }

  const drawCarts = (p: Painter) => {
    for (let i = 0; i < 3; i++) {
      const x = 150 + i * 9
      p.line(x, 109, x + 2, 116, '#6d7480')
      p.rect(x + 2, 111, 8, 5, K)
      p.rect(x + 3, 112, 6, 3, '#c9ccd1')
      p.px(x + 3, 117, K)
      p.px(x + 9, 117, K)
    }
  }

  const drawPlant = (p: Painter, x: number, y: number) => {
    p.ellipse(x, y + 1, 5, 1, 'rgba(40,40,50,.15)')
    p.rect(x - 4, y - 5, 8, 6, K)
    p.rect(x - 3, y - 4, 6, 5, '#c9a27a')
    p.rect(x - 3, y - 4, 6, 1, '#e0bf95')
    p.sphere(x, y - 10, 6, PLANT)
  }

  // 대기 의자 (창 쪽을 보고 앉는다). seated: 앉은 승객의 머리 색 (자리 번호 → 색)
  const drawSeats = (p: Painter, x0: number, y: number, n: number, seated: Record<number, string>) => {
    p.rect(x0, y - 1, n * 6 - 1, 1, '#6d7480')
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 6
      p.rect(x, y - 7, 5, 4, K)
      p.rect(x + 1, y - 6, 3, 2, BLUE)
      p.rect(x + 1, y - 6, 3, 1, '#5a7aa6')
      p.rect(x, y - 3, 5, 3, K)
      p.rect(x + 1, y - 3, 3, 2, NAVY)
      p.px(x + 2, y, '#6d7480')
      const hair = seated[i]
      if (hair) {
        p.rect(x, y - 10, 5, 5, K)
        p.rect(x + 1, y - 9, 3, 3, hair)
        p.rect(x, y - 6, 5, 2, K)
        p.rect(x + 1, y - 6, 3, 1, '#c86a6a')
      }
    }
  }

  const drawGate = (p: Painter) => {
    p.rect(78, 183, 2, 15, '#4a4e58')
    const sw = textWidth('GATE 7') + 6
    p.rect(79 - sw / 2 - 1, 176, sw + 2, 9, K)
    p.rect(79 - sw / 2, 177, sw, 7, NAVY)
    text(p, 'GATE 7', 79 - sw / 2 + 3, 178, YELLOW)
    staff(p, 74, 193, '#2a2030')
    p.rect(68, 198, 20, 8, K)
    p.rect(69, 199, 18, 3, '#eef0f2')
    p.rect(69, 202, 18, 3, BLUE)
    p.rect(82, 197, 4, 2, '#7fb0d8')
  }

  // 활주로를 쓰는 작은 비행기 (코가 오른쪽). shadow면 그림자만
  const drawSmallJet = (p: Painter, x: number, y: number, shadow: boolean) => {
    const body = shadow ? 'rgba(30,35,45,.25)' : '#f7f7f4'
    const wing = shadow ? 'rgba(30,35,45,.25)' : '#cfd4dc'
    const o = shadow ? undefined : K
    quad(p, [[x - 2, y - 2], [x + 4, y - 2], [x - 4, y - 11], [x - 7, y - 11]], wing, o)
    quad(p, [[x - 2, y + 2], [x + 4, y + 2], [x - 4, y + 11], [x - 7, y + 11]], wing, o)
    quad(p, [[x - 12, y - 1], [x - 8, y - 1], [x - 12, y - 6], [x - 14, y - 6]], wing, o)
    quad(p, [[x - 12, y + 1], [x - 8, y + 1], [x - 12, y + 6], [x - 14, y + 6]], wing, o)
    if (!shadow) p.rect(x - 14, y - 3, 27, 7, K)
    p.rect(x - 13, y - 2, 25, 5, body)
    p.rect(x + 12, y - 1, 2, 3, body)
    if (!shadow) {
      p.px(x + 14, y, K)
      p.rect(x - 13, y + 1, 25, 1, '#d6dbe3')
      p.rect(x + 9, y - 1, 2, 3, '#2f3b55')
      p.rect(x - 9, y, 16, 1, '#2f6fb0')
    }
  }

  // 26초마다 한 대가 이륙하고, 이어서 한 대가 내려앉는다
  const drawRunwayTraffic = (p: Painter, t: number) => {
    const cy = 305
    const T = t % 26
    if (T < 10) {
      const k = T / 10
      const x = -30 + (W + 80) * k * k
      const lift = k > 0.55 ? (k - 0.55) * 70 : 0
      drawSmallJet(p, x, cy, true)
      drawSmallJet(p, x, cy - lift, false)
    } else if (T >= 13 && T < 23) {
      const k = (T - 13) / 10
      const touch = 0.3
      const x = k < touch ? -40 + (100 * k) / touch : 60 + (W - 20) * (1 - (1 - (k - touch) / (1 - touch)) ** 2)
      const alt = k < touch ? 40 * (1 - k / touch) : 0
      drawSmallJet(p, x, cy, true)
      drawSmallJet(p, x, cy - alt, false)
      if (k >= touch && k < touch + 0.08) {
        const s = (k - touch) / 0.08
        p.withAlpha(1 - s, () => {
          p.ellipse(60 - s * 6, cy + 3, 2 + s * 3, 1 + s, '#e3e5e9')
          p.ellipse(60 - s * 6, cy - 3, 2 + s * 3, 1 + s, '#e3e5e9')
        })
      }
    }
  }

  return {
    id: 'airport',
    world: { w: W, h: H },
    start: { x: 100, y: 140 },
    places,
    playerShadow: 'rgba(40,40,50,.22)',
    blocked: (x, y) => x < 12 || x > 188 || y < 42 || y > WINDOW - 2 || obstacles.some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h),
    // 출국장 안은 막힌 곳 사이로 직선이 지나가도록 배치했다
    route: (_, to) => [places[to]],
    drawBackground,
    drawUnder(p, f) {
      const t = f.t
      // 도로: 택시(오른쪽으로), 공항버스(왼쪽으로)
      const tx = ((t * 24) % (W + 40)) - 20
      p.rect(tx, 11, 15, 6, K)
      p.rect(tx + 1, 12, 13, 4, YELLOW)
      p.rect(tx + 10, 12, 2, 4, '#2f3b55')
      p.rect(tx + 5, 13, 2, 2, '#ffffff')
      const bx = W + 20 - ((t * 14 + 90) % (W + 70))
      p.rect(bx, 3, 30, 7, K)
      p.rect(bx + 1, 4, 28, 5, '#f4f1ea')
      p.rect(bx + 1, 6, 28, 1, BLUE)
      p.rect(bx + 1, 4, 2, 5, '#2f3b55')
      // 자동문: 가까이 가면 열린다
      const open = Math.abs(f.player.x - 100) < 16 && f.player.y < 58 ? 5 : 0
      p.rect(88, 26, 24, 13, K)
      p.rect(89, 27, 11 - open, 11, '#b9d8ec')
      p.rect(100 + open, 27, 11 - open, 11, '#b9d8ec')
      p.rect(89, 27, 22, 1, '#d9ecf8')
      // 관제탑·여객기 불빛, 활주로 등
      p.px(15, 219, Math.floor(t * 1.5) % 2 ? '#ff5a4a' : '#5a2a2a')
      p.px(126, JET_Y, Math.floor(t * 1.2) % 2 ? '#ff5a4a' : '#d6dbe3')
      for (let x = 8; x < W; x += 12) {
        const on = (Math.floor(t * 2) + x / 12) % 2 ? '#fff1b8' : '#8a7a50'
        p.px(x, RUNWAY, on)
        p.px(x, RUNWAY_END - 1, on)
      }
      const sweep = Math.floor(t * 8) % 8
      for (let i = 0; i < 7; i++) p.px(2, RUNWAY + 4 + i * 4, i === sweep ? '#ffffff' : '#7af08a')
      // 꼬리에 매단 깡통
      let px0 = 152
      let py0 = JET_Y
      for (let i = 0; i < 4; i++) {
        const cx = 157 + i * 5
        const cyy = JET_Y + Math.round(Math.sin(t * 6 + i))
        p.line(px0, py0, cx, cyy, '#9aa3b0')
        p.rect(cx, cyy - 1, 3, 2, '#c9ccd1')
        p.px(cx + 2, cyy - 1, K)
        px0 = cx + 2
        py0 = cyy
      }
      // 컨베이어 차를 타고 올라가는 가방
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.45 + i / 3) % 1
        const x = 131 - 9 * k
        const y = 275 - 13 * k
        p.rect(x - 2, y - 2, 5, 3, K)
        p.rect(x - 1, y - 1, 3, 1, BAGS[(i + 1) % BAGS.length]!)
      }
      // 서비스 도로의 수하물 차
      const gx = ((t * 18) % (W + 90)) - 70
      for (let i = 0; i < 3; i++) {
        const cx = gx + i * 11
        p.rect(cx, 284, 9, 5, K)
        p.rect(cx + 1, 285, 7, 3, '#8a919c')
        p.rect(cx + 2, 284, 4, 2, BAGS[(i + 2) % BAGS.length]!)
        p.rect(cx + 9, 286, 2, 1, K)
      }
      p.rect(gx + 33, 283, 8, 6, K)
      p.rect(gx + 34, 284, 6, 4, YELLOW)
      p.rect(gx + 38, 284, 2, 4, '#2f3b55')
      drawRunwayTraffic(p, t)
      // 바람자루
      const flap = Math.floor(t * 4) % 2
      p.rect(190, 222, 1, 9, '#6d7480')
      for (let i = 0; i < 3; i++) p.rect(191 + i * 2, 222 + (i && flap ? 1 : 0), 2, 2, i % 2 ? '#ffffff' : '#f08a3a')
    },
    drawOver(p, f) {
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i]!
        const k = (f.t - s.t0) / 0.7
        if (k > 1) {
          sparkles.splice(i, 1)
          continue
        }
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) p.px(s.x + Math.cos(a + k) * (3 + k * 8), s.y + Math.sin(a + k) * (2 + k * 5), k < 0.5 ? '#ffffff' : YELLOW)
      }
    },
    drawables(f): Drawable[] {
      const t = f.t
      return [
        { y: 66, draw: (p) => drawCheckin(p, t) },
        { y: 73, draw: drawStanchions },
        { y: 80, draw: drawBoardingPass },
        { y: 80, draw: (p) => drawBalloons(p, 124, t, 0) },
        { y: 80, draw: (p) => drawBalloons(p, 184, t, 2) },
        { y: 96, draw: drawSuitcases },
        { y: 108, draw: drawInfo },
        { y: 118, draw: drawCarts },
        { y: 125, draw: (p) => drawDepartures(p, t) },
        { y: 199, draw: (p) => drawSeats(p, 14, 199, 8, { 2: '#2a2030', 5: '#c8925a' }) },
        { y: 183, draw: (p) => drawSeats(p, 14, 183, 8, { 6: '#7a4a30' }) },
        { y: 183, draw: (p) => drawSeats(p, 122, 183, 11, { 1: '#3a2a20', 7: '#2a2030' }) },
        { y: 199, draw: (p) => drawSeats(p, 122, 199, 11, { 4: '#d8b070' }) },
        { y: 206, draw: drawGate },
        ...columns.map(([x, y]) => ({ y, draw: (p: Painter) => drawColumn(p, x, y) })),
        ...plants.map(([x, y]) => ({ y, draw: (p: Painter) => drawPlant(p, x, y) })),
      ]
    },
    drawAir(p, f) {
      // 계류장·활주로 위로 지나가는 옅은 구름
      for (const [y, speed, phase, w] of [
        [250, 3, 0, 22],
        [300, 2.2, 120, 28],
      ] as const) {
        const x = ((f.t * speed + phase) % (W + 80)) - 40
        p.withAlpha(0.5, () => {
          p.ellipse(x, y, w / 2, 3, '#ffffff')
          p.ellipse(x - 6, y - 3, 7, 2, '#ffffff')
          p.ellipse(x + 6, y - 2, 8, 2, '#ffffff')
        })
      }
    },
    guest,
  }
}
