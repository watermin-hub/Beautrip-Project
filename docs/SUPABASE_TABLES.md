# Supabase 테이블 구조 설계

이 문서는 BeauTrip 프로젝트의 후기 작성 기능을 위한 Supabase 테이블 구조를 설명합니다.

## 테이블 목록

1. `procedure_reviews` - 시술후기
2. `hospital_reviews` - 병원후기
3. `concern_posts` - 고민글
4. `community_comments` - 댓글

---

## 1. procedure_reviews (시술후기)

### 테이블 구조

| 컬럼명             | 타입          | 제약조건                                | 설명                                      |
| ------------------ | ------------- | --------------------------------------- | ----------------------------------------- |
| `id`               | `uuid`        | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                                   |
| `user_id`          | `bigint`      | NOT NULL, DEFAULT 0                     | 작성자 ID (현재는 0으로 통일)             |
| `category`         | `text`        | NOT NULL                                | 시술 카테고리 (눈성형, 리프팅, 보톡스 등) |
| `procedure_name`   | `text`        | NOT NULL                                | 시술명(수술명)                            |
| `hospital_name`    | `text`        | NULL                                    | 병원명 (선택사항)                         |
| `cost`             | `integer`     | NOT NULL                                | 비용 (만원 단위)                          |
| `procedure_rating` | `integer`     | NOT NULL, CHECK (1-5)                   | 시술 만족도 (1~5)                         |
| `hospital_rating`  | `integer`     | NOT NULL, CHECK (1-5)                   | 병원 만족도 (1~5)                         |
| `gender`           | `text`        | NOT NULL, CHECK ('여' OR '남')          | 성별                                      |
| `age_group`        | `text`        | NOT NULL                                | 연령대 (20대, 30대, 40대, 50대)           |
| `surgery_date`     | `date`        | NULL                                    | 시술 날짜 (선택사항)                      |
| `content`          | `text`        | NOT NULL                                | 글 내용                                   |
| `images`           | `text[]`      | NULL                                    | 이미지 URL 배열 (최대 4장)                |
| `created_at`       | `timestamptz` | NOT NULL, DEFAULT now()                 | 작성일시                                  |
| `updated_at`       | `timestamptz` | NOT NULL, DEFAULT now()                 | 수정일시                                  |

### SQL 생성 쿼리

