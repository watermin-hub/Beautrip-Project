"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";
import {
  loadProcedureReviews,
  loadHospitalReviews,
  loadConcernPosts,
  getCommentCount,
} from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimeAgo } from "@/lib/utils/timeFormat";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiEye, FiArrowLeft } from "react-icons/fi";

function PostDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const postId = searchParams.get("id");
  const postType = searchParams.get("type") as
    | "procedure"
    | "hospital"
    | "concern"
    | null;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    if (postId && postType) {
      loadPostData();
    }
  }, [postId, postType]);

  const loadPostData = async () => {
    if (!postId || !postType) return;

    setLoading(true);
    try {
      let postData = null;

      if (postType === "procedure") {
        const reviews = await loadProcedureReviews(100);
        postData = reviews.find((r: any) => r.id === postId);
      } else if (postType === "hospital") {
        const reviews = await loadHospitalReviews(100);
        postData = reviews.find((r: any) => r.id === postId);
      } else if (postType === "concern") {
        const posts = await loadConcernPosts(100);
        postData = posts.find((p: any) => p.id === postId);
      }

      if (postData) {
        setPost(postData);
        // 댓글 수 조회
        const count = await getCommentCount(postId, postType);
        setCommentCount(count);
      }
    } catch (error) {
      console.error("게시글 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = async () => {
    if (postId && postType) {
      const count = await getCommentCount(postId, postType);
      setCommentCount(count);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-500">로딩 중...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-500">게시글을 찾을 수 없습니다.</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const getDisplayName = (): string => {
    return post.username || post.author_name || "익명";
  };

  const getAvatar = (): string => {
    if (post.avatar_url) return post.avatar_url;
    if (post.avatar) return post.avatar;
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* 상단 헤더 */}
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">게시글</h1>
        </div>
      </div>

      {/* 게시글 내용 */}
      <div className="px-4 py-6 pb-20">
        {/* 카테고리 태그 */}
        <div className="mb-4">
          <span className="inline-flex items-center bg-gradient-to-r from-primary-light/20 to-primary-main/10 text-primary-main px-3 py-1.5 rounded-full text-xs font-semibold border border-primary-main/20">
            {post.category}
          </span>
        </div>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-light/30 to-primary-main/20 rounded-full flex items-center justify-center text-2xl shadow-sm ring-2 ring-white">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt={getDisplayName()}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getAvatar()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">
                {getDisplayName()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {post.timestamp || (post.created_at ? formatTimeAgo(post.created_at) : "")}
              </span>
              {post.edited && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  수정됨
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 제목 (고민글인 경우) */}
        {postType === "concern" && post.title && (
          <h2 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
            {post.title}
          </h2>
        )}

        {/* 게시글 내용 */}
        <div className="mb-6">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* 이미지 */}
        {post.images && post.images.length > 0 && (
          <div className="grid gap-2 mb-6 rounded-xl overflow-hidden">
            {post.images.map((img: string, idx: number) => (
              <div
                key={idx}
                className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden aspect-video"
              >
                {img &&
                (img.startsWith("http") ||
                  img.startsWith("blob:") ||
                  img.startsWith("/")) ? (
                  <Image
                    src={img}
                    alt={`게시글 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 참여 지표 */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 mb-6">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiHeart className="text-base" />
            <span className="text-xs font-medium">{post.likes || post.upvotes || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <FiMessageCircle className="text-base" />
            <span className="text-xs font-medium">{commentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <FiEye className="text-sm" />
            <span className="text-xs">{post.views?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">댓글 ({commentCount})</h3>
          
          {/* 댓글 작성 폼 */}
          <div className="mb-6">
            <CommentForm
              postId={postId!}
              postType={postType!}
              onSuccess={handleCommentAdded}
            />
          </div>

          {/* 댓글 목록 */}
          <CommentList
            postId={postId!}
            postType={postType!}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <PostDetailContent />
    </Suspense>
  );
}

