"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiTrendingUp, FiChevronRight } from "react-icons/fi";

// 고민 데이터 (엑셀 파일 기반)
interface Concern {
  id: number;
  name: string;
  category: "skin" | "eyes" | "nose" | "jaw" | "other";
  trend: number; // 증가율 (%)
  isHot: boolean;
  recommendedProcedures: string[];
}

const concerns: Concern[] = [
  {
    id: 1,
    name: "주름",
    category: "skin",
    trend: 125,
    isHot: true,
    recommendedProcedures: ["보톡스", "리쥬란 힐러", "써마지", "울쎄라"],
  },
  {
    id: 2,
    name: "피부처짐",
    category: "skin",
    trend: 98,
    isHot: true,
    recommendedProcedures: ["인모드 리프팅", "슈링크 유니버스", "실리프팅"],
  },
  {
    id: 3,
    name: "색소침착",
    category: "skin",
    trend: 87,
    isHot: true,
    recommendedProcedures: ["프락셀", "CO2 레이저", "마이크로 니들링"],
  },
  {
    id: 4,
    name: "다크서클",
    category: "skin",
    trend: 76,
    isHot: false,
    recommendedProcedures: ["눈밑 필러", "눈밑 지방재배치", "리쥬란"],
  },
  {
    id: 5,
    name: "모공",
    category: "skin",
    trend: 65,
    isHot: false,
    recommendedProcedures: ["프락셀", "아쿠아필", "레이저"],
  },
  {
    id: 6,
    name: "사각턱",
    category: "jaw",
    trend: 54,
    isHot: false,
    recommendedProcedures: ["사각턱 보톡스", "윤곽 리프팅"],
  },
  {
    id: 7,
    name: "낮은 코",
    category: "nose",
    trend: 43,
    isHot: false,
    recommendedProcedures: ["코필러", "코 리프팅"],
  },
  {
    id: 8,
    name: "눈가 주름",
    category: "eyes",
    trend: 38,
    isHot: false,
    recommendedProcedures: ["눈가 보톡스", "눈밑 필러"],
  },
];

export default function HotConcernsSection() {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);

  const displayedConcerns = isExpanded
    ? concerns
    : concerns.slice(0, 3);

  const handleConcernClick = (concern: Concern) => {
    setSelectedConcern(concern);
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiTrendingUp className="text-primary-main" />
          {t("home.hotConcerns")}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-main font-medium"
        >
          {isExpanded ? t("home.seeLess") : t("home.seeMore")}
        </button>
      </div>

      <div className="space-y-3">
        {displayedConcerns.map((concern, index) => (
          <div key={concern.id}>
            <button
              onClick={() => handleConcernClick(concern)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left border border-transparent hover:border-primary-light"
            >
              <div className="flex items-center gap-3 flex-1">
                <span
                  className={`text-lg font-bold ${
                    index < 3 ? "text-primary-main" : "text-gray-400"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {concern.name}
                    </span>
                    {concern.isHot && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        HOT
                      </span>
                    )}
                  </div>
                  {selectedConcern?.id === concern.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {concern.recommendedProcedures.map((procedure, idx) => (
                        <span
                          key={idx}
                          className="bg-primary-light/20 text-primary-main text-xs px-2 py-1 rounded-full font-medium"
                        >
                          {procedure}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 font-medium">
                  +{concern.trend}%
                </span>
                <FiChevronRight
                  className={`text-gray-400 transition-transform ${
                    selectedConcern?.id === concern.id ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        ))}
      </div>

      {selectedConcern && (
        <div className="mt-4 p-4 bg-primary-light/10 rounded-lg border border-primary-light/20">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {selectedConcern.name} 추천 시술
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedConcern.recommendedProcedures.map((procedure, idx) => (
              <button
                key={idx}
                className="bg-white border border-primary-main/30 text-primary-main text-xs px-3 py-1.5 rounded-full font-medium hover:bg-primary-main hover:text-white transition-colors"
              >
                {procedure}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

