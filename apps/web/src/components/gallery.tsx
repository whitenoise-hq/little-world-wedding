'use client'

import type { Photo } from '@lww/shared'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CloseIcon } from './icons'

// 사진 3칸 격자 + 누르면 전체화면. 전체화면은 사진만 보여주고, 가로로 밀어서 넘긴다.
// 넘기기는 CSS scroll-snap(브라우저 기본 스크롤)이라 손가락을 따라 자연스럽게 움직인다.
export function Gallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const n = photos.length

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const next = Math.max(0, Math.min(n - 1, i))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  // 연 사진 위치로 바로 이동 (애니메이션 없이)
  useLayoutEffect(() => {
    if (open === null || !track.current) return
    track.current.scrollLeft = open * track.current.clientWidth
    setIndex(open)
  }, [open])

  useEffect(() => {
    if (open === null) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  })

  if (n === 0) return <p className="small muted center" style={{ padding: '40px 0' }}>아직 사진이 없습니다.</p>

  return (
    <>
      <div className="ggrid">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} aria-label={`${i + 1}번째 사진 크게 보기`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumbUrl} alt={p.caption} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="사진 크게 보기">
          <div
            ref={track}
            className="lb-track"
            onScroll={(e) => {
              const el = e.currentTarget
              setIndex(Math.round(el.scrollLeft / el.clientWidth))
            }}
          >
            {photos.map((p, i) => (
              <div key={p.id} className="lb-slide">
                {/* 지금 사진과 양옆 사진만 큰 이미지를 불러온다 */}
                {Math.abs(i - index) <= 1 || i === open ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.fullUrl} alt={p.caption} draggable={false} />
                ) : null}
              </div>
            ))}
          </div>
          <button type="button" className="icon-button lb-close" onClick={() => setOpen(null)} aria-label="닫기">
            <CloseIcon size={24} />
          </button>
          {index > 0 && (
            <button type="button" className="icon-button lb-arrow lb-prev" onClick={() => go(index - 1)} aria-label="이전 사진">
              <ChevronLeft size={26} />
            </button>
          )}
          {index < n - 1 && (
            <button type="button" className="icon-button lb-arrow lb-next" onClick={() => go(index + 1)} aria-label="다음 사진">
              <ChevronRight size={26} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
