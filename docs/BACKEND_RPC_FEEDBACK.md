# 백엔드 RPC 함수 스펙 피드백

## 📋 문서 검토 결과

### ✅ 잘 된 부분

1. **함수 스펙이 명확함**: 파라미터와 반환값이 잘 정리되어 있음
2. **체크리스트 제공**: 프론트엔드 개발자가 따라하기 좋은 단계별 가이드
3. **특이사항 안내**: 언어별 데이터 부족, fallback 로직 등 실무적인 고려사항 포함

---

## ⚠️ 개선이 필요한 부분

### 1. **함수명 불일치 문제**

**현재 상황:**

- 문서: `rpc_explore_category_rankings` 사용 권장
- 실제 코드: `rpc_mid_category_rankings` 사용 중

**문제점:**

- 기존 함수명과 새 함수명이 다름
- 프론트엔드에서 교체 작업이 필요함을 명확히 해야 함

**제안:**

```markdown
### ⚠️ 중요: 함수명 변경

기존 `rpc_mid_category_rankings` 함수를 `rpc_explore_category_rankings`로 교체했습니다.
프론트엔드에서 모든 호출부를 업데이트해야 합니다.
```

---

### 2. **언어 코드 매핑 불일치**

**현재 상황:**

- 문서 제안: `'KR' | 'EN' | 'CN' | 'JP'` 형식 직접 전달
- 실제 코드: `getCurrentLanguageForDb()` 함수로 `null | 'en' | 'ja' | 'zh-CN'` 형식 사용

**문제점:**

```typescript
// 문서 제안 (잘못된 예시)
const rpcLang = mapToRpcLang(currentUiLang); // 'KR' | 'EN' | 'CN' | 'JP'
const { data } = await supabase.rpc('rpc_explore_category_rankings', {
  p_lang: rpcLang,  // ❌ 'KR' 형식
  ...
});

// 실제 코드 (현재 사용 중)
const dbLang = getCurrentLanguageForDb(language); // null | 'en' | 'ja' | 'zh-CN'
const { data } = await supabase.rpc('rpc_mid_category_rankings', {
  p_lang: dbLang,  // ✅ null 또는 소문자 형식
  ...
});
```

**해결 방안:**

1. **백엔드가 'KR' 형식을 받도록 변경** (권장)

   - 프론트엔드에서 일관성 있게 'KR' | 'EN' | 'CN' | 'JP' 사용 가능
   - 기존 `LanguageCode` 타입과 일치

2. **문서를 현재 DB 형식에 맞게 수정**
   ```typescript
   // 문서 수정안
   function mapToRpcLang(lang: LanguageCode): "KR" | "EN" | "CN" | "JP" | null {
     // KR -> null 또는 'KR' (백엔드 스펙에 따라)
     // EN -> 'EN' 또는 'en' (백엔드 스펙에 따라)
     switch (lang) {
       case "KR":
         return null; // 또는 'KR'
       case "EN":
         return "EN"; // 또는 'en'
       case "CN":
         return "CN"; // 또는 'zh-CN'
       case "JP":
         return "JP"; // 또는 'ja'
       default:
         return null; // 또는 'KR'
     }
   }
   ```

**권장사항:**

- 백엔드에서 `'KR' | 'EN' | 'CN' | 'JP'` 형식을 받도록 통일하는 것이 좋음
- 프론트엔드의 `LanguageCode` 타입과 일치하여 혼란 방지

---

### 3. **기존 함수와의 호환성**

**현재 코드 위치:**

- `lib/api/beautripApi.ts`의 `getMidCategoryRankings()` 함수
- `components/CategoryRankingPage.tsx`에서 호출

**제안:**
문서에 다음 정보 추가:

```markdown
### 기존 코드 위치

- 함수: `lib/api/beautripApi.ts` → `getMidCategoryRankings()`
- 사용처: `components/CategoryRankingPage.tsx` (line 423)
- 변경 사항: RPC 함수명만 `rpc_mid_category_rankings` → `rpc_explore_category_rankings`로 변경
```

---

### 4. **파라미터 기본값 명시**

**문서에 추가 필요:**

```markdown
### 파라미터 기본값 (백엔드)

- `p_m`: 20 (베이지안 prior)
- `p_dedupe_limit_per_name`: 2 (같은 시술명 최대 개수)
- `p_limit_per_category`: 20 (카테고리별 최대 노출 개수)
- `p_lang`: null (기본값은 한국어)

⚠️ 프론트엔드에서 명시적으로 전달하는 것을 권장 (기본값 변경 시 영향 방지)
```

---

### 5. **반환 컬럼 검증 필요**

**문서 내용:**

> "기존 TS 타입 그대로 써도 됨 (컬럼 추가/삭제 없음)"