```sql
CREATE TABLE procedure_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  hospital_name TEXT,
  cost INTEGER NOT NULL,
  procedure_rating INTEGER NOT NULL CHECK (procedure_rating >= 1 AND procedure_rating <= 5),
  hospital_rating INTEGER NOT NULL CHECK (hospital_rating >= 1 AND hospital_rating <= 5),
  gender TEXT NOT NULL CHECK (gender IN ('여', '남')),
  age_group TEXT NOT NULL,
  surgery_date DATE,
  content TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_procedure_reviews_user_id ON procedure_reviews(user_id);
CREATE INDEX idx_procedure_reviews_category ON procedure_reviews(category);
CREATE INDEX idx_procedure_reviews_created_at ON procedure_reviews(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_procedure_reviews_updated_at
  BEFORE UPDATE ON procedure_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. hospital_reviews (병원후기)

### 테이블 구조

| 컬럼명                     | 타입          | 제약조건                                | 설명                                             |
| -------------------------- | ------------- | --------------------------------------- | ------------------------------------------------ |
| `id`                       | `uuid`        | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                                          |
| `user_id`                  | `bigint`      | NOT NULL, DEFAULT 0                     | 작성자 ID (현재는 0으로 통일)                    |
| `hospital_name`            | `text`        | NOT NULL                                | 병원명                                           |
| `category_large`           | `text`        | NOT NULL                                | 시술 카테고리 (대분류)                           |
| `procedure_name`           | `text`        | NULL                                    | 시술명(수술명) (선택사항)                        |
| `visit_date`               | `date`        | NULL                                    | 병원 방문일 (선택사항)                           |
| `overall_satisfaction`     | `integer`     | NULL, CHECK (1-5)                       | 전체적인 시술 만족도 (1~5)                       |
| `hospital_kindness`        | `integer`     | NULL, CHECK (1-5)                       | 병원 만족도 (1~5)                                |
| `has_translation`          | `boolean`     | DEFAULT false                           | 통역 여부                                        |
| `translation_satisfaction` | `integer`     | NULL, CHECK (1-5)                       | 통역 만족도 (1~5, has_translation이 true일 때만) |
| `content`                  | `text`        | NOT NULL                                | 글 내용                                          |
| `images`                   | `text[]`      | NULL                                    | 이미지 URL 배열 (최대 4장)                       |
| `created_at`               | `timestamptz` | NOT NULL, DEFAULT now()                 | 작성일시                                         |
| `updated_at`               | `timestamptz` | NOT NULL, DEFAULT now()                 | 수정일시                                         |

### SQL 생성 쿼리

```sql
CREATE TABLE hospital_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL DEFAULT 0,
  hospital_name TEXT NOT NULL,
  category_large TEXT NOT NULL,
  procedure_name TEXT,
  visit_date DATE,
  overall_satisfaction INTEGER CHECK (overall_satisfaction IS NULL OR (overall_satisfaction >= 1 AND overall_satisfaction <= 5)),
  hospital_kindness INTEGER CHECK (hospital_kindness IS NULL OR (hospital_kindness >= 1 AND hospital_kindness <= 5)),
  has_translation BOOLEAN DEFAULT false,
  translation_satisfaction INTEGER CHECK (translation_satisfaction IS NULL OR (translation_satisfaction >= 1 AND translation_satisfaction <= 5)),
  content TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_hospital_reviews_user_id ON hospital_reviews(user_id);
CREATE INDEX idx_hospital_reviews_hospital_name ON hospital_reviews(hospital_name);
CREATE INDEX idx_hospital_reviews_category_large ON hospital_reviews(category_large);
CREATE INDEX idx_hospital_reviews_created_at ON hospital_reviews(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_hospital_reviews_updated_at
  BEFORE UPDATE ON hospital_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. concern_posts (고민글)

### 테이블 구조

| 컬럼명             | 타입          | 제약조건                                | 설명                                    |
| ------------------ | ------------- | --------------------------------------- | --------------------------------------- |
| `id`               | `uuid`        | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                                 |
| `user_id`          | `bigint`      | NOT NULL, DEFAULT 0                     | 작성자 ID (현재는 0으로 통일)           |
| `title`            | `text`        | NOT NULL                                | 제목                                    |
| `concern_category` | `text`        | NOT NULL                                | 고민 카테고리 (피부 고민, 시술 고민 등) |
| `content`          | `text`        | NOT NULL                                | 고민 글 내용                            |
| `created_at`       | `timestamptz` | NOT NULL, DEFAULT now()                 | 작성일시                                |
| `updated_at`       | `timestamptz` | NOT NULL, DEFAULT now()                 | 수정일시                                |

### SQL 생성 쿼리

```sql
CREATE TABLE concern_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  concern_category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_concern_posts_user_id ON concern_posts(user_id);
CREATE INDEX idx_concern_posts_concern_category ON concern_posts(concern_category);
CREATE INDEX idx_concern_posts_created_at ON concern_posts(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_concern_posts_updated_at
  BEFORE UPDATE ON concern_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. community_comments (댓글)

### 테이블 구조

| 컬럼명              | 타입          | 제약조건                                | 설명                                                                |
| ------------------- | ------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `id`                | `uuid`        | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                                                             |
| `post_id`           | `uuid`        | NOT NULL                                | 게시글 ID (procedure_reviews, hospital_reviews, concern_posts의 id) |
| `post_type`         | `text`        | NOT NULL, CHECK                         | 게시글 타입 ('procedure', 'hospital', 'concern')                    |
| `user_id`           | `uuid`        | NOT NULL                                | 작성자 ID (Supabase Auth의 auth.users.id)                           |
| `content`           | `text`        | NOT NULL                                | 댓글 내용                                                           |
| `parent_comment_id` | `uuid`        | NULL                                    | 대댓글인 경우 부모 댓글 ID (선택사항)                               |
| `created_at`        | `timestamptz` | NOT NULL, DEFAULT now()                 | 작성일시                                                            |
| `updated_at`        | `timestamptz` | NOT NULL, DEFAULT now()                 | 수정일시                                                            |

### SQL 생성 쿼리

```sql
-- uuid_generate_v4() 에러가 나면 아래 주석을 풀고 다시 실행하세요.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- community_comments (댓글)
-- =========================================================
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('procedure', 'hospital', 'concern', 'guide')),
  user_id UUID NOT NULL,  -- ✅ Supabase Auth의 auth.users.id (UUID)
  content TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_community_comments_post_id_post_type
  ON public.community_comments(post_id, post_type);
