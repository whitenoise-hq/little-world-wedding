import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabase, supabasePublishableKey, supabaseUrl } from './lib/supabase/env'

// 요청마다 로그인 세션을 갱신하고, 로그인하지 않았으면 /login 으로 보낸다.
// 운영자 여부(admins)는 화면에서 requireAdmin()으로, 데이터 권한은 DB의 RLS로 한 번 더 확인한다.
export async function proxy(request: NextRequest) {
  if (!hasSupabase) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })
  // getClaims: 토큰 서명을 서버에서 직접 검증한다(비대칭 키). Supabase에 묻지 않아 빠르고,
  // 만료된 토큰이면 갱신해서 쿠키에 다시 쓴다.
  const { data } = await supabase.auth.getClaims()
  const loggedIn = Boolean(data?.claims.sub)

  const isLogin = request.nextUrl.pathname.startsWith('/login')
  if (!loggedIn && !isLogin) return NextResponse.redirect(new URL('/login', request.url))
  if (loggedIn && isLogin) return NextResponse.redirect(new URL('/invitations', request.url))
  return response
}

export const config = {
  // 정적 파일·이미지는 건너뛴다
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