**확인 필요:**

- 실제 반환 컬럼이 기존 `MidCategoryRanking` 타입과 정확히 일치하는지
- `category_mid_key` 컬럼이 실제로 존재하는지

**제안:**

```markdown
### 반환 컬럼 검증 체크리스트

- [ ] `category_mid_key` - 중분류 key (새로 추가된 컬럼인지 확인)
- [ ] `category_mid` - 중분류 표시값 (언어별)
- [ ] `treatment_id`, `treatment_name`, `hospital_id`, `hospital_name`
- [ ] `rating`, `review_count`, `main_img_url`
- [ ] `category_rank`, `category_score`, `average_rating`, `total_reviews`, `treatment_count`

⚠️ `category_mid_key`가 새 컬럼이라면 TypeScript 타입 정의도 업데이트 필요
```

---

### 6. **에러 처리 가이드 추가**

**현재 코드에는 상세한 에러 처리가 있음:**

- RPC 함수가 없을 때 fallback 로직
- 한국어일 때 `treatment_master` 직접 조회

**문서에 추가 제안:**

```markdown
### 에러 처리

1. **RPC 함수가 없는 경우**

   - 에러 코드: `42883` (PostgreSQL function not found)
   - 대응: 백엔드 담당자에게 확인 요청

2. **언어별 데이터 부족**

   - EN/CN/JP에서 결과가 적을 수 있음 (정상)
   - 빈 결과일 때 UI에서 적절한 안내 메시지 표시

3. **네트워크 에러**
   - Supabase 연결 문제 시 재시도 로직 고려
```

---

### 7. **타입 정의 예시 추가**

**문서에 TypeScript 타입 예시 추가:**

```typescript
// lib/api/beautripApi.ts에 이미 정의된 타입
export interface MidCategoryRanking {
  category_mid_key?: string; // ⚠️ 새로 추가된 컬럼인지 확인 필요
  category_mid: string;
  treatment_id: number;
  treatment_name: string;
  hospital_id: number;
  hospital_name: string;
  rating: number;
  review_count: number;
  main_img_url: string | null;
  category_rank: number;
  category_score: number;
  average_rating: number;
  total_reviews: number;
  treatment_count: number;
}
```

---

## 📝 수정된 코드 예시 (문서용)

### 올바른 언어 매핑 함수

```typescript
// lib/api/beautripApi.ts에 이미 존재하는 함수 활용
import {
  getCurrentLanguageForDb,
  type LanguageCode,
} from "@/lib/api/beautripApi";

// 방법 1: 기존 함수 활용 (권장)
const dbLang = getCurrentLanguageForDb(language); // null | 'en' | 'ja' | 'zh-CN'

// 방법 2: 백엔드가 'KR' 형식을 받는다면
function mapToRpcLang(lang: LanguageCode): "KR" | "EN" | "CN" | "JP" | null {
  // 백엔드 스펙에 따라 KR -> null 또는 'KR'
  if (lang === "KR") return null; // 또는 'KR'
  return lang; // 'EN' | 'CN' | 'JP'
}

// RPC 호출
const { data, error } = await supabase.rpc("rpc_explore_category_rankings", {
  p_lang: dbLang, // 또는 mapToRpcLang(language)
  p_category_large: selectedCategory,
  p_m: 20,
  p_dedupe_limit_per_name: 2,
  p_limit_per_category: 20,
});
```

---

## ✅ 최종 체크리스트 (프론트엔드 개발자용)

### 1단계 - 백엔드 스펙 확인

- [ ] `rpc_explore_category_rankings` 함수가 실제로 생성되었는지 확인
- [ ] `p_lang` 파라미터가 `'KR' | 'EN' | 'CN' | 'JP'` 형식인지, 아니면 `null | 'en' | 'ja' | 'zh-CN'` 형식인지 확인
- [ ] 반환 컬럼이 기존 타입과 일치하는지 확인 (특히 `category_mid_key`)

### 2단계 - 코드 변경

- [ ] `lib/api/beautripApi.ts`의 `getMidCategoryRankings()` 함수에서 RPC 함수명 변경
- [ ] 언어 매핑 로직 확인 (기존 `getCurrentLanguageForDb()` 사용 또는 새 함수 작성)
- [ ] TypeScript 타입 정의 업데이트 (필요 시)

### 3단계 - 테스트

- [ ] 한국어(KR) 환경에서 기존과 동일한 결과 확인
- [ ] 영어/중국어/일본어 환경에서 번역된 텍스트 확인
- [ ] 데이터가 적은 언어에서 UI 깨짐 없이 동작하는지 확인

---

## 🎯 핵심 요약

