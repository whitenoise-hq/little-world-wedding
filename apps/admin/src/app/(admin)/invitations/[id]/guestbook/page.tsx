import { GUESTBOOK_LIMITS, GUESTBOOK_RATE_LIMITS } from '@lww/shared'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon, ShieldCheckIcon } from 'lucide-react'
import { guestbook, invitations } from '@/lib/repositories'
import { GuestbookTable } from './guestbook-table'

export default async function GuestbookPage({ params }: PageProps<'/invitations/[id]/guestbook'>) {
  const { id } = await params
  const inv = await invitations.getById(id)
  if (!inv) notFound()
  const entries = await guestbook.list(id)

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/invitations/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" />
          {inv.content.groom.fullName} ♥ {inv.content.bride.fullName}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">방명록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          총 {entries.length}개 · 하객은 글을 지울 수 없어서, 정리는 여기서만 해요.
        </p>
      </div>

      {/* 작성 제한 안내. 값은 packages/shared/src/guestbook.ts 한 곳에서 가져온다 */}
      <div className="flex gap-3 rounded-lg bg-muted p-4 text-sm">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">스팸 방지 작성 제한</p>
          <p className="text-muted-foreground">
            같은 인터넷(IP)에서는 이 청첩장에 {GUESTBOOK_RATE_LIMITS.map((l) => l.label).join(', ')}까지 쓸 수 있어요. 넘으면 하객 화면에 &quot;잠시 후 다시
            남겨 주세요&quot;가 떠요.
          </p>
          <p className="text-muted-foreground">
            같은 와이파이를 쓰는 가족이 연달아 써도 막히지 않을 만큼 넉넉하게 잡았어요. 이름은 {GUESTBOOK_LIMITS.name}자, 메시지는{' '}
            {GUESTBOOK_LIMITS.message}자까지예요.
          </p>
        </div>
      </div>

      <GuestbookTable invitationId={id} entries={entries} />
    </div>
  )
}
