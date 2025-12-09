"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import CategoryRankingPage from "./CategoryRankingPage";
import KBeautyRankingPage from "./KBeautyRankingPage";
import HospitalRankingPage from "./HospitalRankingPage";

export default function RankingSection() {
  const { t } = useLanguage();
  const [rankingType, setRankingType] = useState<
    "category" | "kbeauty" | "hospital"
  >("category");

  return (
    <div className="min-h-screen bg-white">
      {/* 랭킹 타입 선택 */}
      <div className="sticky top-[92px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setRankingType("category")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              rankingType === "category"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("explore.ranking.category")}
          </button>
          <button
            onClick={() => setRankingType("kbeauty")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              rankingType === "kbeauty"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("explore.ranking.kbeauty")}
          </button>
          <button
            onClick={() => setRankingType("hospital")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              rankingType === "hospital"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("explore.ranking.hospital")}
          </button>
        </div>
      </div>

      {/* 랭킹 콘텐츠 */}
      {rankingType === "category" && <CategoryRankingPage />}
      {rankingType === "kbeauty" && <KBeautyRankingPage />}
      {rankingType === "hospital" && <HospitalRankingPage />}
    </div>
  );
}

