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
      ? allContents
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
      <div className="space-y-3">
        {filteredContents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {selectedCategory === "회복 가이드🍀" ||
            selectedCategory === "회복 가이드"
              ? "회복 가이드 글이 준비 중입니다."
              : "컨텐츠가 없습니다."}
          </div>
        ) : (
          filteredContents.map((content) => (
            <button
              key={content.id}
              onClick={() => {
                // 회복 가이드인 경우 상세 페이지로 이동
                if (content.category === "회복 가이드" && content.slug) {
                  router.push(`/community/recovery-guide/${content.slug}`);
                } else {
                  // 다른 컨텐츠는 추후 구현
                  console.log("Navigate to:", content.id);
                }
              }}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start gap-4">
                {/* 썸네일 - 1:1 비율 */}
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary-light/20 to-primary-main/30 rounded-lg overflow-hidden">
                  {content.thumbnail ? (
                    <img
                      src={content.thumbnail}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBook className="text-primary-main text-2xl" />
                    </div>
                  )}
                </div>

                {/* 컨텐츠 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-primary-light/20 text-primary-main px-2 py-0.5 rounded-full font-medium">
                      {content.category}
                    </span>
                    {content.readTime && (
                      <span className="text-xs text-gray-500">
                        {content.readTime} 읽기
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                    {content.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                    {content.description}
                  </p>
                  {content.views && content.views > 0 && (
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>조회 {content.views.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* 화살표 */}
                <div className="flex-shrink-0">
                  <FiChevronRight className="text-gray-400" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
