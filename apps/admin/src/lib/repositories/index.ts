import 'server-only'
import { hasSupabase } from '../supabase/env'
import { memoryGuestbook, memoryInvitations, memoryPhotos } from './memory'
import { supabaseGuestbook, supabaseInvitations, supabasePhotos } from './supabase'

// Supabase 키가 없으면 목업(in-memory)으로 돈다. 화면 코드는 어느 쪽이든 그대로다.
export const invitations = hasSupabase ? supabaseInvitations : memoryInvitations
export const photos = hasSupabase ? supabasePhotos : memoryPhotos
export const guestbook = hasSupabase ? supabaseGuestbook : memoryGuestbook