1. **함수명 변경**: `rpc_mid_category_rankings` → `rpc_explore_category_rankings`
2. **언어 코드 형식 확인 필요**: 백엔드가 어떤 형식을 받는지 명확히 해야 함
   - 옵션 A: `'KR' | 'EN' | 'CN' | 'JP'` (문서 기준)
   - 옵션 B: `null | 'en' | 'ja' | 'zh-CN'` (현재 코드 기준)
3. **기존 코드 재사용**: `getCurrentLanguageForDb()` 함수 활용 고려
4. **타입 검증**: 반환 컬럼이 기존 타입과 일치하는지 확인

---

## 💡 추가 제안

### 백엔드 개발자에게 질문할 사항

1. **언어 코드 형식**

   - `p_lang` 파라미터가 정확히 어떤 형식을 받나요?
   - `'KR'` vs `null` vs `'ko'` 중 어느 것이 한국어를 의미하나요?

2. **함수명 변경 이유**

   - `rpc_mid_category_rankings`와 `rpc_explore_category_rankings`의 차이점은?
   - 기존 함수는 deprecated 되나요?

3. **반환 컬럼**

   - `category_mid_key`는 새로 추가된 컬럼인가요?
   - 기존 `MidCategoryRanking` 타입과 100% 호환되나요?

4. **에러 처리**
   - 언어별 데이터가 없을 때 fallback 로직이 있나요?
   - 아니면 빈 배열을 반환하나요?

---

## 📅 일정 맞춤 시술 추천 RPC 함수 (`rpc_home_schedule_recommendations`) 피드백

### ✅ 잘 된 부분

1. **문서 구조가 명확함**: 두 가지 버전(간단/상세)으로 제공되어 이해하기 쉬움
2. **실무 가이드 제공**: 프론트엔드 개발자가 바로 사용할 수 있는 코드 예시 포함
3. **랭킹 로직 설명**: 백엔드에서 정렬까지 처리한다는 점이 명확히 명시됨
4. **여행 기간 필터링 로직**: 다운타임/권장체류일수 기준 설명이 구체적임

---

### ⚠️ 개선이 필요한 부분

#### 1. **언어 코드 매핑 불일치 (중요)**

**현재 상황:**

- 문서 제안: `'KR' | 'EN' | 'CN' | 'JP'` 형식 직접 전달
- 실제 코드: `getCurrentLanguageForDb()` 함수로 `null | 'en' | 'ja' | 'zh-CN'` 형식 사용

**실제 구현 코드:**

```typescript
// lib/api/beautripApi.ts (line 6648)
const pLang = language === "KR" ? null : getCurrentLanguageForDb(language);
// 결과: null | 'en' | 'ja' | 'zh-CN'
```

**문제점:**

- 문서의 언어 매핑 예시가 실제 코드와 다름
- 문서에서는 `'KR' | 'EN' | 'CN' | 'JP'` 형식을 제안하지만, 실제로는 `null | 'en' | 'ja' | 'zh-CN'` 형식 사용

**제안:**

````markdown
### 언어 매핑 (실제 코드 기준)

실제 프론트엔드 코드에서는 다음과 같이 처리합니다:

```typescript
import {
  getCurrentLanguageForDb,
  type LanguageCode,
} from "@/lib/api/beautripApi";

// 방법 1: 기존 함수 활용 (현재 사용 중)
const pLang = language === "KR" ? null : getCurrentLanguageForDb(language);
// KR → null
// EN → 'en'
// CN → 'zh-CN'
// JP → 'ja'

// 방법 2: 백엔드가 'KR' 형식을 받도록 변경된다면
const pLang = language === "KR" ? "KR" : language; // 'KR' | 'EN' | 'CN' | 'JP' | null
```
````

⚠️ **백엔드 확인 필요**: `p_lang` 파라미터가 정확히 어떤 형식을 받는지 확인 필요

- 옵션 A: `null | 'en' | 'ja' | 'zh-CN'` (현재 코드 기준)
- 옵션 B: `'KR' | 'EN' | 'CN' | 'JP' | null` (문서 기준, 새 테이블 구조와 일치)

**새 테이블 구조 기준 고려사항:**

- `treatment_master_en/cn/jp` 별도 테이블을 사용하므로, `p_lang` 파라미터가 `'EN' | 'CN' | 'JP'` 형식을 받는 것이 더 직관적일 수 있음
- 현재 코드는 `null | 'en' | 'ja' | 'zh-CN'` 형식을 사용 중이므로, 백엔드와 프론트엔드 간 형식 통일 필요

````

---

#### 2. **반환 데이터 구조 불일치**

**문서 내용:**
> "결과는 배열 형태이며, 각 항목은 다음 필드를 갖습니다"

