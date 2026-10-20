import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { hasSupabase } from './supabase/env'
import { createSupabase } from './supabase/server'

// 운영자(admins 테이블에 있는 사용자)인지 확인한다. Supabase 키가 없으면 목업 모드라 통과.
// 토큰은 getClaims로 서버에서 검증하고(네트워크 왕복 없음), 한 요청 안에서는 한 번만 확인한다(cache).
export const getAdmin = cache(async (): Promise<{ email: string } | null> => {
  if (!hasSupabase) return { email: '목업 모드' }
  const db = await createSupabase()
  const { data } = await db.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return null
  const { data: row } = await db.from('admins').select('user_id').eq('user_id', userId).maybeSingle()
  return row ? { email: (data.claims.email as string | undefined) ?? '' } : null
})

export async function requireAdmin() {
  const admin = await getAdmin()
  if (!admin) redirect('/login')
  return admin
}
