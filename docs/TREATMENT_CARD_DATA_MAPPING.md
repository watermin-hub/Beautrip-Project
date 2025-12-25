# 시술 카드 데이터 매핑 및 그룹화 가이드

## 📋 개요

이 문서는 `treatment_master` 테이블에서 시술 정보를 가져와 시술 카드를 표시하는 각 페이지의 데이터 매핑 및 그룹화 방식을 설명합니다.

---

## 🗂️ 시술 카드가 표시되는 주요 위치

### 1. **일정 맞춤 기반 시술 추천** (`ProcedureRecommendation.tsx`)
### 2. **카테고리 랭킹 페이지** (`CategoryRankingPage.tsx`)
### 3. **시술 목록 페이지** (`ProcedureListPage.tsx`)
### 4. **K-뷰티 랭킹 페이지** (`KBeautyRankingPage.tsx`)

---

## 1️⃣ 일정 맞춤 기반 시술 추천 (`ProcedureRecommendation.tsx`)

### 📍 사용 함수
```typescript
getHomeScheduleRecommendations(
  tripStart: string,
  tripEnd: string,
  categoryLarge: string | null,
  language?: LanguageCode
)
```

### 🔄 데이터 가져오기 방식

#### **백엔드 RPC 사용**
- **RPC 함수**: `rpc_home_schedule_recommendations`
- **테이블**: 
  - 한국어: `treatment_master`
  - 다른 언어: `v_treatment_i18n_v2` (lang 필터 적용)

#### **그룹화 로직**
```typescript
// ⚠️ 핵심: category_mid_key 기준으로 그룹화 (한글 고정, 로직용)
const groupedByCategory = new Map<string, HomeScheduleRecommendation>();

data.forEach((row: any) => {
  // category_mid_key: 로직/그룹핑용 (한글 고정)
  const categoryMidKey = row.category_mid_key || row.category_mid || "기타";
  // category_mid: UI 표시용 (언어별)
  const categoryMid = row.category_mid || categoryMidKey;
  
  if (!groupedByCategory.has(categoryMidKey)) {
    groupedByCategory.set(categoryMidKey, {
      categoryMid: categoryMid,        // UI 표시용 (언어별)
      category_mid: categoryMid,       // UI 표시용 (언어별)
      category_mid_key: categoryMidKey, // ⚠️ 로직/그룹핑용 (한글 고정)
      category_large: categoryLarge,
      treatments: [],
      // 집계 필드들...
    });
  }
  
  groupedByCategory.get(categoryMidKey)!.treatments.push(treatment);
});
```

#### **핵심 포인트**
- ✅ **그룹화 키**: `category_mid_key` (한글 고정)
- ✅ **UI 표시**: `category_mid` (언어별)
- ✅ **대분류 필터**: `category_large` (한국어로 변환 후 전달)
- ✅ **백엔드 집계**: 회복 기간, 시술 시간 등 집계 필드 포함

#### **데이터 흐름**
```
1. 프론트: 언어별 카테고리 이름 선택
   ↓
2. convertCategoryNameToKorean() → 한국어로 변환
   ↓
3. RPC 호출: p_category_large (한국어), p_lang (언어 코드)
   ↓
4. 백엔드: treatment_master 또는 v_treatment_i18n_v2에서 필터링
   ↓
5. 프론트: category_mid_key로 그룹화
   ↓
6. UI: category_mid로 표시 (언어별)
```

---

## 2️⃣ 카테고리 랭킹 페이지 (`CategoryRankingPage.tsx`)

### 📍 사용 함수

#### **중분류 랭킹**
```typescript
getMidCategoryRankings(
  p_category_large: string | null,
  p_m: number = 20,
  p_dedupe_limit_per_name: number = 2,
  p_limit_per_category: number = 20,
  language?: LanguageCode
)
```

