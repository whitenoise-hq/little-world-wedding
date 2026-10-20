import type { GuestbookEntry, GuestbookRepository, InvitationRepository, PhotoRepository } from '@lww/shared'
import { FIXTURE_GUESTBOOK, FIXTURE_INVITATIONS, FIXTURE_PHOTOS } from '@lww/shared/fixtures'

// 1단계 화면 작업용. 어드민과 따로 도는 프로세스라 어드민에서 고친 내용은 여기 반영되지 않는다.
// 하객용 앱이 쓰는 기능(slug로 읽기, 사진 목록, 방명록 읽기·쓰기)만 구현한다.

const g = globalThis as typeof globalThis & { __lwwGuestbook?: GuestbookEntry[] }
const entries = (g.__lwwGuestbook ??= structuredClone(FIXTURE_GUESTBOOK))

const notForGuests = () => {
  throw new Error('하객용 앱에서는 쓰지 않는 기능입니다')
}

export const memoryInvitations: InvitationRepository = {
  async getPublishedBySlug(slug) {
    const inv = FIXTURE_INVITATIONS.find((i) => i.slug === slug && i.isPublished)
    return inv ? structuredClone(inv) : null
  },
  list: notForGuests,
  getById: notForGuests,
  create: notForGuests,
  update: notForGuests,
  regenerateSlug: notForGuests,
  remove: notForGuests,
}

export const memoryPhotos: PhotoRepository = {
  async list(invitationId) {
    return FIXTURE_PHOTOS.filter((p) => p.invitationId === invitationId).sort((a, b) => a.sortOrder - b.sortOrder)
  },
}

export const memoryGuestbook: GuestbookRepository = {
  async list(invitationId) {
    return entries.filter((e) => e.invitationId === invitationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async add(invitationId, input) {
    const entry: GuestbookEntry = { id: `gb-${crypto.randomUUID()}`, invitationId, ...input, createdAt: new Date().toISOString() }
    entries.push(entry)
    return entry
  },
  remove: notForGuests,
}
