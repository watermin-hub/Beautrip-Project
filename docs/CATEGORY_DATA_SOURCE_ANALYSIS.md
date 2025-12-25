# 카테고리 데이터 출처 및 번역 구조 분석

## 📋 질문 요약

1. **category_large는 각 언어로 10개만 입력하면 금방 바꿀 수 있는가?**
2. **category_mid와 category_small은 필요한가?**
3. **category_mid와 category_small을 어디 테이블에서 가져오는가?**
4. **전체 16,000개 시술 데이터에서 가져오는가?**

---

## ✅ 답변 요약

### 1. **category_large (대분류) - 10개만 번역하면 됨!**

**현재 상황:**
- `category_large`는 **10개 고정** (눈성형, 리프팅, 보톡스, 안면윤곽/양악, 제모, 지방성형, 코성형, 피부, 필러, 가슴성형)
- 각 언어로 **10개 × 4개 언어 = 40개 번역**만 필요

**번역 방법:**
1. **하드코딩 매핑** (현재 사용 중)
   ```typescript
   export const CATEGORY_NAME_I18N_TO_KR: Record<string, string> = {
     // 한국어
     눈성형: "눈성형",
     // 영어
     "Eye Plastic Surgery": "눈성형",
     // 일본어
     目の整形: "눈성형",
     // 중국어
     眼部整形: "눈성형",
     // ...
   };
   ```

2. **DB 테이블** (권장)
   - `category_toggle_map` 테이블에 언어별 컬럼 추가:
     - `category_large_kr` (한국어)
     - `category_large_en` (영어)
     - `category_large_jp` (일본어)
     - `category_large_cn` (중국어)
   - **10개 행만 입력하면 됨!**

**결론:** ✅ **네, 10개만 번역하면 금방 바꿀 수 있습니다!**

---

### 2. **category_mid (중분류) - 번역 필요!**

**현재 상황:**
- `category_mid`는 **각 시술마다 다름**
- 예: "쌍수", "상안검", "하안검", "눈밑지방제거", "앞트임", "뒤트임" 등
- **수백 개의 중분류가 존재**

**데이터 출처:**
- `treatment_master` 테이블의 `category_mid` 컬럼 (한국어 원본)
- `v_treatment_i18n_v2` 뷰의 `category_mid` 컬럼 (언어별 번역)

**번역 방법:**
- `v_treatment_i18n_v2` 뷰는 `treatment_master` + `treatment_translation`을 JOIN
- `treatment_translation` 테이블에 `category_mid` 번역 저장
- **16,000개 시술 데이터에서 각각 가져옴**

**결론:** ✅ **네, category_mid는 번역이 필요합니다!**

---

### 3. **category_small (소분류) - 번역 필요!**

**현재 상황:**
- `category_small`도 **각 시술마다 다름**
- 예: "부분쌍수", "전체쌍수", "매몰법", "절개법" 등
- **수백 개의 소분류가 존재**

**데이터 출처:**
- `treatment_master` 테이블의 `category_small` 컬럼 (한국어 원본)
- `v_treatment_i18n_v2` 뷰의 `category_small` 컬럼 (언어별 번역)

**번역 방법:**
- `treatment_translation` 테이블에 `category_small` 번역 저장
- **16,000개 시술 데이터에서 각각 가져옴**

**결론:** ✅ **네, category_small도 번역이 필요합니다!**

---

## 📊 데이터 흐름 다이어그램

### category_large (대분류)
```
[하드코딩 매핑 또는 category_toggle_map]
  ↓
10개 고정 번역
  ↓
프론트엔드에서 사용
```

### category_mid & category_small (중분류 & 소분류)
```
[treatment_master 테이블]
  ↓
16,000개 시술 데이터
  ↓
각 시술마다 category_mid, category_small (한국어 원본)
  ↓
[treatment_translation 테이블]
  ↓
언어별 번역 (category_mid_en, category_mid_jp, category_mid_cn 등)
  ↓
[v_treatment_i18n_v2 뷰]
  ↓
JOIN하여 언어별 데이터 반환
  ↓
프론트엔드에서 사용
```

---

## 🔍 현재 코드에서의 사용 방식

### 1. category_large 변환
```typescript
// lib/api/beautripApi.ts
export async function convertCategoryNameToKorean(
  categoryName: string | null | undefined,
  language?: LanguageCode
): Promise<string | null> {
  // 1. DB 조회 우선 (category_toggle_map)
  // 2. 하드코딩 매핑 (CATEGORY_NAME_I18N_TO_KR)
  // 3. 원본 반환
}
```

### 2. category_mid & category_small 사용
```typescript
// treatment_master 또는 v_treatment_i18n_v2에서 직접 가져옴
const treatmentTable = getTreatmentTableName(language);
// 한국어: treatment_master
// 다른 언어: v_treatment_i18n_v2 (lang 필터 적용)

const { data } = await client
  .from(treatmentTable)
  .select("category_mid, category_small, ...")
  .eq("lang", dbLang); // 언어 필터
```

---

## 📈 데이터 규모 비교

| 카테고리 타입 | 개수 | 번역 필요량 | 번역 방법 |
|--------------|------|------------|----------|
| **category_large** | 10개 | 10개 × 4언어 = **40개** | 하드코딩 또는 `category_toggle_map` |
| **category_mid** | 수백 개 | 수백 개 × 4언어 = **수천 개** | `treatment_translation` 테이블 |
| **category_small** | 수백 개 | 수백 개 × 4언어 = **수천 개** | `treatment_translation` 테이블 |

---

## 🎯 요약

### ✅ category_large (대분류)
- **10개만 번역하면 됨!**
- `category_toggle_map` 테이블에 언어별 컬럼 추가하거나 하드코딩 매핑 사용
- **빠르게 변경 가능**

### ✅ category_mid & category_small (중분류 & 소분류)
- **16,000개 시술 데이터에서 각각 가져옴**
- `treatment_master` 테이블 (한국어 원본)
- `v_treatment_i18n_v2` 뷰 (언어별 번역)
- `treatment_translation` 테이블에 번역 저장 필요
- **번역 작업량이 많음**

---

## 💡 권장 사항

### 1. category_large 번역
- `category_toggle_map` 테이블에 언어별 컬럼 추가
- 10개 행만 입력하면 완료

### 2. category_mid & category_small 번역
- `treatment_translation` 테이블에 번역 저장
- 또는 `v_treatment_i18n_v2` 뷰에서 자동으로 JOIN하여 가져오기
- **16,000개 시술 데이터의 각 카테고리를 번역해야 함**

---

## 🔗 관련 테이블 구조

### treatment_master (한국어 원본)
```sql
- treatment_id
- category_large (한국어)
- category_mid (한국어)
- category_small (한국어)
- treatment_name (한국어)
- ...
```

### treatment_translation (번역)
```sql
- treatment_id (FK)
- lang (en, ja, zh-CN)
- category_mid (번역)
- category_small (번역)
- treatment_name (번역)
- ...
```

### v_treatment_i18n_v2 (뷰)
```sql
-- treatment_master + treatment_translation JOIN
-- lang 필터로 언어별 데이터 반환
```

### category_toggle_map (대분류 번역용)
```sql
- category_large (한국어)
- category_large_en (영어) -- 추가 권장
- category_large_jp (일본어) -- 추가 권장
- category_large_cn (중국어) -- 추가 권장
- category_mid
- category_small
- ...
```