**실제 코드:**
```typescript
// lib/api/beautripApi.ts (line 6675-6737)
// RPC 결과를 category_mid 기준으로 그룹화하여 반환
const groupedByCategory = new Map<string, HomeScheduleRecommendation>();

// 반환 타입: HomeScheduleRecommendation[]
// 각 항목은 { categoryMid, category_mid, category_large, treatments: Treatment[] } 구조
````

**문제점:**

- 문서는 평면 배열(flat array)을 반환한다고 설명
- 실제 코드는 카테고리별로 그룹화된 구조를 반환
- 문서의 필드 설명과 실제 반환 구조가 다름

**제안:**

````markdown
### 반환 데이터 구조 (실제 코드 기준)

RPC 함수는 평면 배열을 반환하지만, 프론트엔드 `getHomeScheduleRecommendations()` 함수는
카테고리별로 그룹화하여 반환합니다:

```typescript
// RPC 직접 호출 시 (평면 배열)
const { data } = await supabase.rpc('rpc_home_schedule_recommendations', {...});
// data: Array<{ category_mid, treatment_id, treatment_name, ... }>

// getHomeScheduleRecommendations() 사용 시 (그룹화된 구조)
const recommendations = await getHomeScheduleRecommendations(...);
// recommendations: HomeScheduleRecommendation[]
// [
//   {
//     categoryMid: "눈성형",
//     category_mid: "눈성형",
//     category_large: "성형",
//     treatments: [Treatment, Treatment, ...],
//     averageRecoveryPeriod: 3,
//     ...
//   },
//   ...
// ]
```
````

**문서 수정 제안:**

1. RPC 함수 반환값: 평면 배열 (문서 설명 유지)
2. 프론트엔드 래퍼 함수 반환값: 그룹화된 구조 (추가 설명 필요)

````

---

#### 3. **`category_mid_key` 필드 누락**

**문서 내용:**
> "category_mid_key - 카테고리 key (항상 한글 기준 고정)"

**실제 코드 확인:**
- `getHomeScheduleRecommendations()` 함수에서 `category_mid_key` 필드를 사용하지 않음
- RPC 결과에서 `category_mid`만 사용하여 그룹화

**문제점:**
- 문서에 `category_mid_key` 필드가 명시되어 있지만, 실제 코드에서 사용 여부 불명확
- `category_mid`와 `category_mid_key`의 차이점이 명확하지 않음

**제안:**
```markdown
### category_mid vs category_mid_key

⚠️ **확인 필요**: RPC 함수가 실제로 `category_mid_key` 필드를 반환하는지 확인

- `category_mid`: 표시용 카테고리명 (언어별로 다를 수 있음)
- `category_mid_key`: 카테고리 key (항상 한글 기준 고정)

만약 `category_mid_key`가 없다면:
- 그룹핑 시 `category_mid`를 사용 (현재 코드)
- 언어 변경 시 같은 카테고리가 다른 이름으로 표시될 수 있음
````

---

#### 4. **기본값 불일치**

**문서 내용:**

- `p_limit_categories`: 기본 5
- `p_limit_per_category`: 기본 5

**실제 코드:**

```typescript
// lib/api/beautripApi.ts (line 6661-6662)
p_limit_categories: options?.limitCategories ?? 5,
p_limit_per_category: options?.limitPerCategory ?? 10,  // ⚠️ 기본값이 10
```

**문제점:**

- 문서의 `p_limit_per_category` 기본값(5)과 실제 코드 기본값(10)이 다름

**제안:**

```markdown
### 파라미터 기본값 (실제 코드 기준)

- `p_limit_categories`: 5 (문서와 일치)
- `p_limit_per_category`: 10 (문서는 5로 명시되어 있으나 실제 코드는 10)

⚠️ 문서와 코드의 기본값을 일치시키거나, 문서에 실제 기본값 명시 필요
```

---

#### 5. **반환 컬럼 검증 필요**

**문서에 명시된 필드:**

- `category_mid`, `category_mid_key`, `category_large`
- `treatment_id`, `treatment_name`, `hospital_name`
- `selling_price`, `original_price`, `dis_rate`
- `rating`, `review_count`, `main_img_url`
- `event_url`, `vat_info`, `treatment_hashtags`
- `surgery_time`, `downtime`, `platform`
- `treatment_rank`

**실제 코드에서 사용하는 필드:**

