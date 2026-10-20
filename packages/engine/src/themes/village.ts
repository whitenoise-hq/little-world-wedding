import { OUTLINE as K } from '../constants'
import { bayer, prerender, type Painter } from '../painter'
import { createRng, hashString } from '../random'
import type { Drawable, Frame, GuestVisual, Place, PlaceId, Point, Theme } from '../theme'

// 마을 테마: 숲으로 둘러싸인 마을, 아래로 해변과 바다. 방명록은 낚시터, 글 하나 = 물고기 한 마리.
// 원본 시안은 docs/mockup/village.html, 색은 docs/ART_GUIDE.md 5장.

const W = 200
const H = 340
const TREE = ['#1f4a2a', '#2f6d3a', '#4a9a48', '#6ac05a', '#9ae07a']
const FLOWERS = ['#f29bb5', '#f6c85f', '#ffffff', '#d04a3a', '#b48cf0']
const SEA = ['#1e4e86', '#2a6aa0', '#3a8cc0', '#4fb0d0', '#7fd0e0']

// 해안선: 이 줄 아래가 바다
const SHORE = Array.from({ length: W }, (_, x) => Math.round(204 + Math.sin(x * 0.07) * 3 + Math.sin(x * 0.19 + 1) * 1.5))
const shoreAt = (x: number) => SHORE[Math.max(0, Math.min(W - 1, Math.round(x)))]!

const places: Record<PlaceId, Place> = {
  home: { id: 'home', label: '집', x: 55, y: 120 },
  photo: { id: 'photo', label: '정원', x: 140, y: 120 },
  guestbook: { id: 'guestbook', label: '낚시터', x: 100, y: 254 },
}
const PIER_GATE: Point = { x: 100, y: 186 }

const house = { x: 36, y: 86 }
const gazebo = { x: 122, y: 84 }
const trees: [number, number, 0 | 1][] = [
  [22, 100, 0],
  [184, 128, 1],
  [26, 150, 1],
  [176, 170, 0],
  [42, 184, 0],
  [158, 188, 1],
]
const lamps: [number, number][] = [
  [78, 146],
  [122, 146],
  [108, 184],
]
const obstacles = [
  { x: 88, y: 135, w: 5, h: 4 },
  { x: 107, y: 135, w: 5, h: 4 },
  { x: 35, y: 80, w: 39, h: 35 },
  { x: 121, y: 82, w: 39, h: 33 },
  { x: 87, y: 61, w: 26, h: 10 },
  { x: 77, y: 113, w: 6, h: 5 },
  { x: 164, y: 112, w: 12, h: 7 },
  { x: 82, y: 193, w: 5, h: 5 },
  { x: 84, y: 245, w: 7, h: 7 },
  { x: 109, y: 253, w: 7, h: 5 },
  ...lamps.map(([x, y]) => ({ x: x - 1, y: y - 3, w: 3, h: 3 })),
  ...trees.map(([x, y]) => ({ x: x - 3, y: y - 3, w: 6, h: 4 })),
]

const onPier = (x: number, y: number) => (x > 95 && x < 105 && y > 186 && y < 246) || (x > 85 && x < 115 && y >= 244 && y < 263)

// 스프라이트 (docs/ART_GUIDE.md 4장)
const FISH = ['....kkkk.', 'kk.kcccwk', 'ktkccckck', 'kk.kddddk', '....kkkk.']
const FISH_COLORS: [string, string][] = [
  ['#f08a3a', '#c05a2a'],
  ['#f6c85f', '#c89a30'],
  ['#f29bb5', '#c86a8a'],
  ['#8ad0f0', '#4a90c0'],
  ['#b48cf0', '#7a5ac0'],
  ['#f4efe6', '#c9c6c0'],
]
const HEART_BIG = ['.kk.kk.', 'kppkppk', 'kpwpppk', 'kpppppk', '.kpppk.', '..kpk..', '...k...']
const DOG = ['......kk..', '.k...kwwk.', 'kwkkkkwkwk', '.kwwwwwwk.', '.kwwwwwk..']
const DOG_LEGS = ['.k.k.k.k..', '..k.k.k.k.', '.kk..kk...']
const TURTLE = ['....kkkkk......', '..kkhgGggkk.kk.', '.kggGgggGggksek', 'kGggGgggGggsssk', 'krrrrrrrrrrkkk.']
const TURTLE_LEGS = [
  ['.kssk...kssk...', '.kkkk...kkkk...'],
  ['..kssk...kssk..', '..kkkk...kkkk..'],
]
const TURTLE_COLORS = { k: K, g: '#4a9a48', G: '#2f6d3a', h: '#8ad87a', r: '#d8b070', s: '#9ad070', e: K }
const DOG_COLORS = { k: K, w: '#ffffff' }

