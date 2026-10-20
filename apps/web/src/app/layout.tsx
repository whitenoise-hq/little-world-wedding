import type { Metadata, Viewport } from 'next'
import { Nanum_Myeongjo } from 'next/font/google'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/toast'
import './globals.css'

// 청첩장 글자: 나눔명조 (OFL). 빌드할 때 받아 우리 도메인에서 내보내고, 한글은 쓰인 조각만 내려받는다.
const serif = Nanum_Myeongjo({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
})

// 게임 세계 안 이름표·말풍선: 갈무리11 서브셋 (src/fonts/README.md)
const pixel = localFont({
  src: '../fonts/Galmuri11-subset.woff2',
  variable: '--font-pixel',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: '리틀 월드 웨딩',
  // 청첩장은 주소를 아는 사람만 보도록 검색에 노출하지 않는다.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#111111',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${serif.variable} ${pixel.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
