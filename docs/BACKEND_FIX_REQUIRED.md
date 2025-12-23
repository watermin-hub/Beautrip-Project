# 백엔드 수정 요청 사항

## 🚨 긴급 수정 필요: `rpc_mid_category_rankings_i18n` 함수

### 문제 상황

1. **삭제된 뷰 사용**: `rpc_mid_category_rankings_i18n` 함수가 삭제된 `v_treatment_i18n` 뷰를 사용하고 있습니다.
2. **언어별 작동 불가**: 
   - 한국어(KR)는 `treatment_master` 테이블을 직접 사용하므로 정상 작동
   - 다른 언어(EN/CN/JP)는 `v_treatment_i18n` 뷰를 통해 `treatment_master_en/cn/jp`에 접근해야 하는데 뷰가 없어서 실패

### 현재 에러

```
❌ 중분류 랭킹 조회 실패: Could not find the table 'public.v_treatment_i18n' in the schema cache
```

### 해결 방안

#### 방법 1: 언어별 테이블 직접 사용 (권장)

`rpc_mid_category_rankings_i18n` 함수를 다음과 같이 수정:

```sql
-- ❌ 현재 (삭제된 뷰 사용)
FROM public.v_treatment_i18n vi
WHERE ...

-- ✅ 수정 후 (언어별 테이블 직접 사용)
CASE 
  WHEN p_lang = 'KR' OR p_lang IS NULL THEN
    FROM treatment_master tm
  WHEN p_lang = 'EN' THEN
    FROM treatment_master_en tm
  WHEN p_lang = 'CN' THEN
    FROM treatment_master_cn tm
  WHEN p_lang = 'JP' THEN
    FROM treatment_master_jp tm
END
WHERE ...
```

#### 방법 2: UNION ALL 방식 (rpc_small_category_rankings_i18n 참고)

`rpc_small_category_rankings_i18n`처럼 UNION ALL 방식 사용:

```sql
SELECT ... FROM treatment_master WHERE ...
UNION ALL
SELECT ... FROM treatment_master_en WHERE ...
UNION ALL
SELECT ... FROM treatment_master_cn WHERE ...
UNION ALL
SELECT ... FROM treatment_master_jp WHERE ...
```

### 확인 필요 사항

1. **`p_category_large` 파라미터 처리**:
   - `p_category_large`가 언어별로 다른 값을 받는지 확인
   - 예: 영어 UI에서 "Eye Surgery"를 전달해야 하는지, 아니면 항상 한국어 "눈성형"을 전달해야 하는지
   - **권장**: `p_category_large`는 항상 한국어 기준으로 받고, RPC 함수 내부에서 언어별 테이블의 `category_large`와 매칭하도록 처리

2. **`category_mid` 필드 처리**:
   - 언어별 테이블의 `category_mid` 필드가 각 언어로 번역되어 있는지 확인
   - 예: `treatment_master_en.category_mid`가 "Eye Surgery" 같은 영어 값인지, 아니면 한국어 "눈성형"인지
   - **중요**: `category_treattime_recovery` 테이블과 조인할 때 `category_mid` 매칭이 어떻게 되는지 확인 필요

3. **에러 처리**:
   - `v_treatment_i18n` 뷰가 없을 때 명확한 에러 메시지 반환
   - 또는 자동으로 언어별 테이블로 fallback

### 참고: `rpc_small_category_rankings_i18n` 동작 방식

`rpc_small_category_rankings_i18n` 함수는 이미 언어별 테이블을 올바르게 사용하고 있습니다. 이 함수의 구현 방식을 참고하여 `rpc_mid_category_rankings_i18n`도 동일하게 수정해 주세요.

---

## 📋 정리

### 프론트엔드에서 완료한 작업

1. ✅ `selectedMidCategory`에서 "#" 제거 (문제 1 해결)
2. ✅ 에러 메시지 및 로그 개선

### 백엔드에서 해야 할 작업 (필수)

1. ✅ **`rpc_mid_category_rankings_i18n` 함수 수정**
   - `v_treatment_i18n` 뷰 사용 제거
   - 언어별 테이블(`treatment_master_en/cn/jp`) 직접 사용 또는 UNION ALL 방식으로 변경

2. ✅ **`p_category_large` 파라미터 처리 확인**
   - 언어별로 다른 값을 받는지, 아니면 항상 한국어 기준인지 명확히 정의
   - 권장: 항상 한국어 기준으로 받고, RPC 함수 내부에서 처리

---

## 🚨 우선순위

**즉시 수정 필요**: `rpc_mid_category_rankings_i18n` 함수가 삭제된 `v_treatment_i18n` 뷰를 사용하지 않도록 수정

