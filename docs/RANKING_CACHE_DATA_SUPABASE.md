# 랭킹 알고리즘용 캐시 데이터 Supabase 쿼리 가이드

## 📋 개요

랭킹 알고리즘을 위해 `treatment_master` 테이블에서 **약 2000개**의 시술 데이터를 한 번에 불러와서 프론트엔드에서 캐시로 사용합니다.

**현재 상황:**

- `RankingDataContext.tsx`에서 최대 5000개까지 로드하도록 되어 있음
- 랭킹 알고리즘은 이 캐시된 데이터를 기반으로 동작
- **목표: 약 2000개로 제한하여 효율적인 쿼리 작성**

---

## 🎯 요구사항

### 1. 데이터 개수

- **약 2000개**의 시술 데이터
- 정확히 2000개가 아니어도 됨 (1800~2200개 범위 OK)

### 2. 필요한 컬럼

랭킹 알고리즘에 필요한 모든 컬럼을 포함해야 합니다:

```typescript
interface Treatment {
  treatment_id?: number;
  treatment_name?: string;
  hospital_name?: string;
  category_large?: string;
  category_mid?: string; // 중분류 (필수)
  category_small?: string; // 소분류
  selling_price?: number;
  original_price?: number;
  dis_rate?: number;
  rating?: number; // 평점 (랭킹 계산에 중요)
  review_count?: number; // 리뷰 수 (랭킹 계산에 중요)
  main_image_url?: string;
  event_url?: string;
  vat_info?: string;
  treatment_hashtags?: string;
  surgery_time?: number | string;
  downtime?: number | string;
  platform?: string; // 플랫폼 (gangnamunni, yeoti, babitalk)
  [key: string]: any;
}
```

### 3. 정렬 기준

- **플랫폼 우선순위 정렬은 하지 않음** (`skipPlatformSort: true`)
- 랭킹 알고리즘이 자체적으로 정렬하므로 원본 순서 유지
- 또는 랭킹 알고리즘에 유리한 순서로 정렬 (예: 평점 높은 순, 리뷰 많은 순)

---

## 📊 Supabase 쿼리 예시

### 방법 1: LIMIT으로 2000개 제한

```sql
-- 기본: 2000개 제한
SELECT *
FROM treatment_master
LIMIT 2000;
```

### 방법 2: 평점/리뷰 기준으로 상위 2000개

```sql
-- 평점이 높고 리뷰가 많은 순서로 상위 2000개
SELECT *
FROM treatment_master
WHERE rating IS NOT NULL
  AND review_count IS NOT NULL
  AND review_count > 0
ORDER BY
  rating DESC NULLS LAST,
  review_count DESC NULLS LAST
LIMIT 2000;
```

### 방법 3: 카테고리별 균등 분배 (추천)

```sql
-- 각 카테고리에서 균등하게 가져오기
WITH ranked_treatments AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY category_large
      ORDER BY
        COALESCE(rating, 0) DESC,
        COALESCE(review_count, 0) DESC
    ) as rn
  FROM treatment_master
  WHERE category_large IS NOT NULL
)
SELECT *
FROM ranked_treatments
WHERE rn <= 200  -- 각 카테고리당 최대 200개
ORDER BY
  category_large,
  COALESCE(rating, 0) DESC,
  COALESCE(review_count, 0) DESC
LIMIT 2000;
```

### 방법 4: 페이지네이션으로 2000개 (현재 코드 방식)

```sql
-- 첫 번째 페이지: 0~999
SELECT *
FROM treatment_master
ORDER BY treatment_id  -- 또는 다른 기준
LIMIT 1000
OFFSET 0;

-- 두 번째 페이지: 1000~1999
SELECT *
FROM treatment_master
ORDER BY treatment_id
LIMIT 1000
OFFSET 1000;
```

---

## 🔍 현재 프론트엔드 코드 분석

### `RankingDataContext.tsx` (현재 구현)

```typescript
const loadAllData = async () => {
  // 여러 번 호출하여 모든 데이터 가져오기 (최대 5000개)
  let allData: Treatment[] = [];
  let page = 1;
  const pageSize = 1000; // Supabase 최대 limit
  let hasMore = true;
  const maxData = 5000; // 최대 로드 개수 제한

  while (hasMore && allData.length < maxData) {
    const result = await loadTreatmentsPaginated(page, pageSize, {
      skipPlatformSort: true, // 플랫폼 정렬 건너뛰기
      categoryLarge: undefined,
      categoryMid: undefined,
    });

    allData = [...allData, ...result.data];
    hasMore = result.hasMore && result.data.length === pageSize;
    page++;
  }
};
```

**문제점:**

- 최대 5000개까지 로드하려고 시도
- 여러 번의 API 호출 필요 (1000개씩 5번)
- 불필요한 데이터까지 로드

**개선 방향:**

- **2000개로 제한**
- **1~2번의 API 호출로 완료**
- **효율적인 쿼리 사용**

---

## ✅ 권장 쿼리 (백엔드 개발자용)

### 옵션 A: 단순 LIMIT (가장 간단)

```sql
SELECT *
FROM treatment_master
LIMIT 2000;
```

**장점:**

- 가장 간단
- 빠른 실행

**단점:**

- 어떤 데이터가 선택될지 불명확
- 랭킹 품질이 낮을 수 있음

---

### 옵션 B: 품질 기준 정렬 (추천)

