'use server'

import {
  cacheTags,
  invitationContentSchema,
  MAX_PHOTOS,
  THEME_IDS,
  type InvitationContent,
  type NewPhoto,
  type ThemeId,
} from '@lww/shared'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { guestbook, invitations, photos } from '@/lib/repositories'
import { geocodeVenue, searchVenues as searchKakaoVenues, type VenueResult } from '@/lib/geocode'
import { revalidateWeb } from '@/lib/revalidate-web'

// located: 주소가 있는데 지도 위치(좌표)를 못 찾았으면 false. coords는 저장된 좌표(폼에 다시 반영한다)
export type SaveResult =
  | { ok: true; located: boolean; coords: { lat: number | null; lng: number | null } }
  | { ok: false; errors: Record<string, string> }

// 새 청첩장은 "새 청첩장" 화면(/invitations/new)에서 처음 저장할 때 만든다. 버튼만 눌러서는 DB에 남지 않는다.
export type CreateResult = { ok: true; id: string; located: boolean } | { ok: false; errors: Record<string, string> }

export async function createInvitation(theme: ThemeId, content: InvitationContent): Promise<CreateResult> {
  await requireAdmin()
  const parsed = parseForm(theme, content)
  if (!parsed.ok) return parsed
  const located = await withCoordinates(parsed.content)
  const inv = await invitations.create({ theme: parsed.theme, content: located })
  revalidatePath('/invitations')
  return { ok: true, id: inv.id, located: isLocated(located) }
}

export async function saveInvitation(id: string, theme: ThemeId, content: InvitationContent): Promise<SaveResult> {
  await requireAdmin()
  const parsed = parseForm(theme, content)
  if (!parsed.ok) return parsed
  const located = await withCoordinates(parsed.content)
  const inv = await invitations.update(id, { theme: parsed.theme, content: located })
  revalidatePath('/invitations')
  revalidatePath(`/invitations/${id}`)
  await revalidateWeb([cacheTags.invitation(inv.slug)])
  const { lat, lng } = located.ceremony
  return { ok: true, located: isLocated(located), coords: { lat, lng } }
}

function parseForm(
  theme: ThemeId,
  content: InvitationContent,
): { ok: true; theme: ThemeId; content: InvitationContent } | { ok: false; errors: Record<string, string> } {
  const parsed = z.object({ theme: z.enum(THEME_IDS), content: invitationContentSchema }).safeParse({ theme, content })
  if (parsed.success) return { ok: true, ...parsed.data }
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    // 폼은 content 기준 경로(groom.fullName)로 에러를 찾는다
    const [root, ...rest] = issue.path
    const key = (root === 'content' ? rest : issue.path).join('.')
    errors[key] ??= issue.message
  }
  return { ok: false, errors }
}

// 주소가 없거나 좌표를 찾았으면 true (주소가 있는데 좌표가 없을 때만 경고한다)
function isLocated(content: InvitationContent): boolean {
  const { address, lat, lng } = content.ceremony
  return !address.trim() || (lat !== null && lng !== null)
}

// 어드민 "예식장 검색": 예식장 이름으로 카카오 장소를 찾는다
export async function searchVenues(query: string): Promise<{ ok: true; results: VenueResult[] } | { ok: false; error: string }> {
  await requireAdmin()
  const q = query.trim()
  if (q.length < 2 || q.length > 60) return { ok: false, error: '두 글자 이상 입력해 주세요' }
  try {
    return { ok: true, results: await searchKakaoVenues(q) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '장소 검색에 실패했어요' }
  }
}

// 좌표가 비어 있으면 카카오 로컬 API로 주소 → 좌표를 찾아 채운다(하객 화면 지도용).
// 폼은 예식장 검색으로 고르면 좌표를 넣고, 주소를 손으로 고치면 좌표를 비운다. 그래서 좌표가 있으면 그대로 쓴다.
// 못 찾으면 좌표를 비워 두고 저장한다.
async function withCoordinates(content: InvitationContent): Promise<InvitationContent> {
  const { address, venueName, lat, lng } = content.ceremony
  if (!address.trim()) return { ...content, ceremony: { ...content.ceremony, lat: null, lng: null } }
  if (lat !== null && lng !== null) return content
  const found = await geocodeVenue(address, venueName)
  return { ...content, ceremony: { ...content.ceremony, lat: found?.lat ?? null, lng: found?.lng ?? null } }
}

