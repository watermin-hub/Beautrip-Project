-- ============================================
-- saved_schedules 테이블 RLS 정책 수정
-- ============================================
-- 설명: deleted_at 업데이트를 허용하도록 RLS 정책 수정
-- 작성일: 2025-01-XX
-- ============================================

-- 1. 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Users can update their own saved schedules" ON public.saved_schedules;

-- 2. 새로운 UPDATE 정책 생성
-- deleted_at 업데이트를 포함하여 모든 업데이트를 허용
-- USING: 기존 행에 대한 권한 확인 (auth.uid() = user_id)
-- WITH CHECK: 업데이트된 행에 대한 권한 확인 (auth.uid() = user_id)
-- 참고: user_id는 코드에서 변경하지 않으므로 별도 체크 불필요
CREATE POLICY "Users can update their own saved schedules"
    ON public.saved_schedules
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 검증 쿼리 (실행 후 확인용)
-- ============================================
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
-- WHERE tablename = 'saved_schedules'
--     AND policyname = 'Users can update their own saved schedules';

