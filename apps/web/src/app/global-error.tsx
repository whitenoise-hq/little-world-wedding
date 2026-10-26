'use client'

import { useEffect } from 'react'
import { reportError } from '@/components/report-error'

// 레이아웃까지 깨지는 경우의 마지막 안전망. 이때는 globals.css·글꼴도 없을 수 있어 스타일을 직접 넣는다.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('청첩장 전체 오류', error)
    if (!error.digest) reportError('전체 화면', error)
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: '#1d3a33',
          color: '#fff',
          fontFamily: "'Nanum Myeongjo', 'AppleMyungjo', serif",
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0 }}>청첩장을 불러오지 못했습니다</h1>
        <p style={{ fontSize: 14, lineHeight: 1.9, margin: 0, opacity: 0.85 }}>
          잠시 연결이 원활하지 않습니다.
          <br />
          조금 뒤에 다시 열어 주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 12,
            height: 44,
            padding: '0 32px',
            border: '1px solid rgba(255,255,255,.45)',
            borderRadius: 999,
            background: 'transparent',
            color: '#fff',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  )
}
