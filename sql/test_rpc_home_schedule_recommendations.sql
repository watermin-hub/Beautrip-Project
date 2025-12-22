-- RPC 함수 테스트 및 디버깅 쿼리

-- 1. v_treatment_i18n 테이블에 데이터가 있는지 확인
SELECT 
  lang,
  COUNT(*) as count,
  COUNT(DISTINCT treatment_id) as unique_treatments
FROM v_treatment_i18n
GROUP BY lang
ORDER BY lang;

-- 2. 특정 언어의 샘플 데이터 확인 (예: 중국어)
SELECT 
  treatment_id,
  lang,
  treatment_name,
  category_large,
  category_mid,
  category_small
FROM v_treatment_i18n
WHERE lang = 'zh-CN'
LIMIT 10;

-- 3. treatment_master와 v_treatment_i18n JOIN 테스트
SELECT 
  tm.treatment_id,
  tm.category_mid as kr_category_mid,
  vi.lang,
  vi.category_mid as translated_category_mid,
  vi.treatment_name
FROM treatment_master tm
INNER JOIN v_treatment_i18n vi ON (
  tm.treatment_id = vi.treatment_id
)
WHERE vi.lang = 'zh-CN'
LIMIT 10;

-- 4. RPC 함수 직접 테스트 (한국어)
SELECT * FROM rpc_home_schedule_recommendations(
  '2025-12-22'::DATE,
  '2028-01-17'::DATE,
  NULL,  -- 전체 카테고리
  NULL,  -- 한국어
  5,     -- 최대 5개 카테고리
  10     -- 카테고리당 10개 시술
)
LIMIT 10;

-- 5. RPC 함수 직접 테스트 (중국어)
SELECT * FROM rpc_home_schedule_recommendations(
  '2025-12-22'::DATE,
  '2028-01-17'::DATE,
  NULL,      -- 전체 카테고리
  'zh-CN',   -- 중국어
  5,         -- 최대 5개 카테고리
  10         -- 카테고리당 10개 시술
)
LIMIT 10;

-- 6. RPC 함수 직접 테스트 (영어)
SELECT * FROM rpc_home_schedule_recommendations(
  '2025-12-22'::DATE,
  '2028-01-17'::DATE,
  NULL,  -- 전체 카테고리
  'en',  -- 영어
  5,     -- 최대 5개 카테고리
  10     -- 카테고리당 10개 시술
)
LIMIT 10;

-- 7. RPC 함수 직접 테스트 (일본어)
SELECT * FROM rpc_home_schedule_recommendations(
  '2025-12-22'::DATE,
  '2028-01-17'::DATE,
  NULL,  -- 전체 카테고리
  'ja',  -- 일본어
  5,     -- 최대 5개 카테고리
  10     -- 카테고리당 10개 시술
)
LIMIT 10;

-- 8. category_treattime_recovery와 JOIN 테스트
SELECT 
  tm.treatment_id,
  tm.category_mid,
  ctr."회복기간_max(일)",
  ctr."시술시간_min"
FROM treatment_master tm
LEFT JOIN category_treattime_recovery ctr ON (
  tm.category_mid = ctr.중분류
)
WHERE tm.category_mid IS NOT NULL
LIMIT 10;

