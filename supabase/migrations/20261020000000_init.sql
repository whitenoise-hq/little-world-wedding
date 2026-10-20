-- 리틀 월드 웨딩 초기 스키마. 설명은 docs/PLANNING.md 8장 "데이터 구조", "접근 방식".
-- 하객용 앱(apps/web)은 서버에서 secret 키(service_role)로만 접근한다. anon 권한은 주지 않는다.
-- 어드민(apps/admin)은 로그인한 운영자(admins)만 RLS를 통과한다.

-- ── 운영자 ─────────────────────────────
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;

-- ── 청첩장 ─────────────────────────────
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z]{8}$'),
  theme text not null check (theme in ('space', 'village')),
  is_published boolean not null default false,
  content jsonb not null, -- packages/shared invitationContentSchema 로 검증한 값
  cover_photo_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  thumb_path text not null, -- storage 'photos' 버킷 안의 경로
  full_path text not null,
  caption text not null default '', -- 화면에 보이지 않고 대체 텍스트로만 쓴다
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index photos_invitation_order on public.photos (invitation_id, sort_order);

alter table public.invitations
  add constraint invitations_cover_photo_fk foreign key (cover_photo_id) references public.photos (id) on delete set null;

create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  message text not null check (char_length(message) between 1 and 120),
  ip_hash text, -- 연속 작성 제한용. 원본 IP는 저장하지 않는다
  created_at timestamptz not null default now()
);
create index guestbook_invitation_created on public.guestbook_entries (invitation_id, created_at desc);
create index guestbook_rate_limit on public.guestbook_entries (invitation_id, ip_hash, created_at desc);

-- updated_at 자동 갱신
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;
create trigger invitations_touch before update on public.invitations
  for each row execute function public.touch_updated_at();

-- ── 권한 ─────────────────────────────
-- 새 테이블 자동 공개를 껐으므로 직접 부여한다. anon(공개 키)에는 아무 권한도 주지 않는다.
revoke all on public.admins, public.invitations, public.photos, public.guestbook_entries from anon;
grant select on public.admins to authenticated;
grant select, insert, update, delete on public.invitations, public.photos, public.guestbook_entries to authenticated;
grant all on public.admins, public.invitations, public.photos, public.guestbook_entries to service_role;
grant execute on function public.is_admin() to authenticated;

-- ── RLS ─────────────────────────────
alter table public.admins enable row level security;
alter table public.invitations enable row level security;
alter table public.photos enable row level security;
alter table public.guestbook_entries enable row level security;

create policy "운영자는 자기 행을 본다" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "운영자만 청첩장을 다룬다" on public.invitations
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "운영자만 사진을 다룬다" on public.photos
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "운영자만 방명록을 다룬다" on public.guestbook_entries
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── 사진 저장소 ─────────────────────────────
-- 공개 버킷: 하객은 공개 URL로 사진을 읽는다. 올리기·지우기는 운영자만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif']);

create policy "운영자만 사진을 올린다" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos' and (select public.is_admin()));
create policy "운영자만 사진을 바꾼다" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and (select public.is_admin()));
create policy "운영자만 사진을 지운다" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and (select public.is_admin()));
