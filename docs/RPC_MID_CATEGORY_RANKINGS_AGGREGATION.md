# rpc_mid_category_rankings 집계 필드 추가 요청

## 🔴 현재 문제점

### 백엔드 반환 데이터 (현재)
```sql
-- RPC가 반환하는 컬럼 (flat row만)
category_mid_key
category_mid
treatment_id
treatment_name
hospital_id
hospital_name
rating
review_count
main_img_url
```

### 프론트엔드가 필요한 집계 필드
```typescript
interface MidCategoryRanking {
  category_mid: string;
  category_rank: number;        // ❌ 없음
  category_score: number;       // ❌ 없음
  average_rating: number;       // ❌ 없음
  total_reviews: number;        // ❌ 없음
  treatment_count: number;      // ❌ 없음
  treatments: Treatment[];
}
```

### 현재 프론트엔드 처리 (비효율적)
```typescript
// 프론트엔드에서 집계 계산 (비효율적!)
const midGrouped = Array.from(grouped.values())
  .map((group) => {
    const treatments = group.treatments || [];
    const totalReviews = treatments.reduce(
      (sum: number, t: any) => sum + (t.review_count || 0),
      0
    );
    const totalRating = treatments.reduce(
      (sum: number, t: any) =>
        sum + (t.rating || 0) * (t.review_count || 0),
      0
    );
    const averageRating =
      totalReviews > 0 ? totalRating / totalReviews : 0;
    // ...
  });
```

## ✅ 해결 방법

### 백엔드 RPC 함수 수정 필요

백엔드에서 각 row에 집계 필드를 포함해서 반환해야 합니다.

#### 방법 1: Window Function 사용 (추천)

```sql
CREATE OR REPLACE FUNCTION public.rpc_mid_category_rankings(
  p_category_large TEXT DEFAULT NULL,
  p_m INTEGER DEFAULT 20,
  p_dedupe_limit_per_name INTEGER DEFAULT 2,
  p_limit_per_category INTEGER DEFAULT 20,
  p_lang TEXT DEFAULT NULL
)
RETURNS TABLE (
  -- 기존 컬럼
  category_mid_key TEXT,
  category_mid TEXT,
  treatment_id BIGINT,
  treatment_name TEXT,
  hospital_id BIGINT,
  hospital_name TEXT,
  rating NUMERIC,
  review_count INTEGER,
  main_img_url TEXT,
  
  -- ✅ 집계 필드 추가 (각 row에 포함)
  category_rank INTEGER,           -- 중분류 순위
  category_score NUMERIC,          -- 중분류 점수 (베이지안 평균 또는 평균 평점)
  average_rating NUMERIC,          -- 중분류 평균 평점
  total_reviews INTEGER,           -- 중분류 총 리뷰 수
  treatment_count INTEGER           -- 중분류 시술 개수
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    -- 기존 로직: 베이지안 평균 계산 등
    SELECT ...
  ),
  category_stats AS (
    SELECT 
      category_mid_key,
      COUNT(*) AS treatment_count,
      SUM(review_count) AS total_reviews,
      AVG(rating) AS average_rating,
      -- 베이지안 평균 또는 다른 점수 계산
      AVG(rating) AS category_score, -- 또는 더 복잡한 계산
      ROW_NUMBER() OVER (
        ORDER BY 
          AVG(rating) DESC,
          SUM(review_count) DESC
      ) AS category_rank
    FROM base
    GROUP BY category_mid_key
  )
  SELECT 
    b.*,
    cs.category_rank,
    cs.category_score,
    cs.average_rating,
    cs.total_reviews,
    cs.treatment_count
  FROM base b
  INNER JOIN category_stats cs ON (
    b.category_mid_key = cs.category_mid_key
  )
  ORDER BY cs.category_rank, b.treatment_rank;
END;
$$;
```

#### 방법 2: 각 row에 집계 필드 직접 포함 (더 간단)

```sql
WITH ranked_treatments AS (
  SELECT 
    category_mid_key,
    category_mid,
    treatment_id,
    treatment_name,
    hospital_id,
    hospital_name,
    rating,
    review_count,
    main_img_url,
    -- ✅ Window Function으로 집계 필드 계산
    COUNT(*) OVER (PARTITION BY category_mid_key) AS treatment_count,
    SUM(review_count) OVER (PARTITION BY category_mid_key) AS total_reviews,
    AVG(rating) OVER (PARTITION BY category_mid_key) AS average_rating,
    AVG(rating) OVER (PARTITION BY category_mid_key) AS category_score,
    DENSE_RANK() OVER (
      ORDER BY 
        AVG(rating) OVER (PARTITION BY category_mid_key) DESC,
        SUM(review_count) OVER (PARTITION BY category_mid_key) DESC
    ) AS category_rank
  FROM ...
)
SELECT * FROM ranked_treatments
ORDER BY category_rank, treatment_rank;
```

## 📋 백엔드에 전달할 요구사항

### 반환 컬럼 (기존 + 추가)
```sql
-- 기존 컬럼
category_mid_key TEXT
category_mid TEXT
treatment_id BIGINT
treatment_name TEXT
hospital_id BIGINT
hospital_name TEXT
rating NUMERIC
review_count INTEGER
main_img_url TEXT

-- ✅ 추가 필요
category_rank INTEGER           -- 중분류 순위 (1, 2, 3, ...)
category_score NUMERIC         -- 중분류 점수 (베이지안 평균 또는 평균 평점)
average_rating NUMERIC          -- 중분류 평균 평점
total_reviews INTEGER           -- 중분류 총 리뷰 수
treatment_count INTEGER         -- 중분류 시술 개수
```

### 집계 기준
- **그룹화 기준**: `category_mid_key` (중분류)
- **정렬 기준**: 
  1. `category_score` (또는 `average_rating`) 내림차순
  2. `total_reviews` 내림차순
- **category_rank**: 위 정렬 기준으로 1부터 순차적으로 부여

### 참고: rpc_home_schedule_recommendations 패턴
`rpc_home_schedule_recommendations` 함수를 참고하면 좋습니다:
- `category_rankings` CTE에서 집계 계산
- 각 row에 집계 필드를 JOIN하여 포함

## 🎯 프론트엔드 수정 (백엔드 수정 후)

백엔드에서 집계 필드를 반환하면, 프론트엔드에서는:

```typescript
// ✅ 간단하게 사용 가능
for (const r of rows) {
  const key = r.category_mid;
  if (!grouped.has(key)) {
    grouped.set(key, {
      category_mid: r.category_mid,
      category_rank: r.category_rank,        // ✅ 백엔드에서 제공
      category_score: r.category_score,     // ✅ 백엔드에서 제공
      average_rating: r.average_rating,     // ✅ 백엔드에서 제공
      total_reviews: r.total_reviews,       // ✅ 백엔드에서 제공
      treatment_count: r.treatment_count,   // ✅ 백엔드에서 제공
      treatments: [],
    });
  }
  // ...
}
```

집계 계산 로직 제거 가능! 🎉




