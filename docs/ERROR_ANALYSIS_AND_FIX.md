# 에러 분석 및 해결 방안

## 🔍 문제 1: 한국어에서 중분류 필터 ("#" 뒤) 선택 시 에러

### 원인 분석

1. **UI에서 전달되는 값 형식 문제**:

   - `selectedMidCategory`가 "#코기능교정" 형식으로 전달될 수 있음
   - 하지만 `getSmallCategoryRankings`의 `p_category_mid` 파라미터는 데이터베이스의 실제 `category_mid` 값이어야 함
   - 해시태그 "#"이 포함되어 있으면 DB 조회 시 매칭 실패

2. **데이터베이스 매칭 문제**:
   - `rpc_small_category_rankings_i18n` 함수가 `p_category_mid`로 조회할 때
   - 실제 DB의 `category_mid` 값과 정확히 일치해야 함
   - 예: DB에 "코기능교정"이 있으면 "#코기능교정"으로는 찾을 수 없음

### 해결 방안

#### ✅ 프론트엔드에서 할 일

**파일**: `components/CategoryRankingPage.tsx`

```typescript
// selectedMidCategory에서 "#" 제거
const cleanMidCategory = selectedMidCategory?.replace(/^#/, "") || null;

// getSmallCategoryRankings 호출 시 cleanMidCategory 사용
const result = await getSmallCategoryRankings(
  cleanMidCategory, // ✅ "#" 제거된 값 사용
  null,
  20,
  2,
  20,
  20,
  language
);
```

**또는** `getSmallCategoryRankings` 함수 내부에서 처리:

**파일**: `lib/api/beautripApi.ts`

```typescript
export async function getSmallCategoryRankings(
  p_category_mid: string
  // ...
) {
  // "#" 제거
  const cleanCategoryMid = p_category_mid?.replace(/^#/, "") || p_category_mid;

  const rpcParams = {
    p_category_mid: cleanCategoryMid, // ✅ "#" 제거된 값 사용
    // ...
  };
}
```

---

## 🔍 문제 2: 다른 언어(EN/CN/JP)에서 대분류 선택 시 중분류 랭킹이 안 보임

### 원인 분석 (확인 필요)

⚠️ **주의**: 실제 백엔드 함수 구현을 확인하지 않고 추측한 내용입니다. 실제 에러 메시지와 백엔드 스펙을 확인해야 합니다.

**가능한 원인들:**

1. **백엔드 RPC 함수 구현 문제**:

   - `rpc_mid_category_rankings_i18n` 함수가 다른 언어에서 제대로 작동하지 않을 수 있음
   - 실제 함수 구현 확인 필요 (뷰 사용 여부, 언어별 테이블 사용 여부 등)

2. **대분류 카테고리 이름 언어 불일치 가능성**:

   - 프론트엔드에서 `selectedCategory`는 항상 한국어 값 (예: "피부", "눈성형")
   - 하지만 다른 언어의 DB 테이블(`treatment_master_en/cn/jp`)에는 영어/중국어/일본어 값이 있을 수 있음
   - 예: `treatment_master_en.category_large`가 "Skin"인데, 프론트엔드에서 "피부"를 전달하면 매칭 실패

3. **파라미터 전달 문제**:
   - `p_lang` 파라미터 형식이 맞지 않을 수 있음
   - `p_category_large` 파라미터가 언어별로 다른 값을 받아야 하는데 한국어 값만 전달하고 있을 수 있음

### 해결 방안

#### ✅ 확인 필요 사항 (우선)

1. **실제 에러 메시지 확인**:

   - 브라우저 콘솔에서 실제 에러 메시지 확인
   - `❌ [중분류 랭킹 조회 실패] 상세 정보` 로그 확인
   - 에러 코드, 메시지, 상세 정보 확인

2. **백엔드 함수 스펙 확인**:

   - `rpc_mid_category_rankings_i18n` 함수의 실제 구현 확인
   - 어떤 테이블/뷰를 사용하는지 확인
   - `p_category_large` 파라미터가 언어별로 다른 값을 받는지 확인