```typescript
// lib/api/beautripApi.ts (line 6699-6718)
const treatment: Treatment = {
  treatment_id: row.treatment_id,
  treatment_name: row.treatment_name,
  hospital_name: row.hospital_name,
  category_large: row.category_large,
  category_mid: row.category_mid,
  category_small: row.category_small, // ⚠️ 문서에 없음
  selling_price: row.selling_price,
  original_price: row.original_price,
  dis_rate: row.dis_rate,
  rating: row.rating,
  review_count: row.review_count,
  main_image_url: row.main_image_url, // ⚠️ 문서는 main_img_url
  event_url: row.event_url,
  vat_info: row.vat_info,
  treatment_hashtags: row.treatment_hashtags,
  surgery_time: row.surgery_time,
  downtime: row.downtime,
  platform: row.platform,
  ...row, // 추가 필드 포함
};
```

**문제점:**

- `category_small` 필드가 문서에 없음
- `main_img_url` vs `main_image_url` 필드명 불일치 가능성

**제안:**

```markdown
### 반환 컬럼 검증 체크리스트

- [ ] `category_mid_key` - 실제로 반환되는지 확인
- [ ] `category_small` - 문서에 없지만 코드에서 사용 중
- [ ] `main_img_url` vs `main_image_url` - 필드명 일치 여부 확인
- [ ] `average_recovery_period`, `average_recovery_period_min`, `average_recovery_period_max` - 문서에 없지만 코드에서 사용
- [ ] `average_procedure_time`, `average_procedure_time_min`, `average_procedure_time_max` - 문서에 없지만 코드에서 사용
```

---

#### 6. **카테고리 필터링 로직 설명 부족**

**문서 내용:**

> "selectedCategoryId를 현재 언어의 카테고리 이름으로 변환"

**실제 코드:**

```typescript
// components/ProcedureRecommendation.tsx (line 528-543)
// ⚠️ 중요: 현재 언어 데이터의 category_large 값과 동일해야 필터가 정상 동작
let categoryToUse: string | null = null;
if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
  const selectedCategory = mainCategories.find(
    (cat) => cat.id === selectedCategoryId
  );
  categoryToUse = selectedCategory?.name || selectedCategoryId;
}
```

**문제점:**

- 문서에 카테고리 필터링 시 언어별 매핑이 중요하다는 점이 명확하지 않음
- 실제 코드에는 주석으로 "현재 언어 데이터의 category_large 값과 동일해야 필터가 정상 동작"이라고 명시되어 있음

**제안:**

```markdown
### ⚠️ 카테고리 필터링 시 주의사항

`p_category_large` 파라미터는 **현재 언어의 category_large 값**과 정확히 일치해야 합니다.

예시:

- 한국어 UI: `p_category_large: "눈성형"`
- 영어 UI: `p_category_large: "Eye Surgery"` (또는 백엔드가 영어 category_large를 지원하는지 확인)
- 중국어 UI: `p_category_large: "眼部整形"` (또는 백엔드가 중국어 category_large를 지원하는지 확인)

⚠️ **백엔드 확인 필요**:

- `p_category_large`가 언어별로 다른 값을 받는지, 아니면 항상 한국어 기준인지 확인
- 현재 코드는 `mainCategories`에서 현재 언어의 `name`을 가져와서 전달
```

---

#### 7. **그룹핑 예시 코드 개선**

**문서 내용:**

```typescript
const grouped = data.reduce((acc, item) => {
  if (!acc[item.category_mid_key]) acc[item.category_mid_key] = [];
  acc[item.category_mid_key].push(item);
  return acc;
}, {});
```

**문제점:**

- `category_mid_key`를 사용하지만, 실제 코드는 `category_mid`를 사용
- 실제 코드는 `Map`을 사용하여 그룹화

**제안:**

````markdown
### 그룹핑 예시 (실제 코드 기준)

```typescript
// 방법 1: category_mid 기준 그룹핑 (현재 코드)
const groupedByCategory = new Map<string, any[]>();
data.forEach((row: any) => {
  const categoryMid = row.category_mid || "기타";
  if (!groupedByCategory.has(categoryMid)) {
    groupedByCategory.set(categoryMid, []);
  }
  groupedByCategory.get(categoryMid)!.push(row);
});

// 방법 2: category_mid_key 기준 그룹핑 (category_mid_key가 있다면)
const grouped = data.reduce((acc, item) => {
  const key = item.category_mid_key || item.category_mid;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {} as Record<string, typeof data>);
```
````

````

---

### 📝 실제 코드와의 비교 요약

| 항목 | 문서 | 실제 코드 | 상태 |
|------|------|-----------|------|
| 함수명 | `rpc_home_schedule_recommendations` | `rpc_home_schedule_recommendations` | ✅ 일치 |
| 언어 형식 | `'KR' \| 'EN' \| 'CN' \| 'JP'` | `null \| 'en' \| 'ja' \| 'zh-CN'` | ⚠️ 불일치 |
| 기본값 (limit_categories) | 5 | 5 | ✅ 일치 |
| 기본값 (limit_per_category) | 5 | 10 | ⚠️ 불일치 |
| 반환 구조 | 평면 배열 | 그룹화된 구조 (래퍼 함수) | ⚠️ 설명 부족 |
| category_mid_key | 문서에 명시 | 코드에서 미사용 | ⚠️ 확인 필요 |