interface Fish {
  hx: number
  hy: number
  phase: number
  speed: number
  range: number
  colors: [string, string]
}

export function createVillageTheme(): Theme {
  let treeSprites: HTMLCanvasElement[] | null = null
  let dogAngle = 0
  const splashes: { x: number; y: number; t0: number }[] = []
  const rng = createRng(33)
  const sparkles = Array.from({ length: 40 }, () => {
    const x = (rng() * W) | 0
    return { x, y: shoreAt(x) + 8 + ((rng() * (H - shoreAt(x) - 10)) | 0), p: rng() * 6 }
  })

  const heart = (p: Painter, x: number, y: number) => {
    p.px(x - 1, y, '#f29bb5')
    p.px(x + 1, y, '#f29bb5')
    p.rect(x - 1, y + 1, 3, 1, '#f29bb5')
    p.px(x, y + 2, '#f29bb5')
  }

  const drawFish = (p: Painter, x: number, y: number, right: boolean, colors: [string, string], shadow: boolean) => {
    const pal = shadow ? { k: '#1a3e6a', c: '#1a3e6a', d: '#1a3e6a', t: '#1a3e6a', w: '#1a3e6a' } : { k: K, c: colors[0], d: colors[1], t: colors[1], w: '#ffffff' }
    p.sprite(FISH, pal, Math.round(x) - 4, Math.round(y) - 2, !right)
  }

  const fishPos = (o: Fish, t: number) => {
    const a = t * o.speed + o.phase
    return { x: o.hx + Math.sin(a) * o.range, y: o.hy + Math.sin(a * 2) * 1.5, right: Math.cos(a) > 0 }
  }

  const guest: GuestVisual<Fish> = {
    create(entry) {
      const h = hashString(entry.id + entry.name)
      return {
        hx: 30 + (h % 140),
        hy: 228 + ((h >>> 9) % 96),
        phase: (h % 100) / 16,
        speed: 0.35 + ((h >>> 4) % 10) / 25,
        range: 6 + ((h >>> 12) % 10),
        colors: FISH_COLORS[(h >>> 16) % FISH_COLORS.length]!,
      }
    },
    position: (o, t) => fishPos(o, t),
    hitRadius: 7,
    draw(p, o, f, highlight) {
      const pos = fishPos(o, f.t)
      // 멀리서는 그림자, 해변·부두에 가까이 가면 색이 보인다
      const visible = f.player.y > 184 || f.focusingGuests || highlight
      drawFish(p, pos.x, pos.y, pos.right, o.colors, !visible)
      if (highlight && Math.floor(f.t * 3) % 2) heart(p, pos.x, pos.y - 7)
    },
    spawn: {
      from: { x: 132, y: 258 },
      duration: 1.3,
      draw(p, o, k, f) {
        const from = this.from
        const to = fishPos(o, f.t)
        const right = to.x > from.x
        const x = from.x + (to.x - from.x) * k
        const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 30
        drawFish(p, x, y, right, o.colors, false)
        p.px(x + (right ? -6 : 6), y + 2 + (Math.floor(f.t * 20) % 2), '#d8f4fa')
        if (k < 0.05 && !splashes.some((s) => f.t - s.t0 < 0.1)) splashes.push({ x: from.x, y: from.y, t0: f.t })
      },
      landed(o, f) {
        const pos = fishPos(o, f.t)
        splashes.push({ x: pos.x, y: pos.y, t0: f.t })
      },
    },
    focus: (o) => ({ x: o.hx, y: H }),
  }

  // ── 배경 (한 번만) ───────────────────────────
  function drawBackground(p: Painter) {
    const r = createRng(33)
    p.rect(0, 0, W, H, '#6ab04c')
    for (let i = 0; i < 500; i++) p.px((r() * W) | 0, (r() * H) | 0, r() < 0.5 ? '#5a9a40' : '#80c860')
    for (let i = 0; i < 40; i++) {
      const x = (r() * W) | 0
      const y = (50 + r() * 140) | 0
      p.px(x, y, '#4a8a3a')
      p.px(x + 1, y - 1, '#4a8a3a')
      p.px(x + 2, y, '#4a8a3a')
    }
    for (let i = 0; i < 60; i++) p.px((14 + r() * 172) | 0, (50 + r() * 136) | 0, FLOWERS[i % 5]!)

    // 모래와 바다
    for (let x = 0; x < W; x++) {
      const s = SHORE[x]!
      for (let y = s - 14; y < H; y++) {
        const bt = bayer(x, y)
        if (y < s - 11) {
          if (bt < (y - (s - 14)) / 3) p.px(x, y, '#f0d8a0')
        } else if (y < s - 1) p.px(x, y, bt < 0.12 ? '#e0c488' : '#f0d8a0')
        else if (y < s + 1) p.px(x, y, '#d8bc80')
        else {
          const d = (y - s) / (H - s)
          const l = 1 - d * 1.15 + (bt - 0.5) * 0.22
          p.px(x, y, SEA[l > 0.86 ? 4 : l > 0.62 ? 3 : l > 0.38 ? 2 : l > 0.14 ? 1 : 0]!)
        }
      }
    }
    for (let i = 0; i < 14; i++) {
      const x = (14 + r() * 172) | 0
      p.px(x, shoreAt(x) - 4 - ((r() * 6) | 0), r() < 0.5 ? '#f29bb5' : '#ffffff')
    }

    // 둘레 숲
    p.rect(0, 0, W, 30, '#1f4a2a')
    for (let x = -6; x < W + 10; x += 12) p.sphere(x + ((r() * 4) | 0), 10 + ((r() * 4) | 0), 9, TREE)
    for (let x = 0; x < W + 10; x += 13) p.sphere(x + ((r() * 4) | 0), 29 + ((r() * 4) | 0), 8, TREE)
    for (let y = 48; y < 186; y += 14) {
      p.sphere(2 + ((r() * 3) | 0), y, 7, TREE)
      p.sphere(198 - ((r() * 3) | 0), y, 7, TREE)
    }

    // 흙길과 광장
    const paths = [
      [100, 150, 55, 118],
      [100, 150, 140, 118],
      [100, 150, 100, 194],
    ] as const
    const walk = (w: number, c: string) =>
      paths.forEach(([a, b, x1, y1]) => {
        const n = Math.hypot(x1 - a, y1 - b) | 0
        for (let i = 0; i <= n; i++) {
          const k = i / n
          p.rect(a + (x1 - a) * k - w, b + (y1 - b) * k - w + 1, w * 2 + 1, w * 2 - 1, c)
        }
      })
    walk(3, '#b8945a')
    p.ellipse(100, 150, 11, 6, '#b8945a')
    walk(2, '#e0c088')
    p.ellipse(100, 150, 10, 5, '#e0c088')
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      p.px(100 + Math.cos(a) * 7, 150 + Math.sin(a) * 3, '#c8a870')
    }

    // 화단
    for (const [x, y, w] of [
      [38, 118, 9],
      [62, 118, 9],
      [123, 116, 8],
      [150, 116, 8],
    ] as const) {
      p.rect(x - 1, y - 1, w + 2, 5, K)
      p.rect(x, y, w, 3, '#7a4a2a')
      for (let i = 0; i < w; i += 2) {
        p.px(x + i, y, '#3a7a3a')
        p.px(x + i + 1, y + 1, '#3a7a3a')
        p.px(x + i, y - 1, FLOWERS[(r() * 5) | 0]!)
        p.px(x + i + 1, y, FLOWERS[(r() * 5) | 0]!)
      }
    }

    // 버진로드
    p.rect(95, 72, 11, 68, '#d8ccb8')
    p.rect(96, 72, 9, 68, '#f4efe6')
  }

  // ── 움직이는 물체 ───────────────────────────
  const drawHouse = (p: Painter, t: number) => {
    const { x, y } = house
    p.rect(x, y + 29, 38, 2, '#4a8a3a')
    p.rect(x + 25, y - 6, 6, 10, K)
    p.rect(x + 26, y - 5, 4, 9, '#a05a4a')
    p.px(x + 27, y - 3, '#7a3a30')
    p.px(x + 28, y, '#7a3a30')
    p.rect(x - 1, y, 38, 16, K)
    p.rect(x, y + 1, 36, 14, '#c8503c')
    p.rect(x, y + 1, 36, 1, '#e88a6a')
    for (let r = 4; r < 14; r += 3) {
      p.rect(x, y + r, 36, 1, '#a03a30')
      for (let i = (r % 2) * 3; i < 36; i += 6) p.px(x + i, y + r - 1, '#e07a5a')
    }
    p.rect(x, y + 14, 36, 1, '#7a2a28')
    p.rect(x + 1, y + 16, 34, 13, K)
    p.rect(x + 2, y + 16, 32, 12, '#f4e4c4')
    p.rect(x + 2, y + 16, 32, 1, '#d8c4a0')
    p.rect(x + 2, y + 25, 32, 3, '#c9b08a')
    for (const a of [x + 5, x + 25]) {
      p.rect(a, y + 18, 7, 6, K)
      p.rect(a + 1, y + 19, 5, 4, '#f6c85f')
      p.rect(a + 3, y + 19, 1, 4, '#c89a30')
      p.rect(a + 1, y + 21, 5, 1, '#c89a30')
      p.px(a + 1, y + 19, '#fff1b8')
      p.rect(a, y + 24, 7, 2, '#8a5a3a')
      p.px(a + 1, y + 23, '#f29bb5')
      p.px(a + 3, y + 23, '#d04a3a')
      p.px(a + 5, y + 23, '#f29bb5')
    }
    p.rect(x + 15, y + 18, 8, 11, K)
    p.rect(x + 16, y + 19, 6, 10, '#8a5a3a')
    p.rect(x + 16, y + 19, 6, 1, '#a8784a')
    p.px(x + 21, y + 24, '#f6c85f')
    heart(p, x + 19, y + 21)
    p.rect(x + 14, y + 29, 10, 2, '#c9c6c0')
    // 굴뚝 연기
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.35 + i / 3) % 1
      p.withAlpha(1 - k, () =>
        p.ellipse(x + 28 + Math.sin(k * 5 + i) * 2 + k * 3, y - 9 - k * 16, 1 + Math.round(k * 2), 1 + Math.round(k * 1.5), '#f4efe6'),
      )
    }
  }

  const drawGazebo = (p: Painter) => {
    const { x, y } = gazebo
    const c = x + 18
    const b = y + 26
    p.ellipse(c, b + 2, 19, 4, '#4a8a3a')
    p.ellipse(c, b, 18, 5, K)
    p.ellipse(c, b, 17, 4, '#e0c088')
    p.rect(c - 14, b - 1, 29, 1, '#b8945a')
    p.rect(c - 11, b + 2, 23, 1, '#b8945a')
    for (const a of [c - 15, c + 14]) {
      p.rect(a - 1, y + 14, 4, b - y - 13, K)
      p.rect(a, y + 14, 2, b - y - 14, '#f4efe6')
    }
    for (let i = -12; i <= 12; i++) p.px(c + i, y + 17 + Math.round((1 - (i / 12) ** 2) * 2), '#6d6a7a')
    for (const [a, col] of [
      [-8, '#9fc8a0'],
      [-2, '#ecbcbc'],
      [4, '#b8c8e6'],
      [9, '#e6d4a2'],
    ] as const) {
      const yy = y + 18 + Math.round((1 - (a / 12) ** 2) * 2)
      p.rect(c + a - 2, yy, 5, 6, K)
      p.rect(c + a - 1, yy + 1, 3, 4, '#ffffff')
      p.rect(c + a - 1, yy + 1, 3, 2, col)
    }
    for (let j = 0; j < 16; j++) {
      const hw = Math.round(2 + j * 1.1)
      for (let i = -hw; i <= hw; i++) {
        let col = K
        if (j && j < 15 && i > -hw && i < hw) {
          const stripe = Math.floor(((i + hw) * 8) / (hw * 2 + 1)) % 2
          const shade = i > hw * 0.4
          col = stripe ? (shade ? '#e2d6c8' : '#fbf3e4') : shade ? '#d87a98' : '#f29bb5'
        }
        p.px(c + i, y + j, col)
      }
    }
    for (let i = -18; i <= 18; i++) {
      p.px(c + i, y + 16, ((i + 40) >> 1) % 2 ? '#f29bb5' : '#fbf3e4')
      if ((i + 40) % 4) p.px(c + i, y + 17, K)
    }
    p.rect(c - 1, y - 3, 2, 3, K)
    p.px(c - 1, y - 2, '#f6c85f')
    p.px(c, y - 2, '#f6c85f')
  }

  const drawFountain = (p: Painter, t: number) => {
    const x = 100
    const y = 66
    p.ellipse(x, y + 3, 13, 3, '#4a8a3a')
    p.ellipse(x, y, 12, 5, K)
    p.ellipse(x, y, 11, 4, '#c9c6c0')
    p.ellipse(x, y - 1, 11, 3, '#e0ddd6')
    p.ellipse(x, y, 9, 2, K)
    p.ellipse(x, y, 8, 2, '#4fb0d0')
    const rp = (t * 0.8) % 1
    for (let a = 0; a < Math.PI * 2; a += 0.5) p.px(x + Math.cos(a) * (2 + rp * 6), y + Math.sin(a) * (1 + rp * 1.2), '#bfe8f8')
    p.rect(x - 1, y - 8, 3, 8, K)
    p.rect(x, y - 7, 1, 7, '#e0ddd6')
    p.ellipse(x, y - 8, 4, 1, K)
    p.rect(x - 3, y - 9, 7, 1, '#c9c6c0')
    for (let i = 0; i < 6; i++) {
      const k = (t * 1.4 + i / 6) % 1
      const s = i % 2 ? 1 : -1
      p.px(x + s * (1 + k * 6), y - 11 - Math.sin(k * Math.PI) * 3 + k * 9, k < 0.8 ? '#bfe8f8' : '#ffffff')
    }
    p.px(x, y - 11, '#ffffff')
    p.px(x, y - 12 - (Math.floor(t * 6) % 2), '#d8f4fa')
  }

  // 웨딩 입구: 시작 위치 바로 뒤의 꽃 아치
  const drawGate = (p: Painter) => {
    const x = 100
    const y = 138
    p.ellipse(x, y + 1, 13, 2, '#4a8a3a')
    for (const a of [x - 10, x + 9]) {
      p.rect(a - 2, y - 2, 6, 3, K)
      p.rect(a - 1, y - 2, 4, 2, '#c9c6c0')
      p.rect(a - 1, y - 19, 4, 18, K)
      p.rect(a, y - 18, 2, 17, '#f4efe6')
      p.rect(a, y - 18, 1, 17, '#ffffff')
    }
    const arc = (fn: (ax: number, ay: number) => void) => {
      for (let a = -0.15; a <= 3.3; a += 0.14) fn(x + Math.cos(a) * 10, y - 19 - Math.sin(a) * 7)
    }
    arc((ax, ay) => p.rect(ax - 2, ay - 2, 5, 5, K))
    arc((ax, ay) => {
      p.rect(ax - 1, ay - 1, 3, 3, '#3a7a3a')
      p.px(ax, ay - 1, '#5aa04a')
    })
    let i = 0
    for (let a = 0; a <= 3.15; a += 0.26, i++) {
      const ax = x + Math.cos(a) * 10
      const ay = y - 19 - Math.sin(a) * 7
      const c = ['#ffffff', '#f29bb5', '#ffd0dc'][i % 3]!
      p.px(ax, ay, c)
      p.px(ax + 1, ay, c)
    }
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 1; k += 0.08) {
        const fx = x + s * (6 + 5 * k * k)
        const fy = y - 22 + k * 13
        p.rect(fx - 1, fy, 2, 1, '#ffffff')
        p.px(fx + s, fy, '#d8ccb8')
      }
      p.px(x + s * 11, y - 9, '#f29bb5')
      p.px(x + s * 12, y - 10, '#f29bb5')
      p.px(x + s * 12, y - 8, '#f29bb5')
    }
    p.sprite(HEART_BIG, { k: K, p: '#f29bb5', w: '#ffffff' }, x - 3, y - 32)
  }

  const dogPos = () => ({ x: Math.round(100 + Math.cos(dogAngle) * 26), y: Math.round(70 + Math.sin(dogAngle) * 11) })
  const drawDog = (p: Painter, t: number) => {
    const run = t % 11 < 8
    const { x, y } = dogPos()
    const right = -Math.sin(dogAngle) > 0
    const fr = Math.floor(t * 10) % 2
    const lift = run && fr ? 1 : 0
    p.ellipse(x, y, 4, 1, 'rgba(20,40,20,.28)')
    const rows = [...DOG, DOG_LEGS[run ? fr : 2]!]
    if (!run) {
      // 앉아서 꼬리를 흔든다
      const wag = ['.k.', 'kwk', '.kk']
      for (let j = 0; j < 3; j++) rows[j] = [...rows[j]!].map((c, i) => (i < 3 ? wag[j]![(i + Math.floor(t * 6)) % 3]! : c)).join('')
    }
    p.sprite(rows, DOG_COLORS, x - 5, y - 6 - lift, !right)
  }

  const drawTurtle = (p: Painter, t: number) => {
    const a = t * 0.12
    const x = Math.round(150 + Math.sin(a) * 18)
    const y = 197
    p.ellipse(x, y, 7, 1, 'rgba(90,70,30,.25)')
    p.sprite([...TURTLE, ...TURTLE_LEGS[Math.floor(t * 2) % 2]!], TURTLE_COLORS, x - 7, y - 7, Math.cos(a) <= 0)
  }

  const drawLamp = (p: Painter, x: number, y: number, t: number) => {
    p.rect(x, y - 8, 1, 8, '#6d6a7a')
    p.rect(x - 1, y - 10, 3, 2, K)
    p.px(x, y - 9, Math.sin(t * 9 + x) > -0.8 ? '#fff1b8' : '#c8a040')
    p.px(x - 1, y, '#4a8a3a')
    p.px(x + 1, y, '#4a8a3a')
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
        p.px(x, y + 1, on ? ['#f29bb5', '#f6c85f', '#7af0c8', '#b48cf0'][i % 4]! : '#4a4458')
      }
    }
  }

  const drawMailbox = (p: Painter) => {
    const x = 80
    const y = 117
    p.rect(x, y - 6, 2, 6, '#7a4a2a')
    p.rect(x - 3, y - 11, 8, 6, K)
    p.rect(x - 2, y - 10, 6, 4, '#d04a3a')
    p.rect(x - 2, y - 10, 6, 1, '#f08a6a')
    p.rect(x + 5, y - 13, 1, 5, K)
    p.rect(x + 6, y - 13, 2, 2, '#f6c85f')
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
    if (t % 6 < 0.12) for (let a = 0; a < Math.PI * 2; a += 0.785) p.px(x + Math.cos(a) * 6, y - 11 + Math.sin(a) * 5, '#ffffff')
  }

  const drawSign = (p: Painter) => {
    const x = 84
    const y = 197
    p.rect(x, y - 6, 2, 6, '#7a4a2a')
    p.rect(x - 6, y - 12, 14, 7, K)
    p.rect(x - 5, y - 11, 12, 5, '#c8925a')
    p.rect(x - 5, y - 11, 12, 1, '#e0aa70')
    p.rect(x - 2, y - 9, 5, 2, '#1e4660')
    p.px(x + 3, y - 9, '#1e4660')
    p.px(x - 3, y - 10, '#1e4660')
    p.px(x - 3, y - 7, '#1e4660')
  }

  const drawBoat = (p: Painter, t: number) => {
    const b = Math.sin(t * 1.6) > 0 ? 1 : 0
    const x = 68
    const y = 226 + b
    p.line(79, y - 1, 90, 221, '#c8b088')
    p.ellipse(x, y, 11, 4, K)
    p.ellipse(x, y, 10, 3, '#8a5a32')
    p.ellipse(x, y - 1, 8, 2, '#c8925a')
    p.rect(x - 1, y - 3, 3, 5, '#8a5a32')
    p.line(x - 5, y - 2, x - 13, y - 6, '#7a4a2a')
    p.line(x + 3, y + 1, x + 10, y + 6, '#7a4a2a')
    if (b) p.px(x - 12, y + 3, '#d8f4fa')
  }

  const drawPier = (p: Painter, t: number) => {
    const b = Math.sin(t * 2.4) > 0 ? 1 : 0
    p.rect(109, 206, 3, 38, 'rgba(10,30,60,.25)')
    p.rect(119, 247, 3, 18, 'rgba(10,30,60,.25)')
    p.rect(84, 265, 36, 2, 'rgba(10,30,60,.25)')
    for (const [x, y] of [
      [89, 216],
      [89, 234],
      [109, 216],
      [109, 234],
      [84, 265],
      [115, 265],
    ] as const) {
      p.rect(x, y, 3, 3, K)
      p.px(x + 1, y, '#5a3a22')
      if ((Math.floor(t * 1.5) + x) % 2) p.px(x - 1, y + 3, '#d8f4fa')
    }
    p.rect(91, 190, 18, 56, K)
    for (let y = 191; y < 246; y += 3) {
      p.rect(92, y, 16, 2, '#c8925a')
      p.rect(92, y + 2, 16, 1, '#8a5a32')
    }
    p.rect(81, 243, 38, 22, K)
    for (let y = 244; y < 264; y += 3) {
      p.rect(82, y, 36, 2, '#c8925a')
      p.rect(82, y + 2, 36, 1, '#8a5a32')
    }
    for (let y = 245; y < 264; y += 6) {
      p.px(83, y, '#5a3a22')
      p.px(116, y, '#5a3a22')
    }
    // 양동이와 낚싯대
    p.rect(84, 245, 7, 7, K)
    p.rect(85, 246, 5, 5, '#8a8794')
    p.rect(85, 246, 5, 1, '#4fb0d0')
    p.px(87, 244, '#f08a3a')
    p.px(88, 243, '#f08a3a')
    p.px(86, 243, '#f08a3a')
    p.rect(109, 253, 7, 5, K)
    p.rect(110, 254, 5, 3, '#7a4a2a')
    p.line(112, 254, 130, 238, '#7a4a2a')
    p.line(127, 241, 130, 238, '#c9c6c0')
    const by = 258 + b
    p.line(130, 238, 132, by - 1, '#e8f0f8')
    p.px(132, by - 1, '#ffffff')
    p.px(132, by, '#d04a3a')
    if (b) {
      p.px(130, by + 1, '#d8f4fa')
      p.px(134, by + 1, '#d8f4fa')
    }
  }

  const drawLighthouse = (p: Painter, t: number) => {
    const x = 178
    const y = 304
    const on = Math.floor(t * 1.5) % 2
    p.ellipse(x, y + 2, 10, 4, K)
    p.ellipse(x, y + 1, 9, 3, '#8a8794')
    p.ellipse(x - 1, y, 5, 2, '#a9a6b2')
    if (Math.floor(t * 2) % 2) p.px(x - 10, y + 4, '#ffffff')
    p.rect(x - 4, y - 16, 8, 16, K)
    p.rect(x - 3, y - 15, 6, 15, '#f4efe6')
    p.rect(x - 3, y - 12, 6, 2, '#d04a3a')
    p.rect(x - 3, y - 7, 6, 2, '#d04a3a')
    p.rect(x - 3, y - 15, 1, 15, '#ffffff')
    p.rect(x - 4, y - 21, 8, 5, K)
    p.rect(x - 3, y - 20, 6, 3, on ? '#fff1b8' : '#c8a040')
    p.rect(x - 3, y - 23, 6, 2, '#d04a3a')
    p.px(x, y - 24, K)
    if (on) {
      p.px(x - 5, y - 19, '#fff1b8')
      p.px(x + 4, y - 19, '#fff1b8')
    }
  }

  const BUTTERFLIES: [number, number, string, number][] = [
    [136, 130, '#f6c85f', 0],
    [52, 134, '#f29bb5', 2],
    [30, 118, '#ffffff', 4],
  ]

  return {
    id: 'village',
    world: { w: W, h: H },
    start: { x: 100, y: 160 },
    places,
    playerShadow: 'rgba(20,40,20,.28)',
    blocked: (x, y) =>
      x < 12 || x > 188 || y < 46 || (y > shoreAt(x) - 3 && !onPier(x, y)) || obstacles.some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h),
    // 바다와 육지는 부두 입구로만 이어지므로 경유지를 거친다
    route: (from, to) => ((to === 'guestbook') !== from.y > 200 ? [PIER_GATE, places[to]] : [places[to]]),
    drawBackground,
    drawUnder(p, f) {
      for (const s of sparkles) {
        const v = Math.sin(f.t * 1.4 + s.p)
        if (v > 0.75) {
          p.px(s.x, s.y, '#e8f8ff')
          if (v > 0.96) {
            p.px(s.x - 1, s.y, '#bfe8f8')
            p.px(s.x + 1, s.y, '#bfe8f8')
          }
        }
      }
      const o = Math.round((Math.sin(f.t * 1.3) + 1) * 1.2)
      for (let x = Math.max(0, f.camera.x - 1); x < Math.min(W, f.camera.x + f.view.w + 1); x++) {
        const s = SHORE[x]!
        if (Math.sin(x * 0.5 + f.t * 2) > -0.3) p.px(x, s + o, '#ffffff')
        if (Math.sin(x * 0.23 - f.t * 1.5) > 0.4) p.px(x, s + o + 2, '#bfe8f8')
      }
    },
    drawOver(p, f) {
      drawBoat(p, f.t)
      drawPier(p, f.t)
      drawLighthouse(p, f.t)
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]!
        const k = (f.t - s.t0) / 0.8
        if (k > 1) {
          splashes.splice(i, 1)
          continue
        }
        const r = 2 + k * 8
        for (let a = 0; a < Math.PI * 2; a += 0.35) p.px(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 0.45, k < 0.5 ? '#ffffff' : '#bfe8f8')
        if (k < 0.5) for (let j = 0; j < 4; j++) p.px(s.x + (j - 1.5) * 6 * k, s.y - Math.sin(k * Math.PI * 2) * 6 - (j % 2), '#ffffff')
      }
    },
    drawables(f): Drawable[] {
      const t = f.t
      if (t % 11 < 8) dogAngle += f.dt * 1.1
      treeSprites ??= [false, true].map((blossom) =>
        prerender(22, 26, (p) => {
          p.ellipse(11, 23, 8, 2, '#4a8a3a')
          p.rect(9, 15, 4, 9, K)
          p.rect(10, 15, 2, 8, '#7a4a2a')
          p.sphere(11, 9, 8, TREE)
          if (blossom)
            for (const [a, b] of [
              [7, 6],
              [13, 4],
              [15, 10],
              [9, 12],
              [5, 9],
            ] as const) {
              p.px(a, b, '#f29bb5')
              p.px(a + 1, b, '#ffd0dc')
            }
        }),
      )
      const ts = treeSprites
      return [
        { y: house.y + 29, draw: (p) => drawHouse(p, t) },
        { y: gazebo.y + 30, draw: drawGazebo },
        { y: 70, draw: (p) => drawFountain(p, t) },
        { y: 196, draw: (p) => drawTurtle(p, t) },
        { y: 117, draw: drawMailbox },
        { y: 118, draw: (p) => drawCamera(p, t) },
        { y: 197, draw: drawSign },
        { y: 101, draw: (p) => drawLights(p, t) },
        { y: 138, draw: drawGate },
        { y: dogPos().y, draw: (p) => drawDog(p, t) },
        ...lamps.map(([x, y]) => ({ y, draw: (p: Painter) => drawLamp(p, x, y, t) })),
        ...trees.map(([x, y, b]) => ({ y, draw: (p: Painter) => p.ctx.drawImage(ts[b]!, x - 11, y - 23) })),
      ]
    },
    drawAir(p, f) {
      const t = f.t
      for (const [hx, hy, c, ph] of BUTTERFLIES) {
        const x = hx + Math.sin(t * 0.7 + ph) * 12
        const y = hy + Math.sin(t * 1.9 + ph) * 4 - Math.abs(Math.sin(t * 3 + ph)) * 3
        p.px(x, y, K)
        if (Math.floor(t * 8 + ph) % 2) {
          p.px(x - 1, y - 1, c)
          p.px(x + 1, y - 1, c)
        }
        p.px(x - 1, y, c)
        p.px(x + 1, y, c)
      }
      const T = (t % 14) / 14
      if (T <= 0.6) {
        const k = T / 0.6
        ;[
          [0, 0],
          [-11, 5],
          [-6, -4],
        ].forEach(([dx, dy], i) => {
          const x = W + 10 - k * (W + 40) + dx!
          const y = 176 + dy! + Math.sin(t * 1.5 + i) * 2
          const up = (Math.floor(t * 5) + i) % 2
          p.px(x, y, '#ffffff')
          p.px(x + 1, y, '#8a8794')
          const wy = up ? -1 : 0
          p.px(x - 1, y + wy, '#ffffff')
          p.px(x - 2, y + wy * 2 + (up ? 0 : 1), K)
          p.px(x + 2, y + wy, '#ffffff')
          p.px(x + 3, y + wy * 2 + (up ? 0 : 1), K)
        })
      }
    },
    guest,
  }
}
