-- 뷰(View)를 일반 테이블로 전환하는 마이그레이션 스크립트
-- ⚠️ 주의: 이 스크립트는 데이터 백업 후 실행하세요!

-- ============================================
-- 1. treatment_i18n 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS treatment_i18n (
  treatment_id BIGINT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('KR', 'en', 'ja', 'zh-CN')),
  
  -- 기본 정보
  treatment_name TEXT,
  hospital_name TEXT,
  hospital_id BIGINT,
  
  -- 카테고리
  category_large TEXT,
  category_mid TEXT,
  category_small TEXT,
  
  -- 가격 정보
  selling_price NUMERIC,
  original_price NUMERIC,
  dis_rate NUMERIC,
  vat_info TEXT,
  
  -- 평점 및 리뷰
  rating NUMERIC,
  review_count INTEGER,
  
  -- 이미지 및 URL
  main_image_url TEXT,
  event_url TEXT,
  treatment_hashtags TEXT,
  
  -- 시술 정보
  surgery_time INTEGER,
  downtime INTEGER,
  platform TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (treatment_id, lang)
);

-- ============================================
-- 2. hospital_i18n 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS hospital_i18n (
  hospital_id_rd BIGINT NOT NULL,
  platform TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('KR', 'en', 'ja', 'zh-CN')),
  
  -- 기본 정보
  hospital_name TEXT,
  hospital_url TEXT,
  hospital_address TEXT,
  hospital_intro TEXT,
  hospital_info_raw TEXT,
  
  -- 평점 및 리뷰
  hospital_rating NUMERIC,
  review_count INTEGER,
  
  -- 이미지
  hospital_img_url TEXT,
  
  -- 기타 정보
  hospital_departments TEXT,
  hospital_doctors TEXT,
  opening_hours TEXT,
  hospital_phone_safe TEXT,
  hospital_language_support TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (hospital_id_rd, platform, lang)
);

-- ============================================
-- 3. 인덱스 생성 (성능 최적화)
-- ============================================

-- treatment_i18n 인덱스
CREATE INDEX IF NOT EXISTS idx_treatment_i18n_lang 
ON treatment_i18n(lang);

CREATE INDEX IF NOT EXISTS idx_treatment_i18n_category 
ON treatment_i18n(lang, category_mid);

CREATE INDEX IF NOT EXISTS idx_treatment_i18n_rating 
ON treatment_i18n(lang, rating DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_treatment_i18n_hospital 
ON treatment_i18n(lang, hospital_id);

-- hospital_i18n 인덱스
CREATE INDEX IF NOT EXISTS idx_hospital_i18n_lang 
ON hospital_i18n(lang);

CREATE INDEX IF NOT EXISTS idx_hospital_i18n_platform 
ON hospital_i18n(platform, lang);

-- ============================================
-- 4. 데이터 마이그레이션
-- ============================================

-- treatment_i18n: 한국어 데이터 (treatment_master)
INSERT INTO treatment_i18n (
  treatment_id, lang, treatment_name, hospital_name, hospital_id,
  category_large, category_mid, category_small,
  selling_price, original_price, dis_rate, vat_info,
  rating, review_count,
  main_image_url, event_url, treatment_hashtags,
  surgery_time, downtime, platform
)
SELECT 
  treatment_id, 'KR', treatment_name, hospital_name, hospital_id,
  category_large, category_mid, category_small,
  selling_price, original_price, dis_rate, vat_info,
  rating, review_count,
  main_image_url, event_url, treatment_hashtags,
  surgery_time, downtime, platform
FROM treatment_master
ON CONFLICT (treatment_id, lang) DO NOTHING;

-- treatment_i18n: 번역 데이터 (treatment_translation)
-- ⚠️ lang 매핑: 'ko' → 'KR', 'en' → 'en', 'ja' → 'ja', 'zh-CN' → 'zh-CN'
INSERT INTO treatment_i18n (
  treatment_id, lang, treatment_name, hospital_name,
  category_large, category_mid, category_small,
  vat_info
)
SELECT 
  treatment_id,
  CASE 
    WHEN lang = 'ko' THEN 'KR'
    ELSE lang
  END as lang,
  treatment_name, hospital_name,
  category_large, category_mid, category_small,
  vat_info
FROM treatment_translation
ON CONFLICT (treatment_id, lang) DO UPDATE SET
  treatment_name = EXCLUDED.treatment_name,
  hospital_name = EXCLUDED.hospital_name,
  category_large = EXCLUDED.category_large,
  category_mid = EXCLUDED.category_mid,
  category_small = EXCLUDED.category_small,
  vat_info = EXCLUDED.vat_info,
  updated_at = NOW();

-- hospital_i18n: 한국어 데이터 (hospital_master)
INSERT INTO hospital_i18n (
  hospital_id_rd, platform, lang,
  hospital_name, hospital_url, hospital_address,
  hospital_intro, hospital_info_raw,
  hospital_rating, review_count,
  hospital_img_url,
  hospital_departments, hospital_doctors,
  opening_hours, hospital_phone_safe, hospital_language_support
)
SELECT 
  hospital_id_rd, platform, 'KR',
  hospital_name, hospital_url, hospital_address,
  hospital_intro, hospital_info_raw,
  hospital_rating, review_count,
  hospital_img_url,
  hospital_departments, hospital_doctors,
  opening_hours, hospital_phone_safe, hospital_language_support
FROM hospital_master
ON CONFLICT (hospital_id_rd, platform, lang) DO NOTHING;

-- hospital_i18n: 번역 데이터 (hospital_translation)
-- ⚠️ lang 매핑 필요
INSERT INTO hospital_i18n (
  hospital_id_rd, platform, lang,
  hospital_name, hospital_address, hospital_intro
)
SELECT 
  hospital_id_rd, platform,
  CASE 
    WHEN lang = 'ko' THEN 'KR'
    ELSE lang
  END as lang,
  hospital_name, hospital_address, hospital_intro
FROM hospital_translation
ON CONFLICT (hospital_id_rd, platform, lang) DO UPDATE SET
  hospital_name = EXCLUDED.hospital_name,
  hospital_address = EXCLUDED.hospital_address,
  hospital_intro = EXCLUDED.hospital_intro,
  updated_at = NOW();

-- ============================================
-- 5. 데이터 검증
-- ============================================

-- treatment_i18n 데이터 개수 확인
SELECT lang, COUNT(*) as count
FROM treatment_i18n
GROUP BY lang
ORDER BY lang;

-- hospital_i18n 데이터 개수 확인
SELECT lang, COUNT(*) as count
FROM hospital_i18n
GROUP BY lang
ORDER BY lang;

-- ============================================
-- 6. (선택사항) 뷰 제거
-- ============================================

-- ⚠️ 주의: 프론트엔드 코드 수정 완료 후에만 실행!
-- DROP VIEW IF EXISTS v_treatment_i18n;
-- DROP VIEW IF EXISTS v_hospital_i18n;

-- ============================================
-- 7. 롤백 스크립트 (문제 발생 시)
-- ============================================

-- 뷰를 다시 생성하려면:
-- CREATE VIEW v_treatment_i18n AS ...
-- CREATE VIEW v_hospital_i18n AS ...

