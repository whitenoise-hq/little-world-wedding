import { describe, expect, it } from 'vitest'
import { SLUG_LENGTH, generateSlug, isValidSlug } from './slug'

describe('generateSlug', () => {
  it('영어 소문자 8자리를 만든다', () => {
    for (let i = 0; i < 1000; i++) {
      const slug = generateSlug()
      expect(slug).toHaveLength(SLUG_LENGTH)
      expect(isValidSlug(slug)).toBe(true)
    }
  })

  it('모든 글자가 고르게 나온다', () => {
    const counts = new Map<string, number>()
    const total = 26_000 * SLUG_LENGTH
    for (let i = 0; i < total / SLUG_LENGTH; i++) {
      for (const c of generateSlug()) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    expect(counts.size).toBe(26)
    const expected = total / 26
    for (const n of counts.values()) expect(Math.abs(n - expected) / expected).toBeLessThan(0.05)
  })
})

describe('isValidSlug', () => {
  it('형식이 다르면 거부한다', () => {
    expect(isValidSlug('abcdefg')).toBe(false)
    expect(isValidSlug('abcdefghi')).toBe(false)
    expect(isValidSlug('ABCDEFGH')).toBe(false)
    expect(isValidSlug('abcd1234')).toBe(false)
  })
})
