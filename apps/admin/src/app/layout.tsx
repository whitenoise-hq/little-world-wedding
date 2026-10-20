import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

// 어드민은 항상 최신 데이터를 본다 (하객이 남긴 방명록 등). 정적 생성하지 않는다.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '리틀 월드 웨딩 어드민',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={cn('font-sans', geist.variable)}>
      <body className="min-h-screen bg-muted text-foreground">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
            <Link href="/invitations" className="font-semibold">
              리틀 월드 웨딩
            </Link>
            <nav className="text-sm text-muted-foreground">
              <Link href="/invitations" className="hover:text-foreground">
                청첩장
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
