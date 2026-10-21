'use client'

import { GUESTBOOK_LIMITS, guestbookInputSchema, type GuestbookEntry, type ThemeId } from '@lww/shared'
import { useState } from 'react'
import { toast } from './toast'

// 방명록이 올라가면 게임 화면에 알린다 (물고기·별이 생기는 연출)
export const GUESTBOOK_POSTED = 'lww-guestbook-posted'

// 이 페이지에서 새로 올린 글. 방명록(장소 모달·청첩장 바로 보기)이나 게임 화면이 나중에 열려도 빠지지 않게 모아 둔다.
let posted: GuestbookEntry[] = []
export function withPosted(list: GuestbookEntry[]): GuestbookEntry[] {
  const ids = new Set(list.map((e) => e.id))
  return [...posted.filter((e) => !ids.has(e.id)), ...list]
}

// 글이 게임 화면에서 무엇이 되는지 (방명록 안내 한 줄만 테마 문구를 쓴다. docs/ART_GUIDE.md 6장)
const BECOMES: Record<ThemeId, string> = {
  village: '남겨 주신 메시지는 바다의 물고기 한 마리가 됩니다.',
  space: '남겨 주신 메시지는 하늘의 별 하나가 됩니다.',
}

const dateFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' })

export function Guestbook({ slug, theme, initial }: { slug: string; theme: ThemeId; initial: GuestbookEntry[] }) {
  const [entries, setEntries] = useState(() => withPosted(initial))
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
        toast(body.error ?? '남기지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      const entry = body.entry
      posted = [entry, ...posted]
      setEntries((list) => [entry, ...list])
      setName('')
      setMessage('')
      setErrors({})
      window.dispatchEvent(new CustomEvent<GuestbookEntry>(GUESTBOOK_POSTED, { detail: entry }))
    } catch {
      toast('남기지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <p className="small sub center" style={{ margin: '0 0 22px' }}>
        두 사람에게 축하의 마음을 남겨 주세요.
        <br />
        {BECOMES[theme]}
      </p>
      <form onSubmit={submit} noValidate>
        <input
          className="field"
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
          className="field"
          placeholder="축하 메시지"
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
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? '남기는 중' : '방명록 남기기'}
        </button>
        <p className="note">남긴 글은 수정하거나 삭제할 수 없습니다.</p>
      </form>
      <div className="entries">
        <div className="small muted" style={{ marginBottom: 6 }}>
          축하 메시지 {entries.length}개
        </div>
        {entries.map((e) => (
          <div key={e.id} className="entry">
            <div className="entry-head">
              <span className="entry-name">{e.name}</span>
              <span className="entry-date">{dateFmt.format(new Date(e.createdAt))}</span>
            </div>
            <div className="entry-msg">{e.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
