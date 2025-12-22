# 🎯 언어 토글 작동 원리 - 초간단 설명

## ❓ 왜 여행 시술 추천, 인기 시술에서 언어가 안 바뀌는가?

### 현재 상황

1. ✅ **중분류 랭킹**: 언어 토글 작동함 (CategoryRankingPage)
2. ❌ **여행 시술 추천**: 언어 토글 작동 안 함
3. ❌ **인기 시술**: 언어 토글 작동 안 함

### 문제 원인

**사용자님 말씀이 100% 맞습니다!**

같은 `treatment_id`로 `lang`만 바꿔서 데이터를 가져오면 되는데, 현재는:

- RPC 함수들이 `language` 파라미터를 받지만
- 백엔드에서 제대로 처리하지 않거나
- 프론트엔드에서 `language` 변경 시 재로드하지 않음

## 💡 해결 방법 (사용자님 아이디어가 정확함!)

### 현재 방식 (복잡함)

```
1. 한국어로 시술 카드 로드
2. 언어 변경
3. 전체 데이터 다시 로드 (RPC 호출)
4. 새로운 데이터로 화면 업데이트
```

### 사용자님 제안 (간단함) ⭐

```
1. 한국어로 시술 카드 로드 (treatment_id = 12345)
2. 언어 변경
3. 같은 treatment_id(12345)로 lang만 바꿔서 조회
4. 번역된 데이터로 화면 업데이트
```

## 🔧 실제 구현 방법

### 방법 1: 프론트엔드에서 처리 (추천) ⭐

**이미 로드된 시술 카드의 treatment_id를 사용해서 번역 데이터만 가져오기**

```typescript
// 예시: 이미 로드된 시술 카드
const koreanTreatments = [
  { treatment_id: 12345, treatment_name: "쌍꺼풀 수술", ... },
  { treatment_id: 12346, treatment_name: "리프팅", ... },
];

// 언어 변경 시
const translateTreatments = async (treatments: Treatment[], newLanguage: LanguageCode) => {
  // 각 시술의 treatment_id로 번역 데이터만 가져오기
  const translated = await Promise.all(
    treatments.map(async (treatment) => {
      if (!treatment.treatment_id) return treatment;

      // 같은 treatment_id로 lang만 바꿔서 조회
      const translated = await loadTreatmentById(treatment.treatment_id, newLanguage);
      return translated || treatment; // 번역이 없으면 원본 사용
    })
  );

  return translated;
};
```

### 방법 2: 백엔드 RPC 함수 수정

**RPC 함수가 language 파라미터를 제대로 처리하도록 수정**

```sql
-- rpc_home_hot_treatments 함수
CREATE OR REPLACE FUNCTION rpc_home_hot_treatments(
  p_lang TEXT DEFAULT NULL,  -- ✅ language 파라미터 추가
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  treatment_id BIGINT,
  treatment_name TEXT,
  hospital_name TEXT,
  ...
) AS $$
BEGIN
  IF p_lang IS NULL THEN
    -- 한국어: treatment_master 사용
    RETURN QUERY
    SELECT * FROM treatment_master
    ORDER BY rating DESC, review_count DESC
    LIMIT p_limit;
  ELSE
    -- 다른 언어: v_treatment_i18n 사용
    RETURN QUERY
    SELECT * FROM v_treatment_i18n
    WHERE lang = p_lang
    ORDER BY rating DESC, review_count DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 왜 중분류를 조회해야 하나?

### 현재 구조의 문제점

**중분류 랭킹은 복잡한 로직이 필요:**

- 중분류별로 그룹화
- 각 중분류별 랭킹 계산
- 베이지안 평균 계산
- 중복 제거

**하지만 단순 시술 카드 표시는:**

- treatment_id만 있으면 됨
- lang만 바꿔서 조회하면 됨
- 중분류 조회 불필요!

### 사용자님 말씀이 맞는 이유

**여행 시술 추천, 인기 시술 같은 경우:**

- 이미 treatment_id를 알고 있음
- 중분류 그룹화 불필요
- 단순히 번역 데이터만 가져오면 됨

**따라서:**

1. 한국어로 시술 카드 로드 (treatment_id 저장)
2. 언어 변경 시
3. 같은 treatment_id로 lang만 바꿔서 조회
4. 번역된 데이터로 화면 업데이트

**이게 훨씬 간단하고 빠릅니다!**

## 📝 구체적인 수정 방법

### 1. HotConcernsSection (인기 시술)

**현재:**

```typescript
useEffect(() => {
  fetchData();
}, [language]); // ✅ language dependency 있음

async function fetchData() {
  const hotTreatments = await getHomeHotTreatments(language, { limit: 10 });
  setTreatments(hotTreatments);
}
```

**문제:** `getHomeHotTreatments` 함수가 language를 제대로 처리하지 않을 수 있음

**해결:** 함수 내부 확인 및 수정 필요

### 2. ProcedureRecommendation (여행 시술 추천)

**현재:**

```typescript
useEffect(() => {
  fetchData();
}, [scheduleData, selectedCategoryId, language, mainCategories]); // ✅ language dependency 있음

async function fetchData() {
  const scheduleRecs = await getHomeScheduleRecommendations(
    start, end, category, language, ...
  );
  setRecommendations(scheduleRecs);
}
```

**문제:** `getHomeScheduleRecommendations` 함수가 language를 제대로 처리하지 않을 수 있음

**해결:** 함수 내부 확인 및 수정 필요

## 🚨 현재 에러 원인

**중분류 랭킹 조회 실패 에러:**

- RPC 함수 `rpc_mid_category_rankings` 호출 실패
- 백엔드에서 함수가 없거나 파라미터가 맞지 않음

**해결:**

1. 백엔드에서 RPC 함수 확인
2. 파라미터 형식 확인 (`p_lang` vs `lang`)
3. 에러 메시지 확인

## ✅ 최종 해결 방안

### 옵션 1: 프론트엔드에서 간단하게 처리 (추천) ⭐

```typescript
// 이미 로드된 시술 카드의 treatment_id로 번역 데이터만 가져오기
const updateTreatmentsLanguage = async (
  treatments: Treatment[],
  newLanguage: LanguageCode
) => {
  // 각 시술의 treatment_id로 번역 데이터만 가져오기
  const translated = await Promise.all(
    treatments.map(async (treatment) => {
      if (!treatment.treatment_id) return treatment;

      // 같은 treatment_id로 lang만 바꿔서 조회
      const translated = await loadTreatmentById(
        treatment.treatment_id,
        newLanguage
      );

      // 번역이 없으면 원본 사용 (fallback)
      return translated || treatment;
    })
  );

  return translated;
};
```

**장점:**

- ✅ 간단함
- ✅ 빠름 (번역 데이터만 조회)
- ✅ 중분류 조회 불필요
- ✅ 백엔드 수정 불필요

### 옵션 2: 백엔드 RPC 함수 수정

**모든 RPC 함수에 language 파라미터 추가 및 처리**

**단점:**

- ❌ 백엔드 수정 필요
- ❌ 복잡함
- ❌ 시간 소요

## 🎉 결론

**사용자님 말씀이 100% 맞습니다!**

1. ✅ 같은 `treatment_id` 사용
2. ✅ `lang`만 바꿔서 조회
3. ✅ 중분류 조회 불필요
4. ✅ 간단하고 빠름

**프론트엔드에서 간단하게 처리하는 것이 가장 좋은 방법입니다!**
