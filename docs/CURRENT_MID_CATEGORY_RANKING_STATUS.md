# 현재 중분류 랭킹 동작 상태 확인

## 🔍 현재 프론트엔드 로직

프론트엔드는 **하위 호환성**을 고려하여 두 가지 경우를 모두 처리합니다:

### 1. 백엔드에서 집계 필드를 제공하는 경우
```typescript
// 6691-6695줄: 백엔드에서 받아오기 시도
category_rank: item.category_rank || 0,
category_score: item.category_score || 0,
average_rating: item.average_rating || 0,
total_reviews: item.total_reviews || 0,
treatment_count: item.treatment_count || 0,
```

### 2. 백엔드에서 집계 필드를 제공하지 않는 경우
```typescript
// 6720-6736줄: 없으면 계산
const categoryRank = group.category_rank || 0;
const categoryScore = group.category_score || 0;
const averageRating = group.average_rating || 
  (group.treatments.reduce(...) / group.treatments.length || 0);  // 계산
const totalReviews = group.total_reviews || 
  group.treatments.reduce(...);  // 계산
const category_score = categoryScore || (averageRating * totalReviews);  // 계산
```

### 3. 정렬 로직
```typescript
// 6741-6751줄
if (processedData.some((r) => r.category_rank > 0)) {
  // ✅ 백엔드에서 category_rank를 제공하는 경우
  processedData.sort((a, b) => (a.category_rank || 0) - (b.category_rank || 0));
} else {
  // ❌ 백엔드에서 category_rank를 제공하지 않는 경우
  processedData.sort((a, b) => (b.category_score || 0) - (a.category_score || 0));
  processedData.forEach((r, index) => {
    r.category_rank = index + 1;  // 프론트에서 랭킹 할당
  });
}
```

---

## 🎯 현재 상태 확인 방법

### 방법 1: 브라우저 콘솔 확인

개발자 도구 콘솔에서 다음 로그를 확인:

```javascript
// RPC 반환 데이터 샘플 로그 확인
// 6654-6661줄에서 출력되는 로그
console.log("🔍 [RPC 반환 데이터 샘플]:", {
  keys: Object.keys(data[0]),  // 여기에 category_rank가 있는지 확인
  sample: data[0],
});
```

**확인 포인트:**
- `keys` 배열에 `category_rank`, `category_score`, `average_rating`, `total_reviews`가 있는가?
- `sample` 객체에 이 값들이 실제로 들어있는가?

### 방법 2: 네트워크 탭 확인

1. 개발자 도구 → Network 탭
2. `rpc_mid_category_rankings_i18n` 호출 찾기
3. Response 데이터 확인
4. 집계 필드가 포함되어 있는지 확인

### 방법 3: 코드에 임시 로그 추가

```typescript
// 6680줄 근처에 추가
cleanedData.forEach((item: any) => {
  // 첫 번째 아이템만 로그
  if (cleanedData.indexOf(item) === 0) {
    console.log("🔍 [백엔드 반환 데이터 확인]:", {
      hasCategoryRank: 'category_rank' in item,
      hasCategoryScore: 'category_score' in item,
      hasAverageRating: 'average_rating' in item,
      hasTotalReviews: 'total_reviews' in item,
      categoryRank: item.category_rank,
      categoryScore: item.category_score,
      allKeys: Object.keys(item),
    });
  }
  // ...
});
```

---

## 📊 예상되는 두 가지 시나리오

### 시나리오 A: 백엔드 함수가 아직 수정되지 않은 경우

**백엔드 반환:**
```json
{
  "category_mid_key": "피부관리",
  "category_mid": "피부관리",
  "treatment_id": 123,
  // ... 집계 필드 없음
}
```

**프론트엔드 처리:**
1. `item.category_rank` → `undefined` → `0` 사용
2. `item.category_score` → `undefined` → `0` 사용
3. 프론트엔드에서 계산:
   - `average_rating` = 시술들의 평점 평균 계산
   - `total_reviews` = 시술들의 리뷰 수 합계 계산
   - `category_score` = `average_rating × total_reviews` 계산
4. `category_score` 기준으로 정렬
5. 정렬 후 `category_rank` = 1, 2, 3... 할당

**결과:** ✅ 랭킹 순서로 정렬됨 (프론트에서 처리)

---

### 시나리오 B: 백엔드 함수가 수정된 경우

**백엔드 반환:**
```json
{
  "category_rank": 1,
  "category_score": 450.5,
  "average_rating": 4.5,
  "total_reviews": 100,
  "treatment_count": 20,
  "category_mid_key": "피부관리",
  "category_mid": "피부관리",
  "treatment_id": 123,
  // ...
}
```

**프론트엔드 처리:**
1. `item.category_rank` → `1` 사용 ✅
2. `item.category_score` → `450.5` 사용 ✅
3. `item.average_rating` → `4.5` 사용 ✅
4. `item.total_reviews` → `100` 사용 ✅
5. 계산 불필요 (백엔드 값 그대로 사용)
6. `category_rank` 기준으로 정렬

**결과:** ✅ 랭킹 순서로 정렬됨 (백엔드에서 처리)

---

## 🔍 현재 어떤 시나리오인지 확인하는 방법

### 가장 간단한 방법: 콘솔 로그 확인

현재 코드에 이미 로그가 있습니다 (6654-6661줄):

```typescript
if (data.length > 0) {
  console.log("🔍 [RPC 반환 데이터 샘플]:", {
    keys: Object.keys(data[0]),
    sample: data[0],
  });
}
```

**확인:**
- 브라우저 콘솔에서 이 로그를 찾아보세요
- `keys`에 `category_rank`가 있으면 → **백엔드 수정됨** ✅
- `keys`에 `category_rank`가 없으면 → **백엔드 아직 수정 안 됨** ❌

---

## 💡 결론

**현재 프론트엔드는 두 경우를 모두 처리합니다:**

1. **백엔드가 집계 필드를 제공하면** → 백엔드 값 사용
2. **백엔드가 집계 필드를 제공하지 않으면** → 프론트에서 계산

**어느 쪽이든 랭킹 순서로 정렬됩니다!**

백엔드 함수가 수정되었는지 확인하려면:
- 브라우저 콘솔 로그 확인
- 또는 네트워크 탭에서 Response 확인

