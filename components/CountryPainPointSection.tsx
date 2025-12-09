"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CountryPainPointSection() {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState("all");

  const countries = [
    { id: "all", key: "home.country.all" },
    { id: "korea", key: "home.country.korea" },
    { id: "china", key: "home.country.china" },
    { id: "japan", key: "home.country.japan" },
    { id: "usa", key: "home.country.usa" },
    { id: "sea", key: "home.country.sea" },
  ];

  const painPoints: Record<string, string[]> = {
    all: ["주름", "다크서클", "모공", "피부톤", "트러블"],
    korea: ["주름", "탄력", "모공", "피부톤", "다크서클"],
    china: ["주름", "다크서클", "모공", "피부톤", "트러블"],
    japan: ["모공", "주름", "다크서클", "피부톤", "트러블"],
    usa: ["주름", "다크서클", "피부톤", "모공", "트러블"],
    sea: ["모공", "트러블", "피부톤", "주름", "다크서클"],
  };

  const currentPainPoints = painPoints[selectedCountry] || painPoints.all;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">
          {t("home.countrySearch")}
        </h3>
      </div>

      {/* 국가 필터 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 mb-3">
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => setSelectedCountry(country.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCountry === country.id
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t(country.key)}
          </button>
        ))}
      </div>

      {/* 인기 검색어 태그 */}
      <div className="flex flex-wrap gap-2">
        {currentPainPoints.map((point, index) => (
          <button
            key={index}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary-main hover:text-primary-main transition-colors"
          >
            #{point}
          </button>
        ))}
      </div>
    </div>
  );
}

