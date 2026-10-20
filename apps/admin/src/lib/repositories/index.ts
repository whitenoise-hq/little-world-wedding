import 'server-only'
import { memoryGuestbook, memoryInvitations, memoryPhotos } from './memory'

// Supabase를 연결하면 여기서 구현만 바꾼다. 화면 코드는 그대로 둔다.
export const invitations = memoryInvitations
export const photos = memoryPhotos
export const guestbook = memoryGuestbook
