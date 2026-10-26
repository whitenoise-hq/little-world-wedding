-- 템플릿(홍보용 샘플)과 고객 청첩장을 구분하는 칸 (docs/PLANNING.md 7장 "어드민 청첩장 목록").
-- 어드민에서 만드는 청첩장은 기본값 customer, pnpm db:templates 가 넣는 샘플은 template.
alter table public.invitations
  add column kind text not null default 'customer' check (kind in ('template', 'customer'));

-- 이미 들어가 있는 샘플 청첩장을 템플릿으로 표시한다
update public.invitations set kind = 'template' where slug in ('seavilla', 'marsland', 'loveport');
