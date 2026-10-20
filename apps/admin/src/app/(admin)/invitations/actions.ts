'use server'

import {
  emptyInvitationContent,
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

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string> }

export async function createInvitation() {
  await requireAdmin()
  const inv = await invitations.create({ theme: 'village', content: emptyInvitationContent() })
  revalidatePath('/invitations')
  redirect(`/invitations/${inv.id}`)
}

export async function saveInvitation(id: string, theme: ThemeId, content: InvitationContent): Promise<SaveResult> {
  await requireAdmin()
  const parsed = z.object({ theme: z.enum(THEME_IDS), content: invitationContentSchema }).safeParse({ theme, content })
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      // 폼은 content 기준 경로(groom.fullName)로 에러를 찾는다
      const [root, ...rest] = issue.path
      const key = (root === 'content' ? rest : issue.path).join('.')
      errors[key] ??= issue.message
    }
    return { ok: false, errors }
  }
  await invitations.update(id, parsed.data)
  revalidatePath('/invitations')
  revalidatePath(`/invitations/${id}`)
  return { ok: true }
}

export async function setPublished(id: string, isPublished: boolean) {
  await requireAdmin()
  await invitations.update(id, { isPublished })
  revalidatePath('/invitations')
  revalidatePath(`/invitations/${id}`)
}

export async function regenerateSlug(id: string) {
  await requireAdmin()
  await invitations.regenerateSlug(id)
  revalidatePath('/invitations')
  revalidatePath(`/invitations/${id}`)
}

export async function deleteInvitation(id: string) {
  await requireAdmin()
  await invitations.remove(id)
  revalidatePath('/invitations')
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
}

export async function updatePhotoCaption(invitationId: string, photoId: string, caption: string) {
  await requireAdmin()
  await photos.updateCaption(photoId, z.string().trim().max(60).parse(caption))
  revalidatePath(`/invitations/${invitationId}`)
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
}

export async function setCoverPhoto(invitationId: string, photoId: string | null) {
  await requireAdmin()
  await invitations.update(invitationId, { coverPhotoId: photoId })
  revalidatePath(`/invitations/${invitationId}`)
}

export async function deletePhoto(invitationId: string, photoId: string) {
  await requireAdmin()
  await photos.remove(photoId)
  revalidatePath(`/invitations/${invitationId}`)
}
