'use client'

import { useSyncExternalStore } from 'react'

// 배경음악 재생기 (한 페이지에 하나). docs/PLANNING.md 9장 "배경음악".
// - 켜진 상태로 시작한다. 브라우저는 누르기 전에는 소리를 막으므로 인트로 버튼을 누를 때 startBgm()으로 시작한다.
//   이때 처음 곡 파일을 받는다(고른 곡 하나만).
// - 게임 화면·바로 보기의 음악 버튼은 toggleBgm()으로 끄고 켠다. 재생이 막히면 꺼진 상태로 보여 준다.
// - 표지에서는 들리지 않는다. 바로 보기를 닫고 표지로 돌아오면 pauseBgm()으로 멈추고, 다시 들어가면 이어서 튼다.
// - 앱이 백그라운드로 가면 멈추고, 돌아오면 켜져 있던 경우만 다시 튼다.

let audio: HTMLAudioElement | null = null
let on = true // 하객이 고른 상태(음악 버튼)
let active = false // 표지를 지나 청첩장을 보고 있는지
const listeners = new Set<() => void>()

const setOn = (value: boolean) => {
  on = value
  listeners.forEach((l) => l())
}

const play = () => {
  audio?.play().catch(() => setOn(false))
}

const onVisibility = () => {
  if (document.hidden) audio?.pause()
  else if (on && active) play()
}

// 인트로 버튼의 클릭 처리 안에서 바로 불러야 한다(그래야 브라우저가 소리를 허락한다)
export function startBgm(src: string) {
  if (!src) return
  if (!audio) {
    audio = new Audio(src)
    audio.loop = true
    document.addEventListener('visibilitychange', onVisibility)
  }
  active = true
  if (on && audio.paused) play()
}

// 표지로 돌아올 때. 하객이 고른 켜짐·꺼짐 상태는 그대로 둔다.
export function pauseBgm() {
  active = false
  audio?.pause()
}

export function toggleBgm() {
  if (!audio) return
  if (on) {
    audio.pause()
    setOn(false)
  } else {
    setOn(true)
    play()
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useBgmOn = () =>
  useSyncExternalStore(
    subscribe,
    () => on,
    () => true,
  )
