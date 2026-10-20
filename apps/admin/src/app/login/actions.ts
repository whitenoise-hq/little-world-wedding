'use server'

import { redirect } from 'next/navigation'
import { hasSupabase } from '@/lib/supabase/env'
import { createSupabase } from '@/lib/supabase/server'

export async function signOut() {
  if (hasSupabase) await (await createSupabase()).auth.signOut()
  redirect('/login')
}
