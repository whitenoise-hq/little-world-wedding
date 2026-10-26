import { describe, expect, it } from 'vitest'
import { expiryDate, isExpired, todayKst } from './lifecycle'

describe('이용기간 (예식일 + 3개월)', () => {
  it('예식일에서 3개월 뒤 같은 날까지', () => {
    expect(expiryDate('2027-05-22')).toBe('2027-08-22')
    expect(expiryDate('2027-10-16')).toBe('2028-01-16')
  })

  it('3개월 뒤 같은 날이 없으면 그달 말일', () => {
    expect(expiryDate('2027-11-30')).toBe('2028-02-29')
    expect(expiryDate('2026-11-30')).toBe('2027-02-28')
    expect(expiryDate('2027-05-31')).toBe('2027-08-31')
  })

  it('날짜가 없거나 잘못되면 만료일도 없다', () => {
    expect(expiryDate('')).toBeNull()
    expect(expiryDate('2027-13-01')).toBeNull()
  })

  it('만료일 다음 날부터 만료', () => {
    expect(isExpired('2027-05-22', '2027-08-22')).toBe(false)
    expect(isExpired('2027-05-22', '2027-08-23')).toBe(true)
    expect(isExpired('', '2030-01-01')).toBe(false)
  })

  it('오늘은 한국 날짜 기준', () => {
    expect(todayKst(new Date('2027-08-22T14:59:00Z'))).toBe('2027-08-22')
    expect(todayKst(new Date('2027-08-22T15:00:00Z'))).toBe('2027-08-23')
  })
})
