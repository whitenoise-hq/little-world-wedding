'use client'

import { CopyIcon } from './icons'
import { copyText } from './toast'

export function CopyButton({ value, label = '복사' }: { value: string; label?: string }) {
  return (
    <button type="button" className="btn btn-sm" onClick={() => copyText(value)}>
      <CopyIcon size={14} />
      {label}
    </button>
  )
}
