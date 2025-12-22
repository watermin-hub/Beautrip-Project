"use client";

import { useState, useMemo } from "react";
import TravelScheduleBar from "./TravelScheduleBar";
import ProcedureRecommendation from "./ProcedureRecommendation";
import type { TravelScheduleData } from "./TravelScheduleForm";
import { getMainCategories } from "./CategoryRankingPage";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ScheduleBasedRankingPage() {
  const { t, language } = useLanguage();
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

  // 언어 변경 시 대분류 카테고리 번역 업데이트 (랭킹 페이지와 동일)
  const MAIN_CATEGORIES = useMemo(() => {
    const categories = getMainCategories(t);
    // 아이콘 추가
    const iconMap: Record<string, string> = {
      "눈성형": "👀",
      "리프팅": "✨",
      "보톡스": "💉",
      "안면윤곽/양악": "😊",
      "제모": "🧴",
      "지방성형": "💪",
      "코성형": "👃",
      "피부": "🌟",
      "필러": "💊",
      "가슴성형": "💕",
    };
    return categories.map((cat) => ({
      ...cat,
      icon: cat.id ? iconMap[cat.id] || "📋" : "📋",
    }));
  }, [t, language]);

  const scheduleData: TravelScheduleData | null = useMemo(() => {
    if (!schedule.start || !schedule.end) return null;

    // selectedCategoryId가 null이면 "전체"로 설정
    const categoryLabel = selectedCategoryId
      ? MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId)?.name || t("category.all")
      : t("category.all");

    return {
      travelPeriod: { start: schedule.start, end: schedule.end },
      travelRegion: "서울",
      procedureCategory: categoryLabel,
      estimatedBudget: "100만원 미만",
    };
  }, [schedule.start, schedule.end, selectedCategoryId]);

  return (
    <div className="px-4 pt-4 pb-6">
      <h3 className="text-lg font-bold mb-2 text-gray-900">일정 맞춤 랭킹</h3>
      <p className="text-sm text-gray-600 mb-6">
        여행 일정을 입력하면 해당 기간에 맞는 시술을 추천해드립니다.
      </p>

      {/* 여행 일정 입력 바 (홈페이지와 동일) */}
      <div className="mb-6">
        <TravelScheduleBar onScheduleChange={handleScheduleChange} />
      </div>

      {/* 일정 선택 시 맞춤 시술 추천 표시 (홈페이지와 동일) */}
      {scheduleData ? (
        <div className="-mx-4 bg-gray-50">
          <ProcedureRecommendation
            scheduleData={scheduleData}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            mainCategories={MAIN_CATEGORIES}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            여행 일정을 선택하면 맞춤 시술을 추천해드립니다.
          </p>
        </div>
      )}
    </div>
  );
}
