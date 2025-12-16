# 랜덤 정렬 기능 요구사항 (백엔드)

## 📋 요구사항 개요

**목표**: "늘 비슷한 것만 나오지 않는 느낌"을 주기 위한 랜덤성 제공
- 완전 랜덤이 아닌, 세션/날짜 단위로 다른 순서를 보여주는 것
- 서버 부담 최소화
- Vercel 서버리스 환경 고려 (메모리 제한, 타임아웃)

## 🎯 현재 문제점

1. **현재 구현**: 전체 데이터를 로드 후 클라이언트에서 랜덤 정렬
   - 초기 로딩 시간 증가
   - 클라이언트 메모리 사용량 증가
   - 필터가 없을 때 15,000개+ 데이터 로드

2. **사용자 요구사항**: 
   - "정말 랜덤" ❌
   - "늘 비슷한 것만 나오지 않는 느낌" ⭕️

## 💡 제안 솔루션

### 방법 1: Supabase RPC 함수 (추천)

**PostgreSQL 함수 생성**:
```sql
-- treatment_master 테이블용
CREATE OR REPLACE FUNCTION get_treatments_random(
  p_seed INTEGER,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT NULL,
  p_category_large TEXT DEFAULT NULL,
  p_category_mid TEXT DEFAULT NULL
)
RETURNS TABLE (
  -- treatment_master의 모든 컬럼 반환
  treatment_id INTEGER,
  treatment_name TEXT,
  hospital_name TEXT,
  category_large TEXT,
  category_mid TEXT,
  -- ... 기타 컬럼들
) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM treatment_master
  WHERE 
    (p_search_term IS NULL OR 
     treatment_name ILIKE '%' || p_search_term || '%' OR
     hospital_name ILIKE '%' || p_search_term || '%' OR
     treatment_hashtags ILIKE '%' || p_search_term || '%')
    AND (p_category_large IS NULL OR category_large ILIKE '%' || p_category_large || '%')
    AND (p_category_mid IS NULL OR category_mid = p_category_mid)
  ORDER BY (treatment_id % p_seed), treatment_id
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- hospital_master 테이블용도 동일하게 생성
```

**클라이언트에서 호출**:
```typescript
// 세션/날짜 기반 seed 생성
const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // 날짜 기반
// 또는
const seed = sessionStorage.getItem('randomSeed') || Math.floor(Math.random() * 10000);
sessionStorage.setItem('randomSeed', seed.toString());

// RPC 호출
const { data, error } = await supabase.rpc('get_treatments_random', {
  p_seed: seed,
  p_limit: 10,
  p_offset: (page - 1) * 10,
  p_search_term: searchTerm || null,
  p_category_large: categoryLarge || null,
  p_category_mid: categoryMid || null
});
```

**장점**:
- ✅ 서버에서 효율적으로 처리
- ✅ 페이지네이션 지원
- ✅ 필터링 지원
- ✅ 메모리 사용량 최소

**단점**:
- ⚠️ RPC 함수 생성 필요
- ⚠️ 테이블 구조 변경 시 함수도 수정 필요

---

### 방법 2: 클라이언트에서 제한적 랜덤 (대안)

**로직**:
1. Supabase에서 필터링된 데이터를 **제한된 개수만** 로드 (예: 200개)
2. 클라이언트에서 해당 데이터만 셔플
3. 페이지네이션은 셔플된 데이터에서 처리

```typescript
// 최대 200개만 로드
const result = await query.limit(200);
const shuffled = shuffleArray(result.data);
const paginated = shuffled.slice((page - 1) * pageSize, page * pageSize);
```

**장점**:
- ✅ RPC 함수 불필요
- ✅ 구현 간단
- ✅ 필터가 있을 때는 더 적은 데이터만 로드

**단점**:
- ⚠️ 필터가 없을 때도 200개 제한
- ⚠️ 페이지네이션이 200개를 넘어가면 반복되는 데이터

---

## 📝 백엔드 개발자에게 전달할 내용

### 요구사항

1. **Supabase RPC 함수 생성** (방법 1 추천)
   - `get_treatments_random`: 시술 데이터용
   - `get_hospitals_random`: 병원 데이터용
   - 파라미터: seed, limit, offset, 필터 옵션들
   - 반환: 필터링 + 랜덤 정렬된 데이터

2. **Seed 생성 로직**
   - 클라이언트에서 세션/날짜 기반 seed 생성
   - 같은 seed면 같은 순서 (일관성)
   - 다른 seed면 다른 순서 (다양성)

3. **성능 고려사항**
   - 인덱스 활용 가능한지 확인
   - 필터 조건에 따른 쿼리 최적화
   - 페이지네이션 효율성

### 질문 사항

1. **RPC 함수 생성이 가능한가?**
   - Supabase 대시보드에서 SQL Editor 사용 가능한지
   - 또는 백엔드에서 직접 함수 생성 가능한지

2. **대안 제안**
   - RPC 함수가 어렵다면 다른 방법 제안 가능한지
   - 예: PostgreSQL의 `ORDER BY RANDOM()` 사용 (성능 이슈 있을 수 있음)

3. **테이블 구조 확인**
   - `treatment_master`, `hospital_master` 테이블의 정확한 컬럼명
   - Primary key가 `treatment_id`, `hospital_id`인지 확인

---

## 🔄 구현 우선순위

1. **1순위**: RPC 함수 방식 (방법 1)
   - 가장 효율적이고 확장 가능
   
2. **2순위**: 제한적 랜덤 (방법 2)
   - RPC 함수가 어렵다면 임시 방안

3. **3순위**: 현재 방식 유지
   - 성능 이슈가 크지 않다면 유지 가능

---

## 📞 연락처

질문이나 제안사항이 있으면 알려주세요!

