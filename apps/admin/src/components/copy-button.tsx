'use client'

import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyButton({ value, label = '복사' }: { value: string; label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        toast.success('복사했어요')
      }}
    >
      <CopyIcon />
      {label}
    </Button>
  )
}
