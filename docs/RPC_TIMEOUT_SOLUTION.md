# RPC 타임아웃 문제 해결 가이드

## 문제 상황
`rpc_home_schedule_recommendations` 함수가 타임아웃되어 빈 배열을 반환하는 문제가 발생하고 있습니다.

## 프론트엔드에서 해야 할 일

### 1. 에러 로깅 개선 (완료)
- 에러 객체가 빈 객체 `{}`로 나오는 문제 해결
- 에러 메시지, 코드, 상세 정보를 명확히 로깅

### 2. 타임아웃 시 재시도 로직 (완료)
- 타임아웃 발생 시 더 작은 limit으로 자동 재시도
- 재시도 실패 시 빈 배열 반환

### 3. 추가 개선 사항
- 타임아웃이 계속 발생하면 사용자에게 알림 표시
- 로딩 상태가 제대로 해제되는지 확인

## 백엔드에서 해야 할 일

### 1. 인덱스 추가 (필수)

다음 인덱스들을 Supabase SQL Editor에서 실행하세요:

```sql
-- treatment_master 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_treatment_master_category_large 
  ON public.treatment_master(category_large);

CREATE INDEX IF NOT EXISTS idx_treatment_master_category_mid 
  ON public.treatment_master(category_mid);

CREATE INDEX IF NOT EXISTS idx_treatment_master_rating_review 
  ON public.treatment_master(rating DESC, review_count DESC);

-- category_treattime_recovery 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ctr_category_mid 
  ON public.category_treattime_recovery(category_mid);

-- treatment_master_en/cn/jp 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_treatment_master_en_treatment_id 
  ON public.treatment_master_en(treatment_id);

CREATE INDEX IF NOT EXISTS idx_treatment_master_cn_treatment_id 
  ON public.treatment_master_cn(treatment_id);

CREATE INDEX IF NOT EXISTS idx_treatment_master_jp_treatment_id 
  ON public.treatment_master_jp(treatment_id);
```

### 2. RPC 함수 쿼리 최적화

현재 쿼리의 문제점:
- 여러 LEFT JOIN으로 인한 성능 저하
- 복잡한 CASE 문으로 인한 계산 부하
- 윈도우 함수(row_number) 사용으로 인한 메모리 사용량 증가

**최적화 방안:**

```sql
-- 1. ctr_dedup CTE 최적화: 인덱스 활용
-- (인덱스 추가 후 자동으로 최적화됨)

-- 2. base CTE 최적화: 필요한 컬럼만 선택
-- 현재는 모든 컬럼을 가져오는데, 필요한 컬럼만 선택하도록 수정

-- 3. ranked CTE 최적화: LIMIT을 먼저 적용
-- 전체 데이터를 정렬하기 전에 필터링을 먼저 수행
```

### 3. 타임아웃 시간 증가

Supabase 대시보드에서:
1. **Settings** > **Database** > **Connection Pooling** 이동
2. **Statement Timeout** 설정 확인 (기본값: 60초)
3. 필요시 타임아웃 시간 증가 (예: 120초 또는 180초)

또는 함수 레벨에서 타임아웃 설정:

```sql
-- 함수 실행 시간 제한 설정 (PostgreSQL 14+)
ALTER FUNCTION public.rpc_home_schedule_recommendations
  SET statement_timeout = '120s';
```

### 4. 쿼리 실행 계획 확인

Supabase SQL Editor에서 실행 계획 확인:

```sql
EXPLAIN ANALYZE
SELECT * FROM rpc_home_schedule_recommendations(
  '2025-12-24'::date,
  '2025-12-31'::date,
  null,
  null,
  3,
  5
);
```

실행 계획에서:
- **Seq Scan** (순차 스캔)이 많이 보이면 인덱스 추가 필요
- **Nested Loop**이 많으면 JOIN 최적화 필요
- 실행 시간이 긴 부분을 확인하여 최적화

## 우선순위

### 즉시 실행 (High Priority)
1. ✅ 프론트엔드: 에러 로깅 개선 (완료)
2. ✅ 프론트엔드: 타임아웃 시 재시도 로직 (완료)
3. 🔴 백엔드: 인덱스 추가 (필수)
4. 🔴 백엔드: 타임아웃 시간 증가

### 중기 개선 (Medium Priority)
5. 백엔드: 쿼리 최적화
6. 백엔드: 실행 계획 분석 및 최적화

### 장기 개선 (Low Priority)
7. 백엔드: 데이터 파티셔닝 고려
8. 백엔드: 캐싱 전략 도입

## 테스트 방법

1. 인덱스 추가 후:
   ```sql
   -- 실행 시간 측정
   \timing on
   SELECT * FROM rpc_home_schedule_recommendations(
     '2025-12-24'::date,
     '2025-12-31'::date,
     null,
     null,
     3,
     5
   );
   ```

2. 프론트엔드에서:
   - 개발자 도구 > Network 탭에서 RPC 호출 시간 확인
   - 타임아웃 발생 여부 확인
   - 재시도 로직 작동 여부 확인

## 참고사항

- Supabase의 기본 statement timeout은 60초입니다
- 복잡한 쿼리는 타임아웃이 발생하기 쉽습니다
- 인덱스 추가는 즉각적인 효과를 볼 수 있습니다
- 쿼리 최적화는 실행 계획 분석 후 진행하는 것이 좋습니다

