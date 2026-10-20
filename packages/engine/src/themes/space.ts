import { OUTLINE as K } from '../constants'
import { bayer, type Painter } from '../painter'
import { createRng, hashString } from '../random'
import type { Drawable, GuestVisual, Place, PlaceId, Point, Theme } from '../theme'

// 우주 테마: 마션풍 붉은 행성, 아래로 우주. 방명록은 망원경, 글 하나 = 별 하나.
// 원본 시안은 docs/mockup/index.html, 색은 docs/ART_GUIDE.md 5장.

const W = 200
const H = 340
const CX = 100
const CY = 140
const PR = 80 // 행성 반지름

const places: Record<PlaceId, Place> = {
  home: { id: 'home', label: '집', x: 69, y: 124 },
  photo: { id: 'photo', label: '온실', x: 132, y: 126 },
  guestbook: { id: 'guestbook', label: '망원경', x: 89, y: 198 },
}

const hab = { x: 52, y: 92 }
const greenhouse = { x: 112, y: 92 }
const scope = { x: 101, y: 184 }
const obstacles = [
  { x: 51, y: 97, w: 36, h: 19 },
  { x: 111, y: 96, w: 42, h: 23 },
  { x: 98, y: 188, w: 17, h: 14 },
  { x: 28, y: 144, w: 19, h: 13 },
  { x: 149, y: 148, w: 13, h: 10 },
  { x: 98, y: 76, w: 4, h: 5 },
  { x: 79, y: 140, w: 3, h: 3 },
  { x: 121, y: 138, w: 3, h: 3 },
  { x: 107, y: 176, w: 3, h: 3 },
  { x: 40, y: 108, w: 6, h: 5 },
  { x: 160, y: 124, w: 6, h: 5 },
  { x: 70, y: 194, w: 6, h: 5 },
  { x: 136, y: 188, w: 6, h: 5 },
]
const lamps: [number, number][] = [
  [80, 142],
  [122, 140],
  [108, 178],
]
const crystals: [number, number][] = [
  [42, 112],
  [162, 128],
  [72, 198],
  [138, 192],
]
const plants: [number, number][] = [
  [40, 170],
  [160, 165],
  [122, 76],
  [64, 82],
]

interface Star {
  x: number
  y: number
  phase: number
}

