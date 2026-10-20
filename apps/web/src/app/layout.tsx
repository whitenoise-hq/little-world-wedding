import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/toast'
import './globals.css'

// 갈무리11 서브셋 (src/fonts/README.md)
const pixel = localFont({
  src: '../fonts/Galmuri11-subset.woff2',
  variable: '--font-pixel',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: '리틀 월드 웨딩',
  // 청첩장은 주소를 아는 사람만 보도록 검색에 노출하지 않는다.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2a1a2e',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pixel.variable}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
