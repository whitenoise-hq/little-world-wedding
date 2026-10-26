'use client'

import { BRIDE, CHARACTER_PALETTE, GROOM } from '@lww/engine'
import { useEffect } from 'react'
import { PixelSprite } from '@/components/pixel-sprite'
import { reportError } from '@/components/report-error'

// 청첩장을 그리다 오류가 나면(DB 일시 정지, 네트워크 등) 기본 에러 화면 대신 보여준다.
// docs/PLANNING.md 9장 "하객 화면 에러 처리".
// 다시 시도는 페이지를 새로 읽는다. 서버에서 난 오류는 화면만 다시 그려서는 풀리지 않기 때문이다.
export default function InvitationError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('청첩장 화면 오류', error)
    // 서버에서 난 오류(digest 있음)는 서버가 이미 알렸으므로 브라우저에서 난 오류만 보낸다
    if (!error.digest) reportError('청첩장 화면', error)
  }, [error])

  return (
    <main className="notfound">
      <div className="notfound-chars" aria-hidden="true">
        <PixelSprite rows={GROOM} palette={CHARACTER_PALETTE} scale={5} />
        <PixelSprite rows={BRIDE} palette={CHARACTER_PALETTE} scale={5} />
      </div>
      <h1 className="notfound-title">청첩장을 불러오지 못했습니다</h1>
      <p className="notfound-text">
        잠시 연결이 원활하지 않습니다.
        <br />
        조금 뒤에 다시 열어 주세요.
      </p>
      <button type="button" className="notfound-link notfound-retry" onClick={() => window.location.reload()}>
        다시 시도
      </button>
    </main>
  )
}
