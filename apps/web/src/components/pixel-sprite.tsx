// 문자열 스프라이트를 SVG로 그린다. 서버 컴포넌트에서도 쓸 수 있다.
export function PixelSprite({
  rows,
  palette,
  scale = 4,
  flip = false,
  className,
}: {
  rows: string[]
  palette: Record<string, string>
  scale?: number
  flip?: boolean
  className?: string
}) {
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  const rects: { x: number; y: number; c: string }[] = []
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const c = palette[ch]
      if (c) rects.push({ x: flip ? w - 1 - x : x, y, c })
    }),
  )
  return (
    <svg
      className={className}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1} height={1} fill={r.c} />
      ))}
    </svg>
  )
}
