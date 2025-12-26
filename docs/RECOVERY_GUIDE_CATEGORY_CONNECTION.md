# 회복 가이드와 중분류 연결 구조

## 📋 질문

**회복 가이드랑 연결하는 중분류는 category_treattime_recovery 테이블에서 찾는 거 맞나?**

---

## ✅ 답변

### **아니요! 두 가지가 다릅니다:**

1. **회복 기간 정보** → `category_treattime_recovery` 테이블
2. **회복 가이드 ID** → `category_toggle_map` 테이블

---

## 🔍 상세 분석

### 1. **회복 기간 정보** (`category_treattime_recovery`)

**함수**: `getRecoveryInfoByCategoryMid()`

**용도**: 회복 기간, 시술 시간, 권장 체류일수 등 **수치 정보** 조회

**매칭 방식**:
```typescript
// lib/api/beautripApi.ts (line 841-1100)
export async function getRecoveryInfoByCategoryMid(
  categoryMid: string
): Promise<{
  recoveryMin: number;           // 회복기간_min
  recoveryMax: number;           // 회복기간_max
  procedureTimeMin: number;      // 시술시간_min
  procedureTimeMax: number;      // 시술시간_max
  recommendedStayDays: number;   // 권장체류일수
  recoveryGuides: Record<string, string | null>; // 회복 가이드 텍스트
} | null>
```

**테이블**: `category_treattime_recovery`
- **매칭 컬럼**: `중분류` (한국어)
- **매칭 방식**: `category_mid`와 `중분류` 컬럼 정확/부분 일치
- **반환 데이터**: 회복 기간 범위, 시술 시간 범위, 권장 체류일수

**사용 예시**:
```typescript
// 일정 기반 추천에서 사용
const recoveryInfo = await getRecoveryInfoByCategoryMid("쌍수");
// → { recoveryMin: 1, recoveryMax: 3, recommendedStayDays: 5, ... }
```

---

### 2. **회복 가이드 ID** (`category_toggle_map`)

**함수**: `getRecoveryGuideIdByCategory()`

**용도**: 회복 가이드 페이지의 **ID(slug)** 조회

**매칭 방식**:
```typescript
// lib/api/beautripApi.ts (line 4507-4547)
export async function getRecoveryGuideIdByCategory(
  categoryMid?: string,
  keyword?: string
): Promise<string | null> {
  const toggleMap = await loadCategoryToggleMap();
  
  // category_mid로 먼저 찾기
  if (categoryMid) {
    const matched = toggleMap.find(
      (item) =>
        item.category_mid?.toLowerCase().trim() ===
        categoryMid.toLowerCase().trim()
    );
    if (matched?.recovery_guide_id) {
      return matched.recovery_guide_id; // 예: "double-eyelid-recovery"
    }
  }
  
  // keyword로 찾기 (fallback)
  // ...
}
```

**테이블**: `category_toggle_map`
- **매칭 컬럼**: `category_mid` (한국어)
- **반환 데이터**: `recovery_guide_id` (회복 가이드 페이지 slug)
- **추가 필드**: `toggle_family`, `keyword`, `recovery_guide_keyword`

**사용 예시**:
```typescript
// 회복 가이드 페이지 링크 생성
const guideId = await getRecoveryGuideIdByCategory("쌍수");
// → "double-eyelid-recovery"
// → /recovery-guide/double-eyelid-recovery 로 이동
```

---

## 📊 테이블 비교

| 항목 | category_treattime_recovery | category_toggle_map |
|------|---------------------------|---------------------|
| **용도** | 회복 기간 정보 (수치) | 회복 가이드 ID (slug) |
| **매칭 컬럼** | `중분류` | `category_mid` |
| **반환 데이터** | recoveryMin, recoveryMax, recommendedStayDays | recovery_guide_id |
| **함수** | `getRecoveryInfoByCategoryMid()` | `getRecoveryGuideIdByCategory()` |
| **사용 위치** | 일정 기반 추천, 회복 기간 표시 | 회복 가이드 페이지 링크 |

---

## 🔗 데이터 흐름

### 시나리오: "쌍수" 중분류 선택

1. **회복 기간 정보 조회**
   ```typescript
   const recoveryInfo = await getRecoveryInfoByCategoryMid("쌍수");
   // category_treattime_recovery 테이블에서 조회
   // → { recoveryMin: 1, recoveryMax: 3, recommendedStayDays: 5 }
   ```

2. **회복 가이드 ID 조회**
   ```typescript
   const guideId = await getRecoveryGuideIdByCategory("쌍수");
   // category_toggle_map 테이블에서 조회
   // → "double-eyelid-recovery"
   ```

3. **UI 표시**
   ```typescript
   // 회복 기간 표시
   <div>회복 기간: {recoveryInfo.recoveryMin}~{recoveryInfo.recoveryMax}일</div>
   
   // 회복 가이드 링크
   <Link href={`/recovery-guide/${guideId}`}>
     회복 가이드 보기
   </Link>
   ```

---

## 🎯 핵심 포인트

### ✅ **회복 가이드 ID는 `category_toggle_map`에서 찾습니다!**

- `category_treattime_recovery`: 회복 기간 **수치 정보** (1일, 3일 등)
- `category_toggle_map`: 회복 가이드 **페이지 ID** (slug)

### 두 테이블 모두 `category_mid`로 매칭하지만 용도가 다릅니다:

1. **회복 기간 계산** → `category_treattime_recovery`
2. **회복 가이드 링크** → `category_toggle_map`

---

## 📝 요약

| 질문 | 답변 |
|------|------|
| **회복 가이드 ID는 어디서?** | ✅ `category_toggle_map` 테이블 |
| **회복 기간 정보는 어디서?** | ✅ `category_treattime_recovery` 테이블 |
| **둘 다 category_mid로 매칭?** | ✅ 네, 하지만 용도가 다릅니다 |

**결론: 회복 가이드 ID는 `category_toggle_map` 테이블에서 찾습니다!**





