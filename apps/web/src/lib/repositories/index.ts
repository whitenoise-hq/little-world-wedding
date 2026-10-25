import 'server-only'

// 하객용 앱은 서버에서만 데이터를 읽고 쓴다.
export { supabaseGuestbook as guestbook, supabaseInvitations as invitations, supabasePhotos as photos } from './supabase'
