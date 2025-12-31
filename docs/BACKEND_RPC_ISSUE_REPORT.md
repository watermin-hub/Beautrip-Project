# 백엔드 RPC 함수 수정 요청

## 🚨 긴급 수정 필요: `rpc_mid_category_rankings_i18n`

### 문제 상황
- **에러 발생**: 중분류 랭킹 조회 시 계속 실패
- **원인**: `rpc_mid_category_rankings_i18n` 함수가 **삭제된 `v_treatment_i18n` 뷰를 사용**하고 있음
- **영향**: 탐색 페이지의 중분류 랭킹 기능이 작동하지 않음

### 현재 함수의 문제점
```sql
-- 현재 함수 쿼리 (문제 있는 부분)
from public.v_treatment_i18n vi  -- ❌ 이 뷰는 삭제됨!
left join public.treatment_master tm
on tm.treatment_id = vi.treatment_id::bigint
where upper(vi.lang) = upper(p_lang)
```

### 해결 방법
`rpc_small_category_rankings_i18n` 함수처럼 **언어별 `treatment_master_*` 테이블을 직접 사용**하도록 수정 필요:

```sql
-- 수정 예시 (rpc_small_category_rankings_i18n 참고)
with base as (
  -- KR (기본값)
  select
    t.treatment_id,
    t.treatment_name,
    t.hospital_id,
    t.hospital_name,
    t.category_large,
    t.category_mid,
    coalesce(t.rating, 0) as rating,
    coalesce(t.review_count, 0) as review_count,
    t.main_image_url as main_img_url,
    t.category_mid as category_mid_key
  from public.treatment_master t
  where coalesce(upper(p_lang), 'KR') = 'KR'
    and t.category_mid is not null
    and (p_category_large is null or p_category_large = '' or p_category_large = '전체' or t.category_large = p_category_large)
    and t.rating is not null and t.rating > 0
    and t.review_count is not null and t.review_count > 0
    and t.main_image_url is not null and t.main_image_url <> ''

  union all

  -- EN
  select ... from public.treatment_master_en t
  where upper(coalesce(p_lang, 'KR')) = 'EN'
    ...

  union all

  -- CN
  select ... from public.treatment_master_cn t
  where upper(coalesce(p_lang, 'KR')) = 'CN'
    ...

  union all

  -- JP
  select ... from public.treatment_master_jp t
  where upper(coalesce(p_lang, 'KR')) = 'JP'
    ...
),
-- 나머지 로직은 기존과 동일
```

### 프론트에서 전달하는 파라미터
```typescript
{
  p_category_large: string | null,  // null, '', '전체' 모두 허용
  p_lang: 'KR' | 'EN' | 'CN' | 'JP',  // 필수 (KR도 명시적으로 전달)
  p_m: 20,
  p_dedupe_limit_per_name: 2,
  p_limit_per_category: 20
}
```

### 참고
- `rpc_small_category_rankings_i18n` 함수는 이미 올바르게 구현되어 있음 (언어별 테이블 직접 사용)
- 동일한 방식으로 `rpc_mid_category_rankings_i18n`도 수정하면 됨

### 우선순위
**긴급** - 탐색 페이지 핵심 기능이 작동하지 않음

---

## 📝 추가 확인 사항

### 에러 로그에서 확인된 정보
- 에러 객체에 `code`, `details`, `hint`, `message` 필드가 있음
- 하지만 실제 에러 메시지가 비어있거나 명확하지 않음
- Supabase 스키마 캐시 문제일 가능성도 있음

### 권장 사항
1. 함수 수정 후 Supabase 스키마 캐시 새로고침
2. 함수 테스트 후 프론트에서 정상 동작 확인
3. 에러 발생 시 상세 로그 확인




