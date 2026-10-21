# CLAUDE.md — 리틀 월드 웨딩 (little-world-wedding)

## 프로젝트 요약

게임처럼 캐릭터를 움직이며 둘러보는 픽셀아트 모바일 청첩장. 커플마다 `/{slug}` 고유 주소를 받고, 무대는 테마(우주·마을) 중 하나를 고른다. 운영자 1명이 어드민에서 청첩장을 만든다.

## 먼저 읽을 문서

- `docs/PLANNING.md` — **기획의 단일 출처.** 서비스 구조, 테마, 인트로, 장소와 모달, 방명록, 조작, 어드민 항목, 데이터·백엔드, 진행 순서.
- `docs/ART_GUIDE.md` — 픽셀아트 기준. 해상도, 그리기 순서, 외곽선·디더링, 스프라이트 표기법, 팔레트, UI 색. **게임 화면·테마 작업 전에 확인.**
- `docs/STORE_GUIDE.md` — 스마트스토어 상품·상세 이미지 기준(크기, 글꼴, 테마별 색, 섹션 순서와 문구, 규칙)과 기준 이미지(`docs/store/reference/`). **스토어 이미지를 만들 때는 이 문서대로 만들고 기준 이미지와 비교한다.** 만든 이미지는 커밋하지 않는다.
- `docs/mockup/index.html`(우주), `docs/mockup/village.html`(마을) — 브라우저로 여는 시안. 구현의 참고일 뿐 정답은 아니다. 코드를 그대로 옮기지 말고 엔진 구조에 맞게 다시 짠다.

## 기술 스택

- 모노레포: Turborepo + pnpm. npm 스코프 `@lww/*`.
  - `apps/web` — 하객용 청첩장 (Next.js App Router). `{도메인}/{slug}`
  - `apps/admin` — 어드민 (Next.js App Router). `admin.{도메인}`
  - `packages/engine` — 캔버스 게임 엔진 + 테마(`themes/space`, `themes/village`). web과 admin 미리보기가 같이 씀
  - `packages/shared` — 도메인 타입, zod 스키마, slug 생성, Supabase 타입, 공통 상수
