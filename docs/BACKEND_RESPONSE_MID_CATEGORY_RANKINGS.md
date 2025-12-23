# 백엔드 답변: 중분류 랭킹 i18n 관련 이슈

## 📋 프론트엔드 피드백 요약

프론트엔드에서 보고한 문제:

1. **한국어 중분류 필터("#코기능교정") 문제** - 프론트에서 "#" 제거 처리 완료
2. **EN/CN/JP에서 대분류 선택 시 중분류 안 뜸** - v_treatment_i18n 뷰 삭제로 인한 에러

---

## ✅ 백엔드 현재 상태

### 1. v_treatment_i18n 의존성 제거 완료

**상태**: ✅ **이미 해결 완료**

- `rpc_mid_category_rankings_i18n` 함수에서 `v_treatment_i18n` 뷰 의존성 완전히 제거
- 언어별 `treatment_master_*` 테이블을 직접 조회하도록 수정 완료
- DB 전체 검색 결과: i18n 함수 중 `v_treatment_i18n`을 참조하는 함수 없음

**현재 구조**:

```sql
-- 언어별 테이블 직접 사용
KR: treatment_master
EN: treatment_master_en
CN: treatment_master_cn
JP: treatment_master_jp
```

**UNION ALL 방식으로 통합 조회**

---

### 2. p_category_large 파라미터 처리 방식

**현재 구현**:

```sql
WHERE (
  p_category_large IS NULL
  OR p_category_large = ''
  OR p_category_large = '전체'
  OR t.category_large = p_category_large
)
```

**의미**:

- `p_category_large`는 **각 언어 테이블의 `category_large` 컬럼 값과 직접 비교**
- KR일 때: `p_category_large = "리프팅"` → `treatment_master.category_large = "리프팅"` 매칭
- EN일 때: `p_category_large = "Lifting"` → `treatment_master_en.category_large = "Lifting"` 매칭 가정

**현재 프론트엔드 동작** (확인 완료):

- `selectedCategory`는 **항상 한국어 값**으로 전달됨 (예: "리프팅", "눈성형")
- `getMainCategories`의 `id` 필드가 한국어로 고정되어 있음
- `getMidCategoryRankings(selectedCategory, ...)` 호출 시 한국어 값이 그대로 전달됨

**문제점**:

- EN/CN/JP에서 한국어 `p_category_large`를 전달하면
- 각 언어 테이블의 `category_large`와 매칭되지 않아 **0건 반환 가능**
- 예: EN에서 "리프팅" 전달 → `treatment_master_en.category_large = "Lifting"`과 매칭 실패

---

## 🔧 해결 방안

### ✅ 프론트엔드에서 해결 (구현 완료)

**백엔드 RPC 함수 스펙**:

- `rpc_mid_category_rankings_i18n(p_category_large text, p_lang text, ...)`
- `p_lang`: `'KR'`, `'EN'`, `'CN'`, `'JP'` 형식 (대소문자 무관, `upper()`로 비교)
- `p_category_large`: 각 언어 테이블의 `category_large`와 직접 비교
  - KR: `treatment_master.category_large = p_category_large`
  - EN: `treatment_master_en.category_large = p_category_large`
  - CN: `treatment_master_cn.category_large = p_category_large`
  - JP: `treatment_master_jp.category_large = p_category_large`

**구현 방법**:

- 한국어 `category_large` key를 해당 언어의 `category_large` 값으로 자동 변환
- `treatment_id`를 매개로 한국어 테이블과 해당 언어 테이블을 연결하여 매핑

**로직**:

1. 한국어 테이블(`treatment_master`)에서 해당 `category_large`를 가진 시술들의 `treatment_id` 조회
2. 해당 언어 테이블(`treatment_master_en/cn/jp`)에서 같은 `treatment_id`를 가진 시술들의 `category_large` 조회
3. 가장 많이 나온 `category_large` 값을 반환
4. 변환된 값을 `p_category_large`로 전달하여 백엔드 RPC 호출

**구현 위치**: `lib/api/beautripApi.ts`

- 함수: `convertCategoryLargeToLanguage()` (새로 추가)
- `getMidCategoryRankings()` 함수 내부에서 자동 변환

**장점**:

- ✅ 백엔드 수정 불필요
- ✅ 프론트엔드에서 완전히 해결
- ✅ 실제 DB 데이터를 기반으로 정확한 매핑
- ✅ 언어별 테이블을 활용한 자연스러운 해결

**사용법**:

