import 'server-only'
import { hasSupabase } from '../env'
import { memoryGuestbook, memoryInvitations, memoryPhotos } from './memory'
import { supabaseGuestbook, supabaseInvitations, supabasePhotos } from './supabase'

// 하객용 앱은 서버에서만 데이터를 읽고 쓴다. Supabase 키가 없으면 목업으로 돈다.
export const invitations = hasSupabase ? supabaseInvitations : memoryInvitations
export const photos = hasSupabase ? supabasePhotos : memoryPhotos
export const guestbook = hasSupabase ? supabaseGuestbook : memoryGuestbook
