"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import CategoryRankingPage, {
  CategoryFilterBar,
  getMainCategories,
} from "./CategoryRankingPage";
import KBeautyRankingPage from "./KBeautyRankingPage";
import HospitalRankingPage from "./HospitalRankingPage";
import ScheduleBasedRankingPage from "./ScheduleBasedRankingPage";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackExploreFilterClick } from "@/lib/gtm";

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

  const { t, language } = useLanguage();
  const tabs = [
    { id: "category" as RankingTab, labelKey: "explore.filter.category" },
    { id: "kbeauty" as RankingTab, labelKey: "explore.ranking.kbeauty" },
    { id: "hospital" as RankingTab, labelKey: "explore.filter.hospital" },
    { id: "schedule" as RankingTab, labelKey: "explore.filter.schedule" },
  ];

  // 언어 변경 시 대분류 카테고리 번역 업데이트
  const MAIN_CATEGORIES = useMemo(() => getMainCategories(t), [t, language]);

  // 언어 변경 시 선택된 대분류, 중분류를 ALL(null)로 리셋
  useEffect(() => {
    if (selectedCategory !== null || selectedMidCategory !== null) {
      setSelectedCategory(null);
      setSelectedMidCategory(null);
    }
  }, [language]); // language 변경 시에만 실행

  const isRankingActive = activeSection === "ranking";

  return (
    <div className="bg-white relative">
      {/* 탭바 - activeSection이 "ranking"일 때만 sticky 적용 */}
      {/* Header(48px) + ExploreHeader(약 56px) = 104px */}
      <div
        className={`${
          isRankingActive ? "sticky top-[104px]" : "relative"
        } z-40 bg-white px-4 py-2 border-b border-gray-200 shadow-sm`}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                // GTM: 탐색 필터 클릭 이벤트 ([카테고리별, K-Beauty, 병원별, 일정 맞춤])
                // "category"는 "ranking"으로 매핑
                const filterType = tab.id === "category" ? "ranking" : tab.id;
                trackExploreFilterClick(
                  filterType as "ranking" | "kbeauty" | "hospital" | "schedule"
                );
                setActiveTab(tab.id);
                // 탭 필터 선택 시 맨 위로 스크롤
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* 필터바 - 카테고리별 탭일 때만 표시, activeSection이 "ranking"일 때만 sticky 적용 */}
      {/* 탭바 높이(약 48px) 아래에 위치: top-[152px] = 104 + 48 */}
      {activeTab === "category" && (
        <div
          className={`${
            isRankingActive ? "sticky top-[152px]" : "relative"
          } z-[45] bg-white`}
        >
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            selectedMidCategory={selectedMidCategory}
            midCategoriesList={midCategoriesList}
            mainCategories={MAIN_CATEGORIES}
            language={language}
            onCategoryChange={(categoryId) => {
              setSelectedCategory(categoryId);
              setSelectedMidCategory(null);
            }}
            onMidCategoryChange={(midCategory) => {
              setSelectedMidCategory(midCategory);
              // 필터 선택 시 맨 위로 스크롤
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          />
        </div>
      )}

      {/* 탭 콘텐츠 - 상단 sticky 요소들 아래에 표시되도록 padding-top 추가 */}
      <div className={activeTab === "category" ? "pt-[100px]" : "pt-24"}>
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
              // 대분류 필터 선택 시 맨 위로 스크롤
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            onMidCategoryChange={(midCategory) => {
              setSelectedMidCategory(midCategory);
              // 중분류 필터 선택 시 맨 위로 스크롤
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
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
