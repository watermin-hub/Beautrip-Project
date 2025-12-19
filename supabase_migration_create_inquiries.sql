-- ============================================
-- inquiries 테이블 생성 마이그레이션
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New query > 이 SQL 붙여넣기 > Run
-- 
-- 이 테이블은 시술 상세 페이지에서 문의하기 기능을 통해 생성된 문의 내역을 저장합니다.
-- CRM - Zapier - KIT 자동화를 위해 사용됩니다.

-- inquiries 테이블 생성
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('chat', 'phone', 'email')),
  treatment_id INTEGER NOT NULL, -- treatment_master의 treatment_id 참조
  treatment_name TEXT,
  hospital_name TEXT,
  hospital_phone TEXT, -- 전화 문의인 경우 병원 전화번호
  user_email TEXT, -- 메일 문의인 경우 사용자 이메일 (선택적)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 로그인한 사용자의 경우
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_inquiries_treatment_id ON public.inquiries(treatment_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON public.inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 문의를 생성할 수 있음 (비로그인 사용자 포함)
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.inquiries;
CREATE POLICY "Anyone can insert inquiries"
  ON public.inquiries
  FOR INSERT
  WITH CHECK (true);

-- RLS 정책: 사용자는 자신의 문의만 조회 가능 (선택적 - 필요시 활성화)
-- DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.inquiries;
-- CREATE POLICY "Users can view their own inquiries"
--   ON public.inquiries
--   FOR SELECT
--   USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS 정책: 모든 문의 조회 가능 (CRM 연동을 위해 필요할 수 있음)
-- 주의: 이 정책을 활성화하면 모든 사용자가 모든 문의를 볼 수 있습니다.
-- 필요에 따라 위의 user_id 기반 정책을 사용하거나, 서비스 롤(service_role)을 사용하세요.
DROP POLICY IF EXISTS "Anyone can view inquiries" ON public.inquiries;
CREATE POLICY "Anyone can view inquiries"
  ON public.inquiries
  FOR SELECT
  USING (true);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ inquiries 테이블이 성공적으로 생성되었습니다!';
END $$;