```sql
SELECT *
FROM treatment_master
WHERE
  rating IS NOT NULL
  AND review_count IS NOT NULL
  AND review_count > 0
ORDER BY
  rating DESC,
  review_count DESC,
  treatment_id ASC
LIMIT 2000;
```

**장점:**

- 평점이 높고 리뷰가 많은 데이터 우선
- 랭킹 알고리즘에 유리
- 품질 높은 데이터만 선택

**단점:**

- 일부 카테고리가 누락될 수 있음

---

### 옵션 C: 카테고리 균등 분배 (가장 권장)

```sql
WITH category_ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(category_large, '기타')
      ORDER BY
        COALESCE(rating, 0) DESC,
        COALESCE(review_count, 0) DESC,
        treatment_id ASC
    ) as category_rank
  FROM treatment_master
)
SELECT *
FROM category_ranked
WHERE category_rank <= 200  -- 각 카테고리당 최대 200개
ORDER BY
  COALESCE(category_large, '기타'),
  COALESCE(rating, 0) DESC,
  COALESCE(review_count, 0) DESC
LIMIT 2000;
```

**장점:**

- 카테고리별로 균등하게 분배
- 각 카테고리에서 품질 높은 데이터 선택
- 랭킹 알고리즘에 가장 유리

**단점:**

- 쿼리가 약간 복잡
- 실행 시간이 약간 더 걸릴 수 있음

---

## 🚀 구현 방법

### 1. Supabase에서 직접 쿼리 실행

```sql
-- 권장 쿼리 (옵션 C)
WITH category_ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(category_large, '기타')
      ORDER BY
        COALESCE(rating, 0) DESC,
        COALESCE(review_count, 0) DESC,
        treatment_id ASC
    ) as category_rank
  FROM treatment_master
)
SELECT *
FROM category_ranked
WHERE category_rank <= 200
ORDER BY
  COALESCE(category_large, '기타'),
  COALESCE(rating, 0) DESC,
  COALESCE(review_count, 0) DESC
LIMIT 2000;
```

### 2. 프론트엔드 코드 수정

`RankingDataContext.tsx`에서 `maxData`를 2000으로 변경:

```typescript
const maxData = 2000; // 5000 → 2000으로 변경
```

또는 더 효율적으로, 한 번의 호출로 2000개 가져오기:

```typescript
const loadAllData = async () => {
  try {
    setLoading(true);
    setError(null);

    // 한 번에 2000개 가져오기
    const result = await loadTreatmentsPaginated(1, 2000, {
      skipPlatformSort: true,
      categoryLarge: undefined,
      categoryMid: undefined,
    });

    setAllTreatments(result.data);
    setLastUpdated(new Date());
    console.log(
      `✅ [RankingDataContext] 전체 데이터 로드 완료: ${result.data.length}개`
    );
  } catch (err) {
    // 에러 처리
  } finally {
    setLoading(false);
  }
};
```

---

## 📌 주의사항

1. **NULL 값 처리**

   - `rating`이나 `review_count`가 NULL인 경우를 고려
   - `COALESCE` 함수로 기본값 설정

2. **인덱스 확인**

   - `rating`, `review_count`, `category_large` 컬럼에 인덱스가 있는지 확인
   - 인덱스가 없으면 쿼리 성능이 저하될 수 있음

3. **데이터 품질**

   - `rating`이 0이거나 `review_count`가 0인 데이터는 제외할지 고려
   - 품질 높은 데이터만 선택하는 것이 랭킹 품질에 유리

4. **플랫폼 정렬**
   - **랭킹 페이지는 플랫폼 우선순위 정렬을 하지 않음**
   - `skipPlatformSort: true` 옵션 사용
   - 랭킹 알고리즘이 자체적으로 정렬

---

## 🔍 성능 최적화

### 인덱스 생성 (필요한 경우)

```sql
-- rating과 review_count에 복합 인덱스
CREATE INDEX idx_treatment_rating_review
ON treatment_master(rating DESC, review_count DESC);

-- category_large에 인덱스
CREATE INDEX idx_treatment_category_large
ON treatment_master(category_large);
```

### 쿼리 실행 계획 확인

```sql
EXPLAIN ANALYZE
WITH category_ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(category_large, '기타')
      ORDER BY
        COALESCE(rating, 0) DESC,
        COALESCE(review_count, 0) DESC,
        treatment_id ASC
    ) as category_rank
  FROM treatment_master
)
SELECT *
FROM category_ranked
WHERE category_rank <= 200
LIMIT 2000;
```

---

## 📞 문의사항

1. **데이터 개수**: 정확히 2000개가 필요한가요, 아니면 약 2000개면 되나요?
2. **정렬 기준**: 어떤 기준으로 2000개를 선택할까요? (평점, 리뷰 수, 카테고리 균등 분배 등)
3. **필터링**: 특정 조건의 데이터만 포함할까요? (예: rating > 0, review_count > 0)

---

## ✅ 체크리스트

- [ ] Supabase에서 쿼리 테스트 (2000개 데이터 확인)
- [ ] 쿼리 실행 시간 측정 (목표: 1초 이내)
- [ ] 필요한 컬럼 모두 포함 확인
- [ ] NULL 값 처리 확인
- [ ] 프론트엔드 코드 수정 (`maxData: 2000`)
- [ ] 랭킹 알고리즘 동작 확인
- [ ] 성능 테스트 (로딩 시간 확인)
