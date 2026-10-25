-- 공항 테마 추가 (docs/PLANNING.md 2장). 테마 목록은 packages/shared/src/themes.ts 의 THEME_IDS 와 같아야 한다.
alter table public.invitations drop constraint invitations_theme_check;
alter table public.invitations add constraint invitations_theme_check check (theme in ('space', 'village', 'airport'));
