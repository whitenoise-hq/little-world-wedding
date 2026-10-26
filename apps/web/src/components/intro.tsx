'use client'

import { BRIDE, CHARACTER_PALETTE, GROOM, GROOM_STEP_LEGS, withLegs } from '@lww/engine'
import { useEffect, useState, type ReactNode } from 'react'
import { pauseBgm, startBgm } from './bgm'
import { GAME_READY, INTRO_CLOSED } from './game/events'
import { Modal } from './modal'
import { MusicButton } from './music-button'
import { PixelSprite } from './pixel-sprite'
import { PrivacyLink } from './privacy-link'
import { ShareButton } from './share-button'

// 첫 화면. 서버가 HTML로 바로 보내고, 뒤에서 게임과 글꼴이 준비되면 "들어가기" 버튼으로 바뀐다.
// "청첩장 바로 보기"는 게임을 기다리지 않고 처음부터 누를 수 있다 (전체화면 모달).
// 두 버튼 모두 누르는 순간 배경음악을 시작한다(브라우저 소리 제한이 이 터치로 풀린다).
// docs/PLANNING.md 3장, 9장 "배경음악".

const FALLBACK_MS = 8000 // 무언가 늦어져도 이 시간이 지나면 들어갈 수 있게 한다

interface Props {
  slug: string
  bgm: string // 배경음악 파일 주소, 없으면 ''
  tagline: string
  names: [string, string]
  date: string
  bg: string
  accent: string
  card: ReactNode
}

export function Intro({ slug, bgm, tagline, names, date, bg, accent, card }: Props) {
  const [progress, setProgress] = useState(0.1)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<'open' | 'leaving' | 'closed'>('open')
  const [cardOpen, setCardOpen] = useState(false)

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
    <>
      <div
        className={`intro${phase === 'leaving' ? ' leaving' : ''}`}
        style={{ '--intro-bg': bg } as React.CSSProperties}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && phase === 'leaving') {
            setPhase('closed')
            ;(window as Window & { __lwwIntroClosed?: boolean }).__lwwIntroClosed = true
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
          <div className="intro-slot">
            {ready ? (
              <button
                type="button"
                className="intro-enter"
                onClick={() => {
                  startBgm(bgm)
                  setPhase('leaving')
                }}
                autoFocus
              >
                들어가기
              </button>
            ) : (
              <div className="intro-bar" role="progressbar" aria-label="불러오는 중" aria-valuenow={Math.round(progress * 100)}>
                <i style={{ width: `${progress * 100}%` }} />
              </div>
            )}
          </div>
          <button
            type="button"
            className="intro-enter intro-card"
            onClick={() => {
              startBgm(bgm)
              setCardOpen(true)
            }}
          >
            청첩장 바로 보기
          </button>
        </div>
        <div className="brand-foot intro-brand">
          LITTLE WORLD WEDDING · <PrivacyLink />
        </div>
      </div>
      {cardOpen && (
        <div style={{ '--accent': accent } as React.CSSProperties}>
          <Modal
            title="청첩장"
            full
            onClose={() => {
              pauseBgm() // 표지에서는 음악이 들리지 않는다
              setCardOpen(false)
            }}
            actions={
              <>
                <ShareButton className="icon-button" size={20} />
                {bgm && <MusicButton className="icon-button" size={20} />}
              </>
            }
          >
            <div className="card-cover">
              <div className="card-names">
                {names[0]} <span className="heart">♥</span> {names[1]}
              </div>
              <div className="card-date">{date}</div>
            </div>
            {card}
            <div className="brand-foot">
              LITTLE WORLD WEDDING
              <br />
              <PrivacyLink />
            </div>
          </Modal>
        </div>
      )}
    </>
  )
}
