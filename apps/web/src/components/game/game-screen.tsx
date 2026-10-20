'use client'

import { createTheme, Game, type GuestEntry, type Place, type PlaceId } from '@lww/engine'
import type { GuestbookEntry, ThemeId } from '@lww/shared'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { GUESTBOOK_POSTED } from '../guestbook'
import { CameraIcon, HomeIcon, MusicIcon, MusicOffIcon, PenIcon } from '../icons'
import { Modal } from '../modal'
import { toast } from '../toast'
import { GAME_READY, INTRO_CLOSED } from './events'
import { Joystick } from './joystick'


const MODAL_TITLES: Record<PlaceId, string> = { home: '청첩장', photo: '사진', guestbook: '방명록' }
const FABS: { id: PlaceId; label: string; icon: ReactNode }[] = [
  { id: 'home', label: '집', icon: <HomeIcon size={18} /> },
  { id: 'photo', label: '사진', icon: <CameraIcon size={18} /> },
  { id: 'guestbook', label: '방명록', icon: <PenIcon size={18} /> },
]
// 게임 화면에서만 쓰는 테마 연출 문구 (모달 본문에는 쓰지 않는다)
const NEW_GUEST_TOAST: Record<ThemeId, string> = {
  village: '바다에 새 물고기가 들어왔어요. 눌러 보세요',
  space: '하늘에 새 별이 떴어요. 눌러 보세요',
}

interface Props {
  theme: ThemeId
  names: [string, string]
  date: string
  tagline: string
  taglineColor: string
  accent: string
  bgmUrl: string
  entries: GuestbookEntry[]
  contents: Record<PlaceId, ReactNode>
}

