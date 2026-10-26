'use client'

import { toggleBgm, useBgmOn } from './bgm'
import { MusicIcon, MusicOffIcon } from './icons'

// 배경음악 끄기·켜기 버튼. 게임 화면에서는 플로팅 버튼과 같은 팔각 픽셀 버튼(pixel), 바로 보기 모달 머리에서는 아이콘 버튼(.icon-button).
export function MusicButton({ className, size = 18, pixel = false }: { className: string; size?: number; pixel?: boolean }) {
  const on = useBgmOn()
  return (
    <button type="button" className={className} onClick={toggleBgm} aria-label={on ? '배경음악 끄기' : '배경음악 켜기'} aria-pressed={on}>
      {pixel ? <span className="oct">{icon(on, size)}</span> : icon(on, size)}
    </button>
  )
}

const icon = (on: boolean, size: number) => (on ? <MusicIcon size={size} /> : <MusicOffIcon size={size} />)