---

### ✅ 최종 체크리스트 (일정 맞춤 시술 추천)

#### 1단계 - 백엔드 스펙 확인
- [ ] `p_lang` 파라미터가 `'KR' | 'EN' | 'CN' | 'JP'` 형식인지, 아니면 `null | 'en' | 'ja' | 'zh-CN'` 형식인지 확인
- [ ] `category_mid_key` 필드가 실제로 반환되는지 확인
- [ ] `p_category_large`가 언어별로 다른 값을 받는지, 아니면 항상 한국어 기준인지 확인
- [ ] `p_limit_per_category` 기본값이 5인지 10인지 확인
- [ ] 반환 컬럼명이 `main_img_url`인지 `main_image_url`인지 확인

#### 2단계 - 문서 수정
- [ ] 언어 매핑 예시를 실제 코드 기준으로 수정
- [ ] 반환 데이터 구조 설명 추가 (RPC vs 래퍼 함수)
- [ ] 기본값 불일치 해결
- [ ] 카테고리 필터링 시 언어별 매핑 주의사항 추가
- [ ] 실제 반환 컬럼 목록 검증 및 업데이트

#### 3단계 - 코드 검증
- [ ] `getHomeScheduleRecommendations()` 함수가 문서와 일치하는지 확인
- [ ] `category_mid_key` 사용 여부 확인
- [ ] 언어별 카테고리 필터링이 정상 동작하는지 확인

---

### 🎯 핵심 요약 (일정 맞춤 시술 추천)

1. **언어 코드 형식 확인 필요**: 문서와 실제 코드가 다름
   - 문서: `'KR' | 'EN' | 'CN' | 'JP'`
   - 실제: `null | 'en' | 'ja' | 'zh-CN'`
   - **새 테이블 구조**: `treatment_master_en/cn/jp` 별도 테이블 사용 → 형식 통일 필요
2. **반환 구조**: RPC는 평면 배열, 래퍼 함수는 그룹화된 구조
3. **기본값 불일치**: `p_limit_per_category` 기본값이 문서(5)와 코드(10)에서 다름
4. **필드명 확인**: `category_mid_key`, `main_img_url` 등 실제 반환 여부 확인 필요
5. **카테고리 필터링**: 언어별 매핑이 중요함 (문서에 명시 필요)
6. **테이블 구조**: ✅ 별도 테이블 구조 확인됨 (`treatment_master_en/cn/jp`)
   - 각 테이블의 스키마가 `treatment_master`와 동일한지 확인 필요
   - `category_mid` 필드가 언어별로 번역되어 있는지, 한국어 기준인지 확인 필요

---

### 💡 백엔드 개발자에게 질문할 사항

1. **언어 코드 형식**
   - `p_lang` 파라미터가 정확히 어떤 형식을 받나요?
   - `'KR'` vs `null` 중 어느 것이 한국어를 의미하나요?
   - `'EN'` vs `'en'`, `'CN'` vs `'zh-CN'`, `'JP'` vs `'ja'` 중 어느 형식을 사용하나요?

2. **카테고리 필터링**
   - `p_category_large`가 언어별로 다른 값을 받나요, 아니면 항상 한국어 기준인가요?
   - 예: 영어 UI에서 "Eye Surgery"를 전달해야 하나요, 아니면 "눈성형"을 전달해야 하나요?

3. **반환 컬럼**
   - `category_mid_key` 필드가 실제로 반환되나요?
   - `main_img_url` vs `main_image_url` 중 어느 필드명을 사용하나요?
   - `category_small` 필드가 반환되나요?

4. **기본값**
   - `p_limit_per_category`의 기본값이 5인가요, 10인가요?

5. **추가 필드**
   - `average_recovery_period`, `average_procedure_time` 등의 필드가 반환되나요?

6. **테이블 구조 (새로 확인됨)**
   - `treatment_master_en/cn/jp` 테이블의 스키마가 `treatment_master`와 100% 동일한가요?
   - `category_mid` 필드가 언어별로 번역되어 있나요, 아니면 한국어 기준인가요?
   - `category_treattime_recovery` 테이블과 조인할 때 `category_mid` 매칭이 어떻게 되나요?
   - 언어별 테이블에 데이터가 없을 때 한국어로 fallback하는 로직이 있나요?

---

## 📊 언어별 테이블 구조 정보

