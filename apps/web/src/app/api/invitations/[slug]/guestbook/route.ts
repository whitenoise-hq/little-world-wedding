import { createHash } from 'node:crypto'
import { guestbookInputSchema, isValidSlug } from '@lww/shared'
import { NextResponse, type NextRequest } from 'next/server'
import { serverEnv } from '@/lib/env'
import { guestbook, invitations } from '@/lib/repositories'

// 방명록 쓰기. 하객 브라우저는 Supabase에 직접 붙지 않고 이 서버 코드만 거친다.
// 연속 작성 제한: 같은 IP는 청첩장마다 10분에 3번까지. IP는 소금을 친 해시로만 저장한다.
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 3

const hashIp = (ip: string) => createHash('sha256').update(`${serverEnv.ipHashSalt}:${ip}`).digest('hex')

export async function POST(req: NextRequest, ctx: RouteContext<'/api/invitations/[slug]/guestbook'>) {
  const { slug } = await ctx.params
  if (!isValidSlug(slug)) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

  const inv = await invitations.getPublishedBySlug(slug)
  if (!inv) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

  const parsed = guestbookInputSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력을 확인해 주세요.' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  if ((await guestbook.countRecent(inv.id, ipHash, since)) >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: '잠시 후 다시 남겨 주세요.' }, { status: 429 })
  }

  const entry = await guestbook.add(inv.id, parsed.data, ipHash)
  return NextResponse.json({ entry }, { status: 201 })
}