3. **파라미터 전달 확인**:
   - 프론트엔드에서 전달하는 파라미터 값 확인
   - `p_lang` 형식이 올바른지 확인 (`'KR' | 'EN' | 'CN' | 'JP'`)
   - `p_category_large` 값이 올바른지 확인

#### ✅ 백엔드에서 확인할 사항

1. **`rpc_mid_category_rankings_i18n` 함수 구현 확인**:

   - 어떤 테이블/뷰를 사용하는지 확인
   - 언어별 테이블(`treatment_master_en/cn/jp`)을 올바르게 사용하는지 확인
   - `rpc_small_category_rankings_i18n`처럼 UNION ALL 방식으로 구현되어 있는지 확인

2. **`p_category_large` 파라미터 처리 확인**:

   - `p_category_large`가 언어별로 다른 값을 받는지 확인
   - 예: 영어 UI에서 "Eye Surgery"를 전달해야 하는지, 아니면 항상 한국어 "눈성형"을 전달해야 하는지
   - **권장**: `p_category_large`는 항상 한국어 기준으로 받고, RPC 함수 내부에서 언어별 테이블의 `category_large`와 매칭하도록 처리

3. **에러 처리 확인**:
   - 다른 언어에서 에러가 발생할 때 명확한 에러 메시지 반환하는지 확인

#### ✅ 프론트엔드에서 할 일 (선택)

**1. 에러 메시지 개선**

현재 에러 메시지가 너무 일반적이므로, 백엔드 에러를 더 명확하게 표시:

**파일**: `components/CategoryRankingPage.tsx`

```typescript
if (result.error) {
  // 백엔드 에러 메시지가 있으면 그대로 표시
  const errorMsg = result.error.includes("v_treatment_i18n")
    ? "백엔드 함수가 삭제된 뷰를 사용하고 있습니다. 백엔드 수정이 필요합니다."
    : result.error;
  setError(errorMsg);
}
```

**2. 디버깅 로그 추가**

언어별로 다른 동작을 확인하기 위한 로그:

```typescript
console.log("🔍 [중분류 랭킹 조회]", {
  language,
  selectedCategory,
  note:
    language !== "KR"
      ? "⚠️ 다른 언어에서는 백엔드 RPC 함수가 v_treatment_i18n 뷰를 사용하지 않도록 수정 필요"
      : "✅ 한국어는 정상 작동",
});
```

---

## 📋 정리

### 프론트엔드에서 할 일

1. ✅ **문제 1 해결**: `selectedMidCategory`에서 "#" 제거

   - `components/CategoryRankingPage.tsx` 또는 `lib/api/beautripApi.ts`에서 처리

2. ✅ **문제 2 개선**: 에러 메시지 및 로그 개선
   - 백엔드 에러를 더 명확하게 표시

### 백엔드에서 확인할 사항

1. ⚠️ **문제 2 원인 확인**: `rpc_mid_category_rankings_i18n` 함수 구현 확인

   - 실제 함수 구현 확인 (어떤 테이블/뷰를 사용하는지)
   - 다른 언어에서 작동하지 않는 원인 확인
   - 필요시 언어별 테이블(`treatment_master_en/cn/jp`) 직접 사용 또는 UNION ALL 방식으로 수정

2. ⚠️ **`p_category_large` 파라미터 처리 확인**
   - 언어별로 다른 값을 받는지, 아니면 항상 한국어 기준인지 명확히 정의
   - 권장: 항상 한국어 기준으로 받고, RPC 함수 내부에서 처리

---

## 🚨 우선순위

1. **즉시 수정 필요**: 문제 1 (프론트엔드에서 "#" 제거)
2. **백엔드 수정 필요**: 문제 2 (RPC 함수 수정)
3. **개선 사항**: 에러 메시지 및 로그 개선
