"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import CategoryRankingPage, { CategoryFilterBar } from "./CategoryRankingPage";
import KBeautyRankingPage from "./KBeautyRankingPage";
import HospitalRankingPage from "./HospitalRankingPage";
import ScheduleBasedRankingPage from "./ScheduleBasedRankingPage";

type RankingTab = "category" | "kbeauty" | "hospital" | "schedule";

interface RankingSectionProps {
  isVisible?: boolean;
  activeSection?: string; // ExploreScrollPage의 activeSection 전달
}

export default function RankingSection({
  isVisible = true,
  activeSection = "ranking",
}: RankingSectionProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<RankingTab>("category");

  // 필터 state (CategoryRankingPage와 공유)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMidCategory, setSelectedMidCategory] = useState<string | null>(
    null
  );
  const [midCategoriesList, setMidCategoriesList] = useState<string[]>([]);

  // URL 쿼리 파라미터에서 tab 읽어서 해당 탭 선택
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["category", "kbeauty", "hospital", "schedule"].includes(tab)) {
      setActiveTab(tab as RankingTab);
    }
  }, [searchParams]);

  const tabs = [
    { id: "category" as RankingTab, label: "카테고리별" },
    { id: "kbeauty" as RankingTab, label: "Kbeauty" },
    { id: "hospital" as RankingTab, label: "병원별" },
    { id: "schedule" as RankingTab, label: "일정 맞춤" },
  ];

  return (
    <div className="bg-white">
      {/* 하위 탭 네비게이션 - sticky로 변경하여 자연스럽게 밀려 올라가도록 */}
      {/* Header(48) + ExploreHeader(약 56px) = 104px */}
      <div className="sticky top-[104px] z-40 bg-white px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 필터바 - 카테고리별 탭일 때만 표시, sticky로 렌더링 */}
      {/* 탭바 높이(약 48px) 아래에 위치: top-[152px] = 104 + 48 */}
      {activeTab === "category" && (
        <div className="sticky top-[152px] z-[45] bg-white border-b border-gray-200">
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            selectedMidCategory={selectedMidCategory}
            midCategoriesList={midCategoriesList}
            onCategoryChange={(categoryId) => {
              setSelectedCategory(categoryId);
              setSelectedMidCategory(null);
            }}
            onMidCategoryChange={setSelectedMidCategory}
          />
        </div>
      )}

      {/* 탭 콘텐츠 - 상단 sticky 요소들(탭바 약 48px + 필터바 약 90px) 아래에 표시되도록 padding-top 추가 */}
      <div className="pt-[140px]">
        {activeTab === "category" && (
          <CategoryRankingPage
            isVisible={isVisible}
            shouldStick={activeSection === "ranking"}
            activeSection={activeSection}
            selectedCategory={selectedCategory}
            selectedMidCategory={selectedMidCategory}
            midCategoriesList={midCategoriesList}
            onCategoryChange={(categoryId) => {
              setSelectedCategory(categoryId);
              setSelectedMidCategory(null);
            }}
            onMidCategoryChange={setSelectedMidCategory}
            renderFilterBar={false}
            onMidCategoriesListChange={setMidCategoriesList}
          />
        )}
        {activeTab === "kbeauty" && <KBeautyRankingPage />}
        {activeTab === "hospital" && <HospitalRankingPage />}
        {activeTab === "schedule" && <ScheduleBasedRankingPage />}
      </div>
    </div>
  );
}
