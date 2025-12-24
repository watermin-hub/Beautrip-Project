# 🎯 카테고리 Key 기반 설계 - Cursor 이해도 분석

## ✅ 사용자님 제안 설계 요약

**핵심 원칙: "조인 키를 언어에 독립적인 값으로 고정"**

### 1. Key vs Label 분리
- **Key**: 영구 고정 ID (언어 독립적)
  - `category_large_key`, `category_mid_key`, `category_small_key`
- **Label**: 번역 텍스트 (언어별)
  - `category_large`, `category_mid`, `category_small`

### 2. 테이블 선택 레이어
```typescript
getTreatmentTable(lang) -> 'treatment_master_en' | 'treatment_master_jp' | ...
getHospitalTable(lang) -> ...
```

### 3. 공통 키 컬럼 (모든 언어별 테이블에 필수)
- `treatment_id` (PK)
- `hospital_id` (고정 조인키)
- `category_large_key`, `category_mid_key`, `category_small_key` ← 핵심
- 정렬/랭킹용 숫자 컬럼 (rating, review_count 등)

## 📊 현재 코드베이스 상태

### ✅ 이미 구현된 부분

1. **`category_mid_key` 사용 중**
   ```typescript
   // lib/api/beautripApi.ts
   category_mid_key?: string; // 중분류 키 (로직/그룹핑용, 한글 고정) ⚠️ 핵심
   ```

2. **테이블 선택 함수 존재**
   ```typescript
   // lib/api/beautripApi.ts:89
   export function getTreatmentTableName(language?: LanguageCode): string {
     // 한국어: treatment_master
     // 다른 언어: v_treatment_i18n
   }
   ```

3. **RPC에서 key 사용**
   ```typescript
   // 백엔드 RPC 반환 컬럼
   category_mid_key, category_mid, treatment_id, ...
   ```

### ❌ 개선 필요한 부분

1. **`category_large_key`, `category_small_key` 일관성 없음**
   - `category_mid_key`는 있지만
   - `category_large_key`, `category_small_key`는 명시적으로 사용되지 않음

2. **카테고리 매핑이 하드코딩**
   ```typescript
   // lib/api/beautripApi.ts:2561
   export const CATEGORY_MAPPING: Record<string, string[]> = {
     "눈성형": ["눈성형", "Eye Surgery", "眼部整形"],
     // ...
   };
   ```
   → DB 테이블(`category_i18n`)로 옮겨야 함

3. **조인 시 label 사용**
   ```typescript
   // docs/SUPABASE_TABLE_RELATIONS.md
   // treatment_master.category_mid = category_treattime_recovery.중분류
   ```
   → key로 조인해야 함

## 🎯 사용자님 설계가 Cursor에게 이해하기 쉬운 이유

### 1. 명확한 규칙
```
✅ Key = 조인용 (언어 독립적)
✅ Label = 표시용 (언어별)
```
→ Cursor가 코드 작성 시 혼동 없음

### 2. 일관된 패턴
```typescript
// 모든 조인에서 동일 패턴
WHERE category_mid_key = 'skin_booster'
// 언어가 바뀌어도 key는 동일
```

### 3. 테이블 선택 함수 중앙화
```typescript
// 한 곳에서 관리
lib/db/tables.ts
  getTreatmentTable(lang)
  getHospitalTable(lang)
  getCategoryTable(lang)
```
→ Cursor가 테이블명을 하드코딩하지 않음

### 4. 타입 안정성
```typescript
interface Treatment {
  treatment_id: number;
  category_mid_key: string;  // ✅ 항상 key 사용
  category_mid?: string;     // ✅ label은 선택적
}
```

## 🔧 Cursor가 이해하기 쉬운 파일 구조 제안

### 현재 구조
```
lib/api/beautripApi.ts (7524줄) ← 너무 큼
```

### 제안 구조 (사용자님 방식)
```
lib/db/
  tables.ts              # 언어→테이블명 매핑
  keys.ts                # Key 상수 정의
lib/db/queries/
  ranking.ts             # 랭킹 쿼리
  treatments.ts          # 시술 쿼리
  hospitals.ts           # 병원 쿼리
lib/i18n/
  lang.ts                # 언어 정규화
  category.ts            # 카테고리 번역
```

## ✅ Cursor 이해도 체크리스트

### 1. Key 중심 설계
- [x] `category_mid_key` 사용 중
- [ ] `category_large_key` 추가 필요
- [ ] `category_small_key` 추가 필요
- [ ] 모든 조인을 key로 변경

### 2. 테이블 선택 레이어
- [x] `getTreatmentTableName()` 존재
- [ ] `getHospitalTableName()` 추가 필요
- [ ] `getCategoryTableName()` 추가 필요
- [ ] 중앙화된 `lib/db/tables.ts` 생성

### 3. 카테고리 i18n 테이블
- [ ] `category_i18n` 테이블 생성
- [ ] 하드코딩된 `CATEGORY_MAPPING` 제거
- [ ] DB에서 카테고리 번역 조회

### 4. 조인 규칙
- [ ] 모든 조인을 key로 변경
- [ ] label은 표시용으로만 사용
- [ ] RPC 함수도 key 기반으로 수정

## 🎉 결론

**사용자님 설계가 Cursor에게 이해하기 쉬운 이유:**

1. ✅ **명확한 규칙**: Key vs Label 분리
2. ✅ **일관된 패턴**: 모든 조인에서 key 사용
3. ✅ **중앙화**: 테이블 선택 함수 한 곳에서 관리
4. ✅ **타입 안정성**: Key는 항상 동일 타입

**현재 코드베이스는 50% 구현됨:**
- ✅ `category_mid_key` 사용 중
- ✅ `getTreatmentTableName()` 존재
- ❌ `category_large_key`, `category_small_key` 필요
- ❌ 카테고리 i18n 테이블 필요
- ❌ 모든 조인을 key로 변경 필요

**이 설계대로 진행하면 Cursor가 코드 작성 시 혼동 없이 일관되게 작업할 수 있습니다!**