#### **소분류 랭킹**
```typescript
getSmallCategoryRankings(
  p_category_mid: string,
  p_m: number = 20,
  p_dedupe_limit_per_name: number = 2,
  p_limit_per_category: number = 20,
  language?: LanguageCode
)
```

### 🔄 데이터 가져오기 방식

#### **백엔드 RPC 사용**
- **중분류 RPC**: `rpc_mid_category_rankings_v2`
- **소분류 RPC**: `rpc_small_category_rankings`
- **테이블**: 
  - 한국어: `treatment_master`
  - 다른 언어: `v_treatment_i18n_v2` (lang 필터 적용)

#### **중분류 그룹화 로직**
```typescript
// RPC가 flat row로 반환하므로 category_mid로 그룹화
const rows = result.data as any[];
const grouped = new Map<string, any>();

for (const r of rows) {
  const key = r.category_mid; // ⚠️ UI 표시용 (언어별)
  if (!key) continue;

  if (!grouped.has(key)) {
    // ✅ 백엔드 v2 RPC에서 집계 필드를 제공하므로 그대로 사용
    grouped.set(key, {
      category_mid: r.category_mid,
      category_rank: r.category_rank,        // 백엔드 제공
      category_score: r.category_score,     // 백엔드 제공
      average_rating: r.average_rating,     // 백엔드 제공
      total_reviews: r.total_reviews,       // 백엔드 제공
      treatment_count: r.treatment_count,   // 백엔드 제공
      treatments: [],
    });
  }

  grouped.get(key).treatments.push({
    treatment_id: r.treatment_id,
    treatment_name: r.treatment_name,
    // ... 기타 필드
  });
}

// ✅ 백엔드에서 이미 정렬된 category_rank 기준으로 정렬
const midGrouped = Array.from(grouped.values()).sort(
  (a, b) => (a.category_rank || 999999) - (b.category_rank || 999999)
);
```

#### **소분류 그룹화 로직**
```typescript
// 소분류도 동일한 방식으로 그룹화
const grouped = new Map<string, any>();

for (const r of rows) {
  const key = r.category_small; // 소분류로 그룹화
  if (!key) continue;

  if (!grouped.has(key)) {
    grouped.set(key, {
      category_small: r.category_small,
      category_rank: r.category_rank,
      // ... 집계 필드들
      treatments: [],
    });
  }

  grouped.get(key).treatments.push(treatment);
}
```

#### **핵심 포인트**
- ✅ **그룹화 키**: `category_mid` (중분류) 또는 `category_small` (소분류)
- ✅ **집계 필드**: 백엔드 v2 RPC에서 제공 (프론트 계산 불필요)
- ✅ **정렬**: `category_rank` 기준 (백엔드에서 이미 정렬됨)
- ✅ **베이지안 평균**: 백엔드에서 계산된 `category_score` 사용

#### **데이터 흐름**
```
1. 프론트: 대분류 선택 (선택적)
   ↓
2. RPC 호출: p_category_large (한국어), p_lang (언어 코드)
   ↓
3. 백엔드: 베이지안 평균 계산 + 집계 필드 생성
   ↓
4. 프론트: category_mid로 그룹화 (flat row → 그룹)
   ↓
5. UI: category_rank 기준 정렬 후 표시
```

---

## 3️⃣ 시술 목록 페이지 (`ProcedureListPage.tsx`)

### 📍 사용 함수
```typescript
loadTreatmentsPaginated(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    searchTerm?: string;
    categoryLarge?: string;
    categoryMid?: string;
    categorySmall?: string;
    language?: LanguageCode;
  }
)
```

### 🔄 데이터 가져오기 방식

#### **직접 테이블 조회**
- **테이블**: 
  - 한국어: `treatment_master`
  - 다른 언어: `v_treatment_i18n_v2` (lang 필터 적용)
- **쿼리 방식**: Supabase `.from()` 직접 조회

