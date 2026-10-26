import { describe, expect, it } from 'vitest'
import { BGM_FILES, bgmLabel } from './bgm'
import { emptyInvitationContent, invitationContentSchema } from './invitation'

const withBgm = (bgmUrl: string) => ({ ...emptyInvitationContent(), decor: { bgmUrl } })
const bgmError = (bgmUrl: string) =>
  invitationContentSchema.safeParse(withBgm(bgmUrl)).error?.issues.some((i) => i.path.join('.') === 'decor.bgmUrl') ?? false

describe('배경음악', () => {
  it('기본 곡 경로, 외부 주소, 없음은 통과한다', () => {
    for (const file of BGM_FILES) expect(bgmError(file)).toBe(false)
    expect(bgmError('https://example.com/a.mp3')).toBe(false)
    expect(bgmError('')).toBe(false)
  })

  it('목록에 없는 경로는 막는다', () => {
    expect(bgmError('/bgm/none.mp3')).toBe(true)
    expect(bgmError('piano')).toBe(true)
  })

  it('곡 이름을 찾는다', () => {
    expect(bgmLabel('/bgm/piano.mp3')).toBe('잔잔한 피아노')
    expect(bgmLabel('https://example.com/a.mp3')).toBeNull()
  })
})
