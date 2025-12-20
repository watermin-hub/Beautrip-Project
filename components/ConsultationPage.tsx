"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PostList from "./PostList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ConsultationPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // 고민상담소 카테고리 7가지
  const CONCERN_CATEGORIES = [
    { id: null, label: "전체" },
    { id: "피부 고민", label: "피부 고민" },
    { id: "시술 고민", label: "시술 고민" },
    { id: "병원 선택", label: "병원 선택" },
    { id: "가격 문의", label: t("common.priceInquiry") },
    { id: "회복 기간", label: "회복 기간" },
    { id: "부작용", label: "부작용" },
    { id: "기타", label: "기타" },
  ];

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // 카테고리 선택 시 해당 카테고리 게시글만 보이도록 필터링
    // PostList에 concernCategory prop을 전달하여 필터링
  };

  return (
    <div className="pt-4">
      {/* 카테고리 탭 버튼 - sticky로 커뮤니티 헤더 아래 고정 */}
      <div className="sticky top-[104px] z-30 bg-white px-4 py-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {CONCERN_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id || "all"}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary-main text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 고민상담소 게시글 리스트 */}
      <PostList activeTab="consultation" concernCategory={selectedCategory} />
    </div>
  );
}
