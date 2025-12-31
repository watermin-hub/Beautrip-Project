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
import { supabase } from "@/lib/supabase";
import LoginRequiredPopup from "./LoginRequiredPopup";

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

export default function PopularReviewsSection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [popularReviews, setPopularReviews] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsLoggedIn(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const loadPopularReviews = async () => {
      try {
        setLoading(true);

        // Supabase에서 모든 후기 가져오기 (인기글은 더 많은 데이터를 가져와서 필터링 후 정렬)
        const [procedureReviews, hospitalReviews] = await Promise.all([
          loadProcedureReviews(100),
          loadHospitalReviews(100),
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
            // ✅ procedure_reviews 테이블의 views 컬럼 직접 사용
            views: review.views || 0,
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
            // ✅ hospital_reviews 테이블의 views 컬럼 직접 사용
            views: review.views || 0,
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
              // ✅ 이미 가져온 views 값 사용 (별도 API 호출 불필요)
              return { 
                ...post, 
                likeCount: 0, 
                commentCount: 0, 
                viewCount: post.views || 0 
              };
            }

            const postType =
              post.reviewType === "procedure"
                ? "treatment_review"
                : "hospital_review";

            try {
              // ✅ views는 이미 가져왔으므로 좋아요와 댓글만 추가로 가져오기
              const [likeCount, commentCount] = await Promise.all([
                getPostLikeCount(postId, postType),
                getCommentCount(
                  postId,
                  post.reviewType === "procedure" ? "procedure" : "hospital"
                ),
                // getViewCount() 제거 - 이미 review.views로 가져왔음
              ]);

              return {
                ...post,
                likes: likeCount,
                comments: commentCount,
                // ✅ 이미 가져온 views 값 사용 (별도 API 호출 불필요)
                views: post.views || 0,
                upvotes: likeCount,
                likeCount,
                commentCount,
                viewCount: post.views || 0, // 인기도 계산용
              };
            } catch (error) {
              console.error(`통계 로드 실패 (${postId}):`, error);
              // ✅ 에러 시에도 이미 가져온 views 값 사용
              return { 
                ...post, 
                likeCount: 0, 
                commentCount: 0, 
                viewCount: post.views || 0 
              };
            }
          })
        );

        // 인기글 정렬 (커뮤니티 인기글과 동일한 로직)
        const sortedReviews = reviewsWithStats
          .filter((post: any) => {
            // 인기 탭에서는 조회수, 좋아요, 댓글 중 하나라도 있으면 표시
            // 모든 값이 0인 게시물만 제외
            const viewCount = post.viewCount ?? 0;
            const likeCount = post.likeCount ?? 0;
            const commentCount = post.commentCount ?? 0;
            return viewCount > 0 || likeCount > 0 || commentCount > 0;
          })
          .sort((a: any, b: any) => {
            // 0순위: 이미지가 있는 게시물 우선 (이미지 개수 많은 순)
            const aHasImages = a.images && a.images.length > 0;
            const bHasImages = b.images && b.images.length > 0;
            if (aHasImages && !bHasImages) return -1;
            if (!aHasImages && bHasImages) return 1;
            if (aHasImages && bHasImages) {
              const imageDiff = (b.images?.length || 0) - (a.images?.length || 0);
              if (imageDiff !== 0) return imageDiff;
            }
            
            // 1순위: 조회수 높은 순
            const viewDiff = b.viewCount - a.viewCount;
            if (viewDiff !== 0) return viewDiff;
            
            // 2순위: 조회수가 같으면 좋아요 많은 순
            const likeDiff = b.likeCount - a.likeCount;
            if (likeDiff !== 0) return likeDiff;
            
            // 3순위: 좋아요도 같으면 댓글 많은 순
            return b.commentCount - a.commentCount;
          })
          .slice(0, 4) // 상위 4개만
          .map(({ likeCount, commentCount, viewCount, created_at, ...rest }: any) => rest);

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
    // 후기 조회는 로그인 없이도 가능해야 함
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
    // 후기 목록 조회는 로그인 없이도 가능해야 함
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
                review.images.length === 2 ? (
                  // 이미지가 2장일 때 좌우로 나눠서 표시
                  <div className="w-full h-full flex gap-0.5">
                    <div className="flex-1 relative overflow-hidden">
                      <img
                        src={review.images[0]}
                        alt={review.content.substring(0, 20)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                      <img
                        src={review.images[1]}
                        alt={review.content.substring(0, 20)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  // 이미지가 1장이거나 3장 이상일 때 첫 번째 이미지만 표시
                  <img
                    src={review.images[0]}
                    alt={review.content.substring(0, 20)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                  {t("common.noData")}
                </div>
              )}
              {/* 카테고리 태그 */}
              <div className="absolute top-3 left-3 z-10">
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

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setShowLoginRequiredPopup(false);
        }}
      />
    </div>
  );
}

