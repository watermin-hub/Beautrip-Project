"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiChevronLeft, FiMapPin, FiNavigation } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  getTravelRegionsByLanguage,
  type RegionData,
} from "@/lib/content/travelRegions";

export default function TravelRecommendationPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegions = async () => {
      setLoading(true);
      try {
        const regions = await getTravelRegionsByLanguage(language);
        setRegionData(regions);
      } catch (error) {
        console.error("Failed to load travel regions:", error);
        setRegionData([]);
      } finally {
        setLoading(false);
      }
    };
    loadRegions();
  }, [language]);

  const title = t("community.travelRecommendation.title");
  const subtitle = t("community.travelRecommendation.subtitle");

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiChevronLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 line-clamp-1">
            {title}
          </h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-4 py-6">
        {/* 상단 메인 카피 */}
        <div
          className="rounded-2xl p-6 mb-8 text-center"
          style={{ backgroundColor: "#EAF7FF" }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <FiNavigation className="text-2xl" style={{ color: "#37EAD0" }} />
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-gray-700 text-sm">{subtitle}</p>
        </div>

        {/* 지역별 섹션 */}
        <div className="space-y-12">
          {regionData.map((region, index) => (
            <div key={region.id} className="space-y-4">
              {/* 지역 헤더 */}
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#EAF7FF" }}
                >
                  <FiMapPin style={{ color: "#37EAD0" }} className="text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {region.name}
                  </h3>
                </div>
              </div>

              {/* 한 줄 핵심 */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#EAF7FF" }}
              >
                <p className="text-sm font-medium text-gray-800">
                  {region.oneLine}
                </p>
              </div>

              {/* 상세 설명 */}
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {region.description}
              </p>

              {/* 추천 포인트 */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  {t("community.travelRecommendation.recommendedHighlights")}
                </h4>
                <ul className="space-y-2">
                  {region.recommendations.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "#37EAD0" }}
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 이미지 갤러리 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {region.images.map((imageUrl, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="relative rounded-lg overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={`${region.name} ${imgIdx + 1}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
                {/* 사진 캡션 */}
                <p className="text-xs text-gray-500 italic text-center">
                  "{region.caption}"
                </p>
              </div>

              {/* 구분선 (마지막 제외) */}
              {index < regionData.length - 1 && (
                <div className="pt-6 border-b border-gray-200" />
              )}
            </div>
          ))}
        </div>

        {/* 하단 CTA - 하단 네비게이션 바 높이만큼 padding-bottom 추가 */}
        <div
          className="mt-12 mb-20 rounded-2xl p-6 text-center"
          style={{ backgroundColor: "#EAF7FF" }}
        >
          <p className="text-sm font-medium text-gray-800 mb-3">
            {t("community.travelRecommendation.createRoute")}
          </p>
          <button
            className="px-6 py-3 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#37EAD0" }}
            onClick={() => {
              // 홈으로 이동하고 일정 선택 모달을 열기 위해 쿼리 파라미터 추가
              router.push("/?openCalendar=true");
            }}
          >
            {t("community.travelRecommendation.createSchedule")}
          </button>
        </div>
      </div>
    </div>
  );
}
