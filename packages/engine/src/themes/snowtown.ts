import { OUTLINE as K } from '../constants'
import { bayer, prerender, type Painter } from '../painter'
import { createRng, hashString } from '../random'
import type { Drawable, GuestVisual, Place, PlaceId, Point, Theme } from '../theme'

// 겨울 마을 테마: 눈 덮인 소나무 숲 속 마을. 아래 눈 광장에 커다란 크리스마스트리.
// 방명록은 트리, 글 하나 = 트리에 달린 장식 구슬 하나. 색은 docs/ART_GUIDE.md 5장.

const W = 200
const H = 340
const SNOW = { base: '#eef3f9', shade: '#dde6f0', deep: '#c6d3e2', hi: '#ffffff' }
const PINE = ['#173a2e', '#22533e', '#2f6d4e', '#4a8a62', '#7ab08a']
const WOOD = { dark: '#6a3e24', log: '#94582f', light: '#c07a44' }
const ICE = ['#9fd0ea', '#c8e6f5', '#e8f6fc']
const RED = '#c8323a'
const GOLD = '#e8b040'
const WARM = '#f6c85f'
const WARM_HI = '#fff1b8'

const places: Record<PlaceId, Place> = {
  home: { id: 'home', label: '오두막', x: 55, y: 120 },
  photo: { id: 'photo', label: '눈사람 포토존', x: 140, y: 120 },
  guestbook: { id: 'guestbook', label: '트리', x: 100, y: 304 },
}

// 크리스마스트리: 꼭대기 (100, 200), 발밑 y 290. 4단으로 쌓고 단마다 아래 끝이 물결 모양으로 처진다.
const TREE = { x: 100, top: 200, base: 290 }
const TREE_W = 38
const TIERS = [
  { top: 200, bot: 226, w: 15 },
  { top: 214, bot: 246, w: 23 },
  { top: 232, bot: 267, w: 31 },
  { top: 251, bot: 286, w: 38 },
]
const treeK = (y: number) => (y - TREE.top) / (TREE.base - 3 - TREE.top)
// 충돌용 바깥 테두리 (모든 단을 감싼다)
const treeOuter = (y: number) => (0.25 + 0.75 * treeK(y)) * TREE_W
const tierEdge = (x: number, bot: number) => bot - 2 + Math.round(Math.sin(x * 0.85) * 1.6)
const tierHalf = (t: (typeof TIERS)[number], y: number) => 1 + ((y - t.top) / (t.bot - t.top)) ** 0.9 * (t.w - 1)
// (x, y)가 덮인 가장 위 단의 번호. 위 단이 아래 단을 덮는다. 없으면 -1
const tierAt = (x: number, y: number) => {
  for (let i = 0; i < TIERS.length; i++) {
    const t = TIERS[i]!
    if (y >= t.top && y <= tierEdge(x, t.bot) && Math.abs(x - TREE.x) <= tierHalf(t, y)) return i
  }
  return -1
}

// 트리 양옆 길. 트리를 가로질러 갈 수 없어서, 서 있는 쪽의 옆길로 오르내린다.
const LANE = { left: 52, right: 148, top: 206, bottom: 300 }
// 옆길 위쪽에서 오두막·포토존으로 갈 때 들르는 갈림길 (가로등을 피한다)
const JUNCTION: Point = { x: 100, y: 188 }

const house = { x: 36, y: 86 }
const POND = { x: 40, y: 314, rx: 26, ry: 8 }
const pines: [number, number, 0 | 1][] = [
  [22, 100, 0],
  [184, 130, 1],
  [24, 160, 1],
  [178, 172, 0],
  [22, 236, 0],
  [180, 244, 1],
  [26, 276, 1],
  [178, 284, 0],
]
const lamps: [number, number][] = [
  [78, 146],
  [122, 146],
  [40, 201],
  [160, 201],
]
const obstacles = [
  { x: 88, y: 135, w: 5, h: 4 },
  { x: 107, y: 135, w: 5, h: 4 },
  { x: 35, y: 80, w: 39, h: 35 },
  { x: 76, y: 108, w: 9, h: 7 },
  { x: 88, y: 59, w: 24, h: 10 },
  { x: 122, y: 104, w: 13, h: 10 },
  { x: 142, y: 105, w: 19, h: 9 },
  { x: 164, y: 112, w: 12, h: 7 },
  { x: 150, y: 300, w: 18, h: 8 },
  { x: 140, y: 314, w: 22, h: 6 },
  ...lamps.map(([x, y]) => ({ x: x - 1, y: y - 3, w: 3, h: 3 })),
  ...pines.map(([x, y]) => ({ x: x - 3, y: y - 3, w: 6, h: 4 })),
]

const inTree = (x: number, y: number) => y > TREE.top - 2 && y < TREE.base + 2 && Math.abs(x - TREE.x) < treeOuter(y) + 3
const onPond = (x: number, y: number) => ((x - POND.x) / (POND.rx + 2)) ** 2 + ((y - POND.y) / (POND.ry + 2)) ** 2 < 1