#### **필터링 로직**
```typescript
// 프론트엔드에서 필터링
let query = client.from(treatmentTable).select("*");

// 언어 필터
if (dbLang) {
  query = query.eq("lang", dbLang);
}

// 대분류 필터
if (filters?.categoryLarge) {
  query = query.eq("category_large", filters.categoryLarge);
}

// 중분류 필터
if (filters?.categoryMid) {
  query = query.eq("category_mid", filters.categoryMid);
}

// 소분류 필터
if (filters?.categorySmall) {
  query = query.eq("category_small", filters.categorySmall);
}

// 검색어 필터
if (filters?.searchTerm) {
  query = query.or(
    `treatment_name.ilike.%${filters.searchTerm}%,hospital_name.ilike.%${filters.searchTerm}%`
  );
}
```

#### **중분류 목록 추출**
```typescript
// 프론트엔드에서 로드된 데이터에서 중분류 추출
const midCategories = useMemo(() => {
  if (!categoryLarge) return [];
  const categorySet = new Set<string>();
  treatments
    .filter((t) => t.category_large === categoryLarge)
    .forEach((t) => {
      if (t.category_mid) {
        categorySet.add(t.category_mid);
      }
    });
  return Array.from(categorySet).sort();
}, [treatments, categoryLarge]);
```

#### **핵심 포인트**
- ✅ **그룹화 없음**: 단순 목록 표시 (필터링만)
- ✅ **프론트 필터링**: Supabase 쿼리로 필터링
- ✅ **중분류 추출**: 로드된 데이터에서 동적으로 추출
- ✅ **페이지네이션**: `.range()` 사용

#### **데이터 흐름**
```
1. 프론트: 필터 선택 (대분류, 중분류, 검색어)
   ↓
2. Supabase 쿼리: 필터 조건 적용
   ↓
3. 프론트: 페이지네이션 처리
   ↓
4. UI: 카드 목록으로 표시
```

---

## 4️⃣ K-뷰티 랭킹 페이지 (`KBeautyRankingPage.tsx`)

### 📍 사용 함수
```typescript
getKBeautyRankings(treatments: Treatment[]): Treatment[]
```

### 🔄 데이터 가져오기 방식

#### **프론트엔드 필터링**
- **입력**: 전체 시술 목록 (`Treatment[]`)
- **처리**: 키워드 기반 필터링 + 점수 계산
- **출력**: 필터링된 시술 목록 (점수 순 정렬)

#### **필터링 로직**
```typescript
const KBEAUTY_KEYWORDS = [
  "k-beauty", "k뷰티", "k-뷰티",
  "한국", "korean", "コリアン",
  // ... 기타 키워드
];

export function getKBeautyRankings(treatments: Treatment[]): Treatment[] {
  return treatments
    .filter((treatment) => {
      const name = (treatment.treatment_name || "").toLowerCase();
      const hashtags = (treatment.treatment_hashtags || "").toLowerCase();
      const category = (treatment.category_large || "").toLowerCase();

      return KBEAUTY_KEYWORDS.some(
        (keyword) =>
          name.includes(keyword.toLowerCase()) ||
          hashtags.includes(keyword.toLowerCase()) ||
          category.includes(keyword.toLowerCase())
      );
    })
    .map((treatment) => ({
      ...treatment,
      recommendationScore: calculateRecommendationScore(treatment),
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}
```

#### **점수 계산**
```typescript
function calculateRecommendationScore(treatment: Treatment): number {
  let score = 0;
  
  // 평점 가중치
  if (treatment.rating) {
    score += treatment.rating * 20;
  }
  
  // 리뷰 수 가중치
  if (treatment.review_count) {
    score += Math.log(treatment.review_count + 1) * 10;
  }
  
  // 할인율 가중치
  if (treatment.dis_rate) {
    score += parseFloat(treatment.dis_rate) * 2;
  }
  
  return score;
}
```

#### **핵심 포인트**
- ✅ **그룹화 없음**: 단순 필터링 + 정렬
- ✅ **키워드 기반**: 시술명, 해시태그, 카테고리에서 키워드 검색
- ✅ **점수 계산**: 프론트엔드에서 추천 점수 계산
- ✅ **정렬**: 점수 내림차순

