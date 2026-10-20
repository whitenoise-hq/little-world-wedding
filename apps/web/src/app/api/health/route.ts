import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabase, serverEnv } from '@/lib/env'
import { getDb } from '@/lib/supabase'

// 매일 깨우기 헬스체크 (docs/PLANNING.md 8장).
// Supabase 무료 플랜은 7일 동안 DB 활동이 없으면 멈춘다. Vercel Cron이 하루 한 번 이 주소를 부르고,
// 여기서 DB에 가벼운 조회를 한 번 해서 활동을 남긴다. 캐시를 쓰지 않고 매번 DB까지 간다.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Vercel Cron은 CRON_SECRET을 Authorization: Bearer 로 보낸다. 다른 사람이 부르지 못하게 막는다.
  if (!serverEnv.cronSecret || req.headers.get('authorization') !== `Bearer ${serverEnv.cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  if (!hasSupabase) return NextResponse.json({ ok: true, db: 'skipped' })

  const started = Date.now()
  const { error } = await getDb().from('invitations').select('id').limit(1)
  if (error) return NextResponse.json({ ok: false, db: 'error', message: error.message }, { status: 503 })
  return NextResponse.json({ ok: true, db: 'ok', ms: Date.now() - started, at: new Date().toISOString() })
}
