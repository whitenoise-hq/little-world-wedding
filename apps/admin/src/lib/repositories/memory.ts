import {
  generateSlug,
  type GuestbookEntry,
  type GuestbookRepository,
  type Invitation,
  type InvitationRepository,
  type Photo,
  type PhotoRepository,
} from '@lww/shared'
import { FIXTURE_GUESTBOOK, FIXTURE_INVITATIONS, FIXTURE_PHOTOS } from '@lww/shared/fixtures'

// 1단계 화면 작업용 in-memory 저장소. 서버를 다시 켜면 목업 데이터로 돌아간다.
// 개발 중 핫 리로드에도 값이 유지되도록 globalThis에 둔다.

interface Store {
  invitations: Invitation[]
  photos: Photo[]
  guestbook: GuestbookEntry[]
}

const g = globalThis as typeof globalThis & { __lwwStore?: Store }
const store: Store = (g.__lwwStore ??= structuredClone({
  invitations: FIXTURE_INVITATIONS,
  photos: FIXTURE_PHOTOS,
  guestbook: FIXTURE_GUESTBOOK,
}))

const now = () => new Date().toISOString()
const clone = <T>(v: T): T => structuredClone(v)

function find(id: string): Invitation {
  const inv = store.invitations.find((i) => i.id === id)
  if (!inv) throw new Error(`청첩장을 찾을 수 없습니다: ${id}`)
  return inv
}

function uniqueSlug(): string {
  let slug = generateSlug()
  while (store.invitations.some((i) => i.slug === slug)) slug = generateSlug()
  return slug
}

export const memoryInvitations: InvitationRepository = {
  async list() {
    return store.invitations
      .map((i) => ({
        id: i.id,
        slug: i.slug,
        theme: i.theme,
        isPublished: i.isPublished,
        groomName: i.content.groom.fullName,
        brideName: i.content.bride.fullName,
        date: i.content.ceremony.date,
        updatedAt: i.updatedAt,
        guestbookCount: store.guestbook.filter((e) => e.invitationId === i.id).length,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async getById(id) {
    const inv = store.invitations.find((i) => i.id === id)
    return inv ? clone(inv) : null
  },
  async getPublishedBySlug(slug) {
    const inv = store.invitations.find((i) => i.slug === slug && i.isPublished)
    return inv ? clone(inv) : null
  },
  async create({ theme, content }) {
    const inv: Invitation = {
      id: `inv-${crypto.randomUUID()}`,
      slug: uniqueSlug(),
      theme,
      isPublished: false,
      content: clone(content),
      coverPhotoId: null,
      createdAt: now(),
      updatedAt: now(),
    }
    store.invitations.push(inv)
    return clone(inv)
  },
  async update(id, patch) {
    const inv = find(id)
    Object.assign(inv, clone(patch), { updatedAt: now() })
    return clone(inv)
  },
  async regenerateSlug(id) {
    const inv = find(id)
    inv.slug = uniqueSlug()
    inv.updatedAt = now()
    return clone(inv)
  },
  async remove(id) {
    store.invitations = store.invitations.filter((i) => i.id !== id)
    store.photos = store.photos.filter((p) => p.invitationId !== id)
    store.guestbook = store.guestbook.filter((e) => e.invitationId !== id)
  },
}

// 목업 모드에서는 파일을 올릴 곳이 없어 업로드는 막고, 나머지 관리 기능만 흉내 낸다.
export const memoryPhotos: PhotoRepository = {
  async list(invitationId) {
    return clone(store.photos.filter((p) => p.invitationId === invitationId).sort((a, b) => a.sortOrder - b.sortOrder))
  },
  async add() {
    throw new Error('목업 모드에서는 사진을 올릴 수 없습니다 (Supabase 키 필요)')
  },
  async updateCaption(id, caption) {
    const p = store.photos.find((x) => x.id === id)
    if (p) p.caption = caption
  },
  async reorder(invitationId, orderedIds) {
    orderedIds.forEach((id, i) => {
      const p = store.photos.find((x) => x.id === id && x.invitationId === invitationId)
      if (p) p.sortOrder = i
    })
  },
  async remove(id) {
    store.photos = store.photos.filter((p) => p.id !== id)
    for (const inv of store.invitations) if (inv.coverPhotoId === id) inv.coverPhotoId = null
  },
}

export const memoryGuestbook: GuestbookRepository = {
  async list(invitationId) {
    return clone(
      store.guestbook.filter((e) => e.invitationId === invitationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  },
  async add(invitationId, input) {
    const entry: GuestbookEntry = { id: `gb-${crypto.randomUUID()}`, invitationId, ...input, createdAt: now() }
    store.guestbook.push(entry)
    return clone(entry)
  },
  async countRecent() {
    return 0
  },
  async remove(id) {
    store.guestbook = store.guestbook.filter((e) => e.id !== id)
  },
}
