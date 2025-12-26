# 백엔드 RPC 함수 문제점 정리

## 🚨 발견된 문제점

### 1. **정렬 순서 문제 (가장 심각)**

**현재 백엔드 함수의 마지막 줄:**

```sql
order by category_mid_key, rn_mid;
```

**문제:**

- `category_mid_key`로 먼저 정렬하면 **이름순(알파벳/가나다 순)으로 정렬**됨
- 영어: B로 시작하는 중분류가 1위부터 나타남
- 일본어: 일본어 어순으로 정렬됨
- 한국어: 가나다 순으로 정렬됨
- **랭킹 순서가 아닌 이름순으로 정렬되고 있음!**

**기대 동작:**

- 중분류별로 랭킹 점수(베이지안 점수 집계)가 높은 순서로 정렬되어야 함
- 현재는 각 중분류 내 시술들은 `rn_mid`로 랭킹 순이지만, **중분류 자체의 순서가 이름순**

**해결 방법:**

```sql
-- 중분류별 집계 점수 계산 후 정렬
-- (아래 2번 문제 해결 후 가능)
order by category_mid_rank, rn_mid;  -- 또는 다른 랭킹 필드
```

---

### 2. **집계 필드 부재**

**현재 반환 필드:**

```sql
RETURNS TABLE(
  category_mid_key   text,
  category_mid       text,
  treatment_id       bigint,
  treatment_name     text,
  hospital_id        bigint,
  hospital_name      text,
  rating             numeric,
  review_count       integer,
  main_img_url       text
)
```

**문제:**

- 중분류별 집계 정보가 없음:
  - `category_rank` (중분류 랭킹 순위) 없음
  - `category_score` (중분류 랭킹 점수) 없음
  - `average_rating` (중분류 평균 평점) 없음
  - `total_reviews` (중분류 총 리뷰 수) 없음
  - `treatment_count` (중분류별 시술 개수) 없음

**영향:**

- 프론트엔드에서 중분류별 집계를 다시 계산해야 함 (비효율)
- 중분류 간 랭킹 비교가 불가능 (이름순으로만 정렬 가능)
- 소분류 랭킹 함수(`rpc_small_category_rankings_i18n`)와 일관성 없음

**기대 반환 필드:**

```sql
RETURNS TABLE(
  category_mid_key   text,
  category_mid       text,
  category_rank      integer,      -- ✅ 중분류 랭킹 순위 추가 필요
  category_score     numeric,      -- ✅ 중분류 랭킹 점수 추가 필요
  average_rating     numeric,      -- ✅ 중분류 평균 평점 추가 필요
  total_reviews      integer,      -- ✅ 중분류 총 리뷰 수 추가 필요
  treatment_count    integer,      -- ✅ 중분류별 시술 개수 추가 필요
  treatment_id       bigint,
  treatment_name     text,
  hospital_id        bigint,
  hospital_name      text,
  rating             numeric,
  review_count       integer,
  main_img_url       text,
  rn_mid             integer       -- ✅ 중분류 내 시술 랭킹 (현재는 내부에서만 사용)
)
```

---

### 3. **소분류 함수와의 일관성 부족**

**소분류 함수 (`rpc_small_category_rankings_i18n`) 비교:**

- 소분류 함수는 집계 필드(`category_rank`, `category_score` 등)를 제공함
- 중분류 함수는 집계 필드를 제공하지 않음
- **일관성이 없어 프론트엔드 처리 로직이 복잡해짐**

---

## 💡 해결 방안

### 방안 1: 집계 필드 추가 + 랭킹 정렬 (권장)

**수정할 부분:**

1. **중분류별 집계 계산 추가:**

```sql
-- ranked CTE 이후에 집계 CTE 추가
category_aggregated as (
  select
    r.category_mid_key,
    r.category_mid,
    avg(r.rating) as average_rating,
    sum(r.review_count) as total_reviews,
    count(*) as treatment_count,
    -- 중분류별 랭킹 점수 계산 (예: 평균 베이지안 점수 또는 평균 평점 * 총 리뷰 수)
    avg(r.bayes_score) * sum(r.review_count) as category_score
  from ranked r
  where r.rn_mid <= p_limit_per_category
  group by r.category_mid_key, r.category_mid
),
category_ranked as (
  select
    ca.*,
    row_number() over (order by ca.category_score desc) as category_rank
  from category_aggregated ca
)
```

