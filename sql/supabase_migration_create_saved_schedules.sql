-- ============================================
-- saved_schedules 테이블 생성 마이그레이션
-- ============================================
-- 설명: 사용자가 저장한 여행 일정을 Supabase에 저장하는 테이블
-- 작성일: 2025-01-XX
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.saved_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_period TEXT NOT NULL,
    treatment_ids INTEGER[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
-- user_id로 조회가 많으므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_saved_schedules_user_id ON public.saved_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_schedules_created_at ON public.saved_schedules(created_at DESC);

-- 3. updated_at 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_saved_schedules_updated_at ON public.saved_schedules;
CREATE TRIGGER update_saved_schedules_updated_at
    BEFORE UPDATE ON public.saved_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) 활성화
ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성
-- 6-1. 사용자는 자신의 일정만 조회 가능
CREATE POLICY "Users can view their own saved schedules"
    ON public.saved_schedules
    FOR SELECT
    USING (auth.uid() = user_id);

-- 6-2. 사용자는 자신의 일정만 생성 가능
CREATE POLICY "Users can insert their own saved schedules"
    ON public.saved_schedules
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6-3. 사용자는 자신의 일정만 수정 가능
CREATE POLICY "Users can update their own saved schedules"
    ON public.saved_schedules
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6-4. 사용자는 자신의 일정만 삭제 가능
CREATE POLICY "Users can delete their own saved schedules"
    ON public.saved_schedules
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. 코멘트 추가 (테이블 및 컬럼 설명)
COMMENT ON TABLE public.saved_schedules IS '사용자가 저장한 여행 일정 정보';
COMMENT ON COLUMN public.saved_schedules.id IS '일정 고유 ID (UUID)';
COMMENT ON COLUMN public.saved_schedules.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN public.saved_schedules.schedule_period IS '여행 기간 (예: "25.12.14~25.12.20")';
COMMENT ON COLUMN public.saved_schedules.treatment_ids IS '시술 ID 배열 (예: [1, 2, 3])';
COMMENT ON COLUMN public.saved_schedules.created_at IS '생성 일시';
COMMENT ON COLUMN public.saved_schedules.updated_at IS '수정 일시';

-- ============================================
-- 검증 쿼리 (실행 후 확인용)
-- ============================================
-- 테이블 구조 확인
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--     AND table_name = 'saved_schedules'
-- ORDER BY ordinal_position;

-- 인덱스 확인
-- SELECT 
--     indexname, 
--     indexdef
-- FROM pg_indexes
-- WHERE tablename = 'saved_schedules';

-- RLS 정책 확인
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies
-- WHERE tablename = 'saved_schedules';

-- ============================================
-- 롤백 스크립트 (필요시 실행)
-- ============================================
-- DROP POLICY IF EXISTS "Users can view their own saved schedules" ON public.saved_schedules;
-- DROP POLICY IF EXISTS "Users can insert their own saved schedules" ON public.saved_schedules;
-- DROP POLICY IF EXISTS "Users can update their own saved schedules" ON public.saved_schedules;
-- DROP POLICY IF EXISTS "Users can delete their own saved schedules" ON public.saved_schedules;
-- DROP TRIGGER IF EXISTS update_saved_schedules_updated_at ON public.saved_schedules;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP INDEX IF EXISTS idx_saved_schedules_user_id;
-- DROP INDEX IF EXISTS idx_saved_schedules_created_at;
-- DROP TABLE IF EXISTS public.saved_schedules;
