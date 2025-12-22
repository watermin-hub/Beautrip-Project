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
  getCommentCount,
  incrementViewCount,
  getViewCount,
} from "@/lib/api/beautripApi";
import { formatTimeAgo, formatAbsoluteTime } from "@/lib/utils/timeFormat";
import { maskNickname } from "@/lib/utils/nicknameMask";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import LoginRequiredPopup from "./LoginRequiredPopup";

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
  const [commentCount, setCommentCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [userLocale, setUserLocale] = useState<string | null>(null);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          
          // 댓글 수 로드
          const commentCountResult = await getCommentCount(reviewId, "procedure");
          setCommentCount(commentCountResult);
          
          // 조회수 증가 및 조회
          await incrementViewCount(reviewId, "procedure");
          const views = await getViewCount(reviewId, "procedure");
          setViewCount(views);
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
    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginRequiredPopup(true);
      return;
    }

    try {
      const result = await togglePostLike(reviewId, "treatment_review");
      if (result.success) {
        setIsLiked(result.isLiked);
        const newCount = await getPostLikeCount(reviewId, "treatment_review");
        setLikeCount(newCount);
      } else {
        if (result.error?.includes("로그인이 필요")) {
          setShowLoginRequiredPopup(true);
        }
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  const handleCommentAdded = async () => {
    if (reviewId) {
      const count = await getCommentCount(reviewId, "procedure");
      setCommentCount(count);
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
          <h1 className="text-lg font-bold text-gray-900">{t("review.treatmentReview")}</h1>
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
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            {/* 시술명 & 병원명 */}
            <div className="space-y-3">
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
            </div>

            {/* 만족도 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">{t("label.procedureSatisfaction")}</span>
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
                <span className="text-xs text-gray-500">{t("label.hospitalSatisfaction")}</span>
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

            {/* 성별 & 연령대 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">{t("label.gender")}</span>
                <p className="text-base text-gray-900 mt-1">
                  {review.gender === "남"
                    ? t("label.genderMale")
                    : review.gender === "여"
                    ? t("label.genderFemale")
                    : review.gender}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t("label.age")}</span>
                <p className="text-base text-gray-900 mt-1">
                  {(() => {
                    if (!review.age_group) return "";
                    // "20대", "30대" 등의 형식에서 숫자 부분 추출
                    const ageMatch = review.age_group.match(/^(\d+)/);
                    if (ageMatch) {
                      const ageKey = `label.age${ageMatch[1]}s`;
                      const translated = t(ageKey);
                      // 번역 키가 존재하면 사용, 없으면 원본 반환
                      return translated !== ageKey ? translated : review.age_group;
                    }
                    return review.age_group;
                  })()}
                </p>
              </div>
            </div>

            {/* 비용 */}
            {review.cost !== undefined && review.cost !== null && (
              <div>
                <span className="text-xs text-gray-500">{t("label.cost")}</span>
                <p className="text-base text-gray-900 mt-1">
                  {review.cost.toLocaleString()}만원
                </p>
              </div>
            )}

            {/* 시술 날짜 */}
            {review.surgery_date && (
              <div>
                <span className="text-xs text-gray-500">{t("label.surgeryDate")}</span>
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
        </div>

        {/* 글 내용 */}
        <div className="px-4 py-6 border-b border-gray-100">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
            {review.content}
          </p>
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
            <span className="text-sm font-medium">{commentCount}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-600">
            <FiEye className="text-xl" />
            <span className="text-sm font-medium">{viewCount}</span>
          </button>

          <button
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: t("review.shareTitle").replace("{procedureName}", review.procedure_name),
                    text: review.content.slice(0, 100),
                    url: window.location.href,
                  });
                } else {
                  // 공유 API가 없으면 URL 복사
                  await navigator.clipboard.writeText(window.location.href);
                  alert(t("alert.linkCopiedShort"));
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

        {/* 댓글 섹션 */}
        <div className="px-4 py-6 pb-24 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {t("comment.title")} ({commentCount})
          </h3>
          
          {/* 댓글 작성 폼 */}
          <div className="mb-6">
            <CommentForm
              postId={reviewId}
              postType="procedure"
              onSuccess={handleCommentAdded}
            />
          </div>

          {/* 댓글 목록 */}
          <CommentList
            postId={reviewId}
            postType="procedure"
            onCommentAdded={handleCommentAdded}
            refreshKey={commentCount}
          />
        </div>
      </div>
      <BottomNavigation />

      {/* 로그인 필요 팝업 */}
      {showLoginRequiredPopup && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setShowLoginRequiredPopup(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl pointer-events-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {t("common.loginRequired")}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t("common.loginRequiredMoreInfo")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginRequiredPopup(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginRequiredPopup(false);
                      setShowLoginRequiredPopup(true);
                    }}
                    className="flex-1 py-2.5 px-4 bg-primary-main hover:bg-primary-main/90 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.login")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 로그인 모달 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
          setIsLoggedIn(true);
        }}
      />
    </div>
  );
}
