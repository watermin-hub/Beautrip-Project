# 찜하기 및 좋아요 기능 구현 가이드

이 문서는 회원 기반 찜하기 및 좋아요 기능의 구현 내용을 설명합니다.

## 📋 구현 내용

### 1. Supabase 테이블 생성

#### procedure_favorites (시술 찜하기)

- `user_id`: 사용자 ID (UUID, Supabase Auth)
- `treatment_id`: 시술 ID (정수)
- `created_at`, `updated_at`: 타임스탬프

#### post_likes (커뮤니티 글 좋아요)

- `user_id`: 사용자 ID (UUID, Supabase Auth)
- `post_id`: 글 ID (UUID)
- `post_type`: 글 타입 (procedure_review, hospital_review, concern_post)
- `created_at`, `updated_at`: 타임스탬프

**자세한 내용**: `docs/SUPABASE_FAVORITES_LIKES_TABLES.md` 참고

### 2. API 함수 추가

`lib/api/beautripApi.ts`에 다음 함수들이 추가되었습니다:

#### 시술 찜하기 관련

- `addProcedureFavorite(treatmentId)`: 시술 찜하기 추가
- `removeProcedureFavorite(treatmentId)`: 시술 찜하기 삭제
- `toggleProcedureFavorite(treatmentId)`: 시술 찜하기 토글
- `getFavoriteProcedures()`: 찜한 시술 목록 조회
- `isProcedureFavorite(treatmentId)`: 특정 시술의 찜하기 여부 확인
- `getFavoriteStatus(treatmentIds)`: 여러 시술의 찜하기 여부 일괄 확인

#### 커뮤니티 글 좋아요 관련

- `addPostLike(postId, postType)`: 글 좋아요 추가
- `removePostLike(postId, postType)`: 글 좋아요 삭제
- `togglePostLike(postId, postType)`: 글 좋아요 토글
- `getLikedPosts()`: 좋아요한 글 목록 조회
- `isPostLiked(postId, postType)`: 특정 글의 좋아요 여부 확인
- `getPostLikeCount(postId, postType)`: 글의 좋아요 개수 조회

### 3. UI 컴포넌트 수정

#### 시술 상세 페이지 (`components/TreatmentDetailPage.tsx`)

- 찜하기 기능을 localStorage에서 Supabase로 전환
- 로그인 상태 확인 및 에러 처리 추가

#### 커뮤니티 글 목록 (`components/ReviewList.tsx`)

- 각 글에 좋아요 버튼 추가
- 좋아요 상태 및 개수 실시간 표시
- Supabase와 연동하여 좋아요 토글 기능 구현

#### 마이페이지 (`components/MyPage.tsx`)

- 찜한 시술 개수를 Supabase에서 가져오도록 수정
- 좋아요한 글 메뉴 항목 추가

#### 찜 목록 페이지 (`components/FavoritesPage.tsx`)

- Supabase에서 찜한 시술 목록을 가져오도록 수정
- 시술 상세 정보를 함께 로드하여 표시
- 찜하기 삭제 기능 Supabase 연동

## 🚀 사용 방법

### 1. Supabase 테이블 생성

1. Supabase 대시보드 접속
2. SQL Editor 열기
3. `docs/SUPABASE_FAVORITES_LIKES_TABLES.md`의 SQL 쿼리 실행
4. RLS (Row Level Security) 정책 설정

### 2. 기능 테스트

#### 시술 찜하기

1. 로그인 상태에서 시술 상세 페이지 접속
2. 하트 아이콘 클릭하여 찜하기/찜하기 해제
3. 마이페이지에서 찜한 시술 개수 확인
4. 찜 목록 페이지에서 찜한 시술 목록 확인

#### 커뮤니티 글 좋아요

1. 로그인 상태에서 커뮤니티 페이지 접속
2. 각 글의 하트 아이콘 클릭하여 좋아요/좋아요 해제
3. 좋아요 개수 실시간 업데이트 확인

## ⚠️ 주의사항

### 로그인 필수

- 찜하기 및 좋아요 기능은 로그인이 필수입니다.
- 로그인하지 않은 상태에서 클릭 시 "로그인이 필요합니다" 메시지가 표시됩니다.

### 하위 호환성

- 기존 localStorage 기반 찜하기 기능과의 하위 호환성을 위해 일부 컴포넌트에서 localStorage도 함께 확인합니다.
- 점진적으로 localStorage 의존성을 제거할 수 있습니다.

### 에러 처리

- 모든 API 함수는 에러 처리를 포함하고 있습니다.
- 네트워크 오류나 권한 오류 시 사용자에게 적절한 메시지를 표시합니다.

## 🔄 향후 개선 사항

1. **좋아요한 글 목록 페이지**: 현재는 개수만 표시되지만, 목록 페이지를 추가할 수 있습니다.
2. **찜하기 통계**: 각 시술의 총 찜하기 개수를 표시할 수 있습니다.
3. **알림 기능**: 찜한 시술의 가격 변동이나 새로운 리뷰 등 알림 기능 추가
4. **병원 찜하기**: 현재는 시술만 지원하지만, 병원 찜하기 기능도 추가할 수 있습니다.

## 📝 관련 파일

- `docs/SUPABASE_FAVORITES_LIKES_TABLES.md`: 테이블 생성 SQL 및 구조 설명
- `lib/api/beautripApi.ts`: API 함수 구현
- `components/TreatmentDetailPage.tsx`: 시술 상세 페이지
- `components/ReviewList.tsx`: 커뮤니티 글 목록
- `components/MyPage.tsx`: 마이페이지
- `components/FavoritesPage.tsx`: 찜 목록 페이지
