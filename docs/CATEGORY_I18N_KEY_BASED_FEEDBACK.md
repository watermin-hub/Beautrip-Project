# 📝 카테고리 i18n & Key 기반 구조 - 피드백 및 개선 제안

## ✅ 전반적인 평가

문서가 매우 잘 정리되어 있습니다! Key 기반 구조로 전환하는 것은 **정확한 방향**입니다. 다만, 실제 코드베이스를 확인한 결과 몇 가지 개선이 필요한 부분이 있습니다.

---

## 🔍 발견된 문제점

### 1. 하드코딩된 카테고리 비교 (긴급 수정 필요)

**위치:** `lib/api/beautripApi.ts`

```typescript
// ❌ 문제 코드 (2613줄)
if (t.category_mid === "피부관리") {
  console.log(...);
}

// ❌ 문제 코드 (2728줄)
(t) => t.category_mid === "피부관리"
```

**문제:**
- 언어 변경 시 "피부관리"라는 한글 label이 다른 언어에서는 존재하지 않음
- 필터링/조건 분기가 깨질 수 있음

**해결 방안:**
```typescript
// ✅ 수정 후
if (t.category_mid_key === "skin_care") {
  console.log(...);
}

(t) => t.category_mid_key === "skin_care"
```

---

### 2. CATEGORY_MAPPING 하드코딩 (제거 필요)

**위치:** `lib/api/beautripApi.ts` (2561줄, 525줄, 2603줄)

```typescript
// ❌ 현재 코드
export const CATEGORY_MAPPING: Record<string, string[]> = {
  눈성형: ["눈", "눈성형"],
  리프팅: ["리프팅", "윤곽", "볼륨"],
  // ...
};
```

**문제:**
- 한글 label 기반 매핑으로 언어 변경 시 깨짐
- DB의 `category_i18n`이 Single Source of Truth인데, 프론트에 중복 매핑 존재

**해결 방안:**
1. **단기:** `category_i18n` 테이블에서 동적으로 매핑 로드
2. **장기:** `category_large_key` 기준으로 직접 필터링

```typescript
// ✅ 개선 예시
async function getCategoryMappingFromDb(language: LanguageCode) {
  const client = getSupabaseOrNull();
  if (!client) return {};
  
  const { data } = await client
    .from('category_i18n')
    .select('category_large_key, category_large')
    .eq('lang', language === 'KR' ? null : getDbLangCode(language));
  
  // key -> label 매핑 생성
  return data?.reduce((acc, row) => {
    acc[row.category_large_key] = row.category_large;
    return acc;
  }, {}) || {};
}
```

---

### 3. MAIN_CATEGORIES 하드코딩 (개선 필요)

**위치:** `components/CategoryRankingPage.tsx` (36줄)

```typescript
// ❌ 현재 코드
const MAIN_CATEGORIES = [
  { id: null, name: "전체" },
  { id: "리프팅", name: "리프팅" },
  { id: "보톡스", name: "보톡스" },
  // ...
];
```

**문제:**
- 한글 label 하드코딩
- 언어 변경 시 탭 이름이 바뀌지 않음

**해결 방안:**
```typescript
// ✅ 개선 예시
async function getMainCategories(language: LanguageCode) {
  const client = getSupabaseOrNull();
  if (!client) return [];
  
  const dbLang = getCurrentLanguageForDb(language);
  const { data } = await client
    .from('category_i18n')
    .select('category_large_key, category_large')
    .eq('lang', dbLang || 'KR')
    .order('category_large_key');
  
  return [
    { id: null, nameKey: 'category.all', name: t('category.all') },
    ...(data?.map(row => ({
      id: row.category_large_key, // ✅ key 사용
      nameKey: row.category_large_key,
      name: row.category_large, // ✅ 언어별 label
    })) || [])
  ];
}
```

---

### 4. category_mid 직접 사용 (일부 개선됨, 추가 확인 필요)

**위치:** `components/CategoryRankingPage.tsx` (317줄)

```typescript
// ⚠️ 확인 필요
midCategorySet.add(ranking.category_mid);
```

**현재 상태:**
- 소분류 랭킹에서는 이미 `category_small_key`로 그룹화하고 있음 (373줄) ✅
- 중분류 랭킹도 확인 필요

