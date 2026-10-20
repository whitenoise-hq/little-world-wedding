import 'server-only'
import { WEB_URL } from './env'

// 하객용 앱(apps/web)의 캐시를 지운다. 태그는 packages/shared 의 cacheTags.
// 실패해도 저장 자체는 성공으로 둔다: 하객 페이지는 늦어도 1시간 뒤에 저절로 새로 읽는다.
export async function revalidateWeb(tags: string[]) {
  const token = process.env.REVALIDATE_TOKEN
  if (!token || tags.length === 0) return
  try {
    const res = await fetch(`${WEB_URL}/api/revalidate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ tags }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('하객 페이지 캐시 갱신 실패', res.status)
  } catch (e) {
    console.error('하객 페이지 캐시 갱신 실패', e)
  }
}
