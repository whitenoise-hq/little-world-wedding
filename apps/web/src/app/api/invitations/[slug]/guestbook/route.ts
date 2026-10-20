import { guestbookInputSchema, isValidSlug } from '@lww/shared'
import { NextResponse, type NextRequest } from 'next/server'
import { allow } from '@/lib/rate-limit'
import { guestbook, invitations } from '@/lib/repositories'

// 방명록 쓰기. 하객 브라우저는 Supabase에 직접 붙지 않고 이 서버 코드만 거친다.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/invitations/[slug]/guestbook'>) {
  const { slug } = await ctx.params
  if (!isValidSlug(slug)) return NextResponse.json({ error: '청첩장을 찾을 수 없어요' }, { status: 404 })

  const inv = await invitations.getPublishedBySlug(slug)
  if (!inv) return NextResponse.json({ error: '청첩장을 찾을 수 없어요' }, { status: 404 })

  const parsed = guestbookInputSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력을 확인해 주세요' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (!allow(`${inv.id}:${ip}`)) return NextResponse.json({ error: '잠시 뒤에 다시 남겨 주세요' }, { status: 429 })

  const entry = await guestbook.add(inv.id, parsed.data)
  return NextResponse.json({ entry }, { status: 201 })
}
