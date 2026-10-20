'use client'

import { copyText } from './toast'

export function CopyChip({ value, small = false }: { value: string; small?: boolean }) {
  return (
    <button type="button" className={`chip cut${small ? ' chip-sm' : ''}`} onClick={() => copyText(value)}>
      복사
    </button>
  )
}
