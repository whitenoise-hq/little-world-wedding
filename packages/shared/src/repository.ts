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

export interface PhotoRepository {
  list(invitationId: string): Promise<Photo[]>
}

export interface GuestbookRepository {
  list(invitationId: string): Promise<GuestbookEntry[]> // 최신순
  add(invitationId: string, input: GuestbookInput): Promise<GuestbookEntry>
  remove(id: string): Promise<void> // 운영자만
}
