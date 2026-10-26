'use client'

import { ShareIcon } from './icons'
import { copyText } from './toast'

// 청첩장 링크 공유. 휴대폰 공유 화면(카톡·문자 등)을 띄우고, 지원하지 않는 브라우저에서는 링크를 복사한다.
// 카카오 SDK는 쓰지 않는다: 카톡에 붙인 주소는 OG 태그로 미리보기 카드가 나온다. docs/PLANNING.md 4장 "조작".
async function share() {
  const url = window.location.href.split(/[?#]/)[0]!
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return // 하객이 공유 화면을 닫음
    }
  }
  await copyText(url, '링크를 복사했어요')
}

export function ShareButton({ className, size = 18, pixel = false }: { className: string; size?: number; pixel?: boolean }) {
  const icon = <ShareIcon size={size} />
  return (
    <button type="button" className={className} onClick={share} aria-label="청첩장 링크 공유">
      {pixel ? <span className="oct">{icon}</span> : icon}
    </button>
  )
}