// 스프라이트 (docs/ART_GUIDE.md 4장)
const HEART_BIG = ['.kk.kk.', 'krrkrrk', 'krwrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...']
const DOG = ['......kk..', '.k...kwwk.', 'kwkkkkwkwk', '.kwwwwssk.', '.kwwwwwk..']
const DOG_LEGS = ['.k.k.k.k..', '..k.k.k.k.', '.kk..kk...']
const DOG_COLORS = { k: K, w: '#ffffff', s: RED }
const STAR = ['....k....', '...kyk...', 'kkkkwkkkk', 'kyyywyyyk', '.kyyyyyk.', '..kyyyk..', '.kyykyyk.', '.kkk.kkk.']
const SKATER = ['.h.', 'hfh', '.c.', 'ccc', '.c.', 'k.k']
const ORNAMENT_COLORS: [string, string][] = [
  [RED, '#8a1f28'],
  [GOLD, '#b07a20'],
  ['#4a8ad0', '#2a5a96'],
  ['#f29bb5', '#c86a8a'],
  ['#b48cf0', '#7a5ac0'],
  ['#f4efe6', '#c6d3e2'],
]

interface Ornament {
  x: number
  y: number
  phase: number
  colors: [string, string]
}

// 소나무 한 그루. by는 발밑 y, h는 높이, f는 높이 대비 폭. 층마다 윗줄에 눈이 쌓인다.
function drawPine(p: Painter, cx: number, by: number, h: number, f = 0.34) {
  const top = by - h
  const tiers = Math.max(2, Math.round(h / 7))
  p.rect(cx - 2, by - 4, 5, 4, K)
  p.rect(cx - 1, by - 4, 3, 3, WOOD.log)
  for (let y = top; y < by - 3; y++) {
    const k = (y - top) / (by - 3 - top)
    const tier = (k * tiers) % 1
    const w = Math.round((0.25 + 0.75 * k) * h * f * (0.55 + 0.45 * tier))
    p.rect(cx - w - 1, y, w * 2 + 3, 1, K)
    for (let i = -w; i <= w; i++) {
      const bt = bayer(cx + i, y)
      const l = -i / (w + 1) * 0.6 + 0.5 + (bt - 0.5) * 0.3
      let c = PINE[l > 0.85 ? 4 : l > 0.6 ? 3 : l > 0.35 ? 2 : l > 0.15 ? 1 : 0]!
      if (tier < 0.2 && Math.abs(i) < w) c = i > w * 0.45 ? SNOW.deep : bt < 0.7 ? SNOW.hi : SNOW.base
      p.px(cx + i, y, c)
    }
  }
  p.px(cx, top - 1, K)
  p.px(cx, top, SNOW.hi)
}

// 크리스마스트리 몸통 (배경에 한 번 그린다). 왼쪽 위에서 빛이 비치고, 단 끝에 눈이 살짝 얹힌다.
function drawChristmasTree(p: Painter) {
  const x0 = TREE.x - TREE_W - 2
  const x1 = TREE.x + TREE_W + 2
  for (let y = TREE.top - 1; y <= TREE.base; y++)
    for (let x = x0; x <= x1; x++) {
      const i = tierAt(x, y)
      if (i < 0) {
        // 테두리
        if (tierAt(x - 1, y) >= 0 || tierAt(x + 1, y) >= 0 || tierAt(x, y - 1) >= 0 || tierAt(x, y + 1) >= 0) p.px(x, y, K)
        continue
      }
      const t = TIERS[i]!
      const hw = tierHalf(t, y)
      const u = (x - TREE.x) / hw
      const k = (y - t.top) / (t.bot - t.top)
      const bt = bayer(x, y)
      // 바로 위 단 아래 끝의 그늘
      const under = i > 0 && y - tierEdge(x, TIERS[i - 1]!.bot) <= 2 && y > tierEdge(x, TIERS[i - 1]!.bot) && Math.abs(x - TREE.x) <= tierHalf(TIERS[i - 1]!, TIERS[i - 1]!.bot) + 1
      let l = 0.62 - u * 0.42 - k * 0.18 + (bt - 0.5) * 0.24
      if (under) l -= 0.35
      let c = PINE[l > 0.82 ? 4 : l > 0.58 ? 3 : l > 0.34 ? 2 : l > 0.12 ? 1 : 0]!
      // 단 끝 물결 꼭짓점에 눈
      const edge = tierEdge(x, t.bot)
      if (y >= edge - 1 && Math.sin(x * 0.85) > 0.35 && u < 0.7) c = y === edge ? SNOW.hi : SNOW.base
      if (y === edge && Math.sin(x * 0.85) <= 0.35) c = PINE[0]!
      p.px(x, y, c)
    }
  // 금빛 가랜드: 단마다 늘어진 구슬 줄
  for (const [j, t] of TIERS.entries()) {
    const yMid = t.top + (t.bot - t.top) * 0.55
    const hw = tierHalf(t, yMid) - 2
    for (let x = -hw; x <= hw; x += 2) {
      const y = yMid + (1 - (x / hw) ** 2) * 3 + (j % 2 ? -1 : 0)
      if (tierAt(TREE.x + x, Math.round(y)) === j) p.px(TREE.x + x, y, (x / 2) % 2 ? GOLD : '#f6d880')
    }
  }
  // 줄기와 트리 스커트
  p.rect(TREE.x - 3, TREE.base - 4, 7, 5, K)
  p.rect(TREE.x - 2, TREE.base - 4, 5, 4, WOOD.log)
  p.ellipse(TREE.x, TREE.base + 1, 16, 3, K)
  p.ellipse(TREE.x, TREE.base + 1, 15, 2, RED)
  for (let i = -14; i <= 14; i += 3) p.px(TREE.x + i, TREE.base + 2, '#ffffff')
}

