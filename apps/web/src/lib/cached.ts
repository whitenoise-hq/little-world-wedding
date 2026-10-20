import 'server-only'
import { cacheTags, type Invitation, type Photo } from '@lww/shared'
import { unstable_cache } from 'next/cache'
import { guestbook, invitations, photos } from './repositories'

// 하객 페이지 데이터 캐시 (docs/PLANNING.md 8장 "캐시").
// - 청첩장 내용·사진은 어드민에서만 바뀌므로 캐시하고, 바뀔 때 어드민이 /api/revalidate 로 태그를 지운다.
// - 갱신 호출이 실패해도 1시간 뒤에는 저절로 새로 읽는다.
// - 방명록은 캐시하지 않는다 (하객이 남긴 글이 바로 보여야 한다).
// Next 16은 'use cache'를 권장하지만 Cache Components 전환이 필요해, 지금 버전에서 지원하는 unstable_cache를 쓴다.
const SAFETY_REVALIDATE = 3600

export const getInvitationBySlug = (slug: string): Promise<Invitation | null> =>
  unstable_cache(() => invitations.getPublishedBySlug(slug), ['invitation-by-slug', slug], {
    tags: [cacheTags.invitation(slug)],
    revalidate: SAFETY_REVALIDATE,
  })()

export const getPhotos = (invitationId: string): Promise<Photo[]> =>
  unstable_cache(() => photos.list(invitationId), ['photos', invitationId], {
    tags: [cacheTags.photos(invitationId)],
    revalidate: SAFETY_REVALIDATE,
  })()

// 방명록은 매번 읽되, DB가 잠시 멈춰도 청첩장은 보이도록 실패하면 빈 목록을 돌려준다
export async function getGuestbook(invitationId: string) {
  try {
    return await guestbook.list(invitationId)
  } catch (e) {
    console.error('방명록을 읽지 못했습니다', e)
    return []
  }
}
