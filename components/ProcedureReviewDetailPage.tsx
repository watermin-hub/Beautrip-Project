"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiStar,
  FiHeart,
  FiMessageCircle,
  FiEye,
  FiShare2,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import Image from "next/image";
import {
  getProcedureReview,
  ProcedureReviewData,
  togglePostLike,
  isPostLiked,
  getPostLikeCount,
} from "@/lib/api/beautripApi";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

interface ProcedureReviewDetailPageProps {
  reviewId: string;
}

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return "방금 전";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function ProcedureReviewDetailPage({
  reviewId,
}: ProcedureReviewDetailPageProps) {
  const router = useRouter();
  const [review, setReview] = useState<ProcedureReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const loadReview = async () => {
      try {
        setLoading(true);
        const data = await getProcedureReview(reviewId);
        setReview(data);

        if (data) {
          // 좋아요 상태 및 개수 로드
          const [liked, count] = await Promise.all([
            isPostLiked(reviewId, "procedure_review"),
            getPostLikeCount(reviewId, "procedure_review"),
          ]);
          setIsLiked(liked);
          setLikeCount(count);
        }
      } catch (error) {
        console.error("후기 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [reviewId]);

  const handleLike = async () => {
    try {
      const result = await togglePostLike(reviewId, "procedure_review");
      if (result.success) {
        setIsLiked(result.isLiked);
        const newCount = await getPostLikeCount(reviewId, "procedure_review");
        setLikeCount(newCount);
      } else {
        if (result.error?.includes("로그인이 필요")) {
          alert("로그인이 필요합니다.");
        }
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto w-full flex items-center justify-center py-20">
          <div className="text-gray-500">후기를 불러오는 중...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto w-full flex items-center justify-center py-20">
          <div className="text-gray-500">후기를 찾을 수 없습니다.</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-md mx-auto w-full bg-white">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">시술 후기</h1>
        </div>

        {/* 카테고리 태그 */}
        <div className="px-4 pt-4">
          <span className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-xs font-medium">
            {review.category}
          </span>
        </div>

        {/* 작성자 정보 */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
            <FiUser />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">
              사용자{review.user_id?.slice(0, 8) || "익명"}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(review.created_at)}
            </div>
          </div>
        </div>

        {/* 시술 정보 */}
        <div className="px-4 py-4 space-y-3 border-b border-gray-100">
          <div>
            <span className="text-xs text-gray-500">시술명</span>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {review.procedure_name}
            </p>
          </div>

          {review.hospital_name && (
            <div>
              <span className="text-xs text-gray-500">병원명</span>
              <p className="text-base text-gray-900 mt-1">
                {review.hospital_name}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">시술 만족도</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-lg ${
                      star <= review.procedure_rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-700 ml-1">
                  {review.procedure_rating}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500">병원 만족도</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-lg ${
                      star <= review.hospital_rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-700 ml-1">
                  {review.hospital_rating}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">성별</span>
              <p className="text-base text-gray-900 mt-1">{review.gender}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">연령</span>
              <p className="text-base text-gray-900 mt-1">{review.age_group}</p>
            </div>
          </div>

          {review.cost && (
            <div>
              <span className="text-xs text-gray-500">비용</span>
              <p className="text-base text-gray-900 mt-1">
                {review.cost.toLocaleString()}만원
              </p>
            </div>
          )}

          {review.surgery_date && (
            <div>
              <span className="text-xs text-gray-500">시술 날짜</span>
              <div className="flex items-center gap-1 mt-1">
                <FiCalendar className="text-gray-400 text-sm" />
                <p className="text-base text-gray-900">
                  {new Date(review.surgery_date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 글 내용 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {review.content}
          </p>
        </div>

        {/* 이미지 */}
        {review.images && review.images.length > 0 && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div
              className={`grid gap-2 ${
                review.images.length === 1
                  ? "grid-cols-1"
                  : review.images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2"
              }`}
            >
              {review.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                    review.images!.length === 1 ? "max-h-96" : ""
                  }`}
                >
                  <Image
                    src={img}
                    alt={`후기 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="px-4 py-4 flex items-center gap-4 border-b border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? "text-red-500" : "text-gray-600"
            }`}
          >
            <FiHeart className={`text-xl ${isLiked ? "fill-red-500" : ""}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-600">
            <FiMessageCircle className="text-xl" />
            <span className="text-sm font-medium">0</span>
          </button>

          <button className="flex items-center gap-2 text-gray-600">
            <FiEye className="text-xl" />
            <span className="text-sm font-medium">0</span>
          </button>

          <button className="flex items-center gap-2 text-gray-600 ml-auto">
            <FiShare2 className="text-xl" />
          </button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
