-- ============================================
-- post_likes 테이블 생성 마이그레이션
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New query > 이 SQL 붙여넣기 > Run

-- post_likes 테이블 생성
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('procedure_review', 'hospital_review', 'concern_post')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id, post_type) -- 같은 사용자가 같은 글을 중복 좋아요 방지
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_type ON public.post_likes(post_type);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_post_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_post_likes_updated_at ON public.post_likes;
CREATE TRIGGER update_post_likes_updated_at
  BEFORE UPDATE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 좋아요만 조회 가능
DROP POLICY IF EXISTS "Users can view their own likes" ON public.post_likes;
CREATE POLICY "Users can view their own likes"
  ON public.post_likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 좋아요만 추가 가능
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.post_likes;
CREATE POLICY "Users can insert their own likes"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 좋아요만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;
CREATE POLICY "Users can delete their own likes"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 정책: 모든 사용자가 좋아요 개수는 조회 가능 (통계용)
DROP POLICY IF EXISTS "Anyone can view like counts" ON public.post_likes;
CREATE POLICY "Anyone can view like counts"
  ON public.post_likes
  FOR SELECT
  USING (true);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ post_likes 테이블이 성공적으로 생성되었습니다!';
END $$;
