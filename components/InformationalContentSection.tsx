"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiBook, FiChevronRight } from "react-icons/fi";
import {
  getAllRecoveryGuides,
  type RecoveryGuidePost,
} from "@/lib/content/recoveryGuidePosts";
import { supabase } from "@/lib/supabase";
import LoginRequiredPopup from "./LoginRequiredPopup";
import ReviewRequiredPopup from "./ReviewRequiredPopup";
import CommunityWriteModal from "./CommunityWriteModal";
import { hasUserWrittenReview } from "@/lib/api/beautripApi";
import { trackContentPdpView } from "@/lib/gtm";

interface ContentItem {
  id: number | string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  readTime?: string;
  views?: number;
  slug?: string; // 회복 가이드용 slug
}

export default function InformationalContentSection() {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  // 홈 페이지: RankingBanner(41px) + Header(48px) = 89px
  // 커뮤니티 페이지: Header(48px) + CommunityHeader(56px) = 104px
  const stickyTop = pathname === "/" || pathname === "/home" ? "89px" : "104px";

  // 정보성 컨텐츠 데이터 (언어별 번역 적용)
  const informationalContents: ContentItem[] = [
    {
      id: "top20",
      title: t("community.top20.title"),
      description: t("community.top20.description"),
      category: t("home.category.guide"),
      readTime: "5",
      views: 2341,
      slug: "top20", // 라우팅용 slug
      thumbnail:
        "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/top20/top20_kr.png", // 썸네일 이미지
    },
    {
      id: "travel-recommendation",
      title: t("community.travelRecommendation.title"),
      description: t("community.travelRecommendation.subtitle"),
      category: t("home.category.guide"),
      readTime: "6",
      views: 1892,
      slug: "travel-recommendation",
      thumbnail:
        "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HAN01.png",
    },
  ];
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [recoveryGuidePosts, setRecoveryGuidePosts] = useState<
    RecoveryGuidePost[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [showReviewRequiredPopup, setShowReviewRequiredPopup] = useState(false);
  const [showCommunityWriteModal, setShowCommunityWriteModal] = useState(false);

  // 로그인 상태 확인 및 리뷰 작성 이력 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsLoggedIn(false);
        setHasWrittenReview(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      // 로그인 상태일 때 리뷰 작성 이력 확인
      if (loggedIn && session?.user) {
        const hasReview = await hasUserWrittenReview(session.user.id);
        setHasWrittenReview(hasReview);
      } else {
        setHasWrittenReview(false);
      }
    };
    checkAuth();
  }, []);

  // 카테고리 변경 시 더보기 상태 리셋
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowAll(false);
  };

  // 회복 가이드 글 가져오기 (언어별)
  useEffect(() => {
    const loadGuides = async () => {
      setLoading(true);
      try {
        const guides = await getAllRecoveryGuides(language);
        setRecoveryGuidePosts(guides);
      } catch (error) {
        console.error("Failed to load recovery guides:", error);
        setRecoveryGuidePosts([]);
      } finally {
        setLoading(false);
      }
    };
    loadGuides();
  }, [language]);

  // 카테고리 키 가져오기
  const guideCategoryKey = t("home.category.guide");
  const recoveryGuideCategoryKey = t("home.category.recoveryGuide");

  // 회복 가이드를 ContentItem 형식으로 변환
  const recoveryGuideItems: ContentItem[] = recoveryGuidePosts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    category: recoveryGuideCategoryKey, // 번역된 카테고리명 사용
    readTime: post.readTime,
    views: post.views || 0,
    thumbnail: post.thumbnail,
    slug: post.id,
  }));

  // 모든 컨텐츠 합치기 (정보 + 회복 가이드)
  const allContents: ContentItem[] = [
    ...informationalContents,
    ...recoveryGuideItems,
  ];

  const categories = ["all", guideCategoryKey, recoveryGuideCategoryKey];

  const filteredContents =
    selectedCategory === "all"
      ? (() => {
          // 전체 탭에서는 회복 가이드를 5개만 표시
          const recoveryGuides = allContents.filter(
            (item) => item.category === recoveryGuideCategoryKey
          );
          const otherContents = allContents.filter(
            (item) => item.category !== recoveryGuideCategoryKey
          );
          return [...otherContents, ...recoveryGuides.slice(0, 5)];
        })()
      : selectedCategory === recoveryGuideCategoryKey
      ? allContents.filter((item) => item.category === recoveryGuideCategoryKey)
      : allContents.filter((item) => item.category === selectedCategory);

  // 전체 탭에서 5개만 표시
  const displayedContents =
    selectedCategory === "all" && !showAll
      ? filteredContents.slice(0, 5)
      : filteredContents;

  const hasMore = selectedCategory === "all" && filteredContents.length > 5;

  return (
    <div className="mb-6">
      {/* 카테고리 필터 - sticky로 헤더 아래 고정 */}
      <div
        className={`sticky z-30 bg-white -mx-4 px-4`}
        style={{ top: stickyTop }}
      >
        <div className="py-2 bg-white">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-primary-main text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={{
                  backgroundColor:
                    selectedCategory === category ? undefined : "#f3f4f6",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 컨텐츠 리스트 */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t("common.loading")}
          </div>
        ) : displayedContents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {selectedCategory === recoveryGuideCategoryKey
              ? t("home.recoveryGuideEmpty")
              : t("common.noData")}
          </div>
        ) : (
          displayedContents.map((content) => {
            const isRecoveryGuide =
              content.category === recoveryGuideCategoryKey;
            return (
              <button
                key={content.id}
                onClick={() => {
                  // 회복가이드만 로그인 체크 및 팝업 표시
                  // top20과 travel-recommendation은 로그인 없이 바로 접근 가능
                  const isRecoveryGuide =
                    content.category === recoveryGuideCategoryKey;

                  // 회복가이드인 경우: 비로그인 또는 리뷰 미작성 시 ReviewRequiredPopup 표시
                  if (isRecoveryGuide && (!isLoggedIn || !hasWrittenReview)) {
                    setShowReviewRequiredPopup(true);
                    return;
                  }

                  // GTM: Content PDP 클릭 이벤트 (커뮤니티-가이드용)
                  // entry_source 구분: home (홈에서 클릭), community (커뮤니티 탭에서 클릭)
                  const entrySource =
                    pathname === "/" || pathname === "/home"
                      ? "home"
                      : pathname?.includes("/community")
                      ? "community"
                      : "home"; // 기본값은 home

                  // 클릭 시점에 entry_source를 sessionStorage에 저장 (상세 페이지에서 사용)
                  sessionStorage.setItem("content_entry_source", entrySource);

                  // 컨텐츠 타입 및 ID 설정
                  // 주의: 실제 뷰 이벤트는 상세 페이지에서 발생하므로 여기서는 저장만
                  if (isRecoveryGuide && content.slug) {
                    // 회복 가이드인 경우 - content_id는 postId 그대로 사용
                    router.push(`/community/recovery-guide/${content.slug}`);
                  } else if (content.slug === "top20") {
                    // TOP 20 정보 페이지 - content_id: "top20" (로그인 없이 접근 가능)
                    router.push(`/community/info/top20`);
                  } else if (content.slug === "travel-recommendation") {
                    // 여행지 추천 페이지 - content_id: "travel-recommendation" (로그인 없이 접근 가능)
                    router.push(`/community/info/travel-recommendation`);
                  } else {
                    // 다른 컨텐츠는 추후 구현
                    console.log("Navigate to:", content.id);
                  }
                }}
                className={`w-full bg-white border rounded-xl hover:shadow-lg hover:border-primary-main/30 transition-all duration-200 text-left group ${
                  isRecoveryGuide
                    ? "border-green-100 bg-gradient-to-br from-white to-green-50/30 p-3.5"
                    : "border-gray-200 p-3"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 썸네일 - 1:1 비율 */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-sm ${
                      isRecoveryGuide
                        ? "bg-gradient-to-br from-green-100 to-emerald-100 ring-2 ring-green-200/50"
                        : "bg-gradient-to-br from-primary-light/20 to-primary-main/30"
                    }`}
                  >
                    {content.thumbnail ? (
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className={`w-full h-full object-cover ${
                          content.slug === "top20" ? "object-top" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBook
                          className={`${
                            isRecoveryGuide
                              ? "text-emerald-600"
                              : "text-primary-main"
                          } text-lg`}
                        />
                      </div>
                    )}
                  </div>

                  {/* 컨텐츠 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isRecoveryGuide
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-primary-light/20 text-primary-main"
                        }`}
                      >
                        {content.category}
                      </span>
                      {content.readTime && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          {(() => {
                            const readTime = content.readTime || "";
                            // readTime이 이미 단위를 포함하는지 확인 (분, min, 分, 分钟)
                            const hasUnit = /[가-힣a-zA-Z分钟]+/.test(readTime);
                            return hasUnit
                              ? readTime
                              : `${readTime}${t("common.readTime")}`;
                          })()}
                        </span>
                      )}
                    </div>
                    <h4
                      className={`font-bold line-clamp-2 leading-snug mb-1.5 ${
                        isRecoveryGuide
                          ? "text-sm text-gray-900"
                          : "text-sm text-gray-900"
                      }`}
                    >
                      {content.title}
                    </h4>
                    <p className="text-gray-600 line-clamp-1 leading-relaxed text-xs mb-1.5">
                      {content.description}
                    </p>
                    {content.views !== undefined && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                        <span>
                          {t("common.views")} {content.views.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 화살표 */}
                  <div className="flex-shrink-0 mt-1">
                    <FiChevronRight
                      className={`text-sm transition-transform group-hover:translate-x-0.5 ${
                        isRecoveryGuide ? "text-emerald-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && !showAll && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
          >
            {t("common.seeMoreWithCount", {
              count: filteredContents.length - 5,
            })}
          </button>
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

      {/* 후기 작성 필요 팝업 */}
      <ReviewRequiredPopup
        isOpen={showReviewRequiredPopup}
        onClose={() => setShowReviewRequiredPopup(false)}
        onWriteClick={() => {
          setShowCommunityWriteModal(true);
        }}
      />

      {/* 커뮤니티 글 작성 모달 */}
      <CommunityWriteModal
        isOpen={showCommunityWriteModal}
        onClose={() => setShowCommunityWriteModal(false)}
        entrySource="community"
      />
    </div>
  );
}
