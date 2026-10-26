import { cacheTags, isExpired, todayKst, type InvitationContent } from '@lww/shared'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { sendNotice } from '@/lib/alert'
import { serverEnv } from '@/lib/env'
import { getDb } from '@/lib/supabase'

// 이용기간(예식일 + 3개월)이 지난 고객 청첩장을 비공개로 바꾼다. docs/PLANNING.md 7장 "이용기간 만료".
// Vercel Cron이 매일 부른다(vercel.json). 템플릿은 건드리지 않는다. 삭제는 운영자가 어드민에서 직접 한다.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!serverEnv.cronSecret || req.headers.get('authorization') !== `Bearer ${serverEnv.cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const db = getDb()
  const { data, error } = await db.from('invitations').select('id, slug, content').eq('kind', 'customer').eq('is_published', true)
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 503 })

  const today = todayKst()
  const expired = data.filter((row) => isExpired((row.content as Partial<InvitationContent>).ceremony?.date ?? '', today))
  if (expired.length === 0) return NextResponse.json({ ok: true, today, unpublished: [] })

  const { error: updateError } = await db
    .from('invitations')
    .update({ is_published: false })
    .in(
      'id',
      expired.map((row) => row.id),
    )
  if (updateError) return NextResponse.json({ ok: false, message: updateError.message }, { status: 503 })

  // 비공개가 된 주소는 바로 "찾을 수 없음"이 되도록 캐시를 지운다
  for (const row of expired) revalidateTag(cacheTags.invitation(row.slug), { expire: 0 })

  const lines = expired.map((row) => {
    const content = row.content as Partial<InvitationContent>
    return `- /${row.slug} · ${content.groom?.fullName ?? ''} ♥ ${content.bride?.fullName ?? ''} · 예식 ${content.ceremony?.date ?? '-'}`
  })
  await sendNotice(
    `이용기간이 지난 청첩장 ${expired.length}개를 비공개로 바꿨습니다`,
    [`오늘(${today}) 이용기간(예식일 + 3개월)이 지나 비공개로 바꾼 청첩장입니다.`, '', ...lines, '', '확인한 뒤 어드민에서 삭제해 주세요(사진 파일까지 지워집니다).'].join('\n'),
  )
  return NextResponse.json({ ok: true, today, unpublished: expired.map((row) => row.slug) })
}
