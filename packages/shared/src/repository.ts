import type { ThemeId } from './themes'
import type { GuestbookEntry, Invitation, InvitationContent, Photo } from './invitation'
import type { GuestbookInput } from './guestbook'

// 화면 코드는 이 인터페이스만 쓴다. 목업(in-memory)과 Supabase 구현을 바꿔 끼운다.

export interface InvitationSummary {
  id: string
  slug: string
  theme: ThemeId
  isPublished: boolean
  groomName: string
  brideName: string
  date: string
  updatedAt: string
  guestbookCount: number
}

export interface InvitationRepository {
  list(): Promise<InvitationSummary[]>
  getById(id: string): Promise<Invitation | null>
  // 하객용: 공개된 청첩장만 돌려준다
  getPublishedBySlug(slug: string): Promise<Invitation | null>
  create(input: { theme: ThemeId; content: InvitationContent }): Promise<Invitation>
  update(id: string, patch: Partial<Pick<Invitation, 'theme' | 'isPublished' | 'content' | 'coverPhotoId'>>): Promise<Invitation>
  regenerateSlug(id: string): Promise<Invitation>
  remove(id: string): Promise<void>
}

export interface NewPhoto {
  id: string // 저장 경로에 쓰려고 브라우저에서 미리 만든 uuid
  thumbPath: string
  fullPath: string
  caption: string
}

export interface PhotoRepository {
  list(invitationId: string): Promise<Photo[]> // sort_order 순
  add(invitationId: string, photos: NewPhoto[]): Promise<void> // 뒤에 이어 붙인다
  updateCaption(id: string, caption: string): Promise<void>
  reorder(invitationId: string, orderedIds: string[]): Promise<void>
  remove(id: string): Promise<void> // 저장소 파일까지 지운다
}

export interface GuestbookRepository {
  list(invitationId: string): Promise<GuestbookEntry[]> // 최신순
  // ipHash: 연속 작성 제한용 IP 해시 (원본 IP는 저장하지 않는다)
  add(invitationId: string, input: GuestbookInput, ipHash?: string): Promise<GuestbookEntry>
  // since(ISO 시각) 이후 같은 IP 해시로 남긴 글 수
  countRecent(invitationId: string, ipHash: string, since: string): Promise<number>
  remove(id: string): Promise<void> // 운영자만
}
