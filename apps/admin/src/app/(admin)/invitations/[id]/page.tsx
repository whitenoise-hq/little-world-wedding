import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invitationUrl } from '@/lib/env'
import { formatDateTime } from '@/lib/format'
import { guestbook, invitations, photos } from '@/lib/repositories'
import { InvitationActions } from './invitation-actions'
import { InvitationForm } from './invitation-form'
import { PhotoManager } from './photo-manager'

export default async function InvitationEditPage({ params }: PageProps<'/invitations/[id]'>) {
  const { id } = await params
  const inv = await invitations.getById(id)
  if (!inv) notFound()
  const [photoList, entries] = await Promise.all([photos.list(id), guestbook.list(id)])
  const { groom, bride } = inv.content

  return (
    // 아래 고정 저장 바(64px)에 가리지 않을 만큼만 여백을 둔다: main 아래 여백(32px) + 56px = 저장 바 + 카드 사이 간격(24px)
    <div className="space-y-6 pb-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/invitations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" />
            청첩장 목록
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {groom.fullName || '(신랑)'} ♥ {bride.fullName || '(신부)'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">마지막 수정 {formatDateTime(inv.updatedAt)}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/invitations/${id}/guestbook`}>
            <MessageSquareIcon />
            방명록 {entries.length}
          </Link>
        </Button>
      </div>

      <InvitationActions id={id} url={invitationUrl(inv.slug)} isPublished={inv.isPublished} template={inv.kind === 'template'} />

      <InvitationForm id={id} theme={inv.theme} content={inv.content} />

      <PhotoManager invitationId={id} photos={photoList} coverPhotoId={inv.coverPhotoId} />
    </div>
  )
}
