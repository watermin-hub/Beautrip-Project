# 백엔드 쿼리문 vs 우리 코드 비교 리포트

## 📋 비교 결과 요약

### ✅ **일치하는 부분**

1. **테이블명**: `procedure_reviews`, `hospital_reviews`, `concern_posts` 모두 일치
2. **기본 컬럼 구조**: 대부분의 컬럼명과 타입이 일치
3. **인덱스**: 동일한 인덱스들이 생성됨
4. **트리거**: `updated_at` 자동 갱신 트리거 구조 동일

### ⚠️ **차이점 및 개선사항**

#### 1. **카테고리 CHECK 제약조건** (백엔드 추가)

- **백엔드 쿼리**: 카테고리 값에 CHECK 제약조건 추가
  - `procedure_reviews.category`: 10개 고정값만 허용
  - `hospital_reviews.category_large`: 10개 고정값만 허용
  - `concern_posts.concern_category`: 7개 고정값만 허용
- **우리 코드**: CHECK 제약조건 없음 (프론트엔드에서만 검증)
- **영향**: 백엔드에서 잘못된 카테고리 값이 들어오면 DB가 거부함 (더 안전함)

#### 2. **이미지 배열 길이 제약** (백엔드 추가)

- **백엔드 쿼리**: `images` 배열 최대 4장 제약 추가
  ```sql
  CHECK (images IS NULL OR array_length(images, 1) <= 4)
  ```
- **우리 코드**: 프론트엔드에서만 4장 제한 (`.slice(0, 4)`)
- **영향**: DB 레벨에서도 4장 초과 방지 (더 안전함)

#### 3. **비용 음수 방지** (백엔드 추가)

- **백엔드 쿼리**: `procedure_reviews.cost >= 0` CHECK 제약 추가
- **우리 코드**: 프론트엔드에서만 검증
- **영향**: DB 레벨에서 음수 비용 방지

#### 4. **통역 로직 제약** (백엔드 추가)

- **백엔드 쿼리**: `hospital_reviews`에 통역 로직 CHECK 제약 추가
  ```sql
  CHECK (has_translation = true OR translation_satisfaction IS NULL)
  ```
- **우리 코드**: 프론트엔드에서만 검증
  ```typescript
  translation_satisfaction: data.has_translation && data.translation_satisfaction
    ? data.translation_satisfaction
    : null,
  ```
- **영향**: DB 레벨에서도 모순 데이터 방지

#### 5. **함수 위치 및 구조** (백엔드 개선)

- **백엔드 쿼리**: `update_updated_at_column()` 함수를 맨 위에 공통으로 정의
- **우리 코드**: 동일한 구조 (SUPABASE_TABLES.md에도 동일하게 작성됨)
- **영향**: SQL 실행 순서 문제 방지

#### 6. **CHECK 제약조건 문법 차이**

- **백엔드 쿼리**: `BETWEEN 1 AND 5` 사용
- **우리 코드**: `>= 1 AND <= 5` 사용
- **영향**: 기능적으로 동일, 가독성 차이만 있음

## 🔧 우리 코드에서 수정이 필요한 부분

### 현재 코드 상태 확인

- ✅ `lib/api/beautripApi.ts`의 `saveProcedureReview`, `saveHospitalReview`, `saveConcernPost` 함수들이 올바른 컬럼명 사용
- ✅ 데이터 타입이 백엔드 스키마와 일치
- ✅ `user_id` 기본값 0 처리 일치

### 추가 검증 필요 사항

1. **카테고리 값 검증**: 프론트엔드에서 백엔드 CHECK 제약조건과 동일한 값만 전송하는지 확인 필요
2. **이미지 배열 길이**: 현재 `.slice(0, 4)`로 제한하고 있으므로 문제 없음
3. **비용 검증**: 음수 입력 방지 로직 추가 권장

## 📝 결론

백엔드 쿼리문이 우리가 설계한 구조를 기반으로 **더 강화된 제약조건**을 추가한 버전입니다.

**주요 개선점:**

- ✅ DB 레벨 제약조건으로 데이터 무결성 강화
- ✅ 카테고리 값 고정으로 데이터 일관성 보장
- ✅ 이미지/비용/통역 로직 등 비즈니스 규칙을 DB에서 강제

**우리 코드는 백엔드 스키마와 호환되며, 추가 수정이 필요하지 않습니다.** 다만, 프론트엔드에서도 동일한 검증을 수행하여 사용자 경험을 개선할 수 있습니다.