### ✅ 확인 완료: 별도 테이블 구조 사용

**실제 테이블 구조 (확인됨)**:
- `treatment_master` - 한국어 기본 데이터
- `treatment_master_en` - 영어 데이터 (새로 생성됨)
- `treatment_master_cn` - 중국어 데이터 (새로 생성됨)
- `treatment_master_jp` - 일본어 데이터 (새로 생성됨)

#### RPC 함수에서의 사용 방식

RPC 함수 `rpc_home_schedule_recommendations`는 `p_lang` 파라미터에 따라:

1. **`p_lang = null` 또는 `'KR'`**
   - `treatment_master` 테이블에서 조회
   - 한국어 텍스트 반환

2. **`p_lang = 'EN'`**
   - `treatment_master_en` 테이블에서 조회
   - 영어 텍스트 반환

3. **`p_lang = 'CN'`**
   - `treatment_master_cn` 테이블에서 조회
   - 중국어 텍스트 반환

4. **`p_lang = 'JP'`**
   - `treatment_master_jp` 테이블에서 조회
   - 일본어 텍스트 반환

#### ⚠️ 확인 필요 사항

1. **테이블 스키마 일치 여부**
   - 각 언어별 테이블(`treatment_master_en/cn/jp`)의 컬럼 구조가 `treatment_master`와 동일한가요?
   - 모든 컬럼이 동일한지, 일부 컬럼만 다른지 확인 필요
   - 특히 `treatment_id`, `category_mid`, `category_large` 등 핵심 필드 확인

2. **category_mid 필드 처리**
   - 언어별 테이블의 `category_mid` 필드가 각 언어로 번역되어 있나요?
   - 예: `treatment_master_en`의 `category_mid`가 "Eye Surgery" 같은 영어 값인가요?
   - 아니면 모든 테이블에서 `category_mid`가 한국어 기준으로 동일한가요?
   - ⚠️ **중요**: `category_treattime_recovery` 테이블과 조인할 때 `category_mid` 매칭이 어떻게 되는지 확인 필요

3. **조인 관계 (category_treattime_recovery)**
   - `category_treattime_recovery` 테이블의 `중분류` 컬럼은 한국어 기준입니다
   - 언어별 테이블의 `category_mid`와 어떻게 매칭하나요?
   - 시나리오 A: 언어별 테이블의 `category_mid`가 각 언어로 번역되어 있음
     - → RPC 함수에서 `category_mid`를 한국어로 변환 후 조인?
     - → 아니면 `category_treattime_recovery`에 언어별 컬럼이 있나요?
   - 시나리오 B: 모든 언어별 테이블의 `category_mid`가 한국어 기준으로 동일
     - → 직접 조인 가능

4. **Fallback 로직**
   - 언어별 테이블에 데이터가 없을 때 한국어(`treatment_master`)로 fallback하는 로직이 RPC 함수 내부에 구현되어 있나요?
   - 아니면 빈 값(null)을 반환하나요?
   - 예: `treatment_master_en`에 특정 `treatment_id`가 없으면 `treatment_master`에서 가져오는지?

5. **성능 최적화**
   - 언어별 테이블에 인덱스가 설정되어 있나요?
   - `treatment_id` (PK), `category_mid`, `category_large` 등 조인/필터링에 사용되는 컬럼에 인덱스가 있나요?

6. **데이터 동기화**
   - 언어별 테이블의 데이터가 `treatment_master`와 동기화되어 있나요?
   - 새로운 시술이 추가될 때 모든 언어별 테이블에 자동으로 추가되나요?
   - 아니면 수동으로 관리하나요?

---

### 📝 테이블 구조 문서화 제안

다음 정보를 백엔드 문서에 추가하는 것을 권장합니다:

```markdown
## 데이터베이스 테이블 구조

### 1. treatment_master (한국어 기본 데이터)
- 한국어 시술 데이터
- `treatment_id` (PK)
- `category_mid` (한국어 기준, 예: "눈성형")
- `category_large` (한국어 기준, 예: "성형")
- 텍스트 데이터: `treatment_name`, `hospital_name`, `vat_info` 등 (한국어)
- 숫자 데이터: `selling_price`, `original_price`, `rating`, `review_count` 등

### 2. treatment_master_en (영어 데이터)
- 영어 시술 데이터
- `treatment_id` (PK, treatment_master와 동일한 ID 사용)
- `category_mid` (영어로 번역된 값인지, 한국어 기준인지 확인 필요)
- `category_large` (영어로 번역된 값인지 확인 필요)
- 텍스트 데이터: `treatment_name`, `hospital_name`, `vat_info` 등 (영어)
- 숫자 데이터: `selling_price`, `original_price`, `rating`, `review_count` 등 (treatment_master와 동일)

### 3. treatment_master_cn (중국어 데이터)
- 중국어 시술 데이터
- 구조는 `treatment_master_en`과 동일

### 4. treatment_master_jp (일본어 데이터)
- 일본어 시술 데이터
- 구조는 `treatment_master_en`과 동일

### 5. category_treattime_recovery (회복 기간 정보)
- `중분류` 컬럼 (한국어 기준, 예: "눈성형")
- 모든 언어에서 동일한 데이터 사용
- `downtime`, `권장체류일수`, `시술시간_min`, `시술시간_max` 등

### 6. 조인 관계

#### 시나리오 A: category_mid가 언어별로 번역된 경우
```sql
-- RPC 함수 내부에서 처리 필요
-- 1. 언어별 테이블에서 category_mid 가져오기 (예: "Eye Surgery")
-- 2. category_mid를 한국어로 변환 (예: "눈성형")
-- 3. category_treattime_recovery.중분류와 조인
````

