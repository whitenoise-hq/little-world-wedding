import 'server-only'
import type { Database } from '@lww/shared'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { serverEnv } from './env'

// 하객용 앱의 Supabase 클라이언트. web 전용 secret 키로 서버에서만 쓴다 (docs/PLANNING.md 8장).
// 처음 쓸 때 만든다: 파일을 불러오는 순간 만들면 빌드 단계(환경변수가 없을 수 있음)에서 죽는다.
let client: SupabaseClient<Database> | null = null

export function getDb(): SupabaseClient<Database> {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseSecretKey) {
    throw new Error('SUPABASE_URL, SUPABASE_SECRET_KEY 환경변수가 없습니다 (apps/web)')
  }
  client ??= createClient<Database>(serverEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
