import 'server-only'
import {
  toGuestbookEntry,
  toInvitation,
  toPhoto,
  type Database,
  type GuestbookRepository,
  type InvitationRepository,
  type PhotoRepository,
} from '@lww/shared'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '../env'

// 하객용 앱의 Supabase 저장소. web 전용 secret 키로 서버에서만 접근한다 (docs/PLANNING.md 8장).
// 하객에게 필요한 기능만 구현한다: slug로 읽기, 사진 목록, 방명록 읽기·쓰기.

const db = createClient<Database>(serverEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const notForGuests = () => {
  throw new Error('하객용 앱에서는 쓰지 않는 기능입니다')
}

// 결과가 반드시 있어야 하는 조회 (목록·insert 결과)
function must<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null || res.data === undefined) throw new Error('결과가 없습니다')
  return res.data
}

export const supabaseInvitations: InvitationRepository = {
  async getPublishedBySlug(slug) {
    const { data, error } = await db.from('invitations').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toInvitation(data) : null
  },
  list: notForGuests,
  getById: notForGuests,
  create: notForGuests,
  update: notForGuests,
  regenerateSlug: notForGuests,
  remove: notForGuests,
}

export const supabasePhotos: PhotoRepository = {
  async list(invitationId) {
    const rows = must(await db.from('photos').select('*').eq('invitation_id', invitationId).order('sort_order'))
    return rows.map((r) => toPhoto(r, serverEnv.supabaseUrl))
  },
}

export const supabaseGuestbook: GuestbookRepository = {
  async list(invitationId) {
    const rows = must(
      await db
        .from('guestbook_entries')
        .select('id, invitation_id, name, message, created_at')
        .eq('invitation_id', invitationId)
        .order('created_at', { ascending: false }),
    )
    return rows.map(toGuestbookEntry)
  },
  async add(invitationId, input, ipHash) {
    const row = must(
      await db
        .from('guestbook_entries')
        .insert({ invitation_id: invitationId, name: input.name, message: input.message, ip_hash: ipHash ?? null })
        .select('id, invitation_id, name, message, created_at')
        .single(),
    )
    return toGuestbookEntry(row)
  },
  async countRecent(invitationId, ipHash, since) {
    const { count, error } = await db
      .from('guestbook_entries')
      .select('id', { count: 'exact', head: true })
      .eq('invitation_id', invitationId)
      .eq('ip_hash', ipHash)
      .gte('created_at', since)
    if (error) throw new Error(error.message)
    return count ?? 0
  },
  remove: notForGuests,
}
