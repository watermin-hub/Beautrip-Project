# 백엔드 수정 제안: 프론트엔드 로직 그대로 구현

## 📋 프론트엔드 현재 로직 분석

### 현재 프론트엔드에서 하는 일:

1. **RPC에서 받아온 데이터를 `category_mid_key`로 그룹화**
2. **각 그룹별로 집계 계산:**
   ```typescript
   average_rating = 모든 시술의 평점 평균
   total_reviews = 모든 시술의 리뷰 수 합계
   category_score = average_rating * total_reviews  // ⭐ 핵심 계산식
   ```
3. **`category_score` 기준으로 내림차순 정렬** (높은 점수 순)
4. **정렬 후 `category_rank`를 1부터 순서대로 할당**

### 계산 공식:
```
category_score = average_rating × total_reviews
```

예:
- 중분류 A: 평균 평점 4.5, 총 리뷰 100개 → score = 450
- 중분류 B: 평균 평점 5.0, 총 리뷰 50개 → score = 250
- → A가 1위, B가 2위

---

## 💡 백엔드 수정 방안

### 핵심 아이디어:
프론트엔드가 하는 계산을 **백엔드에서 미리 해서 반환**하면 됩니다!

---

## 🔧 수정된 SQL 함수 (전체)

```sql
CREATE OR REPLACE FUNCTION public.rpc_mid_category_rankings_i18n(
  p_category_large text, 
  p_lang text, 
  p_m integer DEFAULT 20, 
  p_dedupe_limit_per_name integer DEFAULT 2, 
  p_limit_per_category integer DEFAULT 20
)
RETURNS TABLE(
  -- ✅ 집계 필드 추가
  category_rank integer,           -- 중분류 랭킹 순위 (1부터 시작)
  category_score numeric,          -- 중분류 랭킹 점수 (average_rating * total_reviews)
  average_rating numeric,          -- 중분류 평균 평점
  total_reviews integer,           -- 중분류 총 리뷰 수
  treatment_count integer,         -- 중분류별 시술 개수
  -- 기존 필드
  category_mid_key text,
  category_mid text,
  treatment_id bigint,
  treatment_name text,
  hospital_id bigint,
  hospital_name text,
  rating numeric,
  review_count integer,
  main_img_url text
)
LANGUAGE sql
STABLE
AS $function$
with stats as (
  -- 베이지안 C(전체 평균)는 KR 마스터 기준으로 유지
  select avg(t.rating)::numeric as c
  from public.treatment_master t
  where t.rating is not null and t.rating > 0
    and t.review_count is not null and t.review_count > 0
),
base as (
  -- KR (기본: p_lang이 null이거나 'KR'인 경우)
  select
    t.category_mid as category_mid_key,
    t.category_mid as category_mid,
    t.treatment_id,
    t.treatment_name,
    t.hospital_id,
    t.hospital_name,
    t.rating,
    t.review_count,
    t.main_image_url as main_img_url
  from public.treatment_master t
  where coalesce(upper(p_lang), 'KR') = 'KR'
    and (
      p_category_large is null
      or p_category_large = ''
      or p_category_large = '전체'
      or t.category_large = p_category_large
    )
    and t.rating is not null and t.rating > 0
    and t.review_count is not null and t.review_count > 0
    and t.main_image_url is not null
    and t.main_image_url <> ''

  union all

  -- CN
  select
    t.category_mid as category_mid_key,
    t.category_mid as category_mid,
    t.treatment_id,
    t.treatment_name,
    t.hospital_id,
    t.hospital_name,
    t.rating,
    t.review_count,
    t.main_image_url as main_img_url
  from public.treatment_master_cn t
  where upper(p_lang) = 'CN'
    and (
      p_category_large is null
      or p_category_large = ''
      or p_category_large = '전체'
      or t.category_large = p_category_large
    )
    and t.rating is not null and t.rating > 0
    and t.review_count is not null and t.review_count > 0
    and t.main_image_url is not null
    and t.main_image_url <> ''

  union all

  -- EN
  select
    t.category_mid as category_mid_key,
    t.category_mid as category_mid,
    t.treatment_id,
    t.treatment_name,
    t.hospital_id,
    t.hospital_name,
    t.rating,
    t.review_count,
    t.main_image_url as main_img_url
  from public.treatment_master_en t
  where upper(p_lang) = 'EN'
    and (
      p_category_large is null
      or p_category_large = ''
      or p_category_large = '전체'
      or t.category_large = p_category_large
    )
    and t.rating is not null and t.rating > 0
    and t.review_count is not null and t.review_count > 0
    and t.main_image_url is not null
    and t.main_image_url <> ''

  union all

  -- JP
  select
    t.category_mid as category_mid_key,
    t.category_mid as category_mid,
    t.treatment_id,
    t.treatment_name,
    t.hospital_id,
    t.hospital_name,
    t.rating,
    t.review_count,
    t.main_image_url as main_img_url
  from public.treatment_master_jp t
  where upper(p_lang) = 'JP'
    and (
      p_category_large is null
      or p_category_large = ''
      or p_category_large = '전체'
      or t.category_large = p_category_large
    )
    and t.rating is not null and t.rating > 0
    and t.review_count is not null and t.review_count > 0
    and t.main_image_url is not null
    and t.main_image_url <> ''
),
scored as (
  select
    b.*,
    (
      (b.review_count::numeric / (b.review_count::numeric + p_m::numeric)) * b.rating
      + (p_m::numeric / (b.review_count::numeric + p_m::numeric)) * s.c
    ) as bayes_score,
    row_number() over (
      partition by b.category_mid_key, b.treatment_name
      order by
        (
          (b.review_count::numeric / (b.review_count::numeric + p_m::numeric)) * b.rating
          + (p_m::numeric / (b.review_count::numeric + p_m::numeric)) * s.c
        ) desc,
        b.review_count desc,
        b.rating desc,
        b.treatment_id asc
    ) as rn_name
  from base b
  cross join stats s
),
deduped as (
  select *
  from scored
  where rn_name <= p_dedupe_limit_per_name
),
ranked as (
  select
    d.*,
    row_number() over (
      partition by d.category_mid_key
      order by d.bayes_score desc, d.review_count desc, d.rating desc, d.treatment_id asc
    ) as rn_mid
  from deduped d
),
-- ✅ 새로 추가: 중분류별 집계 계산
category_aggregated as (
  select
    r.category_mid_key,
    r.category_mid,
    avg(r.rating)::numeric as average_rating,           -- 평균 평점
    sum(r.review_count)::integer as total_reviews,      -- 총 리뷰 수
    count(*)::integer as treatment_count,               -- 시술 개수
    avg(r.rating)::numeric * sum(r.review_count)::numeric as category_score  -- ⭐ 핵심: 프론트와 동일한 계산식
  from ranked r
  where r.rn_mid <= p_limit_per_category
  group by r.category_mid_key, r.category_mid
),
-- ✅ 새로 추가: 중분류 랭킹 순서 결정
category_ranked as (
  select
    ca.*,
    row_number() over (order by ca.category_score desc) as category_rank  -- category_score 높은 순으로 1, 2, 3...
  from category_aggregated ca
)
-- ✅ 최종 SELECT: 집계 필드 포함 + 랭킹 순서로 정렬
select
  cr.category_rank,              -- ✅ 추가
  cr.category_score,             -- ✅ 추가
  cr.average_rating,             -- ✅ 추가
  cr.total_reviews,              -- ✅ 추가
  cr.treatment_count,            -- ✅ 추가
  r.category_mid_key,
  r.category_mid,
  r.treatment_id,
  r.treatment_name,
  r.hospital_id,
  r.hospital_name,
  r.rating,
  r.review_count,
  r.main_img_url
from ranked r
join category_ranked cr on r.category_mid_key = cr.category_mid_key
where r.rn_mid <= p_limit_per_category
order by cr.category_rank, r.rn_mid;  -- ✅ 수정: category_rank 기준 정렬 (이름순 X)
$function$
```

