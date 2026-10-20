import { describe, expect, it } from 'vitest'
import { daysUntil, formatCeremonyKo, formatCeremonyShort, formatDateKo, formatTimeKo } from './format'

describe('format', () => {
  it('예식 일시를 한국어로 쓴다', () => {
    expect(formatCeremonyKo('2027-05-22', '12:30')).toBe('2027년 5월 22일 토요일 낮 12시 30분')
    expect(formatCeremonyKo('2027-09-11', '11:00')).toBe('2027년 9월 11일 토요일 오전 11시')
    expect(formatCeremonyKo('2027-09-11', '18:00')).toBe('2027년 9월 11일 토요일 오후 6시')
  })

  it('날짜와 시간을 따로 쓴다', () => {
    expect(formatDateKo('2027-05-22')).toBe('2027년 5월 22일 토요일')
    expect(formatTimeKo('12:30')).toBe('낮 12시 30분')
  })

  it('짧은 형식', () => {
    expect(formatCeremonyShort('2027-05-22', '12:30')).toBe('2027.05.22 SAT 12:30')
  })

  it('D-day는 한국 날짜 기준', () => {
    // 한국 시간 2027-05-21 23:30
    expect(daysUntil('2027-05-22', new Date('2027-05-21T14:30:00Z'))).toBe(1)
    // 한국 시간 2027-05-22 00:30
    expect(daysUntil('2027-05-22', new Date('2027-05-21T15:30:00Z'))).toBe(0)
  })
})
