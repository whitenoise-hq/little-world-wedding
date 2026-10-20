'use client'

import { BRIDE, CHARACTER_PALETTE, GROOM, GROOM_STEP_LEGS, withLegs } from '@lww/engine'
import { useEffect, useState } from 'react'
import { PixelSprite } from './pixel-sprite'

// 첫 화면. 서버가 HTML로 바로 보내고, 뒤에서 준비가 끝나면 "들어가기" 버튼으로 바뀐다.
// docs/PLANNING.md 3장.

const BLOCKS = 10

interface Props {
  slug: string
  tagline: string
  names: [string, string]
  date: string
  message: string
  bg: string
  accent: string
}

export function Intro({ slug, tagline, names, date, message, bg, accent }: Props) {
  const [filled, setFilled] = useState(0)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<'open' | 'leaving' | 'closed'>('open')

  useEffect(() => {
    const key = `lww-visited:${slug}`
    let visited = false
    try {
      visited = localStorage.getItem(key) === '1'
    } catch {}
    // 1단계에는 게임이 없으므로 폰트 준비를 기준으로 삼는다. 2단계에서 게임 코드 로딩을 더한다.
    let alive = true
    let n = visited ? BLOCKS - 1 : 0
    const tick = setInterval(() => {
      if (n < BLOCKS - 1) setFilled(++n)
    }, 90)
    document.fonts.ready.then(() => {
      if (!alive) return
      clearInterval(tick)
      setFilled(BLOCKS)
      setReady(true)
      try {
        localStorage.setItem(key, '1')
      } catch {}
    })
    return () => {
      alive = false
      clearInterval(tick)
    }
  }, [slug])

  useEffect(() => {
    document.body.style.overflow = phase === 'closed' ? '' : 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  if (phase === 'closed') return null

  return (
    <div
      className={`intro${phase === 'leaving' ? ' leaving' : ''}`}
      style={{ '--intro-bg': bg, '--intro-accent': accent } as React.CSSProperties}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && phase === 'leaving') setPhase('closed')
      }}
      role="dialog"
      aria-modal="true"
      aria-label="청첩장 표지"
    >
      <div className="intro-tag">{tagline}</div>
      <div className="intro-chars">
        <span>
          <PixelSprite className="base" rows={GROOM} palette={CHARACTER_PALETTE} scale={5} />
          <PixelSprite className="step" rows={withLegs(GROOM, GROOM_STEP_LEGS)} palette={CHARACTER_PALETTE} scale={5} />
        </span>
        <span>
          <PixelSprite rows={BRIDE} palette={CHARACTER_PALETTE} scale={5} />
        </span>
      </div>
      <div className="intro-names">
        {names[0]} <span className="heart">♥</span> {names[1]}
      </div>
      <div className="intro-date">{date}</div>
      {message && <div className="intro-msg">{message}</div>}
      {ready ? (
        <button type="button" className="intro-enter cut" onClick={() => setPhase('leaving')} autoFocus>
          들어가기
        </button>
      ) : (
        <div className="intro-bar" role="progressbar" aria-label="불러오는 중" aria-valuemin={0} aria-valuemax={BLOCKS} aria-valuenow={filled}>
          {Array.from({ length: BLOCKS }, (_, i) => (
            <i key={i} className={`cut${i < filled ? ' on' : ''}`} />
          ))}
        </div>
      )}
    </div>
  )
}