**권장:**
```typescript
// ✅ key 기준으로 변경
midCategorySet.add(ranking.category_mid_key);
```

---

## 💡 개선 제안

### 1. Key 기반 필터링 헬퍼 함수 추가

```typescript
// lib/api/categoryHelpers.ts
export async function filterByCategoryKey(
  treatments: Treatment[],
  categoryLargeKey?: string | null,
  categoryMidKey?: string | null,
  categorySmallKey?: string | null
): Promise<Treatment[]> {
  return treatments.filter(t => {
    if (categoryLargeKey && t.category_large_key !== categoryLargeKey) {
      return false;
    }
    if (categoryMidKey && t.category_mid_key !== categoryMidKey) {
      return false;
    }
    if (categorySmallKey && t.category_small_key !== categorySmallKey) {
      return false;
    }
    return true;
  });
}
```

### 2. 카테고리 i18n 조회 헬퍼 함수

```typescript
// lib/api/categoryHelpers.ts
export async function getCategoryLabels(
  keys: string[],
  language: LanguageCode,
  level: 'large' | 'mid' | 'small'
): Promise<Record<string, string>> {
  const client = getSupabaseOrNull();
  if (!client) return {};
  
  const dbLang = getCurrentLanguageForDb(language);
  const keyColumn = `category_${level}_key`;
  const labelColumn = `category_${level}`;
  
  const { data } = await client
    .from('category_i18n')
    .select(`${keyColumn}, ${labelColumn}`)
    .in(keyColumn, keys)
    .eq('lang', dbLang || 'KR');
  
  return data?.reduce((acc, row) => {
    acc[row[keyColumn]] = row[labelColumn];
    return acc;
  }, {}) || {};
}
```

### 3. 마이그레이션 체크리스트

#### Phase 1: 긴급 수정 (즉시)
- [ ] `category_mid === "피부관리"` → `category_mid_key === "skin_care"` 변경
- [ ] 모든 하드코딩된 카테고리 비교를 key 기반으로 변경

#### Phase 2: CATEGORY_MAPPING 제거
- [ ] `category_i18n`에서 동적 매핑 로드 함수 구현
- [ ] `CATEGORY_MAPPING` 사용처 모두 찾아서 제거
- [ ] 테스트: 언어 변경 시 필터링 정상 동작 확인

#### Phase 3: MAIN_CATEGORIES 동적 로드
- [ ] `getMainCategories()` 함수를 DB 기반으로 변경
- [ ] 언어 변경 시 탭 이름 자동 업데이트 확인

#### Phase 4: 전체 검증
- [ ] 모든 카테고리 관련 로직이 key 기준인지 확인
- [ ] 언어 변경 시나리오 테스트
- [ ] undefined/NaN 체크

---

## 🎯 우선순위

1. **긴급 (즉시 수정):** 하드코딩된 카테고리 비교 (피부관리 등)
2. **높음 (이번 주):** CATEGORY_MAPPING 제거 및 동적 로드
3. **중간 (다음 주):** MAIN_CATEGORIES 동적 로드
4. **낮음 (선택):** category_treattime_recovery key 기반 전환

---

## ✅ 잘 된 부분

1. **소분류 랭킹 그룹화:** 이미 `category_small_key` 기준으로 잘 구현됨 ✅
2. **RPC 결과 처리:** flat row를 key 기준으로 그룹화하는 패턴이 명확함 ✅
3. **문서화:** 설계 원칙과 구조가 명확하게 정리됨 ✅

---

## 📌 추가 고려사항

### 1. 성능 최적화
- `category_i18n` 조회를 캐싱할지 고려
- 언어 변경 시에만 재조회하도록 최적화

### 2. Fallback 전략
- key가 없는 레거시 데이터 처리 방안
- 언어별 label이 없을 때 기본 언어(KR) 사용

### 3. 타입 안정성
- TypeScript 타입 정의에 key 필드 필수화
- Optional chaining으로 안전하게 처리

---

## 🎉 결론

**전체적으로 매우 잘 설계된 구조입니다!**  
다만 실제 코드에서 몇 가지 하드코딩이 남아있어서, 이를 key 기반으로 전환하면 완벽해질 것 같습니다.

**다음 단계:**
1. 긴급 수정사항부터 처리
2. 단계적으로 하드코딩 제거
3. 테스트를 통해 검증





