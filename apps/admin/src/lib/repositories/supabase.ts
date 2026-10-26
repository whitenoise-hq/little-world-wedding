import 'server-only'
import {
  generateSlug,
  PHOTO_BUCKET,
  toGuestbookEntry,
  toInvitation,
  toPhoto,
  type GuestbookRepository,
  type InvitationContent,
  type InvitationRepository,
  type ThemeId,
  type PhotoRepository,
} from '@lww/shared'
import { supabaseUrl } from '../supabase/env'
import { createSupabase } from '../supabase/server'

// 어드민의 Supabase 저장소. 로그인한 운영자 세션으로 접근하고, 권한은 RLS가 판단한다.

function must<T>(res: { data: T; error: { message: string; code?: string } | null }): NonNullable<T> {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code })
  if (res.data === null || res.data === undefined) throw new Error('결과가 없습니다')
  return res.data
}

const UNIQUE_VIOLATION = '23505'
const SLUG_RETRIES = 5

// slug가 겹치면(unique 위반) 새로 뽑아 다시 시도한다
async function withFreshSlug<T>(run: (slug: string) => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await run(generateSlug())
    } catch (e) {
      if ((e as { code?: string }).code !== UNIQUE_VIOLATION || i >= SLUG_RETRIES) throw e
    }
  }
}

export const supabaseInvitations: InvitationRepository = {
  async list() {
    const db = await createSupabase()
    const rows = must(
      await db
        .from('invitations')
        .select('id, slug, theme, kind, is_published, content, updated_at, guestbook_entries(count)')
        .order('updated_at', { ascending: false }),
    )
    return rows.map((r) => {
      const content = r.content as Partial<InvitationContent>
      return {
        id: r.id,
        slug: r.slug,
        theme: r.theme as ThemeId,
        kind: r.kind === 'template' ? ('template' as const) : ('customer' as const),
        isPublished: r.is_published,
        groomName: content.groom?.fullName ?? '',
        brideName: content.bride?.fullName ?? '',
        date: content.ceremony?.date ?? '',
        updatedAt: r.updated_at,
        guestbookCount: r.guestbook_entries[0]?.count ?? 0,
      }
    })
  },
  async getById(id) {
    const db = await createSupabase()
    const { data, error } = await db.from('invitations').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toInvitation(data) : null
  },
  async getPublishedBySlug(slug) {
    const db = await createSupabase()
    const { data, error } = await db.from('invitations').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toInvitation(data) : null
  },
  async create({ theme, content }) {
    const db = await createSupabase()
    const row = await withFreshSlug(async (slug) =>
      must(await db.from('invitations').insert({ slug, theme, content, is_published: false }).select('*').single()),
    )
    return toInvitation(row)
  },
  async update(id, patch) {
    const db = await createSupabase()
    const row = must(
      await db
        .from('invitations')
        .update({
          ...(patch.theme !== undefined && { theme: patch.theme }),
          ...(patch.isPublished !== undefined && { is_published: patch.isPublished }),
          ...(patch.content !== undefined && { content: patch.content }),
          ...(patch.coverPhotoId !== undefined && { cover_photo_id: patch.coverPhotoId }),
        })
        .eq('id', id)
        .select('*')
        .single(),
    )
    return toInvitation(row)
  },
  async regenerateSlug(id) {
    const db = await createSupabase()
    const row = await withFreshSlug(async (slug) => must(await db.from('invitations').update({ slug }).eq('id', id).select('*').single()))
    return toInvitation(row)
  },
  async remove(id) {
    const db = await createSupabase()
    // 사진 파일을 먼저 지운다 (DB 행은 cascade로 함께 지워진다)
    const photos = must(await db.from('photos').select('thumb_path, full_path').eq('invitation_id', id))
    const paths = photos.flatMap((p) => [p.thumb_path, p.full_path])
    if (paths.length) {
      const { error } = await db.storage.from(PHOTO_BUCKET).remove(paths)
      if (error) throw new Error(error.message)
    }
    const { error } = await db.from('invitations').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const supabasePhotos: PhotoRepository = {
  async list(invitationId) {
    const db = await createSupabase()
    const rows = must(await db.from('photos').select('*').eq('invitation_id', invitationId).order('sort_order'))
    return rows.map((r) => toPhoto(r, supabaseUrl))
  },
  async add(invitationId, photos) {
    const db = await createSupabase()
    const last = must(
      await db.from('photos').select('sort_order').eq('invitation_id', invitationId).order('sort_order', { ascending: false }).limit(1),
    )
    const start = (last[0]?.sort_order ?? -1) + 1
    const { error } = await db.from('photos').insert(
      photos.map((p, i) => ({
        id: p.id,
        invitation_id: invitationId,
        thumb_path: p.thumbPath,
        full_path: p.fullPath,
        caption: p.caption,
        sort_order: start + i,
      })),
    )
    if (error) throw new Error(error.message)
  },
  async updateCaption(id, caption) {
    const db = await createSupabase()
    const { error } = await db.from('photos').update({ caption }).eq('id', id)
    if (error) throw new Error(error.message)
  },
  async reorder(invitationId, orderedIds) {
    const db = await createSupabase()
    // 사진 수가 많지 않아(최대 20장) 한 장씩 갱신한다
    for (const [i, id] of orderedIds.entries()) {
      const { error } = await db.from('photos').update({ sort_order: i }).eq('id', id).eq('invitation_id', invitationId)
      if (error) throw new Error(error.message)
    }
  },
  async remove(id) {
    const db = await createSupabase()
    const row = must(await db.from('photos').select('thumb_path, full_path').eq('id', id).single())
    const { error: storageError } = await db.storage.from(PHOTO_BUCKET).remove([row.thumb_path, row.full_path])
    if (storageError) throw new Error(storageError.message)
    const { error } = await db.from('photos').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

const notForAdmin = () => {
  throw new Error('어드민에서는 쓰지 않는 기능입니다')
}

export const supabaseGuestbook: GuestbookRepository = {
  async list(invitationId) {
    const db = await createSupabase()
    const rows = must(
      await db
        .from('guestbook_entries')
        .select('id, invitation_id, name, message, created_at')
        .eq('invitation_id', invitationId)
        .order('created_at', { ascending: false }),
    )
    return rows.map(toGuestbookEntry)
  },
  add: notForAdmin,
  countRecent: notForAdmin,
  async remove(id) {
    const db = await createSupabase()
    const { error } = await db.from('guestbook_entries').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
