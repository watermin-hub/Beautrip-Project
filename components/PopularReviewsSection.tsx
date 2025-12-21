"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiMessageCircle, FiEye, FiHeart, FiChevronRight, FiArrowUp } from "react-icons/fi";
import {
  loadProcedureReviews,
  loadHospitalReviews,
  ProcedureReviewData,
  HospitalReviewData,
  getPostLikeCount,
  getCommentCount,
  getViewCount,
} from "@/lib/api/beautripApi";
import { maskNickname } from "@/lib/utils/nicknameMask";

interface ReviewPost {
  id: number | string;
  category: string;
  username: string;
  avatar: string;
  content: string;
  images?: string[];
  timestamp: string;
  upvotes: number;
  comments: number;
  views: number;
  likes?: number;
  reviewType?: "procedure" | "hospital";
  procedure_name?: string;
  hospital_name?: string;
}

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return "시간 정보 없음";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${Math.floor(diffDays / 7)}주 전`;
};

// 인기글 점수 계산 함수 (PostList와 동일)
const calculatePopularityScore = (
  viewCount: number,
  likeCount: number,
  commentCount: number,
  createdAt?: string
): number => {
  const baseScore = viewCount * 1 + likeCount * 3 + commentCount * 2;
  let timeMultiplier = 1.0;
  if (createdAt) {
    const postDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff <= 24) {
      timeMultiplier = 1.5;
    } else if (hoursDiff <= 168) {
      timeMultiplier = 1.3;
    } else if (hoursDiff <= 720) {
      timeMultiplier = 1.1;
    }
  }
  return baseScore * timeMultiplier;
};

export default function PopularReviewsSection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [popularReviews, setPopularReviews] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularReviews = async () => {
      try {
        setLoading(true);

        // Supabase에서 모든 후기 가져오기
        const [procedureReviews, hospitalReviews] = await Promise.all([
          loadProcedureReviews(20),
          loadHospitalReviews(20),
        ]);

        // 시술 후기 변환
        const formattedProcedureReviews: ReviewPost[] = procedureReviews.map(
          (review: ProcedureReviewData) => ({
            id: review.id || `procedure-${Math.random()}`,
            category: review.category || "후기",
            username: maskNickname((review as any).nickname),
            avatar: "👤",
            content: review.content,
            images: review.images,
            timestamp: formatTimeAgo(review.created_at),
            upvotes: 0,
            comments: 0,
            views: 0,
            reviewType: "procedure" as const,
            procedure_name: review.procedure_name,
            hospital_name: review.hospital_name,
            created_at: review.created_at,
          })
        );

        // 병원 후기 변환
        const formattedHospitalReviews: ReviewPost[] = hospitalReviews.map(
          (review: HospitalReviewData) => ({
            id: review.id || `hospital-${Math.random()}`,
            category: review.category_large || "병원후기",
            username: maskNickname((review as any).nickname),
            avatar: "👤",
            content: review.content,
            images: review.images,
            timestamp: formatTimeAgo(review.created_at),
            upvotes: 0,
            comments: 0,
            views: 0,
            reviewType: "hospital" as const,
            hospital_name: review.hospital_name,
            procedure_name: review.procedure_name,
            created_at: review.created_at,
          })
        );

        const allReviews = [...formattedProcedureReviews, ...formattedHospitalReviews];

        // 좋아요, 댓글, 조회수 로드
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const reviewsWithStats = await Promise.all(
          allReviews.map(async (post) => {
            const postId = String(post.id);
            if (!uuidRegex.test(postId)) {
              return { ...post, likeCount: 0, commentCount: 0, viewCount: 0 };
            }

            const postType =
              post.reviewType === "procedure"
                ? "treatment_review"
                : "hospital_review";

            try {
              const [likeCount, commentCount, viewCount] = await Promise.all([
                getPostLikeCount(postId, postType),
                getCommentCount(
                  postId,
                  post.reviewType === "procedure" ? "procedure" : "hospital"
                ),
                getViewCount(
                  postId,
                  post.reviewType === "procedure" ? "procedure" : "hospital"
                ),
              ]);

              return {
                ...post,
                likes: likeCount,
                comments: commentCount,
                views: viewCount,
                upvotes: likeCount,
                likeCount,
                commentCount,
                viewCount,
              };
            } catch (error) {
              console.error(`통계 로드 실패 (${postId}):`, error);
              return { ...post, likeCount: 0, commentCount: 0, viewCount: 0 };
            }
          })
        );

        // 인기글 점수 계산 및 정렬
        const sortedReviews = reviewsWithStats
          .map((post: any) => {
            const score = calculatePopularityScore(
              post.viewCount || 0,
              post.likeCount || 0,
              post.commentCount || 0,
              post.created_at
            );
            return { ...post, popularityScore: score };
          })
          .sort((a: any, b: any) => b.popularityScore - a.popularityScore)
          .slice(0, 4) // 상위 4개만
          .map(({ popularityScore, likeCount, commentCount, viewCount, created_at, ...rest }: any) => rest);

        setPopularReviews(sortedReviews);
      } catch (error) {
        console.error("❌ 인기글 데이터 로드 실패:", error);
        setPopularReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadPopularReviews();
  }, []);

  const handleReviewClick = (post: ReviewPost) => {
    if (post.reviewType && post.id) {
      const postId = String(post.id);
      if (post.reviewType === "procedure") {
        router.push(`/review/procedure/${postId}`);
      } else if (post.reviewType === "hospital") {
        router.push(`/review/hospital/${postId}`);
      }
    } else {
      router.push("/community?tab=popular");
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/community?tab=popular");
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{t("home.trendingReviews")}</h3>
        <button
          onClick={handleMoreClick}
          className="text-sm text-primary-main font-medium flex items-center gap-1 hover:text-primary-dark transition-colors"
        >
          {t("home.reviewMore")}
          <FiChevronRight className="text-xs" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t("common.loading")}
        </div>
      ) : popularReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t("common.noData")}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {popularReviews.map((review) => (
            <button
              key={review.id}
              onClick={() => handleReviewClick(review)}
              className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left"
            >
            {/* 이미지 영역 */}
            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
              {review.images && review.images.length > 0 ? (
                <img
                  src={review.images[0]}
                  alt={review.content.substring(0, 20)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                  {t("common.noData")}
                </div>
              )}
              {/* 카테고리 태그 */}
              <div className="absolute top-3 left-3">
                <span className="bg-primary-main text-white px-2 py-1 rounded-full text-xs font-medium">
                  {review.category}
                </span>
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="p-3">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {review.avatar}
                </div>
                <span className="text-xs font-semibold text-gray-900">
                  {review.username}
                </span>
                <span className="text-xs text-gray-500">{review.timestamp}</span>
              </div>

              {/* 리뷰 내용 */}
              <p className="text-sm text-gray-800 mb-3 line-clamp-2 leading-relaxed">
                {review.content}
              </p>

              {/* 참여 지표 */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-gray-600">
                  <FiHeart className="text-primary-main fill-primary-main text-sm" />
                  <span className="text-xs">{review.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <FiMessageCircle className="text-primary-main text-sm" />
                  <span className="text-xs">{review.comments}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <FiEye className="text-gray-400 text-sm" />
                  <span className="text-xs text-gray-400">
                    {review.views.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
        </div>
      )}
    </div>
  );
}