2. **최종 SELECT에 집계 필드 포함:**

```sql
select
  cr.category_rank,           -- ✅ 추가
  cr.category_score,          -- ✅ 추가
  cr.average_rating,          -- ✅ 추가
  cr.total_reviews,           -- ✅ 추가
  cr.treatment_count,         -- ✅ 추가
  r.category_mid_key,
  r.category_mid,
  r.treatment_id,
  r.treatment_name,
  r.hospital_id,
  r.hospital_name,
  r.rating,
  r.review_count,
  r.main_img_url,
  r.rn_mid                    -- ✅ 추가 (프론트에서 활용 가능)
from ranked r
join category_ranked cr on r.category_mid_key = cr.category_mid_key
where r.rn_mid <= p_limit_per_category
order by cr.category_rank, r.rn_mid;  -- ✅ 랭킹 순서로 정렬
```

3. **RETURNS TABLE 수정:**

```sql
RETURNS TABLE(
  category_rank      integer,    -- ✅ 추가
  category_score     numeric,    -- ✅ 추가
  average_rating     numeric,    -- ✅ 추가
  total_reviews      integer,    -- ✅ 추가
  treatment_count    integer,    -- ✅ 추가
  category_mid_key   text,
  category_mid       text,
  treatment_id       bigint,
  treatment_name     text,
  hospital_id        bigint,
  hospital_name      text,
  rating             numeric,
  review_count       integer,
  main_img_url       text,
  rn_mid             integer     -- ✅ 추가 (선택사항)
)
```

---

### 방안 2: 정렬만 수정 (임시 방안)

집계 필드 추가가 어렵다면, 최소한 **정렬 순서만 수정**:

**현재:**

```sql
order by category_mid_key, rn_mid;
```

**수정안 1: 각 중분류의 최고 점수 기준 정렬**

```sql
-- 중분류별 최고 베이지안 점수 기준으로 정렬
order by
  (select max(bayes_score) from ranked r2 where r2.category_mid_key = ranked.category_mid_key) desc,
  category_mid_key,
  rn_mid;
```

**수정안 2: 중분류별 평균 점수 기준 정렬**

```sql
-- 서브쿼리로 중분류별 평균 점수 계산하여 정렬
order by
  (select avg(bayes_score) from ranked r2 where r2.category_mid_key = ranked.category_mid_key) desc,
  category_mid_key,
  rn_mid;
```

**단점:**

- 성능 저하 가능 (서브쿼리 사용)
- 집계 정보가 없어 프론트엔드에서 중복 계산 필요
- 소분류 함수와 일관성 없음

---

## 📋 체크리스트

- [ ] **집계 필드 추가**

  - [ ] `category_rank` 추가
  - [ ] `category_score` 추가
  - [ ] `average_rating` 추가
  - [ ] `total_reviews` 추가
  - [ ] `treatment_count` 추가

- [ ] **정렬 순서 수정**

  - [ ] `order by category_mid_key` → `order by category_rank` (또는 `category_score desc`)
  - [ ] 중분류별 랭킹 순서로 정렬되도록 수정

- [ ] **RETURNS TABLE 수정**

  - [ ] 집계 필드들을 반환 타입에 추가

- [ ] **프론트엔드 코드 확인**
  - [ ] 집계 필드를 받아서 사용하도록 수정 (이미 처리됨)
  - [ ] 정렬 로직이 올바르게 동작하는지 확인

---

## 🔍 현재 프론트엔드 동작

프론트엔드는 이미 하위 호환성을 고려하여:

1. RPC에서 집계 필드를 받아오려고 시도
2. 없으면 자동으로 계산
3. `category_score` 기준으로 재정렬

하지만 **백엔드에서 이름순으로 정렬된 데이터를 보내주면**, 프론트엔드에서 재정렬하더라도:

- 불필요한 계산 오버헤드 발생
- 백엔드와 프론트엔드 로직 불일치
- 소분류 함수와 일관성 부족

**결론: 백엔드 함수를 수정하는 것이 가장 좋은 해결책입니다.**
