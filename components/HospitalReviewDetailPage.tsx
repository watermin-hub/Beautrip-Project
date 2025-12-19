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
  FiX,
} from "react-icons/fi";
import Image from "next/image";
import {
  getHospitalReview,
  HospitalReviewData,
  togglePostLike,
  isPostLiked,
  getPostLikeCount,
} from "@/lib/api/beautripApi";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

interface HospitalReviewDetailPageProps {
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

export default function HospitalReviewDetailPage({
  reviewId,
}: HospitalReviewDetailPageProps) {
  const router = useRouter();
  const [review, setReview] = useState<HospitalReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    const loadReview = async () => {
      try {
        setLoading(true);
        console.log("후기 로드 시작, reviewId:", reviewId);
        const data = await getHospitalReview(reviewId);
        console.log("후기 데이터:", data);
        setReview(data);

        if (data) {
          // 좋아요 상태 및 개수 로드
          const [liked, count] = await Promise.all([
            isPostLiked(reviewId, "hospital_review"),
            getPostLikeCount(reviewId, "hospital_review"),
          ]);
          setIsLiked(liked);
          setLikeCount(count);
        } else {
          console.warn("후기 데이터가 없습니다. reviewId:", reviewId);
        }
      } catch (error) {
        console.error("후기 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (reviewId) {
      loadReview();
    } else {
      console.error("reviewId가 없습니다!");
      setLoading(false);
    }
  }, [reviewId]);

  const handleLike = async () => {
    try {
      const result = await togglePostLike(reviewId, "hospital_review");
      if (result.success) {
        setIsLiked(result.isLiked);
        const newCount = await getPostLikeCount(reviewId, "hospital_review");
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
          <h1 className="text-lg font-bold text-gray-900">병원 후기</h1>
        </div>

        {/* 카테고리 태그 */}
        <div className="px-4 pt-4">
          <span className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-xs font-medium">
            {review.category_large}
          </span>
        </div>

        {/* 작성자 정보 */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
            <FiUser />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">
              {(review as any).nickname || "익명"}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(review.created_at)}
            </div>
          </div>
        </div>

        {/* 병원 정보 */}
        <div className="px-4 py-4 space-y-3 border-b border-gray-100">
          <div>
            <span className="text-xs text-gray-500">병원명</span>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {review.hospital_name}
            </p>
          </div>

          {review.procedure_name && (
            <div>
              <span className="text-xs text-gray-500">시술명</span>
              <p className="text-base text-gray-900 mt-1">
                {review.procedure_name}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {review.overall_satisfaction && (
              <div>
                <span className="text-xs text-gray-500">시술 만족도</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`text-lg ${
                        star <= review.overall_satisfaction!
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-700 ml-1">
                    {review.overall_satisfaction}
                  </span>
                </div>
              </div>
            )}

            {review.hospital_kindness && (
              <div>
                <span className="text-xs text-gray-500">병원 만족도</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`text-lg ${
                        star <= review.hospital_kindness!
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-700 ml-1">
                    {review.hospital_kindness}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="text-xs text-gray-500">통역 여부</span>
            <p className="text-base text-gray-900 mt-1">
              {review.has_translation ? "있음" : "없음"}
            </p>
          </div>

          {review.has_translation && review.translation_satisfaction && (
            <div>
              <span className="text-xs text-gray-500">통역 만족도</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-lg ${
                      star <= review.translation_satisfaction!
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-700 ml-1">
                  {review.translation_satisfaction}
                </span>
              </div>
            </div>
          )}

          {review.visit_date && (
            <div>
              <span className="text-xs text-gray-500">병원 방문일</span>
              <div className="flex items-center gap-1 mt-1">
                <FiCalendar className="text-gray-400 text-sm" />
                <p className="text-base text-gray-900">
                  {new Date(review.visit_date).toLocaleDateString("ko-KR", {
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
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                    review.images!.length === 1 ? "max-h-96" : ""
                  }`}
                >
                  <Image
                    src={img}
                    alt={`후기 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      // 이미지 로딩 실패 시 처리
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이미지 갤러리 모달 */}
        {selectedImageIndex !== null && review.images && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <FiX className="text-2xl" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={review.images[selectedImageIndex]}
                alt={`후기 이미지 ${selectedImageIndex + 1}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain"
                unoptimized
              />
              {review.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(
                        selectedImageIndex > 0
                          ? selectedImageIndex - 1
                          : review.images!.length - 1
                      );
                    }}
                    className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(
                        selectedImageIndex < review.images!.length - 1
                          ? selectedImageIndex + 1
                          : 0
                      );
                    }}
                    className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                    {selectedImageIndex + 1} / {review.images.length}
                  </div>
                </>
              )}
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

          <button
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: `${review.hospital_name} 병원 후기`,
                    text: review.content.slice(0, 100),
                    url: window.location.href,
                  });
                } else {
                  // 공유 API가 없으면 URL 복사
                  await navigator.clipboard.writeText(window.location.href);
                  alert("링크가 복사되었습니다!");
                }
              } catch (error) {
                console.error("공유 실패:", error);
              }
            }}
            className="flex items-center gap-2 text-gray-600 ml-auto hover:text-primary-main transition-colors"
          >
            <FiShare2 className="text-xl" />
          </button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
