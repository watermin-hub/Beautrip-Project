"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiBook, FiChevronRight } from "react-icons/fi";

interface ContentItem {
  id: number;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  readTime?: string;
  views?: number;
}

// 정보성 컨텐츠 데이터 (임시 - 추후 API 연동)
const informationalContents: ContentItem[] = [
  {
    id: 1,
    title: "한국 성형수술 가이드: 초보자를 위한 완벽 가이드",
    description: "한국에서 성형수술을 받기 전 알아야 할 모든 것",
    category: "가이드",
    readTime: "5분",
    views: 1234,
  },
  {
    id: 2,
    title: "시술별 회복기간과 주의사항",
    description: "각 시술의 다운타임과 회복 과정을 상세히 안내합니다",
    category: "정보",
    readTime: "7분",
    views: 2345,
  },
  {
    id: 3,
    title: "병원 선택 시 체크리스트",
    description: "안전하고 만족스러운 병원 선택을 위한 필수 체크리스트",
    category: "가이드",
    readTime: "3분",
    views: 3456,
  },
  {
    id: 4,
    title: "통역 서비스 이용 가이드",
    description: "한국어가 서툰 외국인을 위한 통역 서비스 안내",
    category: "정보",
    readTime: "4분",
    views: 1567,
  },
  {
    id: 5,
    title: "비자와 여행 일정 계획하기",
    description: "성형수술 여행을 위한 비자 및 일정 계획 팁",
    category: "가이드",
    readTime: "6분",
    views: 2789,
  },
];

export default function InformationalContentSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "가이드", "정보"];
  const filteredContents =
    selectedCategory === "all"
      ? informationalContents
      : informationalContents.filter((item) => item.category === selectedCategory);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiBook className="text-primary-main" />
          <h3 className="text-lg font-bold text-gray-900">정보성 컨텐츠</h3>
        </div>
        <button className="text-sm text-primary-main font-medium flex items-center gap-1 hover:text-primary-dark transition-colors">
          전체보기
          <FiChevronRight className="text-xs" />
        </button>
      </div>

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
        {filteredContents.map((content) => (
          <button
            key={content.id}
            onClick={() => {
              if (content.id === 2) {
                router.push("/community/info/recovery-guide");
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
                    <span className="text-xs text-gray-500">{content.readTime} 읽기</span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                  {content.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                  {content.description}
                </p>
                {content.views && (
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
        ))}
      </div>
    </div>
  );
}

