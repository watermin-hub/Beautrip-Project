"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiArrowUp, FiMessageCircle, FiEye, FiHeart, FiChevronRight } from "react-icons/fi";

interface ReviewPost {
  id: number;
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
}

// 인기 리뷰 데이터 (조회수/좋아요 기준 상위)
const popularReviews: ReviewPost[] = [
  {
    id: 1,
    category: "후기",
    username: "베소통리소",
    avatar: "🐹",
    content: "원래 눈 라인이 마음에 들지 않아서 재수술을 고민하게 되었어요 첫 수술로 잡았던 라인이 너무 낮기도 하고 여전히 눈매가 흐릿해...",
    images: ["eye1", "eye2"],
    timestamp: "18시간 전",
    upvotes: 62,
    comments: 198,
    views: 5722,
  },
  {
    id: 5,
    category: "후기",
    username: "뷰티러버",
    avatar: "✨",
    content: "강남역 근처 클리닉에서 리쥬란 힐러 받고 왔어요! 처음 받아보는 거라 조금 걱정됐는데 원장님이 친절하게 설명해주셔서...",
    images: ["skin1"],
    timestamp: "2일 전",
    upvotes: 45,
    comments: 72,
    views: 3200,
    likes: 120,
  },
  {
    id: 2,
    category: "후기",
    username: "홀짝댄스",
    avatar: "🐱",
    content: "비티에서 윤곽3종이랑 무보형물로 코수술 하고 왔당 ㅎㅎㅎㅎ 코는 이승호원장님, 윤곽...",
    images: ["face1", "face2"],
    timestamp: "1일 전",
    upvotes: 29,
    comments: 58,
    views: 2648,
  },
  {
    id: 4,
    category: "후기",
    username: "춤추는아미고",
    avatar: "🦊",
    content: "와.. 티타늄 맛집은 테이아였네?? ;; 나 요즘 턱선이랑 볼살이 너무 축 처져서 테이아의원에서 티타늄리프팅 받아봤거...",
    images: ["before", "after"],
    timestamp: "1일 전",
    upvotes: 29,
    comments: 50,
    views: 2604,
  },
];

export default function PopularReviewsSection() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleReviewClick = () => {
    router.push("/community?tab=review");
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/community?tab=review");
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

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {popularReviews.map((review) => (
          <button
            key={review.id}
            onClick={handleReviewClick}
            className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left"
          >
            {/* 이미지 영역 */}
            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {review.images && review.images.length > 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  이미지
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                  이미지 없음
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
                  <FiArrowUp className="text-primary-main text-sm" />
                  <span className="text-xs">{review.upvotes}</span>
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
                {review.likes && (
                  <div className="flex items-center gap-1 text-gray-600 ml-auto">
                    <FiHeart className="text-primary-main fill-primary-main text-sm" />
                    <span className="text-xs">{review.likes}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