#### 시나리오 B: category_mid가 모든 테이블에서 한국어 기준인 경우

```sql
-- 직접 조인 가능
treatment_master_en.category_mid = category_treattime_recovery.중분류
```

⚠️ **확인 필요**: 실제로 어떤 시나리오인지 백엔드에서 확인 필요

````

---

### ✅ 체크리스트: 테이블 구조 확인

- [x] 실제 사용하는 테이블 구조 확인: **별도 테이블 구조 확인됨** (`treatment_master_en/cn/jp`)
- [ ] 각 테이블의 스키마 문서화 (treatment_master와 동일한지 확인)
- [ ] `category_mid` 필드가 언어별로 번역되어 있는지, 아니면 한국어 기준인지 확인
- [ ] `category_treattime_recovery`와의 조인 방식 확인
- [ ] Fallback 로직 문서화 (언어별 데이터 없을 때 한국어로 fallback하는지)
- [ ] 인덱스 정보 문서화 (성능 최적화 참고용)
- [ ] 데이터 동기화 방식 문서화 (새 시술 추가 시 모든 언어별 테이블에 반영되는지)

---

### 🔍 추가 확인 필요 사항 (백엔드 개발자에게 질문)

1. **테이블 스키마**
   ```sql
   -- 각 언어별 테이블의 컬럼 구조가 treatment_master와 100% 동일한가요?
   -- 예를 들어:
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'treatment_master_en'
   ORDER BY ordinal_position;
````

2. **category_mid 필드 처리**

   - `treatment_master_en`의 `category_mid` 값이 무엇인가요?
     - 옵션 A: 영어로 번역된 값 (예: "Eye Surgery")
     - 옵션 B: 한국어 기준 값 (예: "눈성형")
   - `category_treattime_recovery`와 조인할 때 어떻게 처리하나요?

3. **Fallback 로직**

   - `treatment_master_en`에 특정 `treatment_id`가 없을 때:
     - `treatment_master`에서 가져오나요? (Fallback)
     - 아니면 해당 시술을 결과에서 제외하나요?

4. **데이터 일관성**

   - 모든 언어별 테이블에 동일한 `treatment_id` 세트가 있나요?
   - 아니면 언어별로 다른 시술이 포함될 수 있나요?

5. **성능 최적화**
   - 각 언어별 테이블에 어떤 인덱스가 설정되어 있나요?
   - 특히 `treatment_id`, `category_mid`, `category_large` 컬럼에 인덱스가 있나요?

---

## 📌 최종 요약

### 일정 맞춤 시술 추천 RPC 함수 (`rpc_home_schedule_recommendations`)

#### ✅ 확인 완료 사항

- 별도 테이블 구조 사용: `treatment_master_en/cn/jp`
- 함수명: `rpc_home_schedule_recommendations`
- 기본 파라미터 구조 확인

#### ⚠️ 확인 필요 사항

1. **언어 코드 형식**: `'KR' | 'EN' | 'CN' | 'JP'` vs `null | 'en' | 'ja' | 'zh-CN'`
2. **테이블 스키마**: 각 언어별 테이블이 `treatment_master`와 동일한지
3. **category_mid 처리**: 언어별 번역 여부 및 조인 방식
4. **Fallback 로직**: 언어별 데이터 없을 때 한국어로 fallback하는지
5. **기본값**: `p_limit_per_category` 기본값 (5 vs 10)
6. **반환 필드**: `category_mid_key`, `main_img_url` 등 실제 반환 여부

#### 📝 다음 단계

1. 백엔드 개발자와 위 확인 사항 논의
2. 확인된 내용을 바탕으로 문서 업데이트
3. 프론트엔드 코드 수정 (필요 시)
4. 테스트 및 검증