CREATE INDEX idx_community_comments_user_id
  ON public.community_comments(user_id);
CREATE INDEX idx_community_comments_parent_comment_id
  ON public.community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at
  ON public.community_comments(created_at DESC);

-- updated_at 자동 업데이트 트리거 (재실행 안전)
DROP TRIGGER IF EXISTS update_community_comments_updated_at ON public.community_comments;

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

**⚠️ 주의사항:**

- `user_id`는 UUID 타입으로, Supabase Auth의 `auth.users.id`와 일치합니다.
- `post_id`와 `post_type` 조합으로 게시글을 식별합니다 (다중 테이블 참조).
- 외래 키는 `post_type`에 따라 다른 테이블을 참조하므로 설정하지 않습니다.
- 게시글 삭제 시 댓글 정리는 애플리케이션 레벨에서 처리해야 합니다.

---

## Supabase에서 테이블 생성 방법

### ✅ 권장 실행 순서

**중요:** SQL을 실행할 때는 다음 순서를 반드시 지켜주세요:

1. **Extension 생성** (uuid_generate_v4() 사용을 위해)
2. **공통 함수 생성** (update_updated_at_column)
3. **테이블 생성** (procedure_reviews, hospital_reviews, concern_posts, community_comments)
4. **인덱스 생성**
5. **트리거 생성**
6. **RLS 정책 설정** (선택사항)

### 방법 1: SQL Editor 사용 (권장)

1. Supabase 대시보드 접속
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 아래 **완전한 SQL 스크립트**를 복사하여 붙여넣기
5. **Run** 버튼 클릭하여 실행

### 📋 완전한 SQL 스크립트 (한 번에 실행)

