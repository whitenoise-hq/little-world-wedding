import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth'
import { signOut } from '../login/actions'

// 운영자만 들어오는 화면. 로그인하지 않았거나 운영자가 아니면 /login 으로 보낸다.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()
  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
          <Link href="/invitations" className="font-semibold">
            리틀 월드 웨딩
          </Link>
          <nav className="flex-1 text-sm text-muted-foreground">
            <Link href="/invitations" className="hover:text-foreground">
              청첩장
            </Link>
          </nav>
          <span className="text-sm text-muted-foreground">{admin.email}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </>
  )
}
