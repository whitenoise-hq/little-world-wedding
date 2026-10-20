'use client'

import { useRef, useState } from 'react'

// 픽셀 스타일 조이스틱. 크기는 CSS(--joy)로 정하고, 움직임은 실제 크기에 맞춰 계산한다.
const DEAD = 0.15 // 가운데 데드존

type Dir = 'u' | 'd' | 'l' | 'r' | ''

const ARROWS: { d: Exclude<Dir, ''>; style: React.CSSProperties }[] = [
  { d: 'u', style: { left: '50%', top: '14%' } },
  { d: 'd', style: { left: '50%', top: '86%', transform: 'rotate(180deg)' } },
  { d: 'l', style: { left: '14%', top: '50%', transform: 'rotate(-90deg)' } },
  { d: 'r', style: { left: '86%', top: '50%', transform: 'rotate(90deg)' } },
]

export function Joystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const pointer = useRef<number | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [dir, setDir] = useState<Dir>('')

  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const radius = r.width * 0.3
    let dx = e.clientX - r.left - r.width / 2
    let dy = e.clientY - r.top - r.height / 2
    const d = Math.hypot(dx, dy)
    if (d > radius) {
      dx = (dx / d) * radius
      dy = (dy / d) * radius
    }
    // 손잡이는 3px 단위로 움직여 픽셀 느낌을 낸다
    setKnob({ x: Math.round(dx / 3) * 3, y: Math.round(dy / 3) * 3 })
    if (Math.hypot(dx, dy) / radius < DEAD) {
      onChange(0, 0)
      setDir('')
    } else {
      onChange(dx / radius, dy / radius)
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u')
    }
  }
  const end = () => {
    pointer.current = null
    setKnob({ x: 0, y: 0 })
    setDir('')
    onChange(0, 0)
  }

  return (
    <div
      ref={ref}
      className="joystick oct"
      role="application"
      aria-label="이동 조이스틱"
      onPointerDown={(e) => {
        pointer.current = e.pointerId
        ref.current!.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={(e) => e.pointerId === pointer.current && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {ARROWS.map((a) => (
        <i key={a.d} className={`joystick-arrow${dir === a.d ? ' on' : ''}`} style={a.style} />
      ))}
      <div className="joystick-knob oct" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