```sql
-- =========================================================
-- 1. Extension 생성 (uuid_generate_v4() 사용을 위해)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 2. 공통 함수 생성 (모든 테이블에서 공유)
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 3. community_comments 테이블 생성 (기존 테이블들 이후에 실행)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('procedure', 'hospital', 'concern', 'guide')),
  user_id UUID NOT NULL,  -- ✅ Supabase Auth의 auth.users.id (UUID)
  content TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 4. 인덱스 생성
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id_post_type
  ON public.community_comments(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id
  ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_comment_id
  ON public.community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at
  ON public.community_comments(created_at DESC);

-- =========================================================
-- 5. 트리거 생성 (재실행 안전)
-- =========================================================
DROP TRIGGER IF EXISTS update_community_comments_updated_at ON public.community_comments;

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

**✅ 안전성 보장:**

- `CREATE TABLE IF NOT EXISTS`: 테이블이 이미 있어도 에러 없음
- `CREATE INDEX IF NOT EXISTS`: 인덱스가 이미 있어도 에러 없음
- `DROP TRIGGER IF EXISTS`: 트리거가 이미 있어도 재실행 가능
- `CREATE OR REPLACE FUNCTION`: 함수는 항상 최신 버전으로 업데이트

**⚠️ 참고:**

- 기존 테이블들(procedure_reviews, hospital_reviews, concern_posts)은 이미 생성되어 있다고 가정합니다.
- `community_comments` 테이블만 새로 추가하는 경우 위 스크립트를 실행하세요.
- 이 스크립트는 여러 번 실행해도 안전합니다 (idempotent).

### 방법 2: Table Editor 사용

1. Supabase 대시보드 접속
2. 좌측 메뉴에서 **Table Editor** 클릭
3. **New table** 클릭
4. 테이블명 입력 (예: `procedure_reviews`)
5. 각 컬럼을 수동으로 추가 (위의 테이블 구조 참고)

---

## Row Level Security (RLS) 설정

### ⚠️ 개발 단계 (임시 정책)

개발 중에는 모든 사용자가 읽기/쓰기 가능하도록 설정할 수 있습니다:

```sql
-- RLS 활성화
ALTER TABLE public.procedure_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concern_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 개발용: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations for procedure_reviews"
  ON public.procedure_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for hospital_reviews"
  ON public.hospital_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for concern_posts"
  ON public.concern_posts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for community_comments"
  ON public.community_comments
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for user_profiles"
  ON public.user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### ✅ 운영 단계 (권장 정책)

실서비스에서는 보안을 위해 다음 정책을 사용하세요:

```sql
-- 기존 개발용 정책 삭제
DROP POLICY IF EXISTS "Allow all operations for procedure_reviews" ON public.procedure_reviews;
DROP POLICY IF EXISTS "Allow all operations for hospital_reviews" ON public.hospital_reviews;
DROP POLICY IF EXISTS "Allow all operations for concern_posts" ON public.concern_posts;
DROP POLICY IF EXISTS "Allow all operations for community_comments" ON public.community_comments;
DROP POLICY IF EXISTS "Allow all operations for user_profiles" ON public.user_profiles;

-- ✅ 읽기: 모든 사용자 허용
CREATE POLICY "Allow public read for procedure_reviews"
  ON public.procedure_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read for hospital_reviews"
  ON public.hospital_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read for concern_posts"
  ON public.concern_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read for community_comments"
  ON public.community_comments
  FOR SELECT
  USING (true);

-- ✅ 쓰기: 로그인 사용자만 허용
CREATE POLICY "Allow authenticated insert for procedure_reviews"
  ON public.procedure_reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert for hospital_reviews"
  ON public.hospital_reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert for concern_posts"
  ON public.concern_posts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert for community_comments"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ✅ 수정/삭제: 작성자만 허용
CREATE POLICY "Allow owner update for procedure_reviews"
  ON public.procedure_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owner update for hospital_reviews"
  ON public.hospital_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owner update for concern_posts"
  ON public.concern_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owner update for community_comments"
  ON public.community_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow owner delete for procedure_reviews"
  ON public.procedure_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow owner delete for hospital_reviews"
  ON public.hospital_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow owner delete for concern_posts"
  ON public.concern_posts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow owner delete for community_comments"
  ON public.community_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ✅ user_profiles 테이블: 공개 읽기 정책 (닉네임 등 공개 정보)
-- RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (닉네임, display_name은 공개 정보)
CREATE POLICY "Allow public read for user_profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- 본인만 수정 가능
CREATE POLICY "Allow owner update for user_profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인만 삭제 가능
CREATE POLICY "Allow owner delete for user_profiles"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);
```

**⚠️ 중요: `user_profiles` RLS 정책 필요**

**문제 증상:**

- 내 글은 닉네임이 잘 보임 ✅
- 다른 사람 글은 모두 "익명"으로 보임 ❌

**원인:**

