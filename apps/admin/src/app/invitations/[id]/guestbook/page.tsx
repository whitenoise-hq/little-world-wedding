import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { guestbook, invitations } from '@/lib/repositories'
import { DeleteEntryButton } from './delete-entry-button'

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

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 pl-4">이름</TableHead>
              <TableHead>메시지</TableHead>
              <TableHead className="w-40">작성</TableHead>
              <TableHead className="w-16 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  아직 글이 없어요
                </TableCell>
              </TableRow>
            )}
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="pl-4 font-medium">{e.name}</TableCell>
                <TableCell className="whitespace-normal">{e.message}</TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">{formatDateTime(e.createdAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <DeleteEntryButton invitationId={id} entryId={e.id} name={e.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