- 백엔드: Supabase (DB, 사진 스토리지, 어드민 로그인)
- 배포: Vercel 프로젝트 2개(web, admin). 각 앱의 `vercel.json`에서 `turbo-ignore`로 바뀐 앱만 빌드, 함수 실행 위치는 서울(`regions: ["icn1"]`). Supabase도 서울이라 둘을 떼어 놓으면 요청마다 미국 왕복이 생겨 느려진다
- 버전: Node 22, pnpm 10, Next.js 16, React 19, TypeScript 5.9, zod 4, vitest
- 어드민 UI: Tailwind 4 + shadcn/ui(Radix, Nova 프리셋). 하객용(`apps/web`)은 Tailwind 없이 `globals.css`. 글꼴은 나눔명조(청첩장 글자) + 갈무리 서브셋(게임 세계 안 이름표·말풍선)
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
pnpm supabase <명령>   # Supabase CLI (레포 devDependency, Homebrew 불필요)
pnpm db:push          # supabase/migrations 를 원격 DB에 적용
pnpm db:types         # DB 타입 생성 → packages/shared/src/database.types.ts
pnpm db:templates     # 샘플 청첩장(마을 /seavilla, 우주 /marsland)을 DB에 적용. 사진·방문자 글은 건드리지 않음 (--reset-samples: 샘플 방명록만 갈아 끼움)
```

- Supabase 프로젝트: `little-world-wedding`(ref `gninsfsuhbgkzkwbdagc`, 서울). 이 레포에 `supabase link` 되어 있다.
- 환경변수는 각 앱의 `.env.example` 참고. 실제 값은 `.env.local`(git 제외)에만 둔다.

- 이 맥에서는 `pnpm dlx`가 캐시 폴더 권한(`~/Library/Caches/pnpm`) 때문에 EACCES로 실패한다. 캐시 위치를 바꿔서 실행한다.
  예: `pnpm --config.cache-dir=$TMPDIR/pnpm-cache dlx shadcn@4.22.1 add button` (`apps/admin`에서)

## 진행 순서

`docs/PLANNING.md` 10장을 따른다.

0. 모노레포 세팅 — 완료
1. 데이터 구조, 어드민, `/[slug]` 일반 청첩장(게임 없이) + OG 태그 + 인트로 — 화면 완료, **Supabase 연결 남음**
2. 게임 화면(엔진 + 테마)을 붙이고 장소·데이터 연결 — **진행 중** (1단계 Supabase보다 먼저 하기로 함)
3. 방명록 관리·스팸 방지, 사진 최적화, 로딩·성능

- DB 스키마는 처음부터 확정하지 않는다. 1단계에서 어드민 화면을 만들며 드러난 필드를 PLANNING.md에 먼저 적고 확정한다.

## 공통 규칙

- **데이터 접근은 저장소를 거친다.** 화면 코드는 각 앱의 `src/lib/repositories`(인터페이스는 `packages/shared`의 `repository.ts`)만 쓴다. Supabase 키가 있으면 Supabase 구현, 없으면 목업(in-memory) 구현을 쓴다. DB 행 ↔ 화면 모델 변환은 `packages/shared`의 `supabase-mappers.ts`.
- **어드민 인증:** `src/proxy.ts`(Next 16의 미들웨어)가 세션을 갱신하고 비로그인을 `/login`으로 보낸다. `(admin)` 그룹 레이아웃과 모든 Server Action은 `requireAdmin()`으로 운영자인지 다시 확인하고, 데이터 권한은 RLS가 최종 판단한다.
- **하객 브라우저는 데이터 서버에 직접 붙지 않는다.** 하객용 앱은 서버 컴포넌트와 Route Handler에서만 저장소를 쓴다(`server-only`).

- **문서 먼저.** 기획·그림 규칙이 바뀌면 `docs/PLANNING.md` / `docs/ART_GUIDE.md`를 먼저 고친 뒤 코드를 바꾼다.
- **공유 코드는 `packages/`에만.** 앱끼리 서로 import하지 않는다. 타입·스키마·상수는 `packages/shared`에 한 번만 정의한다.
- **엔진과 테마 분리.** 엔진(렌더러, 입력, 카메라, 충돌, 루프)은 테마를 모른다. 테마는 그림, 장소 좌표, 이동 범위, 충돌 영역, 방명록 연출을 데이터와 함수로 넘긴다.
- **하객용 앱에 어드민 것을 넣지 않는다.** Supabase 서비스 키, 어드민 전용 의존성은 `apps/admin`에만 둔다.
- **slug:** 영어 소문자 8자리. `crypto.getRandomValues`로 만들고, 234 이상인 바이트는 버려서 글자 분포를 균등하게 한다. `Math.random` 금지. DB unique 제약 + 겹치면 재생성.
- **결정적 값:** 방명록 오브젝트의 위치·색·움직임은 글 id 해시로 정한다. 렌더할 때마다 바뀌면 안 되므로 `Math.random`을 쓰지 않는다.
- **방명록:** 이름·메시지만 받는다. 비밀번호 없음, 작성자 수정·삭제 없음. 삭제는 어드민에서 운영자만.
- **이름:** 세계 안 장소 이름은 "집"("우리 집" 아님). 하객이 누르는 플로팅 버튼과 모달 제목은 용도로 "청첩장·사진·방명록", 집의 들어가기 버튼은 "청첩장 보기". 자세한 표는 PLANNING.md 4장.
- **픽셀은 게임 화면에만.** 배경·캐릭터·오브젝트, 세계 안 이름표·말풍선, 조작(조이스틱·플로팅 버튼·들어가기 버튼)이 픽셀이다. 모달·인트로·안내 문구·토스트는 차분한 청첩장 디자인(`docs/ART_GUIDE.md` 6장): 나눔명조(`next/font/google`), 둥근 모서리, 영문 라벨 + 한국어 제목, 담백한 존댓말.
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
  - `packages/engine`: 게임 루프·입력·카메라·충돌(`game.ts`), 그리기 도구(`painter.ts`), 마을·우주 테마(`themes/`), 신랑·신부 스프라이트. 캔버스는 화면 배율에 가까운 정수배 해상도로 그려 움직임을 1/3~1/4픽셀 단위로 부드럽게 하고, 움직일 때는 매 프레임·가만히 있을 때는 30fps
  - `apps/admin`: 청첩장 목록, 입력 폼(검증 오류 표시), 공개 전환·주소 다시 만들기·삭제, 방명록 관리. 사진은 보기만
  - `apps/web`: 인트로(표지, 게임 준비되면 들어가기) → 게임 화면(조이스틱·플로팅 버튼·들어가기는 픽셀, 크기 3단계, 태블릿 너비까지) → 장소 모달(청첩장·사진·방명록, 나눔명조). 사진 전체화면은 scroll-snap 슬라이드. 방명록을 올리면 물고기·별 연출. OG 메타, 방명록 API(IP당 10분 3회 제한)
  - 어드민과 하객용은 프로세스가 달라 목업 데이터를 공유하지 않는다. 어드민에서 고친 내용은 Supabase 연결 후에 하객 화면에 반영된다.
- Supabase: 프로젝트 연결·초기 마이그레이션 적용·운영자 등록·DB 타입 생성 완료. 권한 점검(공개 키 차단, secret 키 허용) 완료.
- 저장소 Supabase 교체 완료: 하객용(web secret 키, 방명록 연속 작성 제한은 DB의 IP 해시 기준), 어드민(운영자 세션 + RLS, 로그인·로그아웃). DB에 샘플(템플릿) 청첩장 2개 적용됨: 마을 `/seavilla`, 우주 `/marsland` (내용은 `packages/shared/src/fixtures.ts`).
- 사진 업로드: 어드민 청첩장 편집 화면의 `PhotoManager`. 브라우저에서 썸네일(600px)·큰 사진(1920px) WebP로 줄여 운영자 세션으로 Storage에 직접 올리고, DB 행은 Server Action이 만든다. 순서·대표·설명·삭제. 최대 20장. 대표 미지정 시 카톡 미리보기는 첫 사진.
- 매일 깨우기: `apps/web` `GET /api/health`(CRON_SECRET 필요) + `apps/web/vercel.json` Cron 매일 03:00 UTC.
- 배포(Vercel)에서는 Supabase 키가 없어도 목업으로 넘어가지 않는다(web·admin). Supabase 클라이언트는 처음 쓸 때 만들어 키 없이도 빌드된다.
- 하객 페이지 캐시: 청첩장·사진은 `unstable_cache` + 태그(`cacheTags`), 어드민 Server Action이 `revalidateWeb()`으로 web `POST /api/revalidate` 호출. 방명록은 캐시 안 함.
- 아직 안 한 것: 지도, 지도 표시, 캐시·갱신(어드민 저장 시 하객 페이지 갱신), Vercel 프로젝트 생성, ESLint
- 미결 사항은 `docs/PLANNING.md` 11장 참고 (RSVP, 바로 보기 화면, 그림 외주 여부, 테마 추가, 들어가기 버튼 분리).
