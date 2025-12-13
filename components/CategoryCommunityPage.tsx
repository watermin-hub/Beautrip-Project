"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";

// 홈페이지와 동일한 대분류 카테고리 10개 (전체 포함)
const MAIN_CATEGORIES = [
  { id: null, name: "전체", icon: null },
  { id: "eyes", name: "눈성형", icon: "👀" },
  { id: "lifting", name: "리프팅", icon: "✨" },
  { id: "botox", name: "보톡스", icon: "💉" },
  { id: "facial", name: "안면윤곽/양악", icon: "😊" },
  { id: "hair-removal", name: "제모", icon: "💫" },
  { id: "body", name: "지방성형", icon: "🏃" },
  { id: "nose", name: "코성형", icon: "👃" },
  { id: "skin", name: "피부", icon: "🌟" },
  { id: "filler", name: "필러", icon: "💎" },
  { id: "breast", name: "가슴성형", icon: "💕" },
];

export default function CategoryCommunityPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string | null) => {
    if (categoryId === null) {
      // 전체 선택 시 모든 게시글 표시
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(categoryId);
    router.push(`/community/posts?category=${categoryId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          카테고리별 게시글
        </h2>
        <p className="text-sm text-gray-500">
          관심 있는 카테고리를 선택하여 게시글을 확인하세요
        </p>
      </div>

      {/* 카테고리 필터 - 이모지 카드 형식 (ALL 위에 따로) */}
      <div className="mb-6">
        {/* "ALL 전체" 버튼 - 위에 따로 배치 */}
        <div className="mb-3">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="font-bold">ALL</span> 전체
          </button>
        </div>

        {/* 카테고리 버튼들 - 이모지 카드 형식 5개씩 2줄 그리드 */}
        <div className="grid grid-cols-5 gap-2">
          {MAIN_CATEGORIES.filter((cat) => cat.id !== null).map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id || "all"}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex flex-col items-center justify-center w-full aspect-square rounded-xl border text-xs transition-colors ${
                  isSelected
                    ? "bg-primary-main/10 border-primary-main text-primary-main"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl mb-1">{category.icon}</span>
                <span className="text-[10px] leading-tight text-center px-1">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

