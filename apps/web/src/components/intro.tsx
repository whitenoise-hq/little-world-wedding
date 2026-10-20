'use client'

import { BRIDE, CHARACTER_PALETTE, GROOM, GROOM_STEP_LEGS, withLegs } from '@lww/engine'
import { useEffect, useState } from 'react'
import { GAME_READY, INTRO_CLOSED } from './game/events'
import { PixelSprite } from './pixel-sprite'

// 첫 화면. 서버가 HTML로 바로 보내고, 뒤에서 게임과 글꼴이 준비되면 "들어가기" 버튼으로 바뀐다.
// docs/PLANNING.md 3장.

const FALLBACK_MS = 8000 // 무언가 늦어져도 이 시간이 지나면 들어갈 수 있게 한다

interface Props {
  slug: string
  tagline: string
  names: [string, string]
  date: string
  bg: string
}

export function Intro({ slug, tagline, names, date, bg }: Props) {
  const [progress, setProgress] = useState(0.1)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<'open' | 'leaving' | 'closed'>('open')

  useEffect(() => {
    let alive = true
    let gameReady = !!(window as Window & { __lwwGameReady?: boolean }).__lwwGameReady
    let fontsReady = false
    const check = () => {
      if (!alive) return
      setProgress(0.1 + (gameReady ? 0.6 : 0) + (fontsReady ? 0.3 : 0))
      if (gameReady && fontsReady) setReady(true)
    }
    const onGame = () => {
      gameReady = true
      check()
    }
    window.addEventListener(GAME_READY, onGame)
    document.fonts.ready.then(() => {
      fontsReady = true
      check()
    })
    const fallback = setTimeout(() => alive && setReady(true), FALLBACK_MS)
    try {
      // 다시 방문하면 기다리지 않고 바로 버튼을 보여준다
      if (localStorage.getItem(`lww-visited:${slug}`) === '1') setReady(true)
      localStorage.setItem(`lww-visited:${slug}`, '1')
    } catch {}
    check()
    return () => {
      alive = false
      window.removeEventListener(GAME_READY, onGame)
      clearTimeout(fallback)
    }
  }, [slug])

  if (phase === 'closed') return null

  return (
    <div
      className={`intro${phase === 'leaving' ? ' leaving' : ''}`}
      style={{ '--intro-bg': bg } as React.CSSProperties}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && phase === 'leaving') {
          setPhase('closed')
          window.dispatchEvent(new Event(INTRO_CLOSED))
        }
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
      <div className="intro-foot">
        {ready ? (
          <button type="button" className="intro-enter" onClick={() => setPhase('leaving')} autoFocus>
            들어가기
          </button>
        ) : (
          <div className="intro-bar" role="progressbar" aria-label="불러오는 중" aria-valuenow={Math.round(progress * 100)}>
            <i style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
