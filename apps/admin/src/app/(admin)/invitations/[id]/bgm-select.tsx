'use client'

import { BGM_TRACKS, bgmLabel } from '@lww/shared'
import { PauseIcon, PlayIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WEB_URL } from '@/lib/env'

// 배경음악 고르기 + 미리 듣기. 곡 파일은 하객용 앱(apps/web/public/bgm/)에 있어 그 주소로 재생한다.
// docs/PLANNING.md 9장 "배경음악".
const NONE = 'none' // Select는 빈 값을 못 쓴다

export function BgmSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  // 예전에 외부 주소로 넣은 곡은 목록에 따로 보여 준다(고르면 그대로 유지)
  const custom = value && !bgmLabel(value) ? value : null

  useEffect(() => () => audio.current?.pause(), [])

  const stop = () => {
    audio.current?.pause()
    setPlaying(false)
  }

  const preview = () => {
    if (playing) return stop()
    const src = value.startsWith('/') ? `${WEB_URL}${value}` : value
    audio.current?.pause()
    audio.current = new Audio(src)
    audio.current.onended = () => setPlaying(false)
    audio.current.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value || NONE}
        onValueChange={(v) => {
          stop()
          onChange(v === NONE ? '' : v)
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>없음</SelectItem>
          {BGM_TRACKS.map((t) => (
            <SelectItem key={t.file} value={t.file}>
              {t.label}
            </SelectItem>
          ))}
          {custom && <SelectItem value={custom}>직접 넣은 주소</SelectItem>}
        </SelectContent>
      </Select>
      {value && (
        <Button type="button" variant="outline" size="sm" onClick={preview}>
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? '멈춤' : '미리 듣기'}
        </Button>
      )}
    </div>
  )
}
