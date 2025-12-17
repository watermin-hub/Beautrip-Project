# 찜하기 및 좋아요 기능을 위한 Supabase 테이블 생성

이 문서는 회원 기반 찜하기 및 좋아요 기능을 위한 Supabase 테이블 구조를 설명합니다.

## 테이블 목록

1. `procedure_favorites` - 시술 찜하기
2. `post_likes` - 커뮤니티 글 좋아요

---

## 1. procedure_favorites (시술 찜하기)

### 테이블 구조

| 컬럼명         | 타입        | 제약조건                                | 설명                       |
| -------------- | ----------- | --------------------------------------- | -------------------------- |
| `id`           | `uuid`      | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                    |
| `user_id`      | `uuid`      | NOT NULL, REFERENCES auth.users(id)     | 사용자 ID (Supabase Auth)  |
| `treatment_id` | `integer`   | NOT NULL                                | 시술 ID (treatment_master) |
| `created_at`   | `timestamp` | DEFAULT now()                           | 생성일시                   |
| `updated_at`   | `timestamp` | DEFAULT now()                           | 수정일시                   |

### SQL 생성 쿼리

```sql
-- procedure_favorites 테이블 생성
CREATE TABLE IF NOT EXISTS procedure_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, treatment_id) -- 같은 사용자가 같은 시술을 중복 찜하기 방지
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_procedure_favorites_user_id ON procedure_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_procedure_favorites_treatment_id ON procedure_favorites(treatment_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_procedure_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_procedure_favorites_updated_at
  BEFORE UPDATE ON procedure_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_procedure_favorites_updated_at();
```

---

## 2. post_likes (커뮤니티 글 좋아요)

### 테이블 구조

| 컬럼명       | 타입        | 제약조건                                | 설명                                                      |
| ------------ | ----------- | --------------------------------------- | --------------------------------------------------------- |
| `id`         | `uuid`      | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                                                   |
| `user_id`    | `uuid`      | NOT NULL, REFERENCES auth.users(id)     | 사용자 ID (Supabase Auth)                                 |
| `post_id`    | `uuid`      | NOT NULL                                | 글 ID                                                     |
| `post_type`  | `text`      | NOT NULL, CHECK                         | 글 타입 (procedure_review, hospital_review, concern_post) |
| `created_at` | `timestamp` | DEFAULT now()                           | 생성일시                                                  |
| `updated_at` | `timestamp` | DEFAULT now()                           | 수정일시                                                  |

### SQL 생성 쿼리

```sql
-- post_likes 테이블 생성
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('procedure_review', 'hospital_review', 'concern_post')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id, post_type) -- 같은 사용자가 같은 글을 중복 좋아요 방지
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_type ON post_likes(post_type);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_post_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_likes_updated_at
  BEFORE UPDATE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_updated_at();
```

---

## Supabase에서 테이블 생성 방법

### 방법 1: SQL Editor 사용 (권장)

1. Supabase 대시보드 접속
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 위의 SQL 쿼리를 복사하여 붙여넣기
5. **Run** 버튼 클릭하여 실행

### 방법 2: Table Editor 사용

1. Supabase 대시보드 접속
2. 좌측 메뉴에서 **Table Editor** 클릭
3. **New table** 클릭
4. 테이블명 입력 (예: `procedure_favorites`)
5. 각 컬럼을 수동으로 추가 (위의 테이블 구조 참고)

---

## Row Level Security (RLS) 설정

### procedure_favorites RLS 정책

```sql
-- RLS 활성화
ALTER TABLE procedure_favorites ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 찜하기만 조회 가능
CREATE POLICY "Users can view their own favorites"
  ON procedure_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 찜하기만 추가 가능
CREATE POLICY "Users can insert their own favorites"
  ON procedure_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 찜하기만 삭제 가능
CREATE POLICY "Users can delete their own favorites"
  ON procedure_favorites
  FOR DELETE
  USING (auth.uid() = user_id);
```

### post_likes RLS 정책

```sql
-- RLS 활성화
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 좋아요만 조회 가능
CREATE POLICY "Users can view their own likes"
  ON post_likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 좋아요만 추가 가능
CREATE POLICY "Users can insert their own likes"
  ON post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 좋아요만 삭제 가능
CREATE POLICY "Users can delete their own likes"
  ON post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 모든 사용자가 좋아요 개수는 조회 가능 (통계용)
CREATE POLICY "Anyone can view like counts"
  ON post_likes
  FOR SELECT
  USING (true);
```

---

## 참고사항

### user_id 타입

- Supabase Auth의 `auth.users` 테이블의 `id`는 `uuid` 타입입니다.
- 따라서 `procedure_favorites`와 `post_likes` 테이블의 `user_id`도 `uuid` 타입으로 설정했습니다.
- 코드에서 사용자 ID를 가져올 때는 `supabase.auth.getUser()` 또는 `supabase.auth.getSession()`을 사용합니다.

### 외래키 관계

- `procedure_favorites.user_id` → `auth.users.id` (CASCADE 삭제)
- `post_likes.user_id` → `auth.users(id)` (CASCADE 삭제)
- `procedure_favorites.treatment_id` → `treatment_master.treatment_id` (참조만, 외래키 제약은 선택사항)

### 성능 최적화

- `user_id`와 `treatment_id`에 인덱스를 생성하여 조회 성능을 향상시켰습니다.
- `UNIQUE` 제약조건으로 중복 찜하기/좋아요를 방지합니다.
