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
  getProcedureReview,
  ProcedureReviewData,
  togglePostLike,
  isPostLiked,
  getPostLikeCount,
  getUserProfile,
} from "@/lib/api/beautripApi";
import { formatTimeAgo, formatAbsoluteTime } from "@/lib/utils/timeFormat";
import { maskNickname } from "@/lib/utils/nicknameMask";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

interface ProcedureReviewDetailPageProps {
  reviewId: string;
}

export default function ProcedureReviewDetailPage({
  reviewId,
}: ProcedureReviewDetailPageProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [review, setReview] = useState<ProcedureReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [userLocale, setUserLocale] = useState<string | null>(null);

  useEffect(() => {
    const loadReview = async () => {
      try {
        setLoading(true);
        console.log("후기 로드 시작, reviewId:", reviewId);

        // 사용자 프로필 로드 (timezone, locale)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile) {
            setUserTimezone(profile.timezone || null);
            setUserLocale(profile.locale || null);
          }
        }

        const data = await getProcedureReview(reviewId);
        console.log("후기 데이터:", data);
        console.log("[ProcedureReviewDetailPage] nickname 확인:", {
          reviewId: reviewId,
          nickname: (data as any)?.nickname,
          user_id: data?.user_id,
        });
        setReview(data);

        if (data) {
          // 좋아요 상태 및 개수 로드
          const [liked, count] = await Promise.all([
            isPostLiked(reviewId, "treatment_review"),
            getPostLikeCount(reviewId, "treatment_review"),
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
      const result = await togglePostLike(reviewId, "treatment_review");
      if (result.success) {
        setIsLiked(result.isLiked);
        const newCount = await getPostLikeCount(reviewId, "treatment_review");
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
        <div className="sticky top-[48px] bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10 px-4 py-4 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">시술 후기</h1>
        </div>

        {/* 카테고리 태그 */}
        <div className="px-4 pt-16 pb-2">
          <span className="inline-flex items-center bg-gradient-to-r from-primary-light/20 to-primary-main/10 text-primary-main px-4 py-2 rounded-full text-xs font-semibold border border-primary-main/20">
            {review.category}
          </span>
        </div>

        {/* 작성자 정보 */}
        <div className="px-4 py-4 flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-light/30 to-primary-main/20 rounded-full flex items-center justify-center text-2xl shadow-md ring-2 ring-white">
              <FiUser />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-gray-900 mb-1">
              {maskNickname((review as any).nickname)}
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <div className="font-medium">
                {formatTimeAgo(review.created_at)}
              </div>
              {review.created_at && (
                <div className="text-xs text-gray-400">
                  {formatAbsoluteTime(
                    review.created_at,
                    userTimezone,
                    userLocale
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 시술 정보 */}
        <div className="px-4 py-4 space-y-3 border-b border-gray-100">
          <div>
            <span className="text-xs text-gray-500">
              {t("label.procedureName")}
            </span>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {review.procedure_name}
            </p>
          </div>

          {review.hospital_name && (
            <div>
              <span className="text-xs text-gray-500">
                {t("label.hospitalName")}
              </span>
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
              <span className="text-xs text-gray-500">{t("label.gender")}</span>
              <p className="text-base text-gray-900 mt-1">{review.gender}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t("label.age")}</span>
              <p className="text-base text-gray-900 mt-1">{review.age_group}</p>
            </div>
          </div>

          {review.cost && (
            <div>
              <span className="text-xs text-gray-500">{t("label.cost")}</span>
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
        <div className="px-4 py-6 border-b border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
              {review.content}
            </p>
          </div>
        </div>

        {/* 이미지 */}
        {review.images && review.images.length > 0 && (
          <div className="px-4 py-6 border-b border-gray-100">
            <div
              className={`grid gap-3 ${
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
                  className={`relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden cursor-pointer group/image shadow-md hover:shadow-xl transition-all duration-300 ${
                    review.images!.length === 1
                      ? "aspect-video"
                      : "aspect-square"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`후기 이미지 ${idx + 1}`}
                    fill
                    className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                    unoptimized
                    onError={(e) => {
                      // 이미지 로딩 실패 시 처리
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300"></div>
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
                    title: `${review.procedure_name} 시술 후기`,
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
