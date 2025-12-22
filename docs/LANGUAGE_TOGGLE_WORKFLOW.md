# 언어 토글 작동 방식 상세 설명

## ✅ 네, 가능합니다!

**같은 `treatment_id`로 `lang` 컬럼만 바꿔서 해당 언어 데이터를 바로 가져올 수 있습니다!**

## 🔄 작동 흐름

### 1. 한국어(KR) 상태
```
사용자가 한국어로 시술 카드 보는 중
↓
treatment_id = 12345인 시술 카드 표시
↓
treatment_master 테이블에서 조회
  WHERE treatment_id = 12345
  (lang 필터 없음)
↓
한국어 데이터 표시:
  - treatment_name: "쌍꺼풀 수술"
  - hospital_name: "강남언니 클리닉"
```

### 2. 언어 토글 클릭 (EN으로 변경)
```
사용자가 언어 토글에서 "English" 클릭
↓
LanguageContext에서 language = "EN"으로 변경
↓
CategoryRankingPage의 useEffect가 language 변경 감지
↓
getMidCategoryRankings(selectedCategory, 20, 2, 20, "EN") 호출
↓
getTreatmentTableName("EN") → "v_treatment_i18n" 반환
getCurrentLanguageForDb("EN") → "en" 반환
↓
v_treatment_i18n 뷰에서 조회
  WHERE treatment_id = 12345 AND lang = 'en'
↓
같은 treatment_id(12345)로 영어 데이터 표시:
  - treatment_name: "Double Eyelid Surgery"
  - hospital_name: "Gangnam Unni Clinic"
```

## 📊 데이터베이스 구조

### treatment_master (한국어 원본)
```
treatment_id | treatment_name      | hospital_name
-------------|---------------------|------------------
12345        | 쌍꺼풀 수술          | 강남언니 클리닉
12346        | 리프팅              | 예티 클리닉
```

### treatment_translation (번역 데이터)
```
treatment_id | lang  | treatment_name           | hospital_name
-------------|-------|-------------------------|------------------
12345        | en    | Double Eyelid Surgery    | Gangnam Unni Clinic
12345        | ja    | 二重まぶた手術           | 江南ウニクリニック
12345        | zh-CN | 双眼皮手术               | 江南Unni诊所
12346        | en    | Lifting                  | Yeoti Clinic
```

### v_treatment_i18n (통합 뷰)
```
treatment_id | lang  | treatment_name           | hospital_name
-------------|-------|-------------------------|------------------
12345        | KR    | 쌍꺼풀 수술              | 강남언니 클리닉 (treatment_master)
12345        | en    | Double Eyelid Surgery    | Gangnam Unni Clinic (treatment_translation)
12345        | ja    | 二重まぶた手術           | 江南ウニクリニック (treatment_translation)
```

## 🎯 핵심 포인트

### 1. 같은 treatment_id 사용
- ✅ 한국어든 영어든 같은 `treatment_id = 12345` 사용
- ✅ `treatment_id`는 언어와 무관하게 동일

### 2. lang 필터로 언어 구분
```typescript
// 한국어
treatment_master WHERE treatment_id = 12345

// 영어
v_treatment_i18n WHERE treatment_id = 12345 AND lang = 'en'

// 일본어
v_treatment_i18n WHERE treatment_id = 12345 AND lang = 'ja'
```

### 3. 자동 재로드
```typescript
// CategoryRankingPage.tsx
useEffect(() => {
  loadRankings();
}, [selectedCategory, selectedMidCategory, language]); // ✅ language dependency
```

언어 변경 시 자동으로 데이터 다시 로드!

## 💡 실제 예시

### 시나리오: 사용자가 언어 토글 클릭

**1단계: 한국어 상태**
```
화면에 표시:
- treatment_id: 12345
- treatment_name: "쌍꺼풀 수술"
- hospital_name: "강남언니 클리닉"
```

**2단계: 영어로 변경**
```
사용자가 언어 토글에서 "English" 클릭
↓
language = "EN"으로 변경
↓
useEffect 트리거 → API 호출
↓
v_treatment_i18n WHERE treatment_id = 12345 AND lang = 'en'
↓
화면에 표시:
- treatment_id: 12345 (동일!)
- treatment_name: "Double Eyelid Surgery" (변경!)
- hospital_name: "Gangnam Unni Clinic" (변경!)
```

**3단계: 일본어로 변경**
```
사용자가 언어 토글에서 "日本語" 클릭
↓
language = "JP"로 변경
↓
useEffect 트리거 → API 호출
↓
v_treatment_i18n WHERE treatment_id = 12345 AND lang = 'ja'
↓
화면에 표시:
- treatment_id: 12345 (동일!)
- treatment_name: "二重まぶた手術" (변경!)
- hospital_name: "江南ウニクリニック" (변경!)
```

## ✅ 확인 사항

### 1. treatment_id는 항상 동일
- ✅ 같은 시술은 항상 같은 `treatment_id` 사용
- ✅ 언어와 무관하게 `treatment_id`는 변하지 않음

### 2. lang 필터로 언어 구분
- ✅ 한국어: `treatment_master` (lang 필터 없음)
- ✅ 다른 언어: `v_treatment_i18n` + `lang` 필터

### 3. 자동 재로드
- ✅ `language` 변경 시 `useEffect` 트리거
- ✅ API 호출 시 `language` 파라미터 전달
- ✅ 해당 언어 데이터로 자동 업데이트

## 🚨 주의사항

### 1. 번역 데이터가 없는 경우
- 번역 데이터가 없으면 자동으로 한국어 원본으로 fallback
- 사용자는 항상 데이터를 볼 수 있음

### 2. 병원 데이터도 동일하게 작동
- `hospital_id_rd` + `lang`으로 구분
- 같은 병원은 항상 같은 `hospital_id_rd` 사용

## 🎉 결론

**네, 완벽하게 작동합니다!**

1. ✅ 같은 `treatment_id` 사용
2. ✅ `lang` 필터로 언어 구분
3. ✅ 언어 토글 클릭 시 자동 재로드
4. ✅ 번역 데이터 없으면 한국어로 fallback

**번역 데이터만 입력하면 바로 작동합니다!**

