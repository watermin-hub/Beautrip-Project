# 백엔드 수정 요청 사항

## 🚨 확인 필요: `rpc_mid_category_rankings_i18n` 함수

### 문제 상황

⚠️ **주의**: 실제 함수 구현을 확인하지 않고 추측한 내용입니다. 실제 에러 메시지와 함수 구현을 확인해야 합니다.

1. **다른 언어에서 작동하지 않음**: 
   - 한국어(KR)는 정상 작동
   - 다른 언어(EN/CN/JP)에서 대분류 선택 시 중분류 랭킹이 표시되지 않음

### 확인 필요 사항

1. **실제 에러 메시지 확인**:
   - 브라우저 콘솔에서 실제 에러 메시지 확인
   - 프론트엔드에서 `❌ [중분류 랭킹 조회 실패] 상세 정보` 로그 확인

2. **함수 구현 확인**:
   - `rpc_mid_category_rankings_i18n` 함수의 실제 구현 확인
   - 어떤 테이블/뷰를 사용하는지 확인
   - 언어별 테이블을 올바르게 사용하는지 확인

### 가능한 해결 방안 (함수 구현 확인 후 적용)

⚠️ **주의**: 실제 함수 구현을 확인한 후 적절한 해결 방안을 선택해야 합니다.

#### 방법 1: 언어별 테이블 직접 사용 (함수가 뷰를 사용하는 경우)

만약 함수가 `v_treatment_i18n` 뷰를 사용한다면, 언어별 테이블을 직접 사용하도록 수정:

```sql
-- ❌ 현재 (뷰 사용)
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

#### 방법 3: 파라미터 처리 문제인 경우

만약 함수 구현은 올바르지만 파라미터 처리에 문제가 있다면:
- `p_category_large` 파라미터가 언어별로 다른 값을 받아야 하는지 확인
- 프론트엔드에서 전달하는 파라미터 값 확인

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

