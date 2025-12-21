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
    { id: null, label: t("concernCategory.all") },
    { id: "피부 고민", label: t("concernCategory.skinConcern") },
    { id: "시술 고민", label: t("concernCategory.procedureConcern") },
    { id: "병원 선택", label: t("concernCategory.hospitalSelection") },
    { id: "가격 문의", label: t("concernCategory.priceInquiry") },
    { id: "회복 기간", label: t("concernCategory.recoveryPeriod") },
    { id: "부작용", label: t("concernCategory.sideEffect") },
    { id: "기타", label: t("concernCategory.other") },
  ];

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // 카테고리 선택 시 해당 카테고리 게시글만 보이도록 필터링
    // PostList에 concernCategory prop을 전달하여 필터링
  };

  return (
    <div>
      {/* 카테고리 탭 버튼 - fixed로 커뮤니티 헤더 아래 완전 고정 */}
      <div className="fixed top-[104px] left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 bg-white border-t border-gray-100">
        <div className="px-4 py-1">
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
      </div>
      {/* 필터바 높이만큼 공간 확보 */}
      <div className="h-[45px]"></div>

      {/* 고민상담소 게시글 리스트 */}
      <PostList activeTab="consultation" concernCategory={selectedCategory} />
    </div>
  );
}