#### **데이터 흐름**
```
1. 전체 시술 목록 로드 (loadTreatments 등)
   ↓
2. 키워드 필터링 (K-뷰티 관련)
   ↓
3. 추천 점수 계산
   ↓
4. 점수 기준 정렬
   ↓
5. UI: 랭킹 카드로 표시
```

---

## 🔑 핵심 개념 정리

### 1. **카테고리 필드 구분**

| 필드 | 용도 | 값 형식 | 예시 |
|------|------|--------|------|
| `category_large` | 대분류 | 한국어 고정 | "눈성형", "리프팅" |
| `category_mid` | 중분류 (UI 표시) | 언어별 | "쌍수", "Double Eyelid" |
| `category_mid_key` | 중분류 (로직/그룹핑) | 한국어 고정 | "쌍수" |
| `category_small` | 소분류 | 언어별 | "부분쌍수", "Partial Double Eyelid" |

### 2. **언어별 테이블 선택**

```typescript
// 한국어: treatment_master (lang 필터 없음)
// 다른 언어: v_treatment_i18n_v2 (lang 필터 적용)
const treatmentTable = getTreatmentTableName(language);
const dbLang = getCurrentLanguageForDb(language); // "en" | "ja" | "zh-CN" | null
```

### 3. **그룹화 전략 비교**

| 페이지 | 그룹화 키 | 그룹화 위치 | 집계 위치 |
|--------|----------|------------|----------|
| 일정 맞춤 추천 | `category_mid_key` | 프론트 | 백엔드 |
| 카테고리 랭킹 | `category_mid` / `category_small` | 프론트 | 백엔드 (v2) |
| 시술 목록 | 그룹화 없음 | - | - |
| K-뷰티 랭킹 | 그룹화 없음 | - | 프론트 (점수) |

### 4. **카테고리 이름 변환**

```typescript
// 언어별 카테고리 이름 → 한국어 변환
// 1. DB 조회 우선 (category_toggle_map)
// 2. 하드코딩 매핑 (CATEGORY_NAME_I18N_TO_KR)
const koreanCategory = await convertCategoryNameToKorean(
  localizedCategory,
  language
);
```

---

## 📊 데이터 흐름 다이어그램

### 일정 맞춤 추천
```
[사용자 선택]
  ↓
[언어별 카테고리] → [한국어 변환] → [RPC 호출]
  ↓
[백엔드 집계] → [Flat Row 반환]
  ↓
[category_mid_key 그룹화] → [UI 표시]
```

### 카테고리 랭킹
```
[사용자 선택]
  ↓
[대분류 선택] → [RPC 호출]
  ↓
[백엔드 집계 + 베이지안 평균] → [Flat Row 반환]
  ↓
[category_mid 그룹화] → [category_rank 정렬] → [UI 표시]
```

### 시술 목록
```
[사용자 선택]
  ↓
[필터 조건] → [Supabase 쿼리]
  ↓
[페이지네이션] → [UI 표시]
```

### K-뷰티 랭킹
```
[전체 시술 로드]
  ↓
[키워드 필터링] → [점수 계산] → [정렬]
  ↓
[UI 표시]
```

---

## 🎯 요약

1. **일정 맞춤 추천**: `category_mid_key`로 그룹화, 백엔드 집계
2. **카테고리 랭킹**: `category_mid`/`category_small`로 그룹화, 백엔드 집계 (v2)
3. **시술 목록**: 그룹화 없음, 프론트 필터링
4. **K-뷰티 랭킹**: 그룹화 없음, 프론트 필터링 + 점수 계산

모든 페이지에서 **언어별 데이터**는 `v_treatment_i18n_v2`에서 가져오며, **로직/그룹핑**은 `category_mid_key`(한글 고정)를 사용합니다.




