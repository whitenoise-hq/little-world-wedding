import 'server-only'
import { redirect } from 'next/navigation'
import { hasSupabase } from './supabase/env'
import { createSupabase } from './supabase/server'

// 운영자(admins 테이블에 있는 사용자)인지 확인한다. Supabase 키가 없으면 목업 모드라 통과.
export async function getAdmin(): Promise<{ email: string } | null> {
  if (!hasSupabase) return { email: '목업 모드' }
  const db = await createSupabase()
  const { data } = await db.auth.getUser()
  if (!data.user) return null
  const { data: row } = await db.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  return row ? { email: data.user.email ?? '' } : null
}

export async function requireAdmin() {
  const admin = await getAdmin()
  if (!admin) redirect('/login')
  return admin
}
