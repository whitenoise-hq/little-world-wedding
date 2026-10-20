'use client'

import { THEME_IDS, THEME_LABELS, type Account, type InvitationContent, type Person, type ThemeId } from '@lww/shared'
import { PlusIcon, XIcon } from 'lucide-react'
import { useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { saveInvitation } from '../actions'

type Path = (string | number)[]

// 중첩 객체의 한 값을 바꾼 복사본을 만든다
function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  const src = obj as Record<string | number, unknown>
  const copy = (Array.isArray(obj) ? [...obj] : { ...src }) as Record<string | number, unknown>
  copy[head as string | number] = setIn(src[head as string | number], rest, value)
  return copy as T
}

function getIn(obj: unknown, path: Path): unknown {
  return path.reduce<unknown>((o, k) => (o as Record<string | number, unknown> | undefined)?.[k], obj)
}

interface Props {
  id: string
  theme: ThemeId
  content: InvitationContent
}

export function InvitationForm({ id, theme: initialTheme, content: initialContent }: Props) {
  const [theme, setTheme] = useState(initialTheme)
  const [content, setContent] = useState(initialContent)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [pending, start] = useTransition()

  const set = (path: Path, value: unknown) => {
    setContent((c) => setIn(c, path, value))
    setDirty(true)
  }
  const err = (path: Path) => errors[path.join('.')]

  const text = (path: Path, props: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <Input
      value={String(getIn(content, path) ?? '')}
      onChange={(e) => set(path, e.target.value)}
      aria-invalid={!!err(path)}
      {...props}
    />
  )

  const save = () =>
    start(async () => {
      const res = await saveInvitation(id, theme, content)
      if (res.ok) {
        setErrors({})
        setDirty(false)
        toast.success('저장했어요')
      } else {
        setErrors(res.errors)
        toast.error(`입력을 확인해 주세요 (${Object.keys(res.errors).length}곳)`)
      }
    })

  const person = (side: 'groom' | 'bride', title: string) => {
    const p = content[side] as Person
    return (
      <Section title={title}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="이름 (성 포함)" error={err([side, 'fullName'])}>
            {text([side, 'fullName'], { placeholder: side === 'groom' ? '김원재' : '박은빈' })}
          </Field>
          <Field label="이름표용 이름" error={err([side, 'firstName'])}>
            {text([side, 'firstName'], { placeholder: side === 'groom' ? '원재' : '은빈' })}
          </Field>
        </div>
        <PhoneRow
          label="전화번호"
          value={p.phone}
          show={p.showPhone}
          error={err([side, 'phone'])}
          onValue={(v) => set([side, 'phone'], v)}
          onShow={(v) => set([side, 'showPhone'], v)}
        />
        {(['father', 'mother'] as const).map((rel) => (
          <div key={rel} className="space-y-3 rounded-lg border p-3">
            <Field label={rel === 'father' ? '아버지 성함' : '어머니 성함'} error={err([side, rel, 'name'])}>
              {text([side, rel, 'name'])}
            </Field>
            <PhoneRow
              label="전화번호"
              value={p[rel].phone}
              show={p[rel].showPhone}
              error={err([side, rel, 'phone'])}
              onValue={(v) => set([side, rel, 'phone'], v)}
              onShow={(v) => set([side, rel, 'showPhone'], v)}
            />
          </div>
        ))}
      </Section>
    )
  }

  const accountList = (side: 'groom' | 'bride', title: string) => {
    const list = content.accounts[side]
    const blank: Account = { relation: side === 'groom' ? '신랑' : '신부', holder: '', bank: '', number: '', kakaoPayUrl: '', visible: true }
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
          <Button type="button" variant="outline" size="sm" disabled={list.length >= 5} onClick={() => set(['accounts', side], [...list, blank])}>
            <PlusIcon />
            추가
          </Button>
        </div>
        {list.length === 0 && <p className="text-sm text-muted-foreground">계좌가 없어요</p>}
        {list.map((a, i) => {
          const base: Path = ['accounts', side, i]
          return (
            <div key={i} className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-[5rem_1fr_auto] items-end gap-3">
                <Field label="관계" error={err([...base, 'relation'])}>
                  {text([...base, 'relation'])}
                </Field>
                <Field label="예금주" error={err([...base, 'holder'])}>
                  {text([...base, 'holder'])}
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="계좌 삭제"
                  onClick={() => set(['accounts', side], list.filter((_, j) => j !== i))}
                >
                  <XIcon />
                </Button>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <Field label="은행" error={err([...base, 'bank'])}>
                  {text([...base, 'bank'])}
                </Field>
                <Field label="계좌번호" error={err([...base, 'number'])}>
                  {text([...base, 'number'], { inputMode: 'numeric' })}
                </Field>
              </div>
              <Field label="카카오페이 송금 링크 (선택)" error={err([...base, 'kakaoPayUrl'])}>
                {text([...base, 'kakaoPayUrl'], { placeholder: 'https://qr.kakaopay.com/...' })}
              </Field>
              <Toggle label="청첩장에 표시" checked={a.visible} onChange={(v) => set([...base, 'visible'], v)} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <Section title="기본">
        <Field label="테마">
          <Select
            value={theme}
            onValueChange={(v) => {
              setTheme(v as ThemeId)
              setDirty(true)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_IDS.map((t) => (
                <SelectItem key={t} value={t}>
                  {THEME_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {person('groom', '신랑')}
        {person('bride', '신부')}
      </div>

      <Section title="인사말">
        <Field label="인사말" error={err(['greeting', 'text'])}>
          <Textarea
            rows={5}
            maxLength={500}
            value={content.greeting.text}
            onChange={(e) => set(['greeting', 'text'], e.target.value)}
            aria-invalid={!!err(['greeting', 'text'])}
          />
        </Field>
      </Section>

      <Section title="예식">
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜" error={err(['ceremony', 'date'])}>
            {text(['ceremony', 'date'], { type: 'date' })}
          </Field>
          <Field label="시간" error={err(['ceremony', 'time'])}>
            {text(['ceremony', 'time'], { type: 'time', step: 600 })}
          </Field>
          <Field label="예식장 이름" error={err(['ceremony', 'venueName'])}>
            {text(['ceremony', 'venueName'])}
          </Field>
          <Field label="홀" error={err(['ceremony', 'hall'])}>
            {text(['ceremony', 'hall'], { placeholder: '3층 그랜드홀' })}
          </Field>
        </div>
        <Field label="주소" error={err(['ceremony', 'address'])}>
          {text(['ceremony', 'address'])}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {(['lat', 'lng'] as const).map((k) => (
            <Field key={k} label={k === 'lat' ? '위도 (지도용, 선택)' : '경도 (지도용, 선택)'} error={err(['ceremony', k])}>
              <Input
                type="number"
                step="any"
                value={content.ceremony[k] ?? ''}
                onChange={(e) => set(['ceremony', k], e.target.value === '' ? null : Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="오시는 길">
        {content.directions.map((d, i) => (
          <div key={i} className="grid grid-cols-[6rem_1fr_auto] items-start gap-3">
            <Field label={i === 0 ? '항목' : undefined} error={err(['directions', i, 'label'])}>
              {text(['directions', i, 'label'])}
            </Field>
            <Field label={i === 0 ? '내용' : undefined} error={err(['directions', i, 'text'])}>
              <Textarea
                rows={1}
                value={d.text}
                onChange={(e) => set(['directions', i, 'text'], e.target.value)}
                aria-invalid={!!err(['directions', i, 'text'])}
                className="min-h-9"
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="항목 삭제"
              className={i === 0 ? 'mt-6' : ''}
              onClick={() => set(['directions'], content.directions.filter((_, j) => j !== i))}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={content.directions.length >= 10}
          onClick={() => set(['directions'], [...content.directions, { label: '', text: '' }])}
        >
          <PlusIcon />
          항목 추가
        </Button>
      </Section>

      <Section title="마음 전하실 곳">
        <div className="grid gap-6 lg:grid-cols-2">
          {accountList('groom', '신랑 측')}
          {accountList('bride', '신부 측')}
        </div>
      </Section>

      <Section title="꾸미기" description="캐릭터 헤어·옷 색은 게임 화면을 붙이는 2단계에서 추가해요.">
        <Field label="배경음악 주소 (선택)" error={err(['decor', 'bgmUrl'])}>
          {text(['decor', 'bgmUrl'], { placeholder: 'https://...' })}
        </Field>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-end gap-3 px-6">
          <span className="text-sm text-muted-foreground">{dirty ? '저장하지 않은 변경이 있어요' : '저장됨'}</span>
          <Button onClick={save} disabled={pending || !dirty}>
            {pending ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function Field({ label, error, children }: { label?: string | undefined; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  )
}

function PhoneRow(props: {
  label: string
  value: string
  show: boolean
  error?: string | undefined
  onValue: (v: string) => void
  onShow: (v: boolean) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-end gap-3">
      <Field label={props.label} error={props.error}>
        <Input
          value={props.value}
          inputMode="tel"
          placeholder="010-0000-0000"
          onChange={(e) => props.onValue(e.target.value)}
          aria-invalid={!!props.error}
        />
      </Field>
      <div className="pb-2">
        <Toggle label="연락하기에 표시" checked={props.show} onChange={props.onShow} />
      </div>
    </div>
  )
}
