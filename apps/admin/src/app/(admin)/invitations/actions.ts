'use server'

import { emptyInvitationContent, invitationContentSchema, THEME_IDS, type InvitationContent, type ThemeId } from '@lww/shared'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { guestbook, invitations } from '@/lib/repositories'

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