---

## 🔍 주요 변경 사항

### 1. RETURNS TABLE에 집계 필드 추가
```sql
RETURNS TABLE(
  category_rank integer,      -- ✅ 추가
  category_score numeric,     -- ✅ 추가
  average_rating numeric,     -- ✅ 추가
  total_reviews integer,      -- ✅ 추가
  treatment_count integer,    -- ✅ 추가
  -- 기존 필드들...
)
```

### 2. category_aggregated CTE 추가 (집계 계산)
```sql
category_aggregated as (
  select
    r.category_mid_key,
    r.category_mid,
    avg(r.rating)::numeric as average_rating,
    sum(r.review_count)::integer as total_reviews,
    count(*)::integer as treatment_count,
    avg(r.rating)::numeric * sum(r.review_count)::numeric as category_score  -- ⭐ 프론트와 동일
  from ranked r
  where r.rn_mid <= p_limit_per_category
  group by r.category_mid_key, r.category_mid
)
```

### 3. category_ranked CTE 추가 (랭킹 순서 결정)
```sql
category_ranked as (
  select
    ca.*,
    row_number() over (order by ca.category_score desc) as category_rank  -- 높은 점수 순으로 1, 2, 3...
  from category_aggregated ca
)
```

### 4. 최종 SELECT에서 JOIN + 정렬 수정
```sql
select
  cr.category_rank,      -- ✅ 집계 필드 포함
  cr.category_score,
  cr.average_rating,
  cr.total_reviews,
  cr.treatment_count,
  r.category_mid_key,
  -- ... 기존 필드들
from ranked r
join category_ranked cr on r.category_mid_key = cr.category_mid_key  -- ✅ JOIN 추가
where r.rn_mid <= p_limit_per_category
order by cr.category_rank, r.rn_mid;  -- ✅ 수정: category_rank 기준 (이름순 X)
```

---

## ✅ 이렇게 하면:

1. **프론트엔드가 받는 데이터:**
   - 이미 `category_rank`, `category_score`, `average_rating`, `total_reviews` 등이 포함됨
   - 랭킹 순서로 정렬되어 있음

2. **프론트엔드 처리:**
   - 집계 계산 불필요 (백엔드에서 이미 계산됨)
   - `category_rank` 기준으로 그대로 사용 가능
   - 재정렬 불필요

3. **성능:**
   - 프론트엔드에서 불필요한 계산 제거
   - 백엔드에서 한 번에 처리하여 효율적
   - 3초 안에 응답하는 현재 성능 유지 가능

4. **일관성:**
   - 소분류 함수와 동일한 패턴
   - 프론트엔드 로직과 백엔드 로직 일치

---

## 🎯 체크리스트

- [ ] `RETURNS TABLE`에 집계 필드 5개 추가
- [ ] `category_aggregated` CTE 추가 (집계 계산)
- [ ] `category_ranked` CTE 추가 (랭킹 순서 결정)
- [ ] 최종 SELECT에서 JOIN 추가
- [ ] `order by category_mid_key` → `order by category_rank` 변경
- [ ] 테스트: 집계 값이 프론트엔드 계산과 일치하는지 확인
- [ ] 테스트: 랭킹 순서가 올바른지 확인 (이름순 X)

---

## 📝 참고

프론트엔드 계산 공식과 동일하게 구현:
```sql
category_score = average_rating × total_reviews
```

이 공식을 백엔드에서 계산하여 반환하면, 프론트엔드는 받은 그대로 사용하면 됩니다!

