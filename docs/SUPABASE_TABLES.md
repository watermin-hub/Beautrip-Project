# Supabase 테이블 구조 설계

이 문서는 BeauTrip 프로젝트의 후기 작성 기능을 위한 Supabase 테이블 구조를 설명합니다.

## 테이블 목록

1. `procedure_reviews` - 시술후기
2. `hospital_reviews` - 병원후기
3. `concern_posts` - 고민글

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
4. 테이블명 입력 (예: `procedure_reviews`)
5. 각 컬럼을 수동으로 추가 (위의 테이블 구조 참고)

---

## Row Level Security (RLS) 설정

현재는 로그인 기능이 없으므로 RLS는 비활성화하거나, 모든 사용자가 읽기/쓰기 가능하도록 설정합니다.

```sql
-- RLS 활성화 (선택사항)
ALTER TABLE procedure_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE concern_posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
CREATE POLICY "Allow all operations for procedure_reviews"
  ON procedure_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for hospital_reviews"
  ON hospital_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for concern_posts"
  ON concern_posts
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

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

## 주의사항

1. **user_id**: 현재는 모든 사용자가 `user_id = 0`으로 저장됩니다. 추후 로그인 기능 구현 시 실제 사용자 ID로 변경해야 합니다.

2. **이미지 처리**: 현재는 이미지 URL 배열로만 설계했습니다. 실제 이미지 업로드 기능은 별도로 구현해야 합니다.

3. **데이터 검증**: 클라이언트 측에서 필수 필드 검증을 수행하지만, Supabase에서도 제약조건을 통해 데이터 무결성을 보장합니다.