```typescript
// 프론트엔드에서는 그대로 한국어 key 전달
getMidCategoryRankings("리프팅", 20, 2, 20, "EN");
// → 내부에서 자동으로 "Lifting"으로 변환되어 RPC 호출
```

**프론트엔드 코드 변경 불필요**: `CategoryRankingPage.tsx`에서 그대로 `selectedCategory` 전달하면 됨

---

## 📝 현재 상태 요약

| 항목                    | 상태              | 비고                              |
| ----------------------- | ----------------- | --------------------------------- |
| v_treatment_i18n 의존성 | ✅ 해결 완료      | 더 이상 에러 발생하지 않음        |
| p_category_large 처리   | ⚠️ 규칙 합의 필요 | 프론트-백엔드 간 규칙 명확화 필요 |

---

## 🎯 구현 완료

✅ **프론트엔드에서 해결 완료**

- `convertCategoryLargeToLanguage()` 함수 추가
- `getMidCategoryRankings()` 함수에서 자동 변환 처리
- 한국어 key → 해당 언어 category_large 자동 매핑

**테스트 방법**:

1. EN/CN/JP 언어로 전환
2. 대분류 카테고리 선택 (예: "리프팅")
3. 콘솔 로그 확인:
   - `[카테고리 변환]` 로그에서 변환 결과 확인
   - `[RPC 호출 파라미터]`에서 변환된 `p_category_large` 값 확인

---

## 📊 현재 프론트엔드 코드 상태

**파일**: `components/CategoryRankingPage.tsx`

```typescript
// 474줄: getMidCategoryRankings 호출
const result = await getMidCategoryRankings(
  selectedCategory, // ✅ 현재: 한국어 값 (예: "리프팅")
  20, // p_m
  2, // p_dedupe_limit_per_name
  20, // p_limit_per_category
  language // ✅ 언어 정보는 별도로 전달
);
```

**확인 사항**:

- `selectedCategory`는 `getMainCategories`의 `id` 필드 사용
- `id` 필드는 한국어로 고정: `"리프팅"`, `"눈성형"`, `"보톡스"` 등
- 언어 변경 시에도 `id`는 변하지 않음

---

## 📌 백엔드 답변 원문

> 정리해준 내용 잘 봤어요. 말씀 주신 두 문제 기준으로 현재 백엔드 상태 공유드릴게요.
>
> **1) 한국어 중분류 필터("#코기능교정") 문제**
>
> - 이건 프론트에서 selectedMidCategory에 붙은 "#" 때문에 생긴 이슈라서,
> - 백엔드 쪽에서는 별도 수정이 필요 없고,
> - 프론트에서 "#" 제거 후 RPC 호출하는 현재 구현이면 그대로 사용하셔도 됩니다.
>
> **2) EN/CN/JP에서 중분류 랭킹 안 보이는 문제 (v_treatment_i18n 관련)**
>
> - 피드백 주신 대로, 예전에는 rpc*mid_category_rankings_i18n에서 삭제된 뷰 v_treatment_i18n을 참조하고 있었는데,
>   지금은 언어별 treatment_master*\* 테이블을 직접 조회하도록 수정 완료된 상태입니다.
> - DB 기준으로 i18n 함수들 중에서 v_treatment_i18n을 참조하는 함수는 더 이상 없습니다
>   (pg_proc + pg_get_functiondef로 전체 확인 완료).
>
> - 현재 rpc_mid_category_rankings_i18n 구조는:
>   - KR: treatment_master
>   - EN: treatment_master_en
>   - CN: treatment_master_cn
>   - JP: treatment_master_jp
>     를 UNION ALL 방식으로 사용하고 있고,
>     p_category_large는 각 언어 테이블의 category_large와 직접 비교하는 형태입니다.
>
> 그래서 지금 기준으로는
>
> - v_treatment_i18n 뷰 삭제와 관련된 에러는 더 이상 발생하지 않아야 하고,
> - EN/CN/JP에서 여전히 결과가 안 보인다면,
>   p_category_large에 어떤 문자열을 넘기는지(한국어 값인지, 해당 언어로 번역된 값인지) 콘솔 로그 기준으로 한 번만 확인해주시면 좋아요.
>
> 추가로 "항상 한국어 key 기준으로 p_category_large를 받고, 함수 내부에서 처리"하는 구조로 바꾸고 싶으시면,
> category_large_key 같은 공통 키 컬럼을 기준으로 로직을 다시 설계하는 방향으로 저희가 함수 정의를 한 번 더 리팩터링해보겠습니다.
