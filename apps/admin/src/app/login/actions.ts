'use server'

import { redirect } from 'next/navigation'
import { createSupabase } from '@/lib/supabase/server'

export async function signOut() {
  await (await createSupabase()).auth.signOut()
  redirect('/login')
}
