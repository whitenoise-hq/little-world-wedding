import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'

// 어드민이 청첩장·사진을 바꾼 뒤 부르는 캐시 갱신 주소. REVALIDATE_TOKEN 으로 보호한다.
const bodySchema = z.object({ tags: z.array(z.string().regex(/^(invitation|photos):[\w-]{1,64}$/)).min(1).max(10) })

export async function POST(req: NextRequest) {
  if (!serverEnv.revalidateToken || req.headers.get('authorization') !== `Bearer ${serverEnv.revalidateToken}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 })
  // 어드민에서 저장한 내용은 바로 보여야 하므로 오래된 캐시를 내보내지 않는다
  for (const tag of parsed.data.tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ ok: true, tags: parsed.data.tags })
}
