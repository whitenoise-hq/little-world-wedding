import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { invitationUrl } from '@/lib/env'
import { formatDateTime } from '@/lib/format'
import { guestbook, invitations, photos } from '@/lib/repositories'
import { InvitationActions } from './invitation-actions'
import { InvitationForm } from './invitation-form'

export default async function InvitationEditPage({ params }: PageProps<'/invitations/[id]'>) {
  const { id } = await params
  const inv = await invitations.getById(id)
  if (!inv) notFound()
  const [photoList, entries] = await Promise.all([photos.list(id), guestbook.list(id)])
  const { groom, bride } = inv.content

  return (
    <div className="space-y-6">
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

      <InvitationActions id={id} url={invitationUrl(inv.slug)} isPublished={inv.isPublished} />

      <InvitationForm id={id} theme={inv.theme} content={inv.content} />

      <Card>
        <CardHeader>
          <CardTitle>사진 {photoList.length}장</CardTitle>
          <CardDescription>업로드·순서 변경·설명 수정은 Supabase Storage를 연결한 뒤 만들어요.</CardDescription>
        </CardHeader>
        <CardContent>
          {photoList.length === 0 ? (
            <p className="text-sm text-muted-foreground">사진이 없어요</p>
          ) : (
            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {photoList.map((p) => (
                <li key={p.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbUrl} alt={p.caption} className="aspect-square w-full rounded-md border object-cover" />
                  <p className="truncate text-xs text-muted-foreground">
                    {p.id === inv.coverPhotoId && '★ '}
                    {p.caption}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
