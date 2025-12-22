-- 홈 일정 기반 추천 RPC 함수
-- treatment_id와 lang으로 매칭하여 언어별 데이터 반환
CREATE OR REPLACE FUNCTION public.rpc_home_schedule_recommendations(
  p_trip_start DATE,
  p_trip_end DATE,
  p_category_large TEXT DEFAULT NULL,
  p_lang TEXT DEFAULT NULL, -- 'en', 'ja', 'zh-CN' 또는 NULL (한국어) ⚠️ v_treatment_i18n.lang 컬럼 값과 정확히 일치해야 함
  p_limit_categories INTEGER DEFAULT 5,
  p_limit_per_category INTEGER DEFAULT 10
)
RETURNS TABLE (
  treatment_id INTEGER,
  treatment_name TEXT,
  hospital_name TEXT,
  category_large TEXT,
  category_mid TEXT, -- UI 표시용 (언어별)
  category_mid_key TEXT, -- 로직/그룹핑용 (한글 고정)
  category_small TEXT,
  selling_price NUMERIC,
  original_price NUMERIC,
  dis_rate NUMERIC,
  rating NUMERIC,
  review_count INTEGER,
  main_image_url TEXT,
  event_url TEXT,
  vat_info TEXT,
  treatment_hashtags TEXT,
  surgery_time INTEGER,
  downtime INTEGER,
  platform TEXT,
  treatment_rank INTEGER,
  average_recovery_period NUMERIC,
  average_recovery_period_min NUMERIC,
  average_recovery_period_max NUMERIC,
  average_procedure_time NUMERIC,
  average_procedure_time_min NUMERIC,
  average_procedure_time_max NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip_days INTEGER;
BEGIN
  -- 여행 기간 계산 (일 단위)
  v_trip_days := p_trip_end - p_trip_start;
    
    -- p_lang이 NULL이면 treatment_master 사용 (한국어)
    -- p_lang이 있으면 v_treatment_i18n에서 lang 필터 적용
    IF p_lang IS NULL THEN
      -- 한국어: treatment_master 사용
      RETURN QUERY
      WITH ranked_treatments AS (
        SELECT 
          tm.treatment_id,
          tm.treatment_name,
          tm.hospital_name,
          tm.category_large,
          tm.category_mid AS category_mid, -- UI 표시용 (한국어)
          tm.category_mid AS category_mid_key, -- 로직용 (한글 고정)
          tm.category_small,
          tm.selling_price,
          tm.original_price,
          tm.dis_rate,
          tm.rating,
          tm.review_count,
          tm.main_image_url,
          tm.event_url,
          tm.vat_info,
          tm.treatment_hashtags,
          ctr."시술시간_min" AS surgery_time,
          ctr."회복기간_max(일)" AS downtime,
          tm.platform,
          ROW_NUMBER() OVER (
            PARTITION BY tm.category_mid 
            ORDER BY 
              tm.rating DESC NULLS LAST,
              tm.review_count DESC NULLS LAST,
              tm.selling_price ASC
          ) AS treatment_rank,
          AVG(ctr."회복기간_max(일)") OVER (PARTITION BY tm.category_mid) AS avg_recovery,
          MIN(ctr."회복기간_min(일)") OVER (PARTITION BY tm.category_mid) AS avg_recovery_min,
          MAX(ctr."회복기간_max(일)") OVER (PARTITION BY tm.category_mid) AS avg_recovery_max,
          AVG(ctr."시술시간_min") OVER (PARTITION BY tm.category_mid) AS avg_procedure_time,
          MIN(ctr."시술시간_min") OVER (PARTITION BY tm.category_mid) AS avg_procedure_time_min,
          MAX(ctr."시술시간_max") OVER (PARTITION BY tm.category_mid) AS avg_procedure_time_max
        FROM treatment_master tm
        LEFT JOIN category_treattime_recovery ctr ON (
          tm.category_mid = ctr.중분류
        )
        WHERE 
          (p_category_large IS NULL OR tm.category_large = p_category_large)
          AND (
            -- 회복 기간 필터: NULL이거나 여행 기간보다 작거나 같으면 OK
            ctr."회복기간_max(일)" IS NULL 
            OR ctr."회복기간_max(일)" <= v_trip_days
            OR v_trip_days >= 20 -- 여행 기간이 20일 이상이면 회복 기간 필터 무시
          )
      ),
      category_rankings AS (
        SELECT 
          category_mid_key,
          category_mid,
          category_large,
          COUNT(*) AS treatment_count,
          AVG(rating) AS avg_rating,
          SUM(review_count) AS total_reviews,
          ROW_NUMBER() OVER (
            ORDER BY 
              COUNT(*) DESC,
              AVG(rating) DESC NULLS LAST,
              SUM(review_count) DESC
          ) AS category_rank
        FROM ranked_treatments
        GROUP BY category_mid_key, category_mid, category_large
      )
      SELECT 
        rt.treatment_id,
        rt.treatment_name,
        rt.hospital_name,
        rt.category_large,
        rt.category_mid,
        rt.category_mid_key,
        rt.category_small,
        rt.selling_price,
        rt.original_price,
        rt.dis_rate,
        rt.rating,
        rt.review_count,
        rt.main_image_url,
        rt.event_url,
        rt.vat_info,
        rt.treatment_hashtags,
        rt.surgery_time,
        rt.downtime,
        rt.platform,
        rt.treatment_rank,
        rt.avg_recovery,
        rt.avg_recovery_min,
        rt.avg_recovery_max,
        rt.avg_procedure_time,
        rt.avg_procedure_time_min,
        rt.avg_procedure_time_max
      FROM ranked_treatments rt
      INNER JOIN category_rankings cr ON (
        rt.category_mid_key = cr.category_mid_key
      )
      WHERE 
        cr.category_rank <= p_limit_categories
        AND rt.treatment_rank <= p_limit_per_category
      ORDER BY 
        cr.category_rank,
        rt.treatment_rank;
    ELSE
      -- 다른 언어: v_treatment_i18n 사용 (treatment_id와 lang으로 매칭)
      RETURN QUERY
      WITH ranked_treatments AS (
        SELECT 
          vi.treatment_id,
          vi.treatment_name, -- 번역된 이름
          vi.hospital_name,
          vi.category_large, -- 번역된 대분류
          vi.category_mid AS category_mid, -- UI 표시용 (번역된 중분류)
          tm.category_mid AS category_mid_key, -- 로직용 (한글 고정, treatment_master에서 가져옴)
          vi.category_small, -- 번역된 소분류
          vi.selling_price,
          vi.original_price,
          vi.dis_rate,
          vi.rating,
          vi.review_count,
          vi.main_image_url,
          vi.event_url,
          vi.vat_info,
          vi.treatment_hashtags, -- 한국어 해시태그 (그대로 사용)
          ctr."시술시간_min" AS surgery_time,
          ctr."회복기간_max(일)" AS downtime,
          vi.platform,
          ROW_NUMBER() OVER (
            PARTITION BY tm.category_mid -- category_mid_key 기준으로 그룹화
            ORDER BY 
              vi.rating DESC NULLS LAST,
              vi.review_count DESC NULLS LAST,
              vi.selling_price ASC
          ) AS treatment_rank,
          AVG(ctr."회복기간_max(일)") OVER (PARTITION BY tm.category_mid) AS avg_recovery,
          MIN(ctr."회복기간_min(일)") OVER (PARTITION BY tm.category_mid) AS avg_recovery_min,
          MAX(ctr."회복기간_max(일)") OVER (PARTITION BY tm.category_mid) AS avg_recovery_max,
          AVG(ctr."시술시간_min") OVER (PARTITION BY tm.category_mid) AS avg_procedure_time,
          MIN(ctr."시술시간_min") OVER (PARTITION BY tm.category_mid) AS avg_procedure_time_min,
          MAX(ctr."시술시간_max") OVER (PARTITION BY tm.category_mid) AS avg_procedure_time_max
        FROM v_treatment_i18n vi
        INNER JOIN treatment_master tm ON (
          vi.treatment_id = tm.treatment_id
        )
        LEFT JOIN category_treattime_recovery ctr ON (
          tm.category_mid = ctr.중분류 -- category_mid_key(한글)로 매칭
        )
        WHERE 
          vi.lang = p_lang -- ⚠️ 핵심: lang으로 언어 필터링
          AND (p_category_large IS NULL OR tm.category_large = p_category_large) -- 카테고리 필터는 한글 기준
          AND (
            -- 회복 기간 필터: NULL이거나 여행 기간보다 작거나 같으면 OK
            -- 여행 기간이 매우 길면 (예: 26일) 대부분의 시술이 포함됨
            ctr."회복기간_max(일)" IS NULL 
            OR ctr."회복기간_max(일)" <= v_trip_days
            OR v_trip_days >= 20 -- 여행 기간이 20일 이상이면 회복 기간 필터 무시 (대부분의 시술 포함)
          )
      ),
      category_rankings AS (
        SELECT 
          category_mid_key,
          category_mid,
          category_large,
          COUNT(*) AS treatment_count,
          AVG(rating) AS avg_rating,
          SUM(review_count) AS total_reviews,
          ROW_NUMBER() OVER (
            ORDER BY 
              COUNT(*) DESC,
              AVG(rating) DESC NULLS LAST,
              SUM(review_count) DESC
          ) AS category_rank
        FROM ranked_treatments
        GROUP BY category_mid_key, category_mid, category_large
      )
      SELECT 
        rt.treatment_id,
        rt.treatment_name,
        rt.hospital_name,
        rt.category_large,
        rt.category_mid,
        rt.category_mid_key,
        rt.category_small,
        rt.selling_price,
        rt.original_price,
        rt.dis_rate,
        rt.rating,
        rt.review_count,
        rt.main_image_url,
        rt.event_url,
        rt.vat_info,
        rt.treatment_hashtags,
        rt.surgery_time,
        rt.downtime,
        rt.platform,
        rt.treatment_rank,
        rt.avg_recovery,
        rt.avg_recovery_min,
        rt.avg_recovery_max,
        rt.avg_procedure_time,
        rt.avg_procedure_time_min,
        rt.avg_procedure_time_max
      FROM ranked_treatments rt
      INNER JOIN category_rankings cr ON (
        rt.category_mid_key = cr.category_mid_key
      )
      WHERE 
        cr.category_rank <= p_limit_categories
        AND rt.treatment_rank <= p_limit_per_category
      ORDER BY 
        cr.category_rank,
        rt.treatment_rank;
    END IF;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.rpc_home_schedule_recommendations 
  TO authenticated, anon;

-- 함수 설명 추가
COMMENT ON FUNCTION public.rpc_home_schedule_recommendations IS 
'홈 일정 기반 추천 함수. 
- p_lang이 NULL이면 treatment_master 사용 (한국어)
- p_lang이 있으면 v_treatment_i18n에서 treatment_id와 lang으로 매칭하여 번역된 데이터 반환
- category_mid_key는 항상 한글 고정 (로직/그룹핑용)
- category_mid는 언어별 번역된 값 (UI 표시용)';

