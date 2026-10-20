'use client'

import type { Photo } from '@lww/shared'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CloseIcon } from './icons'

const pad = (n: number) => String(n).padStart(2, '0')

// 사진 3칸 격자 + 누르면 전체화면 보기. docs/PLANNING.md 4장 "사진 모달".
export function Gallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const startX = useRef<number | null>(null)
  const n = photos.length
  const go = (i: number) => setIndex(((i % n) + n) % n)

  useEffect(() => {
    if (index === null) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null)
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    // 이전·다음 사진을 미리 불러온다
    for (const d of [-1, 1]) {
      const p = photos[(((index + d) % n) + n) % n]
      if (p) new Image().src = p.fullUrl
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  })

  if (n === 0) return null
  const current = index === null ? null : photos[index]

  return (
    <section className="sec">
      <h2>✦ 사진</h2>
      <div className="ggrid">
        {photos.map((p, i) => (
          <button key={p.id} type="button" className="cut" onClick={() => setIndex(i)} aria-label={`${i + 1}번째 사진 크게 보기`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumbUrl} alt={p.caption} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {current && index !== null && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="사진 크게 보기">
          <div className="lb-top">
            <span>
              {pad(index + 1)} / {pad(n)}
            </span>
            <button type="button" className="lb-btn cut" onClick={() => setIndex(null)} aria-label="닫기">
              <CloseIcon />
            </button>
          </div>
          <div
            className="lb-img"
            onPointerDown={(e) => (startX.current = e.clientX)}
            onPointerUp={(e) => {
              const s = startX.current
              startX.current = null
              if (s !== null && Math.abs(e.clientX - s) > 30) go(index + (e.clientX < s ? 1 : -1))
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={current.id} src={current.fullUrl} alt={current.caption} draggable={false} />
          </div>
          <div className="lb-cap">{current.caption}</div>
          <div className="lb-nav">
            <button type="button" className="lb-btn cut" onClick={() => go(index - 1)} aria-label="이전 사진">
              <ChevronLeft />
            </button>
            <button type="button" className="lb-btn cut" onClick={() => go(index + 1)} aria-label="다음 사진">
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