export function createSpaceTheme(): Theme {
  const rng = createRng(21)
  const twinkles = Array.from({ length: 34 }, () => {
    let x = 0
    let y = 0
    do {
      x = (rng() * W) | 0
      y = (rng() * H) | 0
    } while (Math.hypot(x - CX, y - CY) < PR + 6)
    return { x, y, p: rng() * 6 }
  })
  const shootRng = createRng(7)
  let shooters: { x: number; y: number; t0: number }[] = []
  let trail: [number, number][] = []

  const star = (p: Painter, x: number, y: number, big: boolean, phase: number, t: number) => {
    const on = Math.sin(t * 2.2 + phase) > -0.3
    p.px(x, y, '#fff6c8')
    if (on || big) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) p.px(x + dx, y + dy, '#f6c85f')
    if (big && on) for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]] as const) p.px(x + dx, y + dy, '#8a7a40')
  }

  const guest: GuestVisual<Star> = {
    create(entry) {
      const h = hashString(entry.id + entry.name)
      return { x: 12 + (h % 176), y: 234 + ((h >>> 9) % 96), phase: (h % 100) / 16 }
    },
    position: (o) => ({ x: o.x, y: o.y }),
    hitRadius: 6,
    draw: (p, o, f, highlight) => star(p, o.x, o.y, highlight, o.phase, f.t),
    spawn: {
      from: { x: scope.x + 14, y: scope.y + 9 },
      duration: 1.4,
      draw(p, o, k, f) {
        if (k < 0.02) trail = []
        const e = 1 - (1 - k) ** 3
        const x = this.from.x + (o.x - this.from.x) * e
        const y = this.from.y + (o.y - this.from.y) * e - Math.sin(k * Math.PI) * 24
        trail.push([x | 0, y | 0])
        if (trail.length > 10) trail.shift()
        trail.forEach(([a, b], i) => p.px(a, b, i > 6 ? '#fff1b8' : i > 3 ? '#f6c85f' : '#8a7a40'))
        p.rect(x - 1, y - 1, 2, 2, '#ffffff')
      },
    },
    focus: (o): Point => ({ x: o.x, y: H }),
  }

  function drawBackground(p: Painter) {
    const r = createRng(21)
    p.rect(0, 0, W, H, '#0b0a1e')
    for (let i = 0; i < 130; i++) {
      const x = (r() * W) | 0
      const y = (r() * H) | 0
      if (Math.hypot(x - CX, y - CY) > PR + 5) p.px(x, y, r() < 0.5 ? '#3e3a6e' : '#6b67a8')
    }
    const ring = (front: boolean) => {
      for (let a = 0; a < Math.PI * 2; a += 0.02) {
        const s = Math.sin(a)
        if (s > 0 === front) p.px(176 + Math.cos(a) * 16, 40 + s * 4, '#f6c85f')
      }
    }
    ring(false)
    p.sphere(176, 40, 9, ['#3a2e70', '#5a4a96', '#8676c4', '#b7a8e8', '#e6dcff'])
    ring(true)
    p.sphere(18, 42, 4, ['#1d4a52', '#2f6d74', '#4fa0a0', '#8fd0c8', '#d0f0ea'])
    p.sphere(186, 250, 6, ['#5a3a1a', '#8a5a2a', '#c8904a', '#e8b86a', '#fae0a0'])
    p.sphere(CX, CY, PR, ['#6a2a2e', '#9a3f30', '#c8593c', '#e07a4f', '#f2a06a'], '#2e2456')
    for (let i = 0; i < 220; i++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * (PR - 6)
      p.px((CX + Math.cos(a) * d) | 0, (CY + Math.sin(a) * d) | 0, r() < 0.6 ? '#b24d36' : '#e88a5e')
    }
    for (const [x, y, a, b] of [
      [58, 150, 5, 2],
      [115, 208, 4, 2],
      [48, 190, 4, 2],
      [150, 180, 3, 1],
      [140, 82, 4, 2],
      [76, 176, 3, 1],
    ] as const) {
      p.ellipse(x, y, a, b, '#7a3028')
      p.ellipse(x + 1, y + 1, a - 1, Math.max(1, b - 1), '#b24d36')
    }
    for (const pl of Object.values(places)) {
      const n = (Math.hypot(pl.x - 100, pl.y - 150) / 5) | 0
      for (let i = 1; i < n; i++) {
        const k = i / n
        p.rect(100 + (pl.x - 100) * k, 150 + (pl.y - 150) * k, 2, 1, '#f2a06a')
        p.px(100 + (pl.x - 100) * k, 151 + (pl.y - 150) * k, '#b24d36')
      }
    }
    // 연못
    p.ellipse(128, 166, 8, 3, K)
    p.ellipse(128, 166, 7, 2, '#5ab0d8')
    p.rect(124, 165, 4, 1, '#bfe8f8')
    p.px(131, 167, '#bfe8f8')
    // 전망대 바닥
    p.ellipse(100, 198, 18, 8, K)
    p.ellipse(100, 198, 17, 7, '#5e5b6c')
    p.ellipse(100, 198, 14, 5, '#8a8794')
    for (let x = 88; x <= 112; x += 4)
      for (let y = 194; y <= 202; y++) {
        const dx = (x - 100) / 14
        const dy = (y - 198) / 5
        if (dx * dx + dy * dy < 1) p.px(x, y, '#6d6a7a')
      }
    p.ellipse(100, 198, 4, 1, '#a9a6b2')
  }

  const drawHab = (p: Painter, t: number) => {
    const { x, y } = hab
    p.rect(x + 1, y + 22, 32, 2, '#7a3028')
    p.rect(x + 4, y + 20, 2, 4, '#8a8794')
    p.rect(x + 28, y + 20, 2, 4, '#8a8794')
    p.rect(x + 3, y + 23, 4, 1, K)
    p.rect(x + 27, y + 23, 4, 1, K)
    p.rect(x + 4, y - 1, 1, 7, '#8a8794')
    p.px(x + 4, y - 2, Math.sin(t * 5) > 0 ? '#ff6b5b' : '#6a2a2e')
    p.rect(x + 17, y, 13, 5, K)
    p.rect(x + 18, y + 1, 11, 3, '#3a5a9a')
    for (let i = 0; i < 4; i++) p.rect(x + 18 + i * 3, y + 1, 2, 2, '#6f9de0')
    p.px(x + 23, y + 5, K)
    p.rect(x + 1, y + 6, 32, 1, K)
    p.rect(x, y + 7, 1, 14, K)
    p.rect(x + 33, y + 7, 1, 14, K)
    p.rect(x + 1, y + 21, 32, 1, K)
    p.rect(x + 1, y + 7, 32, 14, '#f4efe6')
    p.rect(x + 1, y + 18, 32, 3, '#c9c6c0')
    p.rect(x + 1, y + 7, 32, 1, '#ffffff')
    p.rect(x + 1, y + 10, 32, 1, '#e07a4f')
    for (const a of [4, 24]) {
      p.rect(x + a, y + 11, 6, 5, K)
      p.rect(x + a + 1, y + 12, 4, 3, '#f6c85f')
      p.px(x + a + 1, y + 12, '#fff1b8')
    }
    p.rect(x + 13, y + 11, 8, 11, K)
    p.rect(x + 14, y + 12, 6, 9, '#8a8794')
    p.rect(x + 14, y + 12, 6, 1, '#a9a6b2')
    p.px(x + 18, y + 16, '#f6c85f')
    p.rect(x + 14, y + 8, 6, 2, '#f6c85f')
    p.rect(x + 10, y + 19, 3, 2, '#c8593c')
    p.px(x + 11, y + 18, '#4fa04a')
    p.px(x + 10, y + 17, '#f29bb5')
  }

  const drawGreenhouse = (p: Painter) => {
    const { x, y } = greenhouse
    const c = x + 20
    const b = y + 20
    p.ellipse(c, b + 6, 20, 2, '#7a3028')
    p.halfDisc(c, b, 18, K)
    for (let dy = -17; dy <= 0; dy++) {
      const dx = Math.round(Math.sqrt(289 - dy * dy))
      for (let i = -dx; i <= dx; i++) p.px(c + i, b + dy, -dy / 17 + bayer(c + i, b + dy) * 0.5 > 0.75 ? '#d4f6ef' : '#a8e6dc')
    }
    p.ellipse(c - 9, b - 4, 5, 4, '#2f6d3a')
    p.ellipse(c - 9, b - 5, 4, 3, '#4fa04a')
    p.px(c - 11, b - 7, '#7cc85a')
    p.px(c - 8, b - 8, '#7cc85a')
    p.px(c - 10, b - 4, '#f29bb5')
    p.px(c - 7, b - 6, '#ffffff')
    p.rect(c - 1, b - 14, 1, 12, '#2f6d3a')
    p.px(c - 2, b - 8, '#4fa04a')
    p.px(c, b - 10, '#4fa04a')
    p.rect(c - 2, b - 17, 3, 3, '#f6c85f')
    p.px(c - 1, b - 16, '#7a4a30')
    p.px(c - 3, b - 16, '#f6c85f')
    p.px(c + 1, b - 16, '#f6c85f')
    p.rect(c + 7, b - 11, 2, 10, '#2f6d3a')
    p.px(c + 6, b - 9, '#4fa04a')
    p.px(c + 9, b - 7, '#4fa04a')
    p.px(c + 6, b - 6, '#d04a3a')
    p.px(c + 9, b - 10, '#d04a3a')
    p.px(c + 8, b - 4, '#d04a3a')
    p.rect(c + 11, b - 6, 4, 4, '#4fa04a')
    p.px(c + 12, b - 7, '#f6c85f')
    p.px(c + 14, b - 5, '#f29bb5')
    p.line(c - 5, b - 15, c - 5, b - 11, '#8a8794')
    p.rect(c - 7, b - 11, 4, 2, '#c8593c')
    p.px(c - 7, b - 12, '#4fa04a')
    p.px(c - 4, b - 12, '#4fa04a')
    p.px(c - 8, b - 9, '#4fa04a')
    p.rect(c - 15, b - 3, 30, 3, '#9a6a3a')
    p.rect(c - 15, b - 3, 30, 1, '#c8904a')
    ;[-13, -9, -4, 3, 8, 12].forEach((a, i) => p.px(c + a, b - 4, ['#f29bb5', '#ffffff', '#f6c85f', '#f29bb5', '#ffffff', '#b48cf0'][i]!))
    const F = '#f4efe6'
    p.rect(c, b - 17, 1, 17, F)
    for (const a of [-9, 9]) {
      const h = Math.round(Math.sqrt(289 - a * a))
      p.rect(c + a, b - h, 1, h, F)
    }
    for (const dy of [-12, -6]) {
      const dx = Math.round(Math.sqrt(289 - dy * dy))
      p.rect(c - dx, b + dy, dx * 2 + 1, 1, F)
    }
    p.rect(c - 3, b - 7, 7, 7, F)
    p.rect(c - 2, b - 6, 5, 6, '#6fbfb2')
    p.rect(c - 2, b - 6, 5, 1, '#8fd8cc')
    p.px(c + 1, b - 3, '#f6c85f')
    p.px(c - 13, b - 10, '#ffffff')
    p.px(c - 12, b - 11, '#ffffff')
    p.px(c - 11, b - 12, '#ffffff')
    p.px(c - 14, b - 8, '#ffffff')
    p.rect(c - 1, b - 19, 3, 2, '#f6c85f')
    p.rect(x, b, 40, 6, K)
    p.rect(x + 1, b + 1, 38, 4, '#8a8794')
    p.rect(x + 1, b + 1, 38, 1, '#a9a6b2')
    for (let i = 0; i < 5; i++) p.px(x + 4 + i * 8, b + 3, '#6d6a7a')
    for (let i = 0; i < 4; i++) p.px(x + 8 + i * 8, b + 4, '#6d6a7a')
    for (const [a, d] of [
      [x + 5, b + 5],
      [x + 31, b + 5],
    ] as const) {
      p.rect(a, d, 4, 3, K)
      p.rect(a + 1, d, 2, 2, '#c8593c')
      p.px(a, d - 1, '#4fa04a')
      p.px(a + 3, d - 1, '#4fa04a')
      p.px(a + 1, d - 2, '#f29bb5')
      p.px(a + 2, d - 2, '#f6c85f')
    }
  }

  const drawScope = (p: Painter) => {
    const { x, y } = scope
    p.line(x + 7, y + 9, x + 2, y + 17, K)
    p.line(x + 7, y + 9, x + 12, y + 17, K)
    p.line(x + 7, y + 9, x + 7, y + 18, K)
    for (let o = -2; o <= 2; o++) p.line(x, y + 2 + o, x + 13, y + 9 + o, K)
    for (let o = -1; o <= 1; o++) p.line(x + 1, y + 2 + o, x + 12, y + 9 + o, o === 1 ? '#c9c6c0' : '#f4efe6')
    p.line(x + 3, y + 3, x + 6, y + 5, '#e07a4f')
    p.rect(x + 12, y + 6, 3, 6, K)
    p.rect(x + 13, y + 7, 1, 4, '#f6c85f')
    p.rect(x - 2, y + 1, 2, 3, '#8a8794')
  }

  const drawRover = (p: Painter) => {
    const x = 30
    const y = 146
    p.line(x + 3, y - 1, x + 3, y - 6, '#8a8794')
    p.rect(x + 2, y - 8, 3, 2, K)
    p.px(x + 3, y - 7, '#d04a3a')
    p.rect(x, y, 16, 7, K)
    p.rect(x + 1, y + 1, 14, 5, '#f4efe6')
    p.rect(x + 1, y + 4, 14, 2, '#c9c6c0')
    p.rect(x + 1, y + 2, 14, 1, '#e07a4f')
    p.rect(x + 6, y - 3, 9, 3, K)
    p.rect(x + 7, y - 2, 7, 1, '#3a5a9a')
    for (const a of [x + 1, x + 6, x + 11]) {
      p.rect(a, y + 6, 4, 4, K)
      p.rect(a + 1, y + 7, 2, 2, '#8a8794')
    }
  }

  const drawDish = (p: Painter, t: number) => {
    const x = 150
    const y = 146
    p.rect(x + 4, y + 6, 4, 6, K)
    p.rect(x + 5, y + 6, 2, 5, '#8a8794')
    p.rect(x + 2, y + 11, 8, 2, K)
    p.ellipse(x + 6, y + 4, 6, 3, K)
    p.ellipse(x + 6, y + 4, 5, 2, '#f4efe6')
    p.rect(x + 3, y + 5, 7, 1, '#c9c6c0')
    p.line(x + 6, y + 4, x + 9, y - 1, K)
    p.px(x + 9, y - 2, Math.sin(t * 3) > 0 ? '#7af0c8' : '#2f8f74')
  }

  const drawFlag = (p: Painter, t: number) => {
    const x = 100
    const y = 80
    const w = Math.floor(t * 3) % 2
    p.rect(x, y - 14, 1, 14, '#8a8794')
    p.px(x, y - 15, '#f6c85f')
    p.rect(x + 1, y - 14, 9, 6, K)
    p.rect(x + 1, y - 13, 8 - w, 4, '#f4efe6')
    p.px(x + 4, y - 12, '#f29bb5')
    p.px(x + 6, y - 12, '#f29bb5')
    p.rect(x + 4, y - 11, 3, 1, '#f29bb5')
    p.px(x + 5, y - 10, '#f29bb5')
    p.ellipse(x, y, 2, 1, '#7a3028')
  }

  const drawLamp = (p: Painter, x: number, y: number, t: number) => {
    p.rect(x, y - 8, 1, 8, '#6d6a7a')
    p.rect(x - 1, y - 10, 3, 2, K)
    p.px(x, y - 9, Math.sin(t * 9 + x) > -0.8 ? '#fff1b8' : '#c8a040')
    p.px(x - 1, y, '#7a3028')
    p.px(x + 1, y, '#7a3028')
  }

  const drawCrystal = (p: Painter, x: number, y: number, t: number) => {
    p.rect(x - 1, y - 7, 4, 8, K)
    p.rect(x + 2, y - 5, 3, 6, K)
    p.rect(x - 3, y - 4, 3, 5, K)
    p.rect(x, y - 6, 2, 6, '#b48cf0')
    p.rect(x + 3, y - 4, 1, 4, '#8a5ad6')
    p.rect(x - 2, y - 3, 1, 3, '#7a4ac0')
    p.px(x, y - 6, '#e6d4ff')
    if (Math.sin(t * 2 + x) > 0.9) p.px(x + 1, y - 8, '#ffffff')
  }

  const drawPlant = (p: Painter, x: number, y: number, t: number) => {
    const glow = Math.sin(t * 2.5 + y) > 0
    p.rect(x, y - 7, 1, 7, '#2f8f74')
    p.px(x - 1, y - 3, '#2f8f74')
    p.px(x - 2, y - 4, '#4fc0a0')
    p.px(x + 1, y - 5, '#2f8f74')
    p.px(x + 2, y - 6, '#4fc0a0')
    p.rect(x - 1, y - 10, 3, 3, K)
    p.px(x, y - 9, glow ? '#b0ffe6' : '#5ad0b0')
    p.px(x - 1, y, '#7a3028')
    p.px(x + 1, y, '#7a3028')
  }

  const drawLights = (p: Painter, t: number) => {
    const a = [86, 100]
    const b = [112, 103]
    for (let i = 0; i <= 26; i++) {
      const k = i / 26
      const x = a[0]! + (b[0]! - a[0]!) * k
      const y = a[1]! + (b[1]! - a[1]!) * k + Math.sin(k * Math.PI) * 5
      p.px(x, y, '#4a4458')
      if (i % 3 === 1) {
        const on = (Math.floor(t * 2) + i) % 2
        p.px(x, y + 1, on ? ['#f29bb5', '#f6c85f', '#7af0c8', '#b48cf0'][i % 4]! : '#4a4458')
      }
    }
  }

  return {
    id: 'space',
    world: { w: W, h: H },
    start: { x: 100, y: 156 },
    places,
    playerShadow: '#7a3028',
    blocked: (x, y) => Math.hypot(x - CX, y - CY) > PR - 7 || obstacles.some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h),
    route: (_from, to) => [places[to]],
    drawBackground,
    drawUnder(p, f) {
      const t = f.t
      for (const s of twinkles) {
        const v = Math.sin(t * 1.6 + s.p)
        if (v > 0.3) {
          p.px(s.x, s.y, '#e8e4ff')
          if (v > 0.85) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) p.px(s.x + dx, s.y + dy, '#6b67a8')
        }
      }
      if (shootRng() < 0.012) shooters.push({ x: shootRng() * W, y: shootRng() * 60, t0: t })
      shooters = shooters.filter((s) => {
        const k = (t - s.t0) / 0.7
        if (k > 1) return false
        for (let i = 0; i < 5; i++) p.px(s.x + k * 40 - i * 2, s.y + k * 16 - i * 0.8, i ? '#6b67a8' : '#ffffff')
        return true
      })
    },
    drawOver(p, f) {
      // 전망대 테두리 불빛
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        p.px(100 + Math.cos(a) * 16, 198 + Math.sin(a) * 7, (Math.floor(f.t * 3) + i) % 2 === 0 ? '#f6c85f' : '#6d5a2a')
      }
    },
    drawables(f): Drawable[] {
      const t = f.t
      return [
        { y: hab.y + 22, draw: (p) => drawHab(p, t) },
        { y: greenhouse.y + 26, draw: drawGreenhouse },
        { y: scope.y + 17, draw: drawScope },
        { y: 156, draw: drawRover },
        { y: 158, draw: (p) => drawDish(p, t) },
        { y: 80, draw: (p) => drawFlag(p, t) },
        { y: 101, draw: (p) => drawLights(p, t) },
        ...lamps.map(([x, y]) => ({ y, draw: (p: Painter) => drawLamp(p, x, y, t) })),
        ...crystals.map(([x, y]) => ({ y, draw: (p: Painter) => drawCrystal(p, x, y, t) })),
        ...plants.map(([x, y]) => ({ y, draw: (p: Painter) => drawPlant(p, x, y, t) })),
      ]
    },
    drawAir(p, f) {
      const t = f.t
      const T = (t % 16) / 16
      if (T > 0.55) return
      const x = -14 + (T / 0.55) * (W + 28)
      const y = 22 + Math.sin(t * 2) * 2
      p.ellipse(x, y - 2, 3, 2, K)
      p.ellipse(x, y - 2, 2, 1, '#9fe0d6')
      p.ellipse(x, y, 7, 2, K)
      p.ellipse(x, y, 6, 1, '#c9c6c0')
      for (let i = -4; i <= 4; i += 4) p.px(x + i, y + 1, (Math.floor(t * 6) + i) % 2 ? '#f6c85f' : '#d04a3a')
    },
    guest,
  }
}
