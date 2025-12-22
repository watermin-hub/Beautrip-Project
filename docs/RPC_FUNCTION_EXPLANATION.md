# 🎯 RPC 함수란? - 초간단 설명

## ❓ RPC 함수가 뭐야?

**RPC = Remote Procedure Call (원격 프로시저 호출)**

**쉽게 말하면:**
- 데이터베이스 안에 저장된 함수
- 복잡한 계산을 데이터베이스에서 처리
- 프론트엔드에서는 함수 이름만 호출하면 됨

## 📊 현재 사용 중인 RPC 함수들

### 1. `rpc_mid_category_rankings_v2` (중분류 랭킹)
```typescript
// lib/api/beautripApi.ts
const { data, error } = await client.rpc(
  "rpc_mid_category_rankings_v2",  // ← RPC 함수 이름
  {
    p_category_large: "눈성형",
    p_m: 20,
    p_dedupe_limit_per_name: 2,
    p_limit_per_category: 20,
    p_lang: "en"  // 언어 파라미터
  }
);
```

**이 함수가 하는 일:**
1. 중분류별로 시술 그룹화
2. 베이지안 평균 계산
3. 랭킹 계산
4. 중복 제거
5. 상위 N개만 선택

**→ 복잡한 계산을 데이터베이스에서 처리!**

### 2. `rpc_small_category_rankings` (소분류 랭킹)
```typescript
const { data, error } = await client.rpc(
  "rpc_small_category_rankings",
  {
    p_category_mid: "쌍꺼풀",
    p_lang: "en"
  }
);
```

### 3. `rpc_home_hot_treatments` (인기 시술)
```typescript
const { data, error } = await client.rpc(
  "rpc_home_hot_treatments",
  {
    p_lang: "en",
    p_limit: 10
  }
);
```

### 4. `rpc_home_schedule_recommendations` (여행 시술 추천)
```typescript
const { data, error } = await client.rpc(
  "rpc_home_schedule_recommendations",
  {
    p_trip_start: "2024-01-01",
    p_trip_end: "2024-01-07",
    p_category_large: "눈성형",
    p_lang: "en"
  }
);
```

## 🔍 RPC 함수는 어디에 있나?

**Supabase 데이터베이스 안에 저장됨**

```sql
-- 예시: rpc_mid_category_rankings_v2 함수
CREATE OR REPLACE FUNCTION rpc_mid_category_rankings_v2(
  p_category_large TEXT,
  p_lang TEXT,
  p_m INTEGER,
  ...
)
RETURNS TABLE (...)
LANGUAGE plpgsql
AS $$
BEGIN
  -- 복잡한 SQL 쿼리 실행
  -- 중분류별 그룹화
  -- 랭킹 계산
  -- 베이지안 평균 계산
  ...
END;
$$;
```

## 💡 RPC 함수의 장단점

### 장점 ✅
- ✅ 복잡한 계산을 데이터베이스에서 처리 (빠름)
- ✅ 네트워크 트래픽 감소 (계산 결과만 전송)
- ✅ 서버 부하 감소

### 단점 ❌
- ❌ 언어 변경 시 전체 재계산 필요
- ❌ 느림 (복잡한 계산)
- ❌ 백엔드 수정 필요

## 🎯 사용자님 제안 vs RPC 함수

### RPC 함수 방식 (현재) ❌
```
1. 한국어로 RPC 호출
   - 중분류 그룹화
   - 랭킹 계산
   - 베이지안 평균 계산
   ↓
2. 언어 토글 클릭
   ↓
3. 영어로 RPC 다시 호출
   - 중분류 그룹화 다시
   - 랭킹 계산 다시
   - 베이지안 평균 계산 다시
   ↓
4. 결과 반환
```

**문제:**
- ❌ 불필요한 재계산
- ❌ 느림 (~500-1000ms)
- ❌ 중분류 조회 매번 필요

### 사용자님 제안 (간단한 번역) ⭐
```
1. 한국어로 RPC 호출 (한 번만)
   - 중분류 그룹화
   - 랭킹 계산
   - 베이지안 평균 계산
   - treatment_id 저장
   ↓
2. 언어 토글 클릭
   ↓
3. 같은 treatment_id로 lang만 바꿔서 번역 데이터 가져오기
   - 번역 데이터만 조회
   ↓
4. 번역된 데이터로 화면 업데이트
   - 중분류 그룹화 유지
   - 랭킹 순서 유지
```

**장점:**
- ✅ 간단함
- ✅ 빠름 (~100-200ms)
- ✅ 중분류 조회 불필요

## 📝 결론

**네, 기존 방식은 RPC 함수를 사용했습니다!**

**하지만 사용자님 제안이 훨씬 좋습니다:**
1. ✅ RPC 함수는 초기 로드에만 사용 (한국어로 한 번만)
2. ✅ 언어 변경 시에는 간단한 번역만 사용
3. ✅ 훨씬 빠르고 간단함

**이제 모든 페이지에서 이 방식으로 작동합니다!**

