import type { Tables } from './database.types'
import { emptyInvitationContent, type GuestbookEntry, type Invitation, type InvitationContent, type Photo } from './invitation'
import type { ThemeId } from './themes'

// DB 행 ↔ 화면 모델 변환. 두 앱의 Supabase 저장소가 같이 쓴다.

export type InvitationRow = Tables<'invitations'>
export type PhotoRow = Tables<'photos'>
export type GuestbookRow = Tables<'guestbook_entries'>

export const PHOTO_BUCKET = 'photos'

export const photoPublicUrl = (supabaseUrl: string, path: string) =>
  `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`

// 저장할 때 zod로 검증한 값이라 여기서는 다시 검증하지 않는다.
// 새로 생긴 항목이 예전 데이터에 없을 수 있으니 기본값 위에 덮어쓴다.
export function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    slug: row.slug,
    theme: row.theme as ThemeId,
    kind: row.kind === 'template' ? 'template' : 'customer',
    isPublished: row.is_published,
    content: { ...emptyInvitationContent(), ...(row.content as Partial<InvitationContent>) },
    coverPhotoId: row.cover_photo_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toPhoto(row: PhotoRow, supabaseUrl: string): Photo {
  return {
    id: row.id,
    invitationId: row.invitation_id,
    thumbUrl: photoPublicUrl(supabaseUrl, row.thumb_path),
    fullUrl: photoPublicUrl(supabaseUrl, row.full_path),
    caption: row.caption,
    sortOrder: row.sort_order,
  }
}

export function toGuestbookEntry(row: Pick<GuestbookRow, 'id' | 'invitation_id' | 'name' | 'message' | 'created_at'>): GuestbookEntry {
  return { id: row.id, invitationId: row.invitation_id, name: row.name, message: row.message, createdAt: row.created_at }
}
