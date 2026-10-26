'use client'

import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Modal } from './modal'
import { PrivacyContent } from './privacy-content'

// "개인정보처리방침" 글자를 누르면 전체화면 모달로 띄운다. 페이지를 옮기지 않아 입력 중인 방명록과 게임이 그대로 남는다.
// 다른 모달 안에서 눌러도 덮이도록 body 끝에 그린다.
export function PrivacyLink({ className, children = '개인정보처리방침' }: { className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={`privacy-link${className ? ` ${className}` : ''}`} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open &&
        createPortal(
          <Modal title="개인정보 처리방침" full onClose={() => setOpen(false)}>
            <PrivacyContent />
          </Modal>,
          document.body,
        )}
    </>
  )
}
