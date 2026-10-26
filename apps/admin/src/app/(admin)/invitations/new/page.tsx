import { emptyInvitationContent } from '@lww/shared'
import Link from 'next/link'
import { ArrowLeftIcon, ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { InvitationForm } from '../[id]/invitation-form'

// 새 청첩장: DB에는 처음 저장할 때 만든다. docs/PLANNING.md 7장 "어드민 청첩장 목록".
export default function NewInvitationPage() {
  return (
    <div className="space-y-6 pb-14">
      <div>
        <Link href="/invitations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" />
          청첩장 목록
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">새 청첩장</h1>
        <p className="mt-1 text-sm text-muted-foreground">저장하면 청첩장이 만들어져요. 저장하지 않고 나가면 남지 않아요.</p>
      </div>

      <InvitationForm id={null} theme="village" content={emptyInvitationContent()} />

      <Card>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <ImageIcon className="size-5 shrink-0" />
          사진 올리기와 공개 전환은 처음 저장한 뒤에 할 수 있어요.
        </CardContent>
      </Card>
    </div>
  )
}
