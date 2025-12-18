-- ============================================
-- procedure_favorites 테이블 생성 마이그레이션
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New query > 이 SQL 붙여넣기 > Run

-- procedure_favorites 테이블 생성
CREATE TABLE IF NOT EXISTS public.procedure_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, treatment_id) -- 같은 사용자가 같은 시술을 중복 찜하기 방지
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_procedure_favorites_user_id ON public.procedure_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_procedure_favorites_treatment_id ON public.procedure_favorites(treatment_id);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_procedure_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_procedure_favorites_updated_at ON public.procedure_favorites;
CREATE TRIGGER update_procedure_favorites_updated_at
  BEFORE UPDATE ON public.procedure_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_procedure_favorites_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.procedure_favorites ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 찜하기만 조회 가능
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.procedure_favorites;
CREATE POLICY "Users can view their own favorites"
  ON public.procedure_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 찜하기만 추가 가능
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.procedure_favorites;
CREATE POLICY "Users can insert their own favorites"
  ON public.procedure_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 찜하기만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.procedure_favorites;
CREATE POLICY "Users can delete their own favorites"
  ON public.procedure_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ procedure_favorites 테이블이 성공적으로 생성되었습니다!';
END $$;
