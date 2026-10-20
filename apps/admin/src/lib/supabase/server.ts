import 'server-only'
import type { Database } from '@lww/shared'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabasePublishableKey, supabaseUrl } from './env'

// 로그인한 운영자의 세션(쿠키)으로 접근한다. 권한은 DB의 RLS가 판단한다.
export async function createSupabase() {
  const store = await cookies()
  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 맡는다.
        }
      },
    },
  })
}
