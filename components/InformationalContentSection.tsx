"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiBook, FiChevronRight } from "react-icons/fi";
import {
  getAllRecoveryGuides,
  type RecoveryGuidePost,
} from "@/lib/content/recoveryGuidePosts";

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

// 정보성 컨텐츠 데이터 (임시 - 추후 API 연동)
const informationalContents: ContentItem[] = [
  {
    id: 4,
    title: "통역 서비스 이용 가이드",
    description: "한국어가 서툰 외국인을 위한 통역 서비스 안내",
    category: "정보",
    readTime: "4분",
    views: 1567,
  },
  {
    id: "top20",
    title: "외국인 여행객을 위한 한국 인기 시술 정보 TOP 20!",
    description:
      "한국을 방문하는 외국인 여행객을 위한 인기 시술 정보를 한눈에 확인하세요",
    category: "정보",
    readTime: "5분",
    views: 2341,
    slug: "top20", // 라우팅용 slug
    thumbnail:
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/top20/top20_kr.png", // 썸네일 이미지
  },
  {
    id: "travel-recommendation",
    title: "내 일정에 딱 맞는 한국 여행지 추천 ✈️",
    description: "여행 루트 자동 생성해드려요!",
    category: "정보",
    readTime: "6분",
    views: 1892,
    slug: "travel-recommendation",
    thumbnail:
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HAN01.png",
  },
];

export default function InformationalContentSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 회복 가이드 글 가져오기
  const recoveryGuidePosts = getAllRecoveryGuides();

  // 회복 가이드를 ContentItem 형식으로 변환
  const recoveryGuideItems: ContentItem[] = recoveryGuidePosts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
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

  const categories = ["all", "가이드", "정보", "회복 가이드🍀"];

  const filteredContents =
    selectedCategory === "all"
      ? (() => {
          // 전체 탭에서는 회복 가이드를 5개만 표시
          const recoveryGuides = allContents.filter(
            (item) => item.category === "회복 가이드"
          );
          const otherContents = allContents.filter(
            (item) => item.category !== "회복 가이드"
          );
          return [...otherContents, ...recoveryGuides.slice(0, 5)];
        })()
      : selectedCategory === "회복 가이드🍀"
      ? allContents.filter((item) => item.category === "회복 가이드")
      : allContents.filter((item) => item.category === selectedCategory);

  return (
    <div className="mb-6 pt-3">
      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 mb-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category === "all" ? "전체" : category}
          </button>
        ))}
      </div>

      {/* 컨텐츠 리스트 */}
      <div className="space-y-2.5">
        {filteredContents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {selectedCategory === "회복 가이드🍀" ||
            selectedCategory === "회복 가이드"
              ? "회복 가이드 글이 준비 중입니다."
              : "컨텐츠가 없습니다."}
          </div>
        ) : (
          filteredContents.map((content) => {
            const isRecoveryGuide = content.category === "회복 가이드";
            return (
              <button
                key={content.id}
                onClick={() => {
                  // 회복 가이드인 경우 상세 페이지로 이동
                  if (content.category === "회복 가이드" && content.slug) {
                    router.push(`/community/recovery-guide/${content.slug}`);
                  } else if (content.slug === "top20") {
                    // TOP 20 정보 페이지로 이동
                    router.push(`/community/info/top20`);
                  } else if (content.slug === "travel-recommendation") {
                    // 여행지 추천 페이지로 이동
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
                          {content.readTime} 읽기
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
                        <span>조회 {content.views.toLocaleString()}</span>
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
    </div>
  );
}
