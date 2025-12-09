"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RankingBanner from "./RankingBanner";
import Header from "./Header";
import TravelScheduleBar from "./TravelScheduleBar";
import SearchSection from "./SearchSection";
import HotConcernsSection from "./HotConcernsSection";
import KBeautyByCountry from "./KBeautyByCountry";
import AIAnalysisBanner from "./AIAnalysisBanner";
import PromotionBanner from "./PromotionBanner";
import AISkinAnalysisButton from "./AISkinAnalysisButton";
import RecentEventsSection from "./RecentEventsSection";
import PopularReviewsSection from "./PopularReviewsSection";
import OverlayBar from "./OverlayBar";
import BottomNavigation from "./BottomNavigation";
import ProcedureRecommendation from "./ProcedureRecommendation";
import MissionSection from "./MissionSection";
import CountryPainPointSection from "./CountryPainPointSection";
import CommunityWriteModal from "./CommunityWriteModal";
import DDayBanner from "./DDayBanner";
import type { TravelScheduleData } from "./TravelScheduleForm";

export default function HomePage() {
  const { t } = useLanguage();

  const MAIN_CATEGORIES = [
    { id: "skin", labelKey: "home.category.skin", icon: "😊" },
    { id: "scar", labelKey: "home.category.scar", icon: "✨" },
    { id: "slim", labelKey: "home.category.slim", icon: "💆‍♀️" },
    { id: "nose", labelKey: "home.category.nose", icon: "👃" },
    { id: "eyes", labelKey: "home.category.eyes", icon: "👀" },
    { id: "inject", labelKey: "home.category.inject", icon: "💉" },
    { id: "body", labelKey: "home.category.body", icon: "💪" },
    { id: "other", labelKey: "home.category.other", icon: "⋯" },
  ];
  const [schedule, setSchedule] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const handleScheduleChange = (
    start: string | null,
    end: string | null,
    categoryId?: string | null
  ) => {
    setSchedule({ start, end });
    // 일정 선택 시 전체 카테고리를 디폴트로 설정
    if (start && end && !categoryId) {
      setSelectedCategoryId(null); // null = 전체
    } else if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  };

  const handleCategoryClick = (id: string) => {
    setSelectedCategoryId((prev) => (prev === id ? null : id));
  };

  const scheduleData: TravelScheduleData | null = useMemo(() => {
    if (!schedule.start || !schedule.end) return null;

    // selectedCategoryId가 null이면 "전체"로 설정
    const categoryLabel = selectedCategoryId
      ? MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId)
        ? t(MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId)!.labelKey)
        : "전체"
      : "전체";

    return {
      travelPeriod: { start: schedule.start, end: schedule.end },
      travelRegion: "서울",
      procedureCategory: categoryLabel,
      estimatedBudget: "100만원 미만",
    };
  }, [schedule.start, schedule.end, selectedCategoryId, t]);

  const hasFullSchedule = !!(schedule.start && schedule.end);

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      {/* Fixed Ranking Banner - 상단 고정 */}
      <RankingBanner />
      {/* Header - 배너 아래 고정 */}
      <Header hasRankingBanner={true} />
      {/* 배너 높이만큼 여백 추가 (pt-[41px] = 배너 높이) */}
      <div className="pt-[41px] px-4 pb-20">
        {/* 헤더와 일정 입력창 사이 여백 */}
        <div className="mt-4">
          {/* 여행 일정 입력 바 (빨간 테두리 - 높은 중요도) */}
          <TravelScheduleBar
            onScheduleChange={handleScheduleChange}
            onModalStateChange={setIsCalendarModalOpen}
          />
        </div>


        {/* 일정 기반 맞춤 시술 추천 (여행 일정 선택 시 노출) */}
        {scheduleData && (
          <div className="mb-6 -mx-4 bg-gray-50">
            <ProcedureRecommendation
              scheduleData={scheduleData}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              mainCategories={MAIN_CATEGORIES}
            />
          </div>
        )}

        {/* 인기 시술 → 맞춤 시술 */}
        <HotConcernsSection />

        {/* 배너 슬라이더 (AI/이벤트/블프...) */}
        <PromotionBanner />

        {/* 미션 (출석, 활동) */}
        <MissionSection />

        {/* 국가별 페인포인트 인기 검색어 목록 */}
        <CountryPainPointSection />

        {/* 국가별 인기 시술 */}
        <KBeautyByCountry />

        {/* AI 분석 배너 */}
        <AIAnalysisBanner />

        {/* 인기 급상승 리뷰 */}
        <PopularReviewsSection />

        {/* 인기 급상승 비포&애프터 리뷰 */}
        <RecentEventsSection />

        {/* 리뷰 작성 버튼 */}
        <div className="mb-4">
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors shadow-md"
          >
            <span>{t("home.reviewButton")}</span>
            <span>&gt;</span>
          </button>
        </div>

        {/* 검색어 입력 - 주석 처리 */}
        {/* <SearchSection /> */}
      </div>

      {/* 플로팅 AI 피부 분석 버튼 (전역 렌더링) */}
      <AISkinAnalysisButton />

      {/* D-Day 플로팅 배너 */}
      <DDayBanner />

      <OverlayBar />

      {/* 커뮤니티 글쓰기 모달 */}
      <CommunityWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
      />

      <div className="pb-20">
        <BottomNavigation disabled={isCalendarModalOpen} />
      </div>
    </div>
  );
}
