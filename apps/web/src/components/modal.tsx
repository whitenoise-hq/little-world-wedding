'use client'

import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

// 화면의 90%를 채우는 패널. 닫기 버튼, 바깥 영역, Esc로 닫힌다.
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 사진 전체화면이 열려 있으면 그쪽이 먼저 닫힌다
      if (e.key === 'Escape' && !document.querySelector('.lb')) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            <CloseIcon size={22} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
