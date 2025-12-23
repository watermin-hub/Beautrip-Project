-- =========================================================
-- inquiries 테이블 (CRM/문의하기 클릭 로그)
-- ✅ 그대로 복붙 실행용 "최종본"
-- =========================================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New query > 이 SQL 붙여넣기 > Run
-- 
-- 이 테이블은 시술 상세 페이지에서 문의하기 기능을 통해 생성된 문의 내역을 저장합니다.
-- CRM - Zapier - KIT 자동화를 위해 사용됩니다.

-- 0) UUID 생성 함수 준비 (pgcrypto)
create extension if not exists pgcrypto;

-- 1) 테이블 생성
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null
    check (inquiry_type in ('chat', 'phone', 'email')),
  -- ✅ treatment_master.treatment_id 가 integer 이므로 동일하게 integer
  treatment_id integer not null,
  -- 스냅샷(나중에 treatment_master가 바뀌어도 문의 당시 정보 보존)
  treatment_name text,
  hospital_name text,
  hospital_phone text,
  user_email text,
  -- 로그인 유저면 저장, 비로그인이면 NULL 가능
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) FK (시술 존재하는 경우만 문의 저장되게)
alter table public.inquiries
  drop constraint if exists fk_inquiries_treatment;
alter table public.inquiries
  add constraint fk_inquiries_treatment
  foreign key (treatment_id)
  references public.treatment_master(treatment_id)
  on delete restrict;

-- 3) updated_at 트리거 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4) updated_at 트리거
drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();

-- 5) 인덱스
create index if not exists idx_inquiries_treatment_id on public.inquiries(treatment_id);
create index if not exists idx_inquiries_user_id on public.inquiries(user_id);
create index if not exists idx_inquiries_inquiry_type on public.inquiries(inquiry_type);
create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);

-- 6) RLS 활성화
alter table public.inquiries enable row level security;

-- ✅ 비로그인 포함 INSERT 허용 (수집 목적)
drop policy if exists "inquiries_insert_anyone" on public.inquiries;
create policy "inquiries_insert_anyone"
on public.inquiries
for insert
to anon, authenticated
with check (true);

-- ✅ (옵션) 로그인 사용자는 본인 문의만 조회
-- drop policy if exists "inquiries_select_own" on public.inquiries;
-- create policy "inquiries_select_own"
-- on public.inquiries
-- for select
-- to authenticated
-- using (user_id = auth.uid());

-- ❌ 전체 SELECT 공개 정책은 만들지 마세요.
-- CRM 조회는 service_role(서버/엣지함수/Zapier 서버측)로 처리 권장

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ inquiries 테이블이 성공적으로 생성되었습니다!';
END $$;
