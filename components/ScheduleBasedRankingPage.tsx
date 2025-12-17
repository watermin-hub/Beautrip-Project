"use client";

import { useState, useMemo } from "react";
import TravelScheduleBar from "./TravelScheduleBar";
import ProcedureRecommendation from "./ProcedureRecommendation";
import type { TravelScheduleData } from "./TravelScheduleForm";

// 홈페이지와 동일한 대분류 카테고리
const MAIN_CATEGORIES = [
  { id: "eyes", name: "눈성형", icon: "👀" },
  { id: "lifting", name: "리프팅", icon: "✨" },
  { id: "botox", name: "보톡스", icon: "💉" },
  { id: "facial", name: "안면윤곽/양악", icon: "😊" },
  { id: "hair-removal", name: "제모", icon: "🧴" },
  { id: "liposuction", name: "지방성형", icon: "💪" },
  { id: "nose", name: "코성형", icon: "👃" },
  { id: "skin", name: "피부", icon: "🌟" },
  { id: "filler", name: "필러", icon: "💊" },
  { id: "breast", name: "가슴성형", icon: "💕" },
];

export default function ScheduleBasedRankingPage() {
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

  const scheduleData: TravelScheduleData | null = useMemo(() => {
    if (!schedule.start || !schedule.end) return null;

    // selectedCategoryId가 null이면 "전체"로 설정
    const categoryLabel = selectedCategoryId
      ? MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId)
        ? MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId)!.name
        : "전체"
      : "전체";

    return {
      travelPeriod: { start: schedule.start, end: schedule.end },
      travelRegion: "서울",
      procedureCategory: categoryLabel,
      estimatedBudget: "100만원 미만",
    };
  }, [schedule.start, schedule.end, selectedCategoryId]);

  return (
    <div className="px-4 py-6">
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