export async function setPublished(id: string, isPublished: boolean) {
  await requireAdmin()
  const inv = await invitations.update(id, { isPublished })
  revalidatePath('/invitations')
  revalidatePath(`/invitations/${id}`)
  await revalidateWeb([cacheTags.invitation(inv.slug)])
}

// 템플릿(홍보용 샘플)은 주소가 스토어 상세 QR에 들어가 있어 삭제·주소 변경을 막는다. docs/PLANNING.md 7장
function assertNotTemplate(inv: { kind: string } | null) {
  if (inv?.kind === 'template') throw new Error('템플릿은 삭제하거나 주소를 바꿀 수 없어요')
}

export async function regenerateSlug(id: string) {
  await requireAdmin()
  const before = await invitations.getById(id)
  assertNotTemplate(before)
  const after = await invitations.regenerateSlug(id)
  revalidatePath('/invitations')
  revalidatePath(`/invitations/${id}`)
  // 예전 주소의 캐시도 지워야 예전 링크로 더는 열리지 않는다
  await revalidateWeb([...(before ? [cacheTags.invitation(before.slug)] : []), cacheTags.invitation(after.slug)])
}

export async function deleteInvitation(id: string) {
  await requireAdmin()
  const inv = await invitations.getById(id)
  assertNotTemplate(inv)
  await invitations.remove(id)
  revalidatePath('/invitations')
  if (inv) await revalidateWeb([cacheTags.invitation(inv.slug), cacheTags.photos(id)])
  redirect('/invitations')
}

export async function deleteGuestbookEntry(invitationId: string, entryId: string) {
  await requireAdmin()
  await guestbook.remove(entryId)
  revalidatePath(`/invitations/${invitationId}/guestbook`)
  revalidatePath('/invitations')
}

// ── 사진 ─────────────────────────────
// 파일은 브라우저가 Storage에 직접 올리고(운영자 세션, RLS), 여기서는 DB 행만 다룬다.

const photoPath = (invitationId: string) =>
  z.string().regex(new RegExp(`^${invitationId}/[0-9a-f-]{36}-(thumb|full)\\.(webp|jpg)$`), '잘못된 사진 경로입니다')

export async function addPhotos(invitationId: string, items: NewPhoto[]) {
  await requireAdmin()
  const schema = z
    .array(z.object({ id: z.uuid(), thumbPath: photoPath(invitationId), fullPath: photoPath(invitationId), caption: z.string().max(60) }))
    .min(1)
  const parsed = schema.parse(items)
  const current = await photos.list(invitationId)
  if (current.length + parsed.length > MAX_PHOTOS) throw new Error(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`)
  await photos.add(invitationId, parsed)
  revalidatePath(`/invitations/${invitationId}`)
  await revalidateWeb([cacheTags.photos(invitationId)])
}

export async function updatePhotoCaption(invitationId: string, photoId: string, caption: string) {
  await requireAdmin()
  await photos.updateCaption(photoId, z.string().trim().max(60).parse(caption))
  revalidatePath(`/invitations/${invitationId}`)
  await revalidateWeb([cacheTags.photos(invitationId)])
}

export async function movePhoto(invitationId: string, photoId: string, direction: -1 | 1) {
  await requireAdmin()
  const ids = (await photos.list(invitationId)).map((p) => p.id)
  const i = ids.indexOf(photoId)
  const j = i + direction
  if (i < 0 || j < 0 || j >= ids.length) return
  ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  await photos.reorder(invitationId, ids)
  revalidatePath(`/invitations/${invitationId}`)
  await revalidateWeb([cacheTags.photos(invitationId)])
}

export async function setCoverPhoto(invitationId: string, photoId: string | null) {
  await requireAdmin()
  const inv = await invitations.update(invitationId, { coverPhotoId: photoId })
  revalidatePath(`/invitations/${invitationId}`)
  await revalidateWeb([cacheTags.invitation(inv.slug)])
}

export async function deletePhoto(invitationId: string, photoId: string) {
  await requireAdmin()
  await photos.remove(photoId)
  revalidatePath(`/invitations/${invitationId}`)
  await revalidateWeb([cacheTags.photos(invitationId)])
}
