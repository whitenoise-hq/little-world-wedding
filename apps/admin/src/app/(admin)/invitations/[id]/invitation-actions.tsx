'use client'

import { ExternalLinkIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { CopyButton } from '@/components/copy-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { deleteInvitation, regenerateSlug, setPublished } from '../actions'

interface Props {
  id: string
  url: string
  isPublished: boolean
}

// 저장 버튼 없이 바로 반영되는 동작: 공개 여부, 주소 다시 만들기, 삭제
export function InvitationActions({ id, url, isPublished }: Props) {
  const [pending, start] = useTransition()

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="published"
            checked={isPublished}
            disabled={pending}
            onCheckedChange={(v) =>
              start(async () => {
                await setPublished(id, v)
                toast.success(v ? '공개했어요' : '비공개로 바꿨어요')
              })
            }
          />
          <Label htmlFor="published">{isPublished ? '공개' : '비공개'}</Label>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <code className="truncate rounded bg-muted px-2 py-1 text-sm">{url}</code>
          <CopyButton value={url} label="주소 복사" />
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              하객 화면
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={pending}>
                <RefreshCwIcon />
                주소 다시 만들기
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>주소를 다시 만들까요?</AlertDialogTitle>
                <AlertDialogDescription>지금 주소로는 더 이상 들어올 수 없어요. 링크가 원치 않는 곳에 퍼졌을 때 쓰세요.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    start(async () => {
                      await regenerateSlug(id)
                      toast.success('새 주소를 만들었어요')
                    })
                  }
                >
                  다시 만들기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive" disabled={pending}>
                <Trash2Icon />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>청첩장을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>사진과 방명록도 함께 지워지고 되돌릴 수 없어요.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => start(() => deleteInvitation(id))}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
