"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import CategoryRankingPage from "./CategoryRankingPage";
import KBeautyRankingPage from "./KBeautyRankingPage";
import HospitalRankingPage from "./HospitalRankingPage";
import ScheduleBasedRankingPage from "./ScheduleBasedRankingPage";

type RankingTab = "category" | "kbeauty" | "hospital" | "schedule";

interface RankingSectionProps {
  isVisible?: boolean;
}

export default function RankingSection({
  isVisible = true,
}: RankingSectionProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<RankingTab>("category");

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
      {/* 하위 탭 네비게이션 */}
      <div className="bg-white px-4 py-3">
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

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === "category" && (
          <CategoryRankingPage isVisible={isVisible} />
        )}
        {activeTab === "kbeauty" && <KBeautyRankingPage />}
        {activeTab === "hospital" && <HospitalRankingPage />}
        {activeTab === "schedule" && <ScheduleBasedRankingPage />}
      </div>
    </div>
  );
}
