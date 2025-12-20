-- ============================================
-- saved_schedules 테이블에 deleted_at 컬럼 추가
-- ============================================
-- 설명: Soft delete를 위한 deleted_at 컬럼 추가
-- 작성일: 2025-01-XX
-- ============================================

-- 1. deleted_at 컬럼 추가 (NULL 허용, Soft delete용)
ALTER TABLE public.saved_schedules 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- 2. deleted_at 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_saved_schedules_deleted_at 
ON public.saved_schedules(deleted_at) 
WHERE deleted_at IS NULL;

-- 3. RLS 정책 업데이트
-- 3-1. SELECT 정책: deleted_at이 NULL인 것만 조회 가능하도록 수정
DROP POLICY IF EXISTS "Users can view their own saved schedules" ON public.saved_schedules;
CREATE POLICY "Users can view their own saved schedules"
    ON public.saved_schedules
    FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 3-2. UPDATE 정책: deleted_at이 NULL인 것만 수정 가능하도록 수정
DROP POLICY IF EXISTS "Users can update their own saved schedules" ON public.saved_schedules;
CREATE POLICY "Users can update their own saved schedules"
    ON public.saved_schedules
    FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- 4. 코멘트 추가
COMMENT ON COLUMN public.saved_schedules.deleted_at IS 'Soft delete용 삭제 일시 (NULL이면 삭제되지 않음)';

-- ============================================
-- 검증 쿼리 (실행 후 확인용)
-- ============================================
-- 컬럼 확인
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--     AND table_name = 'saved_schedules'
--     AND column_name = 'deleted_at';

-- 인덱스 확인
-- SELECT 
--     indexname, 
--     indexdef
-- FROM pg_indexes
-- WHERE tablename = 'saved_schedules' 
--     AND indexname = 'idx_saved_schedules_deleted_at';

