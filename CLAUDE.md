# CLAUDE.md — 리틀 월드 웨딩 (little-world-wedding)

## 프로젝트 요약

게임처럼 캐릭터를 움직이며 둘러보는 픽셀아트 모바일 청첩장. 커플마다 `/{slug}` 고유 주소를 받고, 무대는 테마(우주·마을) 중 하나를 고른다. 운영자 1명이 어드민에서 청첩장을 만든다.

## 먼저 읽을 문서

- `docs/PLANNING.md` — **기획의 단일 출처.** 서비스 구조, 테마, 인트로, 장소와 모달, 방명록, 조작, 어드민 항목, 데이터·백엔드, 진행 순서.
- `docs/ART_GUIDE.md` — 픽셀아트 기준. 해상도, 그리기 순서, 외곽선·디더링, 스프라이트 표기법, 팔레트, UI 색. **게임 화면·테마 작업 전에 확인.**
- `docs/mockup/index.html`(우주), `docs/mockup/village.html`(마을) — 브라우저로 여는 시안. 구현의 참고일 뿐 정답은 아니다. 코드를 그대로 옮기지 말고 엔진 구조에 맞게 다시 짠다.

## 기술 스택

- 모노레포: Turborepo + pnpm. npm 스코프 `@lww/*`.
  - `apps/web` — 하객용 청첩장 (Next.js App Router). `{도메인}/{slug}`
  - `apps/admin` — 어드민 (Next.js App Router). `admin.{도메인}`
  - `packages/engine` — 캔버스 게임 엔진 + 테마(`themes/space`, `themes/village`). web과 admin 미리보기가 같이 씀
  - `packages/shared` — 도메인 타입, zod 스키마, slug 생성, Supabase 타입, 공통 상수
- 백엔드: Supabase (DB, 사진 스토리지, 어드민 로그인)
- 배포: Vercel 프로젝트 2개(web, admin). 각 앱의 `vercel.json`에서 `turbo-ignore`로 바뀐 앱만 빌드
- 버전: Node 22, pnpm 10, Next.js 16, React 19, TypeScript 5.9, zod 4, vitest
- 어드민 UI: Tailwind 4 + shadcn/ui(Radix, Nova 프리셋). 하객용(`apps/web`)은 Tailwind 없이 `globals.css` + 갈무리 서브셋 폰트
- 내부 패키지(`@lww/shared`, `@lww/engine`)는 빌드하지 않고 TS 소스를 그대로 내보낸다. 앱의 `next.config.ts`에서 `transpilePackages`로 컴파일한다.

## 명령

```bash
pnpm install
pnpm dev          # web(3000) + admin(3001)
pnpm dev:web      # 하객용만
pnpm dev:admin    # 어드민만
pnpm typecheck
pnpm test
pnpm build
```

- 이 맥에서는 `pnpm dlx`가 캐시 폴더 권한(`~/Library/Caches/pnpm`) 때문에 EACCES로 실패한다. 캐시 위치를 바꿔서 실행한다.
  예: `pnpm --config.cache-dir=$TMPDIR/pnpm-cache dlx shadcn@4.22.1 add button` (`apps/admin`에서)

## 진행 순서

`docs/PLANNING.md` 10장을 따른다.

0. 모노레포 세팅 — 완료
1. 데이터 구조, 어드민, `/[slug]` 일반 청첩장(게임 없이) + OG 태그 + 인트로 — **진행 중** (화면 완료, Supabase 연결 전)
2. 게임 화면(엔진 + 테마)을 붙이고 장소·데이터 연결
3. 방명록 관리·스팸 방지, 사진 최적화, 로딩·성능

- DB 스키마는 처음부터 확정하지 않는다. 1단계에서 어드민 화면을 만들며 드러난 필드를 PLANNING.md에 먼저 적고 확정한다.

## 공통 규칙

- **데이터 접근은 저장소를 거친다.** 화면 코드는 각 앱의 `src/lib/repositories`(인터페이스는 `packages/shared`의 `repository.ts`)만 쓴다. 지금은 목업(in-memory) 구현이고, Supabase 구현으로 바꿔도 화면 코드는 고치지 않는다.
- **하객 브라우저는 데이터 서버에 직접 붙지 않는다.** 하객용 앱은 서버 컴포넌트와 Route Handler에서만 저장소를 쓴다(`server-only`).

