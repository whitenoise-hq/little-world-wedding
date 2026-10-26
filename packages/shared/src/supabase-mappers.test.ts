import { describe, expect, it } from 'vitest'
import { toInvitation, type InvitationRow } from './supabase-mappers'

const row = (kind: string): InvitationRow => ({
  id: 'id-1',
  slug: 'abcdefgh',
  theme: 'village',
  kind,
  is_published: true,
  content: {},
  cover_photo_id: null,
  created_at: '2026-10-27T00:00:00Z',
  updated_at: '2026-10-27T00:00:00Z',
})

describe('toInvitation kind', () => {
  it('template 행은 템플릿으로 읽는다', () => {
    expect(toInvitation(row('template')).kind).toBe('template')
  })

  it('그 밖의 값은 고객 청첩장으로 읽는다', () => {
    expect(toInvitation(row('customer')).kind).toBe('customer')
    expect(toInvitation(row('')).kind).toBe('customer')
  })
})
