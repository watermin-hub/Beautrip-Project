-- ============================================
-- post_likes 및 community_comments 테이블에 'guide' post_type 추가
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New query > 이 SQL 붙여넣기 > Run

-- ============================================
-- 1. post_likes 테이블의 CHECK 제약조건 수정
-- ============================================

-- 기존 CHECK 제약조건 삭제
ALTER TABLE public.post_likes 
  DROP CONSTRAINT IF EXISTS post_likes_post_type_check;

-- 새로운 CHECK 제약조건 추가 ('guide' 포함)
ALTER TABLE public.post_likes 
  ADD CONSTRAINT post_likes_post_type_check 
  CHECK (post_type IN ('procedure_review', 'hospital_review', 'concern_post', 'guide'));

-- ============================================
-- 2. community_comments 테이블의 CHECK 제약조건 수정
-- ============================================

-- 기존 CHECK 제약조건 삭제
ALTER TABLE public.community_comments 
  DROP CONSTRAINT IF EXISTS community_comments_post_type_check;

-- 새로운 CHECK 제약조건 추가 ('guide' 포함)
ALTER TABLE public.community_comments 
  ADD CONSTRAINT community_comments_post_type_check 
  CHECK (post_type IN ('procedure', 'hospital', 'concern', 'guide'));

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ post_likes 및 community_comments 테이블에 ''guide'' post_type이 성공적으로 추가되었습니다!';
END $$;

