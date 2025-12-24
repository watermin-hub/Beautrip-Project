-- ============================================
-- rpc_home_schedule_recommendations 함수 최적화
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New query > 이 SQL 붙여넣기 > Run

-- ============================================
-- 1. 인덱스 추가 (성능 향상)
-- ============================================

-- treatment_master 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_treatment_master_category_large 
  ON public.treatment_master(category_large);

CREATE INDEX IF NOT EXISTS idx_treatment_master_category_mid 
  ON public.treatment_master(category_mid);

CREATE INDEX IF NOT EXISTS idx_treatment_master_rating_review 
  ON public.treatment_master(rating DESC, review_count DESC);

CREATE INDEX IF NOT EXISTS idx_treatment_master_category_rating 
  ON public.treatment_master(category_large, category_mid, rating DESC, review_count DESC);

-- category_treattime_recovery 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ctr_category_mid 
  ON public.category_treattime_recovery(category_mid);

-- treatment_master_en/cn/jp 테이블 인덱스 (JOIN 성능 향상)
CREATE INDEX IF NOT EXISTS idx_treatment_master_en_treatment_id 
  ON public.treatment_master_en(treatment_id);

CREATE INDEX IF NOT EXISTS idx_treatment_master_cn_treatment_id 
  ON public.treatment_master_cn(treatment_id);

CREATE INDEX IF NOT EXISTS idx_treatment_master_jp_treatment_id 
  ON public.treatment_master_jp(treatment_id);

-- ============================================
-- 2. 함수 실행 시간 제한 증가 (PostgreSQL 14+)
-- ============================================
-- 주의: Supabase에서 함수 레벨 타임아웃 설정이 지원되지 않을 수 있습니다.
-- 대신 Supabase 대시보드 > Settings > Database에서 statement timeout을 증가시키세요.

-- ALTER FUNCTION public.rpc_home_schedule_recommendations
--   SET statement_timeout = '120s';

-- ============================================
-- 3. 실행 계획 확인 (선택사항)
-- ============================================
-- 인덱스 추가 후 실행 계획을 확인하여 최적화가 잘 되었는지 확인하세요.

-- EXPLAIN ANALYZE
-- SELECT * FROM rpc_home_schedule_recommendations(
--   '2025-12-24'::date,
--   '2025-12-31'::date,
--   null,
--   null,
--   3,
--   5
-- );

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 인덱스가 성공적으로 생성되었습니다!';
  RAISE NOTICE '⚠️ Supabase 대시보드에서 statement timeout을 120초 이상으로 설정하세요.';
  RAISE NOTICE '📊 실행 계획 확인 후 추가 최적화가 필요할 수 있습니다.';
END $$;

