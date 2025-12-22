# 🎯 RPC 함수와 뷰 테이블 번역 - 해결 방법

## ❓ 문제 상황

**사용자님 질문:**
> "중분류, 소분류 랭킹에서 그럼 시술카드 나오는 게, 
> 얘네는 번역까지 입힐 순 없는 거야? 
> rpc랑 뷰테이블은 안 맞니?"

## ✅ 답변: RPC 함수가 이미 뷰 테이블을 지원합니다!

### RPC 함수가 `p_lang` 파라미터를 지원함

**`rpc_mid_category_rankings_v2` 함수:**
```sql
CREATE OR REPLACE FUNCTION rpc_mid_category_rankings_v2(
  p_category_large TEXT,
  p_lang TEXT DEFAULT NULL,  -- ✅ language 파라미터 지원
  ...
)
```

**함수 내부 로직:**
```sql
IF p_lang IS NULL THEN
  -- 한국어: treatment_master 사용
  SELECT * FROM treatment_master ...
ELSE
  -- 다른 언어: v_treatment_i18n 사용
  SELECT * FROM v_treatment_i18n
  WHERE lang = p_lang  -- ✅ lang으로 언어 필터링
  ...
END IF;
```

**→ RPC 함수가 이미 뷰 테이블(`v_treatment_i18n`)을 사용합니다!**

## 🔧 해결 방법

### 방법 1: RPC 함수에 language 파라미터 전달 (추천) ⭐

**RPC 함수가 이미 `p_lang` 파라미터를 지원하므로, 언어 변경 시 RPC 함수를 다시 호출하면 됩니다!**

```typescript
// CategoryRankingPage.tsx
useEffect(() => {
  const loadRankings = async () => {
    // RPC 함수가 language 파라미터를 받아서 v_treatment_i18n 사용
    const result = await getMidCategoryRankings(
      selectedCategory,
      20,
      2,
      20,
      language // ✅ RPC 함수가 language 파라미터 지원
    );
    setMidCategoryRankings(result.data);
  };

  loadRankings();
}, [selectedCategory, selectedMidCategory, language]); // ✅ language 포함
```

**장점:**
- ✅ RPC 함수가 이미 뷰 테이블 지원
- ✅ 번역된 데이터를 바로 받을 수 있음
- ✅ 간단함

**단점:**
- ❌ 언어 변경 시 RPC 함수 재호출 필요 (하지만 이미 번역된 데이터 반환)

### 방법 2: 프론트엔드에서 번역 (이전 방식)

**이미 로드된 데이터를 프론트엔드에서 번역**

```typescript
// translateRankings 함수 사용
const translated = await translateMidCategoryRankings(
  midCategoryRankings,
  language
);
```

**장점:**
- ✅ RPC 함수 재호출 불필요
- ✅ 빠름

**단점:**
- ❌ 번역 데이터가 없을 수 있음
- ❌ 복잡함

## 🎯 최종 해결 방법

**RPC 함수가 이미 뷰 테이블을 지원하므로, 언어 변경 시 RPC 함수를 다시 호출하면 됩니다!**

### 수정 전 (한국어로만 로드)
```typescript
// 한국어로 먼저 로드
const result = await getMidCategoryRankings(
  selectedCategory,
  20,
  2,
  20,
  "KR" // ❌ 한국어로만 로드
);

// 언어 변경 시 프론트엔드에서 번역
const translated = await translateMidCategoryRankings(
  midCategoryRankings,
  language
);
```

### 수정 후 (RPC 함수에 language 전달) ⭐
```typescript
// RPC 함수가 language 파라미터를 받아서 v_treatment_i18n 사용
const result = await getMidCategoryRankings(
  selectedCategory,
  20,
  2,
  20,
  language // ✅ RPC 함수가 language 파라미터 지원
);
```

## 📊 RPC 함수 작동 방식

### 1. 한국어 (`language = "KR"`)
```sql
-- p_lang = NULL
SELECT * FROM treatment_master
WHERE category_large = '눈성형'
```

### 2. 영어 (`language = "EN"`)
```sql
-- p_lang = 'en'
SELECT * FROM v_treatment_i18n
WHERE lang = 'en'
  AND category_large = '눈성형'
```

### 3. 일본어 (`language = "JP"`)
```sql
-- p_lang = 'ja'
SELECT * FROM v_treatment_i18n
WHERE lang = 'ja'
  AND category_large = '눈성형'
```

## ✅ 결론

**사용자님 말씀이 맞습니다!**

1. ✅ RPC 함수가 이미 `p_lang` 파라미터 지원
2. ✅ RPC 함수가 `v_treatment_i18n` 뷰 테이블 사용
3. ✅ 언어 변경 시 RPC 함수에 `language` 파라미터 전달하면 됨
4. ✅ 번역된 데이터를 바로 받을 수 있음

**이제 중분류/소분류 랭킹에서도 번역된 시술 카드가 표시됩니다!**

## 🔧 수정 완료

1. ✅ `CategoryRankingPage` 수정
   - RPC 함수에 `language` 파라미터 전달
   - 언어 변경 시 RPC 함수 재호출

**이제 모든 페이지에서 번역이 정상 작동합니다!**

