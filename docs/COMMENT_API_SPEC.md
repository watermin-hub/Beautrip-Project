# 댓글 기능 API 명세서

백엔드 파트를 위한 댓글 기능 구현 요구사항 문서입니다.

---

## 📋 목차

1. [데이터베이스 스키마](#데이터베이스-스키마)
2. [API 엔드포인트](#api-엔드포인트)
3. [데이터 타입 및 인터페이스](#데이터-타입-및-인터페이스)
4. [주요 기능 상세](#주요-기능-상세)
5. [RLS 정책](#rls-정책)
6. [주의사항](#주의사항)

---

## 데이터베이스 스키마

### 테이블: `community_comments`

```sql
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('procedure', 'hospital', 'concern')),
  user_id UUID NOT NULL,  -- Supabase Auth의 auth.users.id (UUID)
  content TEXT NOT NULL,
  parent_comment_id UUID,  -- 대댓글인 경우 부모 댓글 ID (선택사항)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 인덱스

```sql
CREATE INDEX idx_community_comments_post_id_post_type
  ON public.community_comments(post_id, post_type);
CREATE INDEX idx_community_comments_user_id
  ON public.community_comments(user_id);
CREATE INDEX idx_community_comments_parent_comment_id
  ON public.community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at
  ON public.community_comments(created_at DESC);
```

### 설명

- **post_id**: 게시글 ID (procedure_reviews, hospital_reviews, concern_posts의 id)
- **post_type**: 게시글 타입 ('procedure', 'hospital', 'concern')
- **user_id**: 작성자 ID (Supabase Auth의 auth.users.id, UUID 타입)
- **parent_comment_id**: 대댓글인 경우 부모 댓글 ID (NULL이면 일반 댓글)
- **외래 키**: post_type에 따라 다른 테이블을 참조하므로 외래 키는 설정하지 않음

---

## API 엔드포인트

### 1. 댓글 작성

**POST** `/api/comments`

**Request Body:**

```json
{
  "post_id": "uuid",
  "post_type": "procedure" | "hospital" | "concern",
  "content": "string",
  "parent_comment_id": "uuid | null"  // 선택사항, 대댓글인 경우
}
```

**Response (성공):**

```json
{
  "success": true,
  "id": "uuid"
}
```

**Response (실패):**

```json
{
  "success": false,
  "error": "string"
}
```

**인증:** 로그인 필수 (auth.uid() 사용)

---

### 2. 댓글 목록 조회 (게시글별)

**GET** `/api/comments?post_id={uuid}&post_type={procedure|hospital|concern}`

**Query Parameters:**

- `post_id` (required): 게시글 ID
- `post_type` (required): 게시글 타입

**Response:**

```json
[
  {
    "id": "uuid",
    "post_id": "uuid",
    "post_type": "procedure",
    "user_id": "uuid",
    "content": "string",
    "parent_comment_id": "uuid | null",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "user_nickname": "string | null",
    "user_display_name": "string | null",
    "user_avatar_url": "string | null"
  }
]
```

**정렬:** `created_at` 오름차순 (가장 오래된 댓글이 먼저)

**인증:** 불필요 (공개 조회)

---

### 3. 댓글 삭제

**DELETE** `/api/comments/{comment_id}`

**Response (성공):**

```json
{
  "success": true
}
```

**Response (실패):**

```json
{
  "success": false,
  "error": "string"
}
```

**인증:** 로그인 필수, 본인 댓글만 삭제 가능

---

### 4. 댓글 수정 (선택사항)

**PATCH** `/api/comments/{comment_id}`

**Request Body:**

```json
{
  "content": "string"
}
```

**Response (성공):**

```json
{
  "success": true
}
```

**Response (실패):**

```json
{
  "success": false,
  "error": "string"
}
```

**인증:** 로그인 필수, 본인 댓글만 수정 가능

---

### 5. 댓글 수 조회

**GET** `/api/comments/count?post_id={uuid}&post_type={procedure|hospital|concern}`

**Query Parameters:**

- `post_id` (required): 게시글 ID
- `post_type` (required): 게시글 타입

**Response:**

```json
{
  "count": 10
}
```

**인증:** 불필요 (공개 조회)

---

### 6. 내가 작성한 댓글 조회 (선택사항)

**GET** `/api/comments/my`

**Response:**

```json
[
  {
    "id": "uuid",
    "post_id": "uuid",
    "post_type": "procedure",
    "user_id": "uuid",
    "content": "string",
    "parent_comment_id": "uuid | null",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "user_nickname": "string | null",
    "user_display_name": "string | null",
    "user_avatar_url": "string | null"
  }
]
```

**정렬:** `created_at` 내림차순 (가장 최근 댓글이 먼저)

**인증:** 로그인 필수

---

## 데이터 타입 및 인터페이스

### TypeScript 인터페이스

```typescript
// 댓글 기본 데이터
interface CommentData {
  id?: string;
  post_id: string;
  post_type: "procedure" | "hospital" | "concern";
  user_id?: string; // UUID (Supabase Auth의 auth.users.id)
  content: string;
  parent_comment_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 사용자 정보 포함 댓글
interface CommentWithUser extends CommentData {
  user_nickname?: string | null;
  user_display_name?: string | null;
  user_avatar_url?: string | null;
}
```

---

## 주요 기능 상세

### 1. 댓글 작성

**요구사항:**

- 로그인 필수 (auth.uid() 사용)
- `user_id`는 반드시 현재 로그인한 사용자의 ID (auth.uid())를 사용
- `content`는 공백 제거 후 저장
- `parent_comment_id`가 있으면 대댓글, 없으면 일반 댓글

**검증:**

- `post_id`: UUID 형식, 필수
- `post_type`: 'procedure', 'hospital', 'concern' 중 하나, 필수
- `content`: 공백 제거 후 최소 1자 이상, 필수
- `parent_comment_id`: UUID 형식 또는 null, 선택사항

**주의:**

- 클라이언트에서 전달하는 `user_id`는 무시하고 항상 `auth.uid()`를 사용해야 함 (RLS 정책과 일치)

---

### 2. 댓글 목록 조회

**요구사항:**

- `post_id`와 `post_type`으로 필터링
- `created_at` 오름차순 정렬 (가장 오래된 댓글이 먼저)
- `user_profiles` 테이블과 조인하여 사용자 정보 포함
  - `nickname`, `display_name`, `avatar_url` 조회
  - 사용자 정보가 없으면 null 반환

**JOIN 쿼리 예시:**

```sql
SELECT
  c.*,
  up.nickname as user_nickname,
  up.display_name as user_display_name,
  up.avatar_url as user_avatar_url
FROM community_comments c
LEFT JOIN user_profiles up ON c.user_id = up.user_id
WHERE c.post_id = $1 AND c.post_type = $2
ORDER BY c.created_at ASC;
```

---

### 3. 댓글 삭제

**요구사항:**

- 로그인 필수
- 본인 댓글만 삭제 가능
- 삭제 전 작성자 확인 필요

**프로세스:**

1. 현재 로그인한 사용자 확인 (auth.uid())
2. 댓글 조회하여 작성자 확인
3. 작성자가 일치하면 삭제, 아니면 에러 반환

---

### 4. 댓글 수정 (선택사항)

**요구사항:**

- 로그인 필수
- 본인 댓글만 수정 가능
- `content`만 수정 가능
- `updated_at` 자동 갱신

---

### 5. 댓글 수 조회

**요구사항:**

- `post_id`와 `post_type`으로 필터링
- COUNT 쿼리 사용

---

## RLS 정책

### 개발 단계 (임시 정책)

```sql
-- RLS 활성화
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 개발용: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations for community_comments"
  ON public.community_comments
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 운영 단계 (권장 정책)

```sql
-- 기존 개발용 정책 삭제
DROP POLICY IF EXISTS "Allow all operations for community_comments"
  ON public.community_comments;

-- ✅ 읽기: 모든 사용자 허용
CREATE POLICY "Allow public read for community_comments"
  ON public.community_comments
  FOR SELECT
  USING (true);

-- ✅ 쓰기: 로그인 사용자만 허용
CREATE POLICY "Allow authenticated insert for community_comments"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ✅ 수정: 작성자만 허용
CREATE POLICY "Allow owner update for community_comments"
  ON public.community_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ 삭제: 작성자만 허용
CREATE POLICY "Allow owner delete for community_comments"
  ON public.community_comments
  FOR DELETE
  USING (auth.uid() = user_id);
```

**⚠️ 중요:**

- 운영 정책을 사용할 때는 반드시 `user_id`에 `auth.uid()`를 사용해야 함
- 클라이언트에서 전달하는 `user_id`는 무시하고 서버에서 `auth.uid()`를 사용

---

## 주의사항

### 1. user_id 타입 통일 ✅

- 모든 테이블의 `user_id`가 `UUID` 타입으로 통일되어 있음
- Supabase Auth의 `auth.users.id`와 완벽하게 호환
- RLS 정책에서 `auth.uid() = user_id` 비교가 정확하게 동작

### 2. RLS 정책 사용 시 주의사항 ⚠️

**운영용 RLS 정책을 사용할 때:**

- 댓글 작성 시 반드시 `auth.uid()`를 `user_id`에 넣어야 함
- 클라이언트에서 전달하는 `user_id`는 무시하고 서버에서 `auth.uid()`를 사용

**✅ 올바른 구현:**

```typescript
const userId = auth.uid(); // 현재 로그인한 사용자 ID
const commentData = {
  user_id: userId, // ✅ 무조건 auth.uid() 사용
  // ...
};
```

**❌ 잘못된 구현:**

```typescript
// 클라이언트에서 전달한 user_id 사용 시 RLS가 막을 수 있음
user_id: data.user_id || localStorage.getItem("userId"); // ❌
```

### 3. 게시글 삭제 시 댓글 정리

- `community_comments` 테이블은 외래 키가 없어서 게시글 삭제 시 댓글이 자동으로 삭제되지 않음
- 게시글 삭제 시 관련 댓글도 함께 삭제해야 함

**예시:**

```sql
-- 게시글 삭제 시 댓글도 함께 삭제
DELETE FROM community_comments
WHERE post_id = $1 AND post_type = $2;
```

### 4. user_profiles RLS 정책 필요

**문제 증상:**

- 내 글은 닉네임이 잘 보임 ✅
- 다른 사람 글은 모두 "익명"으로 보임 ❌

**원인:**

- `user_profiles` 테이블에 RLS가 활성화되어 있지만 공개 읽기 정책이 없음

**해결 방법:**

```sql
-- user_profiles 테이블: 공개 읽기 정책
CREATE POLICY "Allow public read for user_profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);
```

### 5. 데이터 검증

**클라이언트 측:**

- 필수 필드 검증
- `content` 공백 제거 후 최소 1자 이상 확인

**서버 측:**

- UUID 형식 검증
- `post_type` 값 검증 ('procedure', 'hospital', 'concern')
- `content` 최소 길이 검증
- 로그인 상태 확인 (작성/수정/삭제 시)

### 6. 대댓글 기능 (선택사항)

- 현재는 `parent_comment_id` 필드만 있고 대댓글 UI는 미구현
- 추후 대댓글 기능 추가 시 사용할 수 있도록 설계됨

---

## 프론트엔드 연동 예시

### 댓글 작성

```typescript
const result = await saveComment({
  post_id: postId,
  post_type: "procedure",
  content: "댓글 내용",
  parent_comment_id: null, // 대댓글인 경우 부모 댓글 ID
});
```

### 댓글 목록 조회

```typescript
const comments = await loadComments(postId, "procedure");
```

### 댓글 삭제

```typescript
const result = await deleteComment(commentId);
```

### 댓글 수 조회

```typescript
const count = await getCommentCount(postId, "procedure");
```

---

## 테스트 케이스

### 1. 댓글 작성

- ✅ 로그인한 사용자가 댓글 작성 성공
- ✅ 로그인하지 않은 사용자가 댓글 작성 시도 → 실패
- ✅ 빈 내용으로 댓글 작성 시도 → 실패
- ✅ 잘못된 post_type으로 댓글 작성 시도 → 실패

### 2. 댓글 목록 조회

- ✅ 게시글별 댓글 목록 조회 성공
- ✅ 댓글이 없는 게시글 조회 → 빈 배열 반환
- ✅ 사용자 정보가 없는 댓글 → user_nickname 등이 null

### 3. 댓글 삭제

- ✅ 본인 댓글 삭제 성공
- ✅ 다른 사람 댓글 삭제 시도 → 실패
- ✅ 로그인하지 않은 사용자가 삭제 시도 → 실패

### 4. 댓글 수정 (선택사항)

- ✅ 본인 댓글 수정 성공
- ✅ 다른 사람 댓글 수정 시도 → 실패
- ✅ 빈 내용으로 수정 시도 → 실패

---

## 추가 참고사항

- 프론트엔드 코드 위치: `lib/api/beautripApi.ts` (saveComment, loadComments, deleteComment 함수)
- 컴포넌트 위치: `components/CommentForm.tsx`, `components/CommentList.tsx`
- 데이터베이스 스키마 상세: `docs/SUPABASE_TABLES.md`

---

**문서 작성일:** 2024-12-19  
**작성자:** 프론트엔드 팀  
**문서 버전:** 1.0
