# 조회수 기능 구현 가이드

## 📋 개요

게시글(시술 후기, 병원 후기, 고민글)의 조회수 기능을 구현하기 위한 가이드입니다.

---

## 1. 데이터베이스 스키마 변경

### 필요한 컬럼 추가

다음 테이블들에 `views` 컬럼을 추가해야 합니다:

- `procedure_reviews`
- `hospital_reviews`
- `concern_posts`

### SQL 마이그레이션

```sql
-- procedure_reviews 테이블에 views 컬럼 추가
ALTER TABLE public.procedure_reviews
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- hospital_reviews 테이블에 views 컬럼 추가
ALTER TABLE public.hospital_reviews
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- concern_posts 테이블에 views 컬럼 추가
ALTER TABLE public.concern_posts
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 인덱스 추가 (조회수 기반 정렬을 위해)
CREATE INDEX IF NOT EXISTS idx_procedure_reviews_views
  ON public.procedure_reviews(views DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_reviews_views
  ON public.hospital_reviews(views DESC);
CREATE INDEX IF NOT EXISTS idx_concern_posts_views
  ON public.concern_posts(views DESC);
```

---

## 2. API 함수

### 조회수 증가

**함수명:** `incrementViewCount`

**위치:** `lib/api/beautripApi.ts`

**기능:**

- 게시글 상세 페이지 진입 시 호출
- 해당 게시글의 조회수를 1 증가시킴
- `views` 컬럼이 없어도 에러 없이 처리 (점진적 마이그레이션 지원)

**사용 예시:**

```typescript
await incrementViewCount(postId, "procedure");
```

### 조회수 조회

**함수명:** `getViewCount`

**위치:** `lib/api/beautripApi.ts`

**기능:**

- 게시글의 현재 조회수를 반환
- `views` 컬럼이 없으면 0 반환

**사용 예시:**

```typescript
const views = await getViewCount(postId, "procedure");
```

---

## 3. 구현 위치

### 게시글 상세 페이지

**파일:**

- `app/community/posts/[id]/page.tsx`
- `components/ProcedureReviewDetailPage.tsx`

**구현 내용:**

- 페이지 로드 시 `incrementViewCount()` 호출
- 조회수 표시: `getViewCount()`로 조회하여 표시

### 게시글 목록

**파일:** `components/PostList.tsx`

**구현 내용:**

- 게시글 목록 로드 시 각 게시글의 조회수 로드
- `viewCounts` state로 관리
- 실제 조회수 표시: `viewCounts[postId] ?? 0`

---

## 4. 작동 방식

### 조회수 증가 로직

1. 사용자가 게시글 상세 페이지 진입
2. `incrementViewCount()` 호출
3. 현재 조회수 조회 → +1 증가 → 업데이트
4. `getViewCount()`로 최신 조회수 조회하여 표시

### 조회수 표시 로직

1. 게시글 목록 로드 시 `loadViewsForPosts()` 호출
2. 각 게시글의 조회수를 일괄 조회
3. `viewCounts` state에 저장
4. UI에서 `viewCounts[postId]`로 표시

---

## 5. 주의사항

### 중복 조회 방지

현재 구현은 중복 조회 방지 로직이 없습니다. 같은 사용자가 여러 번 조회해도 매번 증가합니다.

**향후 개선 방안:**

- IP 주소 기반 중복 방지
- 사용자 ID 기반 중복 방지 (24시간 내 1회만)
- 쿠키 기반 중복 방지

### 성능 고려사항

- 조회수 증가는 비동기로 처리되어 페이지 로딩 속도에 영향 없음
- 조회수 조회 실패 시에도 에러 없이 0으로 표시
- `views` 컬럼이 없어도 정상 작동 (점진적 마이그레이션 지원)

---

## 6. 테스트 방법

1. 게시글 상세 페이지 진입
2. 조회수 증가 확인 (새로고침 시마다 증가)
3. 게시글 목록에서 조회수 표시 확인
4. 상세 페이지와 목록의 조회수 일치 확인

---

**작성일:** 2024-12-19  
**작성자:** 프론트엔드 팀
