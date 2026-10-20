// 목업 청첩장(packages/shared fixtures)과 방명록을 Supabase에 넣는다. 개발·확인용.
// 이미 같은 slug가 있으면 건너뛴다. 사진은 목업이 data URL이라 넣지 않는다.
// 실행: pnpm db:seed  (apps/admin/.env.local 의 URL과 admin secret 키를 쓴다)
import { readFileSync } from 'node:fs'
import { FIXTURE_GUESTBOOK, FIXTURE_INVITATIONS } from '../packages/shared/src/fixtures'

const env = Object.fromEntries(
  readFileSync(new URL('../apps/admin/.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error('apps/admin/.env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY 가 필요합니다')

const headers = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }
async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  return (res.status === 204 ? null : await res.json()) as T
}

for (const inv of FIXTURE_INVITATIONS) {
  const existing = await rest<{ id: string }[]>(`invitations?select=id&slug=eq.${inv.slug}`)
  if (existing.length) {
    console.log(`건너뜀: ${inv.slug} (이미 있음)`)
    continue
  }
  const [row] = await rest<{ id: string }[]>('invitations', {
    method: 'POST',
    headers: { prefer: 'return=representation' },
    body: JSON.stringify({ slug: inv.slug, theme: inv.theme, is_published: inv.isPublished, content: inv.content }),
  })
  const entries = FIXTURE_GUESTBOOK.filter((e) => e.invitationId === inv.id).map((e) => ({
    invitation_id: row!.id,
    name: e.name,
    message: e.message,
    created_at: e.createdAt,
  }))
  if (entries.length) await rest('guestbook_entries', { method: 'POST', body: JSON.stringify(entries) })
  console.log(`추가: ${inv.slug} (${inv.theme}, 방명록 ${entries.length}개)`)
}