// 트리 위 한 점: 덮인 단 안쪽으로 끌어당긴다 (장식·전구 자리)
function onTree(y: number, u: number): Point {
  for (let shrink = 0; shrink < 30; shrink++) {
    const x = Math.round(TREE.x + u * (TREE_W - 4 - shrink))
    if (tierAt(x, y) >= 0 && tierAt(x - 2, y) >= 0 && tierAt(x + 2, y) >= 0 && tierAt(x, y + 2) >= 0) return { x, y }
  }
  return { x: TREE.x, y }
}

export function createSnowtownTheme(): Theme {
  let pineSprites: HTMLCanvasElement[] | null = null
  const bursts: { x: number; y: number; t0: number }[] = []
  const rng = createRng(77)
  const flakes = Array.from({ length: 90 }, () => ({ x: rng() * W, y: rng() * H, speed: 6 + rng() * 8, sway: rng() * 6, big: rng() < 0.25 }))
  const treeLights = Array.from({ length: 36 }, (_, i) => {
    const pt = onTree(TREE.top + 8 + ((rng() * (TREE.base - TREE.top - 14)) | 0), rng() * 2 - 1)
    return { ...pt, c: [WARM, RED, '#7af0c8', '#f29bb5'][i % 4]! }
  })

  const heart = (p: Painter, x: number, y: number, c = '#f29bb5') => {
    p.px(x - 1, y, c)
    p.px(x + 1, y, c)
    p.rect(x - 1, y + 1, 3, 1, c)
    p.px(x, y + 2, c)
  }

  const drawOrnament = (p: Painter, x: number, y: number, colors: [string, string], shine: boolean) => {
    x = Math.round(x)
    y = Math.round(y)
    p.px(x, y - 2, GOLD)
    p.rect(x - 2, y - 1, 5, 3, K)
    p.rect(x - 1, y - 2, 3, 5, K)
    p.rect(x - 1, y - 1, 3, 3, colors[0])
    p.px(x + 1, y + 1, colors[1])
    p.px(x - 1, y - 1, '#ffffff')
    if (shine) {
      p.px(x - 3, y - 3, '#ffffff')
      p.px(x + 3, y - 3, '#ffffff')
    }
  }

  const guest: GuestVisual<Ornament> = {
    create(entry) {
      const h = hashString(entry.id + entry.name)
      const y = TREE.top + 12 + Math.round((((h >>> 3) % 1000) / 1000) * (TREE.base - TREE.top - 20))
      const pt = onTree(y, (((h >>> 13) % 1000) / 1000) * 2 - 1)
      return { ...pt, phase: (h % 100) / 16, colors: ORNAMENT_COLORS[(h >>> 23) % ORNAMENT_COLORS.length]! }
    },
    position: (o) => ({ x: o.x, y: o.y }),
    hitRadius: 6,
    draw(p, o, f, highlight) {
      drawOrnament(p, o.x, o.y, o.colors, Math.sin(f.t * 1.6 + o.phase) > 0.93)
      if (highlight && Math.floor(f.t * 3) % 2) heart(p, o.x, o.y - 7)
    },
    spawn: {
      from: { x: places.guestbook.x, y: places.guestbook.y - 4 },
      duration: 1.2,
      draw(p, o, k, f) {
        const e = 1 - (1 - k) ** 2
        const x = this.from.x + (o.x - this.from.x) * e
        const y = this.from.y + (o.y - this.from.y) * e - Math.sin(k * Math.PI) * 26
        drawOrnament(p, x, y, o.colors, true)
        for (let i = 1; i <= 3; i++) {
          const kk = Math.max(0, k - i * 0.05)
          const ee = 1 - (1 - kk) ** 2
          const tx = this.from.x + (o.x - this.from.x) * ee
          const ty = this.from.y + (o.y - this.from.y) * ee - Math.sin(kk * Math.PI) * 26
          if ((Math.floor(f.t * 20) + i) % 2) p.px(tx, ty, i === 1 ? WARM_HI : '#ffffff')
        }
      },
      landed(o, f) {
        bursts.push({ x: o.x, y: o.y, t0: f.t })
      },
    },
    focus: () => ({ x: TREE.x, y: (TREE.top + TREE.base) / 2 }),
  }

  // ── 배경 (한 번만) ───────────────────────────
  function drawBackground(p: Painter) {
    const r = createRng(77)
    p.rect(0, 0, W, H, SNOW.base)
    for (let i = 0; i < 700; i++) p.px((r() * W) | 0, (r() * H) | 0, r() < 0.6 ? SNOW.shade : SNOW.hi)
    // 눈 더미 (작은 언덕 그늘)
    for (let i = 0; i < 26; i++) {
      const x = (14 + r() * 172) | 0
      const y = (50 + r() * 270) | 0
      p.rect(x, y, 4 + ((r() * 4) | 0), 1, SNOW.deep)
      p.rect(x + 1, y - 1, 3, 1, SNOW.hi)
    }

    // 둘레 숲 (위, 양옆, 아래)
    p.rect(0, 0, W, 30, PINE[0]!)
    for (let x = -4; x < W + 8; x += 9) drawPine(p, x + ((r() * 4) | 0), 22 + ((r() * 4) | 0), 22 + ((r() * 6) | 0))
    for (let x = 2; x < W + 8; x += 11) drawPine(p, x + ((r() * 4) | 0), 42 + ((r() * 4) | 0), 18 + ((r() * 6) | 0))
    for (let y = 60; y < 330; y += 16) {
      drawPine(p, 4 + ((r() * 3) | 0), y, 16 + ((r() * 4) | 0))
      drawPine(p, 196 - ((r() * 3) | 0), y + 6, 16 + ((r() * 4) | 0))
    }
    for (let x = 0; x < W + 8; x += 10) drawPine(p, x + ((r() * 4) | 0), H + 6, 16 + ((r() * 5) | 0))

    // 눈 치운 돌길: 광장 → 오두막·포토존·아래, 트리 둘레
    const paths: [number, number, number, number][] = [
      [100, 150, 55, 118],
      [100, 150, 140, 118],
      [100, 150, 100, 196],
      [100, 196, 52, 210],
      [100, 196, 148, 210],
      [52, 210, 52, 298],
      [148, 210, 148, 296],
      [52, 298, 100, 306],
      [148, 296, 100, 306],
    ]
    const walk = (w: number, c: string) =>
      paths.forEach(([a, b, x1, y1]) => {
        const n = Math.hypot(x1 - a, y1 - b) | 0
        for (let i = 0; i <= n; i++) {
          const k = i / n
          p.rect(a + (x1 - a) * k - w, b + (y1 - b) * k - w + 1, w * 2 + 1, w * 2 - 1, c)
        }
      })
    walk(3, '#9aa6b6')
    p.ellipse(100, 150, 11, 6, '#9aa6b6')
    p.ellipse(100, 306, 12, 5, '#9aa6b6')
    walk(2, '#bcc6d3')
    p.ellipse(100, 150, 10, 5, '#bcc6d3')
    p.ellipse(100, 306, 11, 4, '#bcc6d3')
    for (let i = 0; i < 160; i++) {
      const [a, b, x1, y1] = paths[i % paths.length]!
      const k = r()
      const x = a + (x1 - a) * k + (r() - 0.5) * 4
      const y = b + (y1 - b) * k + (r() - 0.5) * 3
      p.px(x, y, r() < 0.5 ? '#aab4c2' : SNOW.shade)
    }

    // 버진로드
    p.rect(95, 72, 11, 68, '#c6d3e2')
    p.rect(96, 72, 9, 68, '#ffffff')
    for (let y = 76; y < 138; y += 6) p.px(100, y, '#f29bb5')

    // 얼어붙은 연못
    p.ellipse(POND.x, POND.y + 1, POND.rx + 2, POND.ry + 2, SNOW.deep)
    p.ellipse(POND.x, POND.y, POND.rx + 1, POND.ry + 1, K)
    p.ellipse(POND.x, POND.y, POND.rx, POND.ry, ICE[0]!)
    p.ellipse(POND.x - 3, POND.y - 1, POND.rx - 6, POND.ry - 3, ICE[1]!)
    for (const [dx, dy, len] of [
      [-14, -3, 7],
      [2, 1, 9],
      [10, -2, 5],
    ] as const)
      p.line(POND.x + dx, POND.y + dy, POND.x + dx + len, POND.y + dy - 2, ICE[2]!)

    // 크리스마스트리 (방명록). 장식 구슬은 이 위에 그린다.
    p.ellipse(TREE.x, TREE.base, TREE_W + 4, 5, SNOW.deep)
    drawChristmasTree(p)
    // 선물 상자
    for (const [x, w, h, c, ribbon] of [
      [72, 9, 7, RED, GOLD],
      [83, 7, 5, '#4a8ad0', '#ffffff'],
      [110, 8, 6, GOLD, RED],
      [120, 7, 8, '#2f6d4e', RED],
    ] as const) {
      const y = TREE.base + 3 - h
      p.rect(x - 1, y - 1, w + 2, h + 2, K)
      p.rect(x, y, w, h, c)
      p.rect(x + (w >> 1), y, 1, h, ribbon)
      p.rect(x, y + (h >> 1), w, 1, ribbon)
      p.px(x + (w >> 1) - 1, y - 2, ribbon)
      p.px(x + (w >> 1) + 1, y - 2, ribbon)
    }
  }

  // ── 움직이는 물체 ───────────────────────────
  const drawCabin = (p: Painter, t: number) => {
    const { x, y } = house
    p.ellipse(x + 18, y + 30, 21, 3, SNOW.deep)
    // 굴뚝
    p.rect(x + 25, y - 6, 6, 10, K)
    p.rect(x + 26, y - 5, 4, 9, '#8a8794')
    p.rect(x + 26, y - 5, 4, 1, SNOW.hi)
    // 벽 (통나무)
    p.rect(x + 1, y + 13, 34, 17, K)
    p.rect(x + 2, y + 14, 32, 15, WOOD.log)
    for (let j = y + 15; j < y + 29; j += 3) {
      p.rect(x + 2, j, 32, 1, WOOD.dark)
      p.px(x + 1, j - 1, WOOD.light)
      p.px(x + 34, j - 1, WOOD.light)
    }
    p.rect(x + 2, y + 14, 32, 1, WOOD.light)
    // 지붕 (눈)
    for (let j = 0; j < 15; j++) {
      const hw = 6 + j * 1.0
      p.rect(x + 18 - hw - 1, y + j, hw * 2 + 3, 1, K)
      for (let i = -hw; i <= hw; i++) {
        const shade = i > hw * 0.35
        p.px(x + 18 + i, y + j, j > 11 ? WOOD.dark : shade ? SNOW.shade : bayer(x + i, y + j) < 0.8 ? SNOW.hi : SNOW.base)
      }
    }
    for (let i = -18; i <= 18; i += 3) p.rect(x + 18 + i, y + 15, 1, 1 + ((i + 21) % 2), ICE[1]!)
    // 창문 (따뜻한 불빛)
    for (const a of [x + 5, x + 25]) {
      p.rect(a, y + 17, 7, 6, K)
      p.rect(a + 1, y + 18, 5, 4, WARM)
      p.rect(a + 3, y + 18, 1, 4, '#c89a30')
      p.rect(a + 1, y + 20, 5, 1, '#c89a30')
      p.px(a + 1, y + 18, WARM_HI)
      p.rect(a, y + 23, 7, 1, SNOW.hi)
    }
    // 문과 리스
    p.rect(x + 14, y + 17, 9, 13, K)
    p.rect(x + 15, y + 18, 7, 12, '#7a2a28')
    p.rect(x + 15, y + 18, 7, 1, '#a04a3a')
    p.px(x + 20, y + 24, WARM)
    for (let a = 0; a < Math.PI * 2; a += 0.55) p.px(x + 18 + Math.cos(a) * 2.4, y + 21 + Math.sin(a) * 2.4, '#2f6d4e')
    p.px(x + 18, y + 23, RED)
    p.px(x + 17, y + 24, RED)
    p.px(x + 19, y + 24, RED)
    p.rect(x + 13, y + 30, 11, 1, '#bcc6d3')
    // 굴뚝 연기
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.35 + i / 3) % 1
      p.withAlpha(1 - k, () =>
        p.ellipse(x + 28 + Math.sin(k * 5 + i) * 2 + k * 3, y - 9 - k * 16, 1 + Math.round(k * 2), 1 + Math.round(k * 1.5), '#e8eaee'),
      )
    }
  }

  // 장작더미 (오두막 오른쪽 앞)
  const drawWoodpile = (p: Painter) => {
    const x = 76
    const y = 114
    p.rect(x - 1, y - 7, 11, 8, K)
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3 - (j === 2 ? 1 : 0); i++) {
        const cx = x + 1 + i * 3 + (j === 2 ? 1 : 0)
        const cy = y - 2 - j * 2
        p.rect(cx, cy, 2, 2, WOOD.light)
        p.px(cx, cy, '#e0a870')
      }
    p.rect(x, y - 8, 9, 1, SNOW.hi)
  }

  const drawSnowman = (p: Painter) => {
    const x = 128
    const y = 113
    p.ellipse(x, y, 6, 2, SNOW.deep)
    p.ellipse(x, y - 4, 6, 5, K)
    p.ellipse(x, y - 4, 5, 4, SNOW.hi)
    p.ellipse(x + 2, y - 3, 2, 2, SNOW.shade)
    p.ellipse(x, y - 12, 4, 4, K)
    p.ellipse(x, y - 12, 3, 3, SNOW.hi)
    p.px(x + 2, y - 11, SNOW.shade)
    p.px(x - 1, y - 13, K)
    p.px(x + 1, y - 13, K)
    p.px(x + 2, y - 12, '#f08a3a')
    p.px(x + 3, y - 12, '#f08a3a')
    p.rect(x - 3, y - 9, 7, 2, RED)
    p.rect(x + 2, y - 8, 2, 3, RED)
    p.px(x, y - 6, K)
    p.px(x, y - 4, K)
    p.line(x - 5, y - 6, x - 9, y - 10, WOOD.dark)
    p.line(x + 5, y - 6, x + 9, y - 9, WOOD.dark)
    p.rect(x - 4, y - 16, 9, 1, K)
    p.rect(x - 2, y - 20, 5, 4, K)
    p.rect(x - 2, y - 17, 5, 1, RED)
  }

  // 사진 액자판: 하트가 그려진 금색 테두리 판
  const drawPhotoBoard = (p: Painter) => {
    const x = 142
    const y = 112
    p.ellipse(x + 9, y + 1, 10, 2, SNOW.deep)
    p.rect(x + 2, y - 6, 2, 7, WOOD.dark)
    p.rect(x + 14, y - 6, 2, 7, WOOD.dark)
    p.rect(x - 1, y - 21, 20, 16, K)
    p.rect(x, y - 20, 18, 14, GOLD)
    p.rect(x + 2, y - 18, 14, 10, '#c8e6f5')
    p.rect(x + 2, y - 11, 14, 3, SNOW.hi)
    p.sprite(HEART_BIG, { k: K, r: RED, w: '#ffffff' }, x + 6, y - 18)
    p.rect(x, y - 21, 18, 1, SNOW.hi)
    p.px(x - 1, y - 20, SNOW.hi)
  }

  const drawCamera = (p: Painter, t: number) => {
    const x = 170
    const y = 118
    p.line(x, y - 8, x - 4, y, K)
    p.line(x, y - 8, x + 4, y, K)
    p.line(x, y - 8, x, y, K)
    p.rect(x - 5, y - 14, 10, 7, K)
    p.rect(x - 4, y - 13, 8, 5, '#4a4458')
    p.rect(x - 4, y - 13, 8, 1, '#6d6a7a')
    p.rect(x - 1, y - 12, 3, 3, '#7af0c8')
    p.px(x - 1, y - 12, '#ffffff')
    p.rect(x + 2, y - 15, 2, 1, K)
    p.rect(x - 5, y - 15, 10, 1, SNOW.hi)
    if (t % 6 < 0.12) for (let a = 0; a < Math.PI * 2; a += 0.785) p.px(x + Math.cos(a) * 6, y - 11 + Math.sin(a) * 5, '#ffffff')
  }

  // 하트 얼음 조각: 버진로드 끝 (마을의 분수 자리)
  const drawIceHeart = (p: Painter, t: number) => {
    const x = 100
    const y = 66
    p.ellipse(x, y + 2, 12, 3, SNOW.deep)
    p.ellipse(x, y, 10, 3, K)
    p.ellipse(x, y, 9, 2, SNOW.hi)
    const rows = ['.kkk.kkk.', 'kabbkbbak', 'kabbbbbbk', 'kbbbbbbbk', '.kbbbbbk.', '..kbbbk..', '...kbk...', '....k....']
    p.sprite(rows, { k: '#5a8ab0', a: ICE[2]!, b: ICE[1]! }, x - 4, y - 10)
    p.px(x - 2, y - 8, '#ffffff')
    const s = Math.floor(t * 1.2) % 3
    p.px(x - 3 + s * 3, y - 9 + (s % 2) * 3, '#ffffff')
  }

  // 웨딩 입구: 시작 위치 바로 뒤의 소나무 가랜드 아치
  const drawGate = (p: Painter, t: number) => {
    const x = 100
    const y = 138
    p.ellipse(x, y + 1, 13, 2, SNOW.deep)
    for (const a of [x - 10, x + 9]) {
      p.rect(a - 2, y - 2, 6, 3, K)
      p.rect(a - 1, y - 2, 4, 2, '#c9c6c0')
      p.rect(a - 1, y - 19, 4, 18, K)
      p.rect(a, y - 18, 2, 17, '#f4efe6')
      for (let j = y - 17; j < y - 1; j += 4) p.rect(a, j, 2, 2, RED)
    }
    const arc = (fn: (ax: number, ay: number, i: number) => void) => {
      let i = 0
      for (let a = -0.15; a <= 3.3; a += 0.14, i++) fn(x + Math.cos(a) * 10, y - 19 - Math.sin(a) * 7, i)
    }
    arc((ax, ay) => p.rect(ax - 2, ay - 2, 5, 5, K))
    arc((ax, ay, i) => {
      p.rect(ax - 1, ay - 1, 3, 3, PINE[2]!)
      p.px(ax, ay - 1, PINE[3]!)
      if (i % 3 === 0) p.px(ax, ay - 1, SNOW.hi)
      if (i % 4 === 2) p.px(ax, ay + 1, (Math.floor(t * 2) + i) % 2 ? WARM : GOLD)
    })
    for (const s of [-1, 1]) {
      p.rect(x + s * 10 - 1, y - 24, 3, 2, RED)
      p.px(x + s * 10 - 2, y - 22, RED)
      p.px(x + s * 10 + 2, y - 22, RED)
    }
    p.sprite(HEART_BIG, { k: K, r: RED, w: '#ffffff' }, x - 3, y - 32)
  }

  // 강아지(빨간 목도리): 11초 중 8초는 얼음 조각 주위를 달리고 3초는 앉는다. 각도는 경과 시간만으로 정한다.
  const DOG_CYCLE = 11
  const DOG_RUN = 8
  const dogAngle = (t: number) => (Math.floor(t / DOG_CYCLE) * DOG_RUN + Math.min(t % DOG_CYCLE, DOG_RUN)) * 1.1
  const dogPos = (t: number) => ({ x: Math.round(100 + Math.cos(dogAngle(t)) * 26), y: Math.round(70 + Math.sin(dogAngle(t)) * 11) })
  const drawDog = (p: Painter, t: number) => {
    const run = t % DOG_CYCLE < DOG_RUN
    const { x, y } = dogPos(t)
    const right = -Math.sin(dogAngle(t)) > 0
    const fr = Math.floor(t * 10) % 2
    const lift = run && fr ? 1 : 0
    p.ellipse(x, y, 4, 1, 'rgba(60,80,110,.22)')
    const rows = [...DOG, DOG_LEGS[run ? fr : 2]!]
    if (!run) {
      const wag = ['.k.', 'kwk', '.kk']
      for (let j = 0; j < 3; j++) rows[j] = [...rows[j]!].map((c, i) => (i < 3 ? wag[j]![(i + Math.floor(t * 6)) % 3]! : c)).join('')
    }
    p.sprite(rows, DOG_COLORS, x - 5, y - 6 - lift, !right)
  }

  const drawLamp = (p: Painter, x: number, y: number, t: number) => {
    p.rect(x, y - 8, 1, 8, '#4a4458')
    p.rect(x - 1, y - 10, 3, 2, K)
    p.rect(x - 1, y - 11, 3, 1, SNOW.hi)
    p.px(x, y - 9, Math.sin(t * 9 + x) > -0.8 ? WARM_HI : '#c8a040')
    p.px(x - 1, y, SNOW.deep)
    p.px(x + 1, y, SNOW.deep)
  }

  const drawLights = (p: Painter, t: number) => {
    const a = [74, 94]
    const b = [121, 96]
    for (let i = 0; i <= 30; i++) {
      const k = i / 30
      const x = a[0]! + (b[0]! - a[0]!) * k
      const y = a[1]! + (b[1]! - a[1]!) * k + Math.sin(k * Math.PI) * 6
      p.px(x, y, '#4a4458')
      if (i % 3 === 1) {
        const on = (Math.floor(t * 2) + i) % 2
        p.px(x, y + 1, on ? [WARM, RED, '#7af0c8', '#f29bb5'][i % 4]! : '#4a4458')
      }
    }
  }

  // 썰매와 벤치 (오른쪽 아래)
  const drawSled = (p: Painter) => {
    const x = 151
    const y = 306
    p.ellipse(x + 8, y + 1, 9, 2, SNOW.deep)
    p.rect(x, y - 1, 17, 1, K)
    p.px(x - 1, y - 2, K)
    p.px(x + 17, y - 2, K)
    p.rect(x + 3, y - 3, 1, 2, K)
    p.rect(x + 13, y - 3, 1, 2, K)
    p.rect(x + 1, y - 6, 15, 4, K)
    p.rect(x + 2, y - 5, 13, 2, RED)
    p.rect(x + 2, y - 5, 13, 1, '#e8606a')
    p.rect(x + 3, y - 8, 6, 2, '#2f6d4e')
    p.rect(x + 9, y - 7, 4, 1, GOLD)
  }
  const drawBench = (p: Painter) => {
    const x = 141
    const y = 319
    p.rect(x, y - 3, 2, 3, K)
    p.rect(x + 18, y - 3, 2, 3, K)
    p.rect(x - 1, y - 6, 22, 3, K)
    p.rect(x, y - 5, 20, 1, WOOD.log)
    p.rect(x - 1, y - 10, 22, 3, K)
    p.rect(x, y - 9, 20, 1, WOOD.log)
    p.rect(x, y - 11, 20, 1, SNOW.hi)
    p.rect(x, y - 7, 20, 1, SNOW.hi)
  }

  // 연못에서 스케이트 타는 두 사람: 같은 궤도를 앞뒤로 돈다
  const drawSkaters = (p: Painter, t: number) => {
    for (const [ph, coat] of [
      [0, RED],
      [0.5, '#4a8ad0'],
    ] as const) {
      const a = t * 0.6 + ph * Math.PI * 2
      const x = POND.x + Math.cos(a) * (POND.rx - 8)
      const y = POND.y + Math.sin(a) * (POND.ry - 3)
      p.ellipse(x, y + 1, 2, 1, 'rgba(60,90,120,.3)')
      p.sprite(SKATER, { h: '#3a2a22', f: '#f2c8a0', c: coat, k: K }, x - 1, y - 6, Math.sin(a) > 0)
    }
  }

  return {
    id: 'snowtown',
    world: { w: W, h: H },
    start: { x: 100, y: 160 },
    places,
    playerShadow: 'rgba(60,80,110,.25)',
    blocked: (x, y) =>
      x < 12 ||
      x > 188 ||
      y < 46 ||
      y > 326 ||
      inTree(x, y) ||
      onPond(x, y) ||
      obstacles.some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h),
    // 트리는 가로질러 갈 수 없다. 트리 위·아래를 오갈 때는 지금 서 있는 쪽(왼쪽·오른쪽) 옆길로 오르내린다.
    // 트리 옆에 서 있으면 먼저 옆길로 비켜선 뒤 곧장 내려가거나 올라간다(위로 되돌아가지 않는다).
    route: (from, to) => {
      const x = from.x < TREE.x ? LANE.left : LANE.right
      const below = from.y > TREE.base + 4
      const beside = !below && from.y > TREE.top - 4
      if (to === 'guestbook') {
        if (below) return [places.guestbook]
        return beside ? [{ x, y: from.y }, { x, y: LANE.bottom }, places.guestbook] : [{ x, y: LANE.top }, { x, y: LANE.bottom }, places.guestbook]
      }
      if (below) return [{ x, y: LANE.bottom }, { x, y: LANE.top }, JUNCTION, places[to]]
      return beside ? [{ x, y: from.y }, { x, y: LANE.top }, JUNCTION, places[to]] : [places[to]]
    },
    drawBackground,
    drawUnder(p, f) {
      // 트리 줄전구와 꼭대기 별
      for (let i = 0; i < treeLights.length; i++) {
        const l = treeLights[i]!
        const on = (Math.floor(f.t * 2) + i) % 3 !== 0
        p.px(l.x, l.y, on ? l.c : '#4a4458')
      }
      // 꼭대기 별: 반짝일 때 둘레에 빛
      const tw = Math.floor(f.t * 2) % 2
      p.sprite(STAR, { k: K, y: GOLD, w: WARM_HI }, TREE.x - 4, TREE.top - 8)
      if (tw)
        for (const [dx, dy] of [
          [-6, -7],
          [6, -7],
          [0, -10],
          [-7, 0],
          [7, 0],
        ] as const)
          p.px(TREE.x + dx, TREE.top - 4 + dy, WARM_HI)
      drawSkaters(p, f.t)
    },
    drawOver(p, f) {
      for (let i = bursts.length - 1; i >= 0; i--) {
        const s = bursts[i]!
        const k = (f.t - s.t0) / 0.7
        if (k > 1) {
          bursts.splice(i, 1)
          continue
        }
        const r = 2 + k * 6
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) p.px(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, k < 0.5 ? WARM_HI : '#ffffff')
      }
    },
    drawables(f): Drawable[] {
      const t = f.t
      pineSprites ??= [16, 20].map((h) =>
        prerender(18, h + 3, (p) => {
          p.ellipse(9, h, 6, 1, SNOW.deep)
          drawPine(p, 9, h, h - 1)
        }),
      )
      const ps = pineSprites
      return [
        { y: house.y + 30, draw: (p) => drawCabin(p, t) },
        { y: 114, draw: drawWoodpile },
        { y: 113, draw: drawSnowman },
        { y: 112, draw: drawPhotoBoard },
        { y: 118, draw: (p) => drawCamera(p, t) },
        { y: 68, draw: (p) => drawIceHeart(p, t) },
        { y: 101, draw: (p) => drawLights(p, t) },
        { y: 138, draw: (p) => drawGate(p, t) },
        { y: 306, draw: drawSled },
        { y: 319, draw: drawBench },
        { y: dogPos(t).y, draw: (p) => drawDog(p, t) },
        ...lamps.map(([x, y]) => ({ y, draw: (p: Painter) => drawLamp(p, x, y, t) })),
        ...pines.map(([x, y, s]) => {
          const h = s ? 20 : 16
          return { y, draw: (p: Painter) => p.ctx.drawImage(ps[s]!, x - 9, y - h) }
        }),
      ]
    },
    // 내리는 눈: 시간만으로 위치를 정해 프레임을 건너뛰어도 같은 자리에 온다
    drawAir(p, f) {
      const { x: cx, y: cy } = f.camera
      for (const s of flakes) {
        const y = (((s.y + f.t * s.speed) % H) + H) % H
        const x = (((s.x + Math.sin(f.t * 0.7 + s.sway) * 4) % W) + W) % W
        if (x < cx - 2 || x > cx + f.view.w + 2 || y < cy - 2 || y > cy + f.view.h + 2) continue
        p.px(x, y, '#ffffff')
        if (s.big) p.px(x + 1, y, '#ffffff')
      }
    },
    guest,
  }
}
