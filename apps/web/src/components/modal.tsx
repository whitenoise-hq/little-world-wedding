'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './icons'

// 화면의 90%를 채우는 패널. 닫기 버튼, 바깥 영역, Esc로 닫힌다.
// full: 화면 전체를 덮고, 머리에는 왼쪽 위 닫기 버튼만 둔다 (표지의 "청첩장 바로 보기").
// actions: 머리 오른쪽에 둘 버튼 (바로 보기의 음악 버튼)
interface Props {
  title: string
  onClose: () => void
  full?: boolean
  actions?: ReactNode
  children: ReactNode
}

export function Modal({ title, onClose, full = false, actions, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // 사진 전체화면이 열려 있으면 그쪽이 먼저 닫힌다
      if (document.querySelector('.lb')) return
      // 모달이 겹쳐 있으면(예: 바로 보기 안의 개인정보 처리방침) 맨 위 것만 닫는다
      const all = document.querySelectorAll('.modal-backdrop')
      if (all[all.length - 1] !== ref.current) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div ref={ref} className={`modal-backdrop${full ? ' full' : ''}`} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${full ? ' full' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          {!full && <div className="modal-title">{title}</div>}
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            <CloseIcon size={22} />
          </button>
          {actions && <div className="modal-actions">{actions}</div>}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
