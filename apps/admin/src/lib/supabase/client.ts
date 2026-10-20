'use client'

import type { Database } from '@lww/shared'
import { createBrowserClient } from '@supabase/ssr'
import { supabasePublishableKey, supabaseUrl } from './env'

// 브라우저용: 로그인, 사진 업로드
export const createSupabaseBrowser = () => createBrowserClient<Database>(supabaseUrl, supabasePublishableKey)
