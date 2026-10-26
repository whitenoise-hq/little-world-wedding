'use client'

import { MapPinIcon, SearchIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { VenueResult } from '@/lib/geocode'
import { searchVenues } from '../actions'

// 예식장 이름으로 카카오 장소를 찾아 고르면 예식장 이름·주소·좌표를 채운다. docs/PLANNING.md 4장 "예식 장소".
export function VenueSearch({ onPick }: { onPick: (venue: VenueResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VenueResult[] | null>(null)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const search = () =>
    start(async () => {
      setError('')
      const res = await searchVenues(query)
      if (res.ok) setResults(res.results)
      else {
        setResults(null)
        setError(res.error)
      }
    })

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Label htmlFor="venue-search">예식장 검색</Label>
      <div className="flex gap-2">
        <Input
          id="venue-search"
          value={query}
          placeholder="예식장 이름 (예: 더채플앳청담)"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              search()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={search} disabled={pending}>
          <SearchIcon />
          {pending ? '찾는 중' : '검색'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {results && results.length === 0 && <p className="text-sm text-muted-foreground">검색 결과가 없어요. 이름을 바꿔 보거나 주소를 직접 입력해 주세요.</p>}
      {results && results.length > 0 && (
        <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
          {results.map((v) => (
            <li key={`${v.name}-${v.address}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onPick(v)
                  setResults(null)
                  setQuery('')
                }}
              >
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block text-sm font-medium">{v.name}</span>
                  <span className="block text-xs text-muted-foreground">{v.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">고르면 예식장 이름, 주소, 지도 위치가 채워져요. 홀 이름은 아래에 따로 입력해 주세요.</p>
    </div>
  )
}
