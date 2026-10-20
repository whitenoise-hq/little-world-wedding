import 'server-only'
import { memoryGuestbook, memoryInvitations, memoryPhotos } from './memory'

// 하객용 앱은 서버에서만 데이터를 읽고 쓴다. Supabase를 연결하면 여기서 구현만 바꾼다.
export const invitations = memoryInvitations
export const photos = memoryPhotos
export const guestbook = memoryGuestbook
