// 샘플(템플릿) 청첩장을 실제 DB에 적용한다. 내용은 packages/shared/src/templates.ts 가 기준이다.
// - 같은 주소(slug)가 있으면 내용만 갱신하고, 없으면 새로 만든다. 올린 사진은 건드리지 않는다.
// - 예전 목업 주소(ejdushfe, qmwvhzta)로 된 청첩장이 있으면 그 행을 템플릿으로 바꾼다.
// - 샘플 방명록은 방명록이 비어 있을 때만 넣는다 (방문자가 남긴 글을 지우지 않는다).
// - --reset-samples: 샘플 방명록만 지우고 새 내용으로 다시 넣는다. 샘플 글은 templates.ts의 작성 시각과
//   정확히 같은 시각으로 들어가 있어서, 그 시각의 글만 지우면 방문자 글은 그대로 남는다.
// - 끝나면 하객 화면 캐시(하루)를 지운다. 로컬(NEXT_PUBLIC_WEB_URL)과 배포 주소에 어드민과 같은 방식으로
//   POST /api/revalidate 를 보낸다(REVALIDATE_TOKEN). 실패해도 DB 적용은 그대로이고, 하루 뒤에 저절로 반영된다.
// 실행: pnpm db:templates [--reset-samples]  (apps/admin/.env.local 의 URL과 admin secret 키를 쓴다)
import { readFileSync } from 'node:fs'
import { cacheTags } from '../packages/shared/src/repository'
import { TEMPLATE_GUESTBOOK, TEMPLATE_INVITATIONS } from '../packages/shared/src/templates'

const resetSamples = process.argv.includes('--reset-samples')
const LEGACY_SLUGS: Record<string, string> = { village: 'ejdushfe', space: 'qmwvhzta' }
const PRODUCTION_WEB_URL = 'https://little-world-wedding.vercel.app'

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
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

for (const tpl of TEMPLATE_INVITATIONS) {
  const fields = { slug: tpl.slug, theme: tpl.theme, kind: 'template', is_published: true, content: tpl.content }
  const legacy = LEGACY_SLUGS[tpl.theme]
  const slugs = legacy ? `${tpl.slug},${legacy}` : tpl.slug
  const found = await rest<{ id: string; slug: string }[]>(`invitations?select=id,slug&slug=in.(${slugs})`)
  const target = found.find((r) => r.slug === tpl.slug) ?? found[0]
  let id: string
  if (target) {
    await rest(`invitations?id=eq.${target.id}`, { method: 'PATCH', body: JSON.stringify(fields) })
    id = target.id
    console.log(`갱신: ${target.slug} → /${tpl.slug} (${tpl.theme})`)
  } else {
    const [row] = await rest<{ id: string }[]>('invitations', {
      method: 'POST',
      headers: { prefer: 'return=representation' },
      body: JSON.stringify(fields),
    })
    id = row!.id
    console.log(`추가: /${tpl.slug} (${tpl.theme})`)
  }

  const samples = TEMPLATE_GUESTBOOK.filter((e) => e.invitationId === tpl.id)
  if (resetSamples) {
    const times = samples.map((e) => `"${e.createdAt}"`).join(',')
    const removed = await rest<unknown[]>(`guestbook_entries?invitation_id=eq.${id}&created_at=in.(${times})`, {
      method: 'DELETE',
      headers: { prefer: 'return=representation' },
    })
    console.log(`  방명록: 예전 샘플 ${removed.length}개 삭제`)
  }
  // --reset-samples면 방문자 글이 있어도 샘플을 다시 넣는다
  const existing = resetSamples ? [] : await rest<{ id: string }[]>(`guestbook_entries?select=id&invitation_id=eq.${id}&limit=1`)
  if (existing.length) {
    console.log('  방명록: 이미 글이 있어 그대로 둠')
    continue
  }
  const entries = samples.map((e) => ({
    invitation_id: id,
    name: e.name,
    message: e.message,
    created_at: e.createdAt,
  }))
  if (entries.length) await rest('guestbook_entries', { method: 'POST', body: JSON.stringify(entries) })
  console.log(`  방명록: 샘플 ${entries.length}개 추가`)
}

// 하객 화면 캐시 지우기 (어드민 revalidateWeb과 같은 요청)
const token = env.REVALIDATE_TOKEN
const webUrls = [...new Set([env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000', PRODUCTION_WEB_URL].map((u) => u.replace(/\/$/, '')))]
const tags = TEMPLATE_INVITATIONS.map((tpl) => cacheTags.invitation(tpl.slug))
if (!token) console.log('캐시: REVALIDATE_TOKEN이 없어 건너뜀 (하객 화면은 하루 안에 반영)')
for (const web of token ? webUrls : []) {
  try {
    const res = await fetch(`${web}/api/revalidate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(5000),
    })
    console.log(`캐시: ${web} ${res.ok ? '지움' : `실패 ${res.status}${res.status === 401 ? ' (REVALIDATE_TOKEN이 그쪽 값과 다름)' : ''}`}`)
  } catch {
    console.log(`캐시: ${web} 연결 안 됨 (서버가 꺼져 있으면 무시해도 됨)`)
  }
}
