'use client'

import { GUESTBOOK_LIMITS, guestbookInputSchema, type GuestbookEntry } from '@lww/shared'
import { useState } from 'react'
import { toast } from './toast'

export function Guestbook({ slug, initial }: { slug: string; initial: GuestbookEntry[] }) {
  const [entries, setEntries] = useState(initial)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ name?: string | undefined; message?: string | undefined }>({})
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = guestbookInputSchema.safeParse({ name, message })
    if (!parsed.success) {
      const next: typeof errors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as 'name' | 'message'
        next[key] ??= issue.message
      }
      setErrors(next)
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/invitations/${slug}/guestbook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body = (await res.json()) as { entry?: GuestbookEntry; error?: string }
      if (!res.ok || !body.entry) {
        toast(body.error ?? '남기지 못했어요. 잠시 뒤 다시 해 주세요')
        return
      }
      setEntries((list) => [body.entry!, ...list])
      setName('')
      setMessage('')
      setErrors({})
      toast('마음을 남겼어요')
    } catch {
      toast('남기지 못했어요. 잠시 뒤 다시 해 주세요')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="sec">
      <h2>✦ 방명록</h2>
      <form onSubmit={submit} noValidate>
        <input
          className="fld"
          placeholder="이름"
          maxLength={GUESTBOOK_LIMITS.name}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((x) => ({ ...x, name: undefined }))
          }}
          aria-label="이름"
          aria-invalid={!!errors.name}
        />
        {errors.name && <div className="err">{errors.name}</div>}
        <textarea
          className="fld"
          placeholder="축하 메시지를 남겨 주세요"
          maxLength={GUESTBOOK_LIMITS.message}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setErrors((x) => ({ ...x, message: undefined }))
          }}
          aria-label="메시지"
          aria-invalid={!!errors.message}
        />
        {errors.message && <div className="err">{errors.message}</div>}
        <button type="submit" className="primary cut" disabled={sending}>
          {sending ? '남기는 중…' : '마음 남기기'}
        </button>
        <p className="note">남긴 글은 수정하거나 지울 수 없어요</p>
      </form>
      <div className="sub-2" style={{ fontSize: 11, marginTop: 22 }}>
        남겨진 마음 {entries.length}개
      </div>
      {entries.map((e) => (
        <div key={e.id} className="entry">
          <div className="entry-name">{e.name}</div>
          <div className="entry-msg">{e.message}</div>
        </div>
      ))}
    </section>
  )
}
