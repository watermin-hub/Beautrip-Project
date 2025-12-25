# 랭킹 페이지 "#" 중분류 목록 출처 분석

## 📋 질문

**랭킹에 "#" 붙는 중분류들은 어디서 가져오는가?**
- 16,000개 다 뒤져서 가져오는 거 아니잖아
- 카테고리 토글맵 테이블인가?
- 리커버리 테이블인가?

---

## ✅ 답변

### **RPC 결과에서 동적으로 추출합니다!**

**16,000개를 다 뒤지지 않습니다.** 백엔드 RPC가 집계된 결과를 반환하고, 프론트엔드에서 그 결과에서 중분류 목록을 추출합니다.

---

## 🔍 데이터 흐름

### 1. **백엔드 RPC 호출**
```typescript
// lib/api/beautripApi.ts
const { data, error } = await client.rpc(
  "rpc_mid_category_rankings_v2",
  {
    p_category_large: "눈성형", // 또는 "전체"
    p_m: 20,
    p_dedupe_limit_per_name: 2,
    p_limit_per_category: 20,
    p_lang: "en" // 또는 null (한국어)
  }
);
```

**RPC가 반환하는 데이터:**
- `treatment_master` 또는 `v_treatment_i18n_v2`에서 필터링된 시술 데이터
- 각 row에 `category_mid` 포함
- **집계된 결과만 반환** (16,000개 전체가 아님!)

### 2. **프론트엔드에서 중분류 목록 추출**
```typescript
// components/CategoryRankingPage.tsx (line 500-518)
const midCategorySet = new Set<string>();
midGrouped.forEach((ranking) => {
  if (ranking.category_mid) {
    midCategorySet.add(ranking.category_mid);
  }
});

const sorted = Array.from(midCategorySet)
  .filter((name) => name && name.trim() !== "")
  .sort();

setMidCategoriesList(sorted);
```

### 3. **필터바에 "#" 붙여서 표시**
```typescript
// components/CategoryRankingPage.tsx (line 1705)
{midCategoriesList.map((midCategory) => (
  <button>
    #{midCategory}  {/* "#" 기호는 UI에서만 붙임 */}
  </button>
))}
```

---

## 📊 테이블별 역할

### ❌ **category_toggle_map 테이블**
- **사용 안 함** (중분류 목록 추출에)
- **용도**: `toggle_family`, `recovery_guide_id` 조회용
- **함수**: `getToggleFamilyByCategoryMid()`, `getRecoveryGuideIdByCategory()`

### ❌ **category_treattime_recovery 테이블**
- **사용 안 함** (중분류 목록 추출에)
- **용도**: 회복 기간 정보 조회용
- **함수**: `getRecoveryInfoByCategoryMid()`

### ✅ **treatment_master / v_treatment_i18n_v2 테이블**
- **사용함!** (RPC 내부에서)
- **용도**: 시술 데이터 조회 및 집계
- **RPC**: `rpc_mid_category_rankings_v2`가 이 테이블에서 데이터를 가져옴

---

## 🎯 핵심 포인트

### 1. **16,000개를 다 뒤지지 않음**
- RPC가 백엔드에서 **필터링 + 집계**를 수행
- 대분류 필터(`p_category_large`)가 있으면 해당 대분류만 조회
- 집계된 결과만 반환 (예: 각 중분류당 상위 20개 시술)

### 2. **중분류 목록은 RPC 결과에서 추출**
- RPC 반환 데이터의 `category_mid` 컬럼에서 추출
- Set으로 중복 제거 후 정렬
- **정적 테이블이 아닌 동적 추출**

### 3. **"#" 기호는 UI에서만 붙임**
- 데이터베이스에 "#" 저장 안 함
- 프론트엔드에서 표시할 때만 붙임
- `#{midCategory}` 형태로 렌더링

---

## 📈 예시

### 시나리오: "눈성형" 대분류 선택

1. **RPC 호출**
   ```sql
   -- 백엔드에서 실행 (예시)
   SELECT category_mid, treatment_id, ...
   FROM treatment_master
   WHERE category_large = '눈성형'
   -- 집계 및 정렬
   LIMIT 20 per category
   ```

2. **RPC 반환 데이터** (예시)
   ```json
   [
     { "category_mid": "쌍수", "treatment_id": 1, ... },
     { "category_mid": "쌍수", "treatment_id": 2, ... },
     { "category_mid": "상안검", "treatment_id": 3, ... },
     { "category_mid": "하안검", "treatment_id": 4, ... },
     ...
   ]
   ```

3. **프론트엔드 추출**
   ```typescript
   // category_mid만 추출
   ["쌍수", "상안검", "하안검", "눈밑지방제거", ...]
   ```

4. **UI 표시**
   ```
   #쌍수  #상안검  #하안검  #눈밑지방제거  ...
   ```

---

## 🔗 관련 코드 위치

### 프론트엔드
- **중분류 목록 추출**: `components/CategoryRankingPage.tsx` (line 500-518)
- **필터바 렌더링**: `components/CategoryRankingPage.tsx` (line 1691-1708)
- **RPC 호출**: `lib/api/beautripApi.ts` (line 5859-6183)

### 백엔드 (추정)
- **RPC 함수**: `rpc_mid_category_rankings_v2`
- **데이터 소스**: `treatment_master` 또는 `v_treatment_i18n_v2`

---

## 💡 요약

| 항목 | 답변 |
|------|------|
| **16,000개 다 뒤지는가?** | ❌ 아니요. RPC가 집계된 결과만 반환 |
| **카테고리 토글맵 테이블?** | ❌ 아니요. 중분류 목록 추출에 사용 안 함 |
| **리커버리 테이블?** | ❌ 아니요. 중분류 목록 추출에 사용 안 함 |
| **어디서 가져오는가?** | ✅ **RPC 결과에서 동적으로 추출** |
| **RPC는 어디서 가져오는가?** | ✅ `treatment_master` 또는 `v_treatment_i18n_v2` |

**결론: RPC 결과에서 `category_mid`를 추출하여 중복 제거 후 정렬하여 필터바에 표시합니다!**