- **문서 먼저.** 기획·그림 규칙이 바뀌면 `docs/PLANNING.md` / `docs/ART_GUIDE.md`를 먼저 고친 뒤 코드를 바꾼다.
- **공유 코드는 `packages/`에만.** 앱끼리 서로 import하지 않는다. 타입·스키마·상수는 `packages/shared`에 한 번만 정의한다.
- **엔진과 테마 분리.** 엔진(렌더러, 입력, 카메라, 충돌, 루프)은 테마를 모른다. 테마는 그림, 장소 좌표, 이동 범위, 충돌 영역, 방명록 연출을 데이터와 함수로 넘긴다.
- **하객용 앱에 어드민 것을 넣지 않는다.** Supabase 서비스 키, 어드민 전용 의존성은 `apps/admin`에만 둔다.
- **slug:** 영어 소문자 8자리. `crypto.getRandomValues`로 만들고, 234 이상인 바이트는 버려서 글자 분포를 균등하게 한다. `Math.random` 금지. DB unique 제약 + 겹치면 재생성.
- **결정적 값:** 방명록 오브젝트의 위치·색·움직임은 글 id 해시로 정한다. 렌더할 때마다 바뀌면 안 되므로 `Math.random`을 쓰지 않는다.
- **방명록:** 이름·메시지만 받는다. 비밀번호 없음, 작성자 수정·삭제 없음. 삭제는 어드민에서 운영자만.
- **이름:** 장소 이름은 "집"으로 쓴다("우리 집" 아님).
- **Supabase 무료 플랜 일시 정지 방지:** 하루 한 번 `apps/web`의 헬스체크가 DB에 가벼운 조회를 하게 한다(Vercel Cron 또는 GitHub Actions). 캐시를 쓰더라도 헬스체크는 DB까지 가야 한다. 자세한 내용은 PLANNING.md 8장.

## 성능 규칙

- 아이콘 폰트 금지. 쓰는 아이콘만 SVG로 넣는다.
- 갈무리 폰트는 필요한 글자만 남긴 서브셋을 직접 호스팅한다. npm·CDN 전체 폰트를 쓰지 않는다.
- 사진은 썸네일과 큰 사진을 따로 만들어 필요할 때 불러온다.
- 게임 코드는 별도 청크로 나눠 인트로가 떠 있는 동안 불러온다.
- 배경은 한 번만 그려 두고, 매 프레임에는 움직이는 것만 그린다. 모달이 열려 있거나 백그라운드일 때는 그리기 루프를 멈춘다. 30fps로 제한한다.
- 그리기 루프의 시간 간격(dt)은 0 이상으로 자른다. 첫 프레임에 음수가 나와 스프라이트 프레임 계산이 깨진 적이 있다.

## 현재 상태

- 0단계 완료, 1단계 화면 완료(목업 데이터). typecheck·test·build 통과.
  - `packages/shared`: 청첩장 내용 스키마(`invitation.ts`), 저장소 인터페이스, 날짜 포맷, slug, 방명록 스키마, 목업 데이터(`@lww/shared/fixtures`)
  - `packages/engine`: 화면 규격 상수, 테마 인터페이스 초안, 신랑·신부 스프라이트
  - `apps/admin`: 청첩장 목록, 입력 폼(검증 오류 표시), 공개 전환·주소 다시 만들기·삭제, 방명록 관리. 사진은 보기만
  - `apps/web`: 인트로(표지 + 진행 막대 + 들어가기), 게임 없는 일반 청첩장(인사말, 일시·달력·D-day, 장소·길찾기, 오시는 길, 연락하기, 계좌, 사진 3칸 격자 + 전체화면, 방명록), OG 메타, 방명록 API(IP당 10분 3회 제한)
  - 어드민과 하객용은 프로세스가 달라 목업 데이터를 공유하지 않는다. 어드민에서 고친 내용은 Supabase 연결 후에 하객 화면에 반영된다.
- 아직 안 한 것: Supabase 연결(스키마 확정, 저장소 구현, 어드민 로그인, 사진 업로드, 매일 깨우기), 지도 표시, 캐시·갱신(어드민 저장 시 하객 페이지 갱신), Vercel 프로젝트 생성, ESLint
- 미결 사항은 `docs/PLANNING.md` 11장 참고 (RSVP, 바로 보기 화면, 그림 외주 여부, 테마 추가, 들어가기 버튼 분리).
