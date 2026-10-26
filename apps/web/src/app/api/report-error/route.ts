import { after, NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { sendAlert } from '@/lib/alert'

// 하객 브라우저에서 난 오류를 받아 운영자에게 메일로 알린다. docs/PLANNING.md 9장 "에러 알림".
// 누구나 부를 수 있는 주소라 입력 길이를 자르고, 같은 IP는 10분에 10번까지만 받는다(서버 인스턴스마다 따로 센다).
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 10
const hits = new Map<string, number[]>()

const reportSchema = z.object({
  where: z.enum(['청첩장 화면', '전체 화면', '게임']),
  message: z.string().max(500),
  url: z.string().max(500),
  digest: z.string().max(100).optional(),
})

function allowed(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return false
  hits.set(ip, [...recent, now])
  if (hits.size > 1000) hits.clear()
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  if (!allowed(ip, Date.now())) return new NextResponse(null, { status: 429 })
  const parsed = reportSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return new NextResponse(null, { status: 400 })
  const userAgent = req.headers.get('user-agent') ?? undefined
  after(() => sendAlert({ ...parsed.data, userAgent }))
  return new NextResponse(null, { status: 204 })
}
