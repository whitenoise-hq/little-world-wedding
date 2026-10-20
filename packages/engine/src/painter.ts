import { BAYER_4X4, OUTLINE } from './constants'

// 픽셀 단위로 그리는 도구. 좌표는 그리기 직전에 반올림한다. docs/ART_GUIDE.md 3장.
export interface Painter {
  readonly ctx: CanvasRenderingContext2D
  rect(x: number, y: number, w: number, h: number, color: string): void
  px(x: number, y: number, color: string): void
  line(x0: number, y0: number, x1: number, y1: number, color: string): void
  ellipse(cx: number, cy: number, a: number, b: number, color: string): void
  halfDisc(cx: number, cy: number, r: number, color: string): void
  // 왼쪽 위에서 빛이 비치는 구형 음영. palette는 어두움 → 밝음 5단계.
  sphere(cx: number, cy: number, r: number, palette: readonly string[], atmosphere?: string): void
  // 문자열 스프라이트. palette에 없는 글자와 '.'은 투명.
  sprite(rows: readonly string[], palette: Record<string, string>, x: number, y: number, flip?: boolean): void
  withAlpha(alpha: number, draw: () => void): void
}

export const bayer = (x: number, y: number) => BAYER_4X4[y & 3]![x & 3]! / 16

// subpixel: 월드 1픽셀을 몇 칸으로 쪼개 위치를 잡을지. 움직이는 물체가 부드럽게 보이도록 게임 화면은 2~4를 쓴다.
export function createPainter(ctx: CanvasRenderingContext2D, subpixel = 1): Painter {
  const snap = (v: number) => Math.round(v * subpixel) / subpixel
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(snap(x), snap(y), w, h)
  }
  const px = (x: number, y: number, color: string) => rect(x, y, 1, 1, color)

  return {
    ctx,
    rect,
    px,
    line(x0, y0, x1, y1, color) {
      x0 = Math.round(x0)
      y0 = Math.round(y0)
      x1 = Math.round(x1)
      y1 = Math.round(y1)
      const dx = Math.abs(x1 - x0)
      const dy = -Math.abs(y1 - y0)
      const sx = x0 < x1 ? 1 : -1
      const sy = y0 < y1 ? 1 : -1
      let e = dx + dy
      for (;;) {
        px(x0, y0, color)
        if (x0 === x1 && y0 === y1) break
        const e2 = 2 * e
        if (e2 >= dy) {
          e += dy
          x0 += sx
        }
        if (e2 <= dx) {
          e += dx
          y0 += sy
        }
      }
    },
    ellipse(cx, cy, a, b, color) {
      for (let dy = -b; dy <= b; dy++) {
        const dx = Math.round(a * Math.sqrt(1 - (dy / b) ** 2))
        rect(cx - dx, cy + dy, dx * 2 + 1, 1, color)
      }
    },
    halfDisc(cx, cy, r, color) {
      for (let dy = -r; dy <= 0; dy++) {
        const dx = Math.round(Math.sqrt(r * r - dy * dy))
        rect(cx - dx, cy + dy, dx * 2 + 1, 1, color)
      }
    },
    sphere(cx, cy, r, palette, atmosphere) {
      for (let y = cy - r - 3; y <= cy + r + 3; y++) {
        for (let x = cx - r - 3; x <= cx + r + 3; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
          const bt = bayer(x, y)
          if (d <= r) {
            if (d > r - 1.2) {
              px(x, y, OUTLINE)
              continue
            }
            const nx = (x + 0.5 - cx) / r
            const ny = (y + 0.5 - cy) / r
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
            const l = -0.45 * nx - 0.55 * ny + 0.7 * nz + (bt - 0.5) * 0.18
            px(x, y, palette[l > 0.92 ? 4 : l > 0.7 ? 3 : l > 0.38 ? 2 : l > 0.15 ? 1 : 0]!)
          } else if (atmosphere && d <= r + 2.5 && bt < 0.5) px(x, y, atmosphere)
        }
      }
    },
    sprite(rows, palette, x, y, flip = false) {
      const ox = snap(x)
      const oy = snap(y)
      rows.forEach((row, j) => {
        const w = row.length
        for (let i = 0; i < w; i++) {
          const c = palette[row[flip ? w - 1 - i : i]!]
          if (c) px(ox + i, oy + j, c)
        }
      })
    },
    withAlpha(alpha, draw) {
      const prev = ctx.globalAlpha
      ctx.globalAlpha = alpha
      draw()
      ctx.globalAlpha = prev
    },
  }
}

// 같은 그림을 여러 번 찍을 때 작은 캔버스에 미리 그려 둔다.
export function prerender(w: number, h: number, draw: (p: Painter) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(createPainter(canvas.getContext('2d')!))
  return canvas
}
