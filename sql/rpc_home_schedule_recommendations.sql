-- 홈 일정 기반 추천 RPC 함수 (백엔드 원본 기준)
-- treatment_id와 lang으로 매칭하여 언어별 데이터 반환
create or replace function public.rpc_home_schedule_recommendations(
  p_trip_start         date,
  p_trip_end           date,
  p_category_large     text default null,
  p_lang               text default null,
  p_limit_categories   integer default 5,
  p_limit_per_category integer default 5
)
returns table (
  category_mid        text,
  category_mid_key    text,
  category_large      text,
  treatment_id        bigint,
  treatment_name      text,
  hospital_name       text,
  selling_price       numeric,
  original_price      numeric,
  dis_rate            numeric,
  rating              numeric,
  review_count        integer,
  main_img_url        text,
  event_url           text,
  vat_info            text,
  treatment_hashtags  text,
  surgery_time        integer,
  downtime            integer,
  platform            text,
  treatment_rank      integer
)
language sql
stable
as $function$
with
params as (
  select
    ((p_trip_end - p_trip_start)::int + 1) as trip_days_inclusive,
    ((p_trip_end - p_trip_start)::int + 2) as allowed_reco_stay_days
),

ctr_dedup as (
  select
    category_mid,
    min("시술시간_min(분)")::int as surgery_time_min,
    max("시술시간_max(분)")::int as surgery_time_max,
    min("회복기간_min(일)")::int    as downtime_min,
    max("회복기간_max(일)")::int    as downtime_max,
    max("권장체류일수(일)")::int    as reco_stay_days
  from public.category_treattime_recovery
  group by category_mid
),

base as (
  select
    tm.treatment_id,

    -- 표시용 category_mid (언어별)
    case
      when coalesce(p_lang, 'KR') = 'EN' then coalesce(t_en.category_mid, tm.category_mid)
      when coalesce(p_lang, 'KR') = 'CN' then coalesce(t_cn.category_mid, tm.category_mid)
      when coalesce(p_lang, 'KR') = 'JP' then coalesce(t_jp.category_mid, tm.category_mid)
      else tm.category_mid
    end as category_mid,

    -- key는 한글 기준 고정
    tm.category_mid as category_mid_key,
    tm.category_large,

    -- 시술명 다국어
    case
      when coalesce(p_lang, 'KR') = 'EN' then coalesce(t_en.treatment_name, tm.treatment_name)
      when coalesce(p_lang, 'KR') = 'CN' then coalesce(t_cn.treatment_name, tm.treatment_name)
      when coalesce(p_lang, 'KR') = 'JP' then coalesce(t_jp.treatment_name, tm.treatment_name)
      else tm.treatment_name
    end as treatment_name,

    -- 병원명 다국어
    case
      when coalesce(p_lang, 'KR') = 'EN' then coalesce(t_en.hospital_name, tm.hospital_name)
      when coalesce(p_lang, 'KR') = 'CN' then coalesce(t_cn.hospital_name, tm.hospital_name)
      when coalesce(p_lang, 'KR') = 'JP' then coalesce(t_jp.hospital_name, tm.hospital_name)
      else tm.hospital_name
    end as hospital_name,

    -- 랭킹 기준 값은 마스터 기준
    tm.selling_price,
    tm.original_price,
    tm.dis_rate,
    tm.rating,
    tm.review_count,

    -- 썸네일 다국어 (없으면 fallback)
    case
      when coalesce(p_lang, 'KR') = 'EN' then coalesce(t_en.main_image_url, tm.main_image_url)
      when coalesce(p_lang, 'KR') = 'CN' then coalesce(t_cn.main_image_url, tm.main_image_url)
      when coalesce(p_lang, 'KR') = 'JP' then coalesce(t_jp.main_image_url, tm.main_image_url)
      else tm.main_image_url
    end as main_image_url,

    tm.event_url,
    tm.vat_info,
    tm.treatment_hashtags,

    ctr.surgery_time_min as surgery_time,
    ctr.downtime_max     as downtime,

    tm.platform
  from public.treatment_master tm
  left join public.treatment_master_en t_en
    on tm.treatment_id = t_en.treatment_id
  left join public.treatment_master_cn t_cn
    on tm.treatment_id = t_cn.treatment_id
  left join public.treatment_master_jp t_jp
    on tm.treatment_id = t_jp.treatment_id

  left join ctr_dedup ctr
    on tm.category_mid = ctr.category_mid
  cross join params p
  where
    (p_category_large is null or tm.category_large = p_category_large)
    and (
      -- ✅ 권장체류일수 필터링 개선: 권장체류일수가 있으면 우선 사용
      (
        ctr.reco_stay_days is not null
        and ctr.reco_stay_days <= p.allowed_reco_stay_days
      )
      or (
        -- 권장체류일수가 없으면 회복기간_max 사용
        ctr.reco_stay_days is null
        and (
          ctr.downtime_max is null
          or ctr.downtime_max <= p.trip_days_inclusive
        )
      )
      -- 여행 기간이 매우 길면 필터 무시 (대부분의 시술 포함)
      or p.trip_days_inclusive >= 30
    )
),

ranked as (
  select
    b.*,
    row_number() over (
      partition by b.category_mid_key
      order by
        b.rating desc nulls last,
        b.review_count desc nulls last,
        b.selling_price asc nulls last,
        b.treatment_id asc
    ) as treatment_rank
  from base b
),

cat_rank as (
  select
    category_mid_key,
    row_number() over (
      order by
        count(*) desc,
        avg(rating) desc nulls last,
        sum(review_count) desc
    ) as category_rank
  from ranked
  group by category_mid_key
)

select
  r.category_mid,
  r.category_mid_key,
  r.category_large,
  r.treatment_id,
  r.treatment_name,
  r.hospital_name,
  r.selling_price,
  r.original_price,
  r.dis_rate,
  r.rating,
  r.review_count,
  r.main_image_url as main_img_url,
  r.event_url,
  r.vat_info,
  r.treatment_hashtags,
  r.surgery_time,
  r.downtime,
  r.platform,
  r.treatment_rank
from ranked r
join cat_rank c using (category_mid_key)
where
  c.category_rank <= p_limit_categories
  and r.treatment_rank <= p_limit_per_category
order by
  c.category_rank,
  r.treatment_rank;
$function$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.rpc_home_schedule_recommendations 
  TO authenticated, anon;

-- 함수 설명 추가
COMMENT ON FUNCTION public.rpc_home_schedule_recommendations IS 
'홈 일정 기반 추천 함수 (백엔드 원본 기준).
- p_lang이 NULL이면 treatment_master 사용 (한국어)
- p_lang이 있으면 treatment_master_* 테이블에서 LEFT JOIN으로 번역된 데이터 반환
- category_mid_key는 항상 한글 고정 (로직/그룹핑용)
- category_mid는 언어별 번역된 값 (UI 표시용)
- 권장체류일수가 있으면 우선 사용, 없으면 회복기간_max 사용';
