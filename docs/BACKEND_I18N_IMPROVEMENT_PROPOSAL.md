# 다국어 시술 데이터 구조 사용 가이드

## 현재 구조 (이미 구현됨)

1. **`treatment_translation` 테이블**: 언어별 번역 데이터 저장
2. **`v_treatment_i18n` 뷰**: `treatment_master`와 `treatment_translation`을 JOIN한 뷰

## 문제점

1. **언어별 데이터 분리 문제**

   - `v_treatment_i18n` 뷰에 같은 `treatment_id`에 대해 여러 언어 버전이 존재 (lang 컬럼으로 구분)
   - 한국어일 때도 `v_treatment_i18n`을 사용하면, 같은 `treatment_id`에 대해 여러 언어 버전이 모두 나올 수 있음
   - 회복기간 기반 일정 추천이나 RankingSection에서 `treatment_id`로 연결할 때, 같은 `treatment_id`에 여러 언어 버전이 있어서 헷갈림

2. **해결 방법**: 언어에 따라 적절한 테이블/뷰 사용

## 프론트엔드 구현 방법

### 1. `treatment_translation` 테이블 구조 (이미 존재)

```sql
create table if not exists public.treatment_translation (
  treatment_id bigint not null,
  lang text not null check (lang in ('ko','en','ja','zh','zh-CN')),
  -- 언어별 텍스트 컬럼
  treatment_name text,
  category_large text,
  category_mid text,
  category_small text,
  vat_info text,
  hospital_name text,
  hospital_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 시술 + 같은 언어는 1개만
  constraint pk_treatment_translation
    primary key (treatment_id, lang),
  -- 마스터 시술과 연결
  constraint fk_treatment_translation_master
    foreign key (treatment_id)
    references public.treatment_master (treatment_id)
    on delete cascade
);

-- 언어별 조회 성능용
create index if not exists idx_treatment_translation_lang
  on public.treatment_translation (lang);
```

### 2. `v_treatment_i18n` 뷰 구조 (이미 존재)

현재 `v_treatment_i18n` 뷰는 다음과 같은 구조입니다:

```sql
-- v_treatment_i18n 뷰는 이미 다음과 같은 구조로 되어 있습니다:
-- treatment_master와 treatment_translation을 LEFT JOIN하여
-- lang 컬럼으로 언어를 구분합니다.
```

### 3. 프론트엔드 사용 방법 (✅ 이미 구현 완료)

프론트엔드에서는 다음과 같이 사용합니다:

1. **한국어 (KR)**: `treatment_master` 테이블에서 직접 조회 (lang 필터 없음)
   - 이유: `v_treatment_i18n`을 사용하면 같은 `treatment_id`에 대해 여러 언어 버전이 나올 수 있음
2. **다른 언어 (EN, JP, CN)**: `v_treatment_i18n` 뷰에서 `lang` 필터로 조회
   - `lang='en'`, `lang='ja'`, `lang='zh-CN'` 등으로 필터링하여 해당 언어만 조회

```typescript
// 예시
const treatmentTable = getTreatmentTableName(language); // KR이면 'treatment_master', 아니면 'v_treatment_i18n'
const dbLang = getCurrentLanguageForDb(language); // KR이면 null, 아니면 'en', 'ja', 'zh-CN'

let query = client
  .from(treatmentTable)
  .select("*")
  .eq("treatment_id", treatmentId);
if (dbLang) {
  query = query.eq("lang", dbLang); // 다른 언어일 때만 lang 필터 적용
}
```

## 장점

1. **명확한 데이터 분리**: 한국어는 `treatment_master`, 다른 언어는 `treatment_translation`으로 명확히 분리
2. **효율적인 쿼리**: 언어별로 적절한 테이블/뷰를 사용하여 불필요한 JOIN 최소화
3. **일관성**: `treatment_id`는 항상 동일하며, 언어별로 다른 텍스트만 분리
4. **확장성**: 새로운 언어 추가 시 `treatment_translation`에만 데이터 추가하면 됨
5. **성능**: 인덱스를 활용한 빠른 언어별 조회

## 구현 상태

✅ **완료된 작업**:

1. `treatment_translation` 테이블 존재 (이미 구현됨)
2. `v_treatment_i18n` 뷰 존재 (이미 구현됨)
3. 프론트엔드에서 `language` 파라미터 전달 (수정 완료)
4. `getTreatmentTableName` 함수: 한국어일 때 `treatment_master`, 다른 언어일 때 `v_treatment_i18n` 반환 (수정 완료)
5. 모든 API 호출에서 `language` 파라미터 전달 (수정 완료)

## 참고사항

- `treatment_master`의 `treatment_id`는 모든 언어에서 동일하게 사용
- 회복기간, 시술시간 등 언어와 무관한 데이터는 `treatment_master`에 유지
- 텍스트 데이터(시술명, 카테고리명 등)만 `treatment_translation`에 저장