export default function GameScreen({ theme: themeId, names, date, tagline, taglineColor, accent, bgmUrl, entries, contents }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nametagRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [near, setNear] = useState<{ place: Place | null; auto: boolean }>({ place: null, auto: false })
  const [open, setOpen] = useState<PlaceId | null>(null)
  const [selected, setSelected] = useState<GuestEntry | null>(null)
  const [hint, setHint] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const stage = stageRef.current!
    const game = new Game(
      canvas,
      createTheme(themeId),
      {
        onNearChange: (place, auto) => setNear({ place, auto }),
        onEnter: (place) => setOpen(place.id),
        onGuestTap: (entry) => setSelected(entry),
      },
      nametagRef.current,
    )
    game.setGuests(entries.map(({ id, name, message }) => ({ id, name, message })))
    gameRef.current = game
    // 개발 중 확인용
    if (process.env.NODE_ENV !== 'production') (window as Window & { __lwwGame?: Game }).__lwwGame = game
    const fit = () => game.resize(stage.clientWidth, stage.clientHeight)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    game.start()
    requestAnimationFrame(() => {
      ;(window as Window & { __lwwGameReady?: boolean }).__lwwGameReady = true
      window.dispatchEvent(new Event(GAME_READY))
    })
    return () => {
      ro.disconnect()
      game.destroy()
      gameRef.current = null
    }
    // 처음 한 번만 만든다. 이후 방명록은 addGuest로 더한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId])

  // 모달이 열려 있거나 앱이 백그라운드면 그리기 루프를 멈춘다
  useEffect(() => {
    const sync = () => gameRef.current?.setPaused(open !== null || document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [open])

  // 방명록이 올라가면 모달을 닫고 새 오브젝트 연출을 보여준다
  useEffect(() => {
    const onPosted = (e: Event) => {
      const entry = (e as CustomEvent<GuestbookEntry>).detail
      setOpen(null)
      gameRef.current?.addGuest({ id: entry.id, name: entry.name, message: entry.message })
      setTimeout(() => toast(NEW_GUEST_TOAST[themeId]), 1500)
    }
    window.addEventListener(GUESTBOOK_POSTED, onPosted)
    return () => window.removeEventListener(GUESTBOOK_POSTED, onPosted)
  }, [themeId])

  // 안내 문구는 인트로가 닫히고 4초 뒤, 또는 처음 움직이면 사라진다
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onClosed = () => (timer = setTimeout(() => setHint(false), 4000))
    window.addEventListener(INTRO_CLOSED, onClosed)
    return () => {
      window.removeEventListener(INTRO_CLOSED, onClosed)
      clearTimeout(timer)
    }
  }, [])

  // 누른 방명록 글: 화면 위쪽 가운데에 고정으로 보여주고, 그 오브젝트를 강조한다
  useEffect(() => {
    gameRef.current?.setSelected(selected?.id ?? null)
    if (!selected) return
    const timer = setTimeout(() => setSelected(null), 5000)
    return () => clearTimeout(timer)
  }, [selected])

  // 배경음악: 꺼진 상태로 시작한다. 앱이 백그라운드로 가면 멈춘다.
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) audioRef.current?.pause()
      else if (playing) void audioRef.current?.play()
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [playing])
  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      toast('음악을 재생하지 못했어요')
    }
  }

  const onJoystick = useCallback((x: number, y: number) => {
    gameRef.current?.setJoystick(x, y)
    if (x || y) setHint(false)
  }, [])
  const close = useCallback(() => setOpen(null), [])

  return (
    <div ref={stageRef} className="stage" style={{ '--accent': accent } as React.CSSProperties}>
      <canvas ref={canvasRef} aria-label="청첩장 마을 화면" />

      <div ref={nametagRef} className="nametag" aria-hidden="true">
        <span>
          {names[0]} <span className="heart">♥</span> {names[1]}
        </span>
      </div>

      {selected && (
        <div key={selected.id} className="guest-card cut" role="status">
          <b>{selected.name}</b>
          <p>{selected.message}</p>
        </div>
      )}

      <div className="hud-top">
        <div className="hud-tag" style={{ color: taglineColor }}>
          {tagline}
        </div>
        <div className="hud-names">
          {names[0]} <span className="heart">♥</span> {names[1]}
        </div>
        <div className="hud-date">{date}</div>
      </div>

      {bgmUrl && (
        <>
          <audio ref={audioRef} src={bgmUrl} loop preload="none" />
          <button type="button" className="music cut" onClick={toggleMusic} aria-label={playing ? '배경음악 끄기' : '배경음악 켜기'} aria-pressed={playing}>
            {playing ? <MusicIcon size={18} /> : <MusicOffIcon size={18} />}
          </button>
        </>
      )}

      <div className="hint" style={{ opacity: hint ? 1 : 0 }}>
        조이스틱이나 버튼으로 움직여 보세요
      </div>

      {near.place && !near.auto && (
        <button type="button" className="enter cut" onClick={() => setOpen(near.place!.id)}>
          {near.place.label} 들어가기
        </button>
      )}

      <div className="controls">
        <Joystick onChange={onJoystick} />
        <div className="fabs">
          {FABS.map((f) => (
            <FabButton
              key={f.id}
              label={f.label}
              icon={f.icon}
              onPress={() => {
                gameRef.current?.goTo(f.id)
                setHint(false)
              }}
            />
          ))}
        </div>
      </div>

      {open && (
        <Modal title={MODAL_TITLES[open]} onClose={close}>
          {contents[open]}
        </Modal>
      )}
    </div>
  )
}

// 픽셀 플로팅 버튼. 누르는 동안만 노란색: 손을 떼거나(취소·벗어남 포함) 늦어도 0.25초 뒤에는 돌아온다.
function FabButton({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  const [pressed, setPressed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const release = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPressed(false), 80)
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])
  return (
    <button
      type="button"
      className={`fab oct${pressed ? ' pressed' : ''}`}
      aria-label={`${label}(으)로 이동`}
      onPointerDown={() => {
        setPressed(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setPressed(false), 250)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onClick={onPress}
    >
      <span className="oct">
        {icon}
        {label}
      </span>
    </button>
  )
}