- `user_profiles` 테이블에 RLS가 활성화되어 있지만 **공개 읽기 정책이 없음**
- `getUserNickname()` 함수가 다른 사용자의 프로필을 조회할 수 없음

**해결 방법:**
위의 `user_profiles` RLS 정책을 Supabase SQL Editor에서 실행하세요. 특히 **"Allow public read for user_profiles"** 정책이 핵심입니다.

**⚠️ 주의:**

- 운영 정책은 `user_id`가 UUID 타입이고 `auth.uid()`와 일치해야 합니다.
- ✅ 모든 테이블의 `user_id`가 이미 UUID로 설정되어 있어 바로 사용 가능합니다.

---

## 이미지 저장 방법

이미지는 Supabase Storage에 저장하는 것을 권장합니다. 현재는 이미지 URL 배열로 저장하도록 설계했지만, 추후 다음과 같이 변경할 수 있습니다:

1. **Supabase Storage 버킷 생성**

   - 버킷명: `review-images`
   - Public access 활성화

2. **이미지 업로드 후 URL 저장**
   - 클라이언트에서 이미지를 Supabase Storage에 업로드
   - 반환된 URL을 `images` 배열에 저장

---

## ⚠️ 중요 주의사항

### 1. user_id 타입 통일 ✅

**현재 상황:**

- ✅ 모든 테이블의 `user_id`가 `UUID` 타입으로 통일되어 있습니다.
- ✅ `procedure_reviews`, `hospital_reviews`, `concern_posts`, `community_comments` 모두 `user_id UUID` 사용
- ✅ Supabase Auth의 `auth.users.id`와 완벽하게 호환됩니다.

**장점:**

- "내 댓글 보기", "작성자 확인" 등의 기능이 정상 작동합니다.
- RLS 정책에서 `auth.uid() = user_id` 비교가 정확하게 동작합니다.
- 모든 테이블 간 일관성 유지로 데이터 관리가 용이합니다.

### 2. RLS 정책 사용 시 주의사항 ⚠️

**운영용 RLS 정책을 사용할 때:**

RLS 정책이 `auth.uid() = user_id`로 설정되어 있으면, **반드시** `saveComment()` 함수에서 `auth.uid()`를 `user_id`에 넣어야 합니다.

**✅ 올바른 구현:**

```typescript
const {
  data: { user },
} = await client.auth.getUser();
const userId = user?.id; // auth.uid()

const commentData = {
  user_id: userId, // ✅ 무조건 auth.uid() 사용
  // ...
};
```

**❌ 잘못된 구현:**

```typescript
// data.user_id를 사용하거나 localStorage 값 사용 시 RLS가 막을 수 있음
user_id: data.user_id || localStorage.getItem("userId"); // ❌
```

**현재 구현 상태:**

- ✅ `saveComment()` 함수는 이미 `auth.uid()`를 사용하도록 구현되어 있습니다.
- ✅ `data.user_id`는 무시하고 항상 현재 로그인한 사용자의 ID를 사용합니다.

### 3. 게시글 삭제 시 댓글 정리

`community_comments` 테이블은 `post_id`와 `post_type`으로 게시글을 참조하지만, 외래 키가 없어서:

- 게시글 삭제 시 댓글이 자동으로 삭제되지 않습니다.
- 애플리케이션 레벨에서 게시글 삭제 시 관련 댓글도 함께 삭제해야 합니다.

```typescript
// 예시: 게시글 삭제 시 댓글도 함께 삭제
await supabase
  .from("community_comments")
  .delete()
  .eq("post_id", postId)
  .eq("post_type", postType);
```

### 4. 이미지 처리

현재는 이미지 URL 배열로만 설계했습니다. 실제 이미지 업로드 기능은 별도로 구현해야 합니다.

### 5. 데이터 검증

클라이언트 측에서 필수 필드 검증을 수행하지만, Supabase에서도 제약조건을 통해 데이터 무결성을 보장합니다.
