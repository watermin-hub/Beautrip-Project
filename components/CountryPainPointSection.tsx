"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiHeart, FiStar, FiX } from "react-icons/fi";
import {
  loadTreatmentsPaginated,
  getThumbnailUrl,
  calculateRecommendationScore,
  type Treatment,
} from "@/lib/api/beautripApi";

// 고민 키워드와 시술 매핑
const CONCERN_KEYWORDS: Record<string, string[]> = {
  주름: ["보톡스", "리쥬란", "리프팅", "인모드", "슈링크", "주름"],
  다크서클: ["필러", "지방재배치", "리쥬란", "다크서클", "눈밑"],
  모공: ["프락셀", "레이저", "모공", "피코", "아쿠아필"],
  피부톤: ["미백", "레이저", "프락셀", "피부톤", "백옥"],
  트러블: ["레이저", "프락셀", "트러블", "피코", "아쿠아필"],
  탄력: ["리프팅", "인모드", "슈링크", "울쎄라", "탄력"],
};

export default function CountryPainPointSection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [recommendedTreatments, setRecommendedTreatments] = useState<
    Treatment[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const countries = [
    { id: "all", key: "home.country.all" },
    { id: "korea", key: "home.country.korea" },
    { id: "china", key: "home.country.china" },
    { id: "japan", key: "home.country.japan" },
    { id: "usa", key: "home.country.usa" },
    // { id: "sea", key: "home.country.sea" }, // 동남아 제거
  ];

  const painPoints: Record<string, string[]> = {
    all: ["주름", "다크서클", "모공", "피부톤", "트러블"],
    korea: ["주름", "탄력", "모공", "피부톤", "다크서클"],
    china: ["주름", "다크서클", "모공", "피부톤", "트러블"],
    japan: ["모공", "주름", "다크서클", "피부톤", "트러블"],
    usa: ["주름", "다크서클", "피부톤", "모공", "트러블"],
    // sea: ["모공", "트러블", "피부톤", "주름", "다크서클"], // 동남아 제거
  };

  const currentPainPoints = painPoints[selectedCountry] || painPoints.all;

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const procedureFavorites = savedFavorites
      .filter((f: any) => f.type === "procedure")
      .map((f: any) => f.id);
    setFavorites(new Set(procedureFavorites));
  }, []);

  const handleConcernClick = async (concern: string) => {
    if (selectedConcern === concern) {
      // 같은 해시태그를 다시 클릭하면 닫기
      setSelectedConcern(null);
      setRecommendedTreatments([]);
      return;
    }

    setSelectedConcern(concern);
    setLoading(true);

    try {
      // 필요한 만큼만 로드 (100개)
      const result = await loadTreatmentsPaginated(1, 100);
      const allTreatments = result.data;
      const keywords = CONCERN_KEYWORDS[concern] || [concern];

      // 키워드로 필터링
      const filtered = allTreatments.filter((treatment) => {
        const name = (treatment.treatment_name || "").toLowerCase();
        const hashtags = (treatment.treatment_hashtags || "").toLowerCase();
        const categoryLarge = (treatment.category_large || "").toLowerCase();
        const categoryMid = (treatment.category_mid || "").toLowerCase();

        return keywords.some((keyword) => {
          const keywordLower = keyword.toLowerCase();
          return (
            name.includes(keywordLower) ||
            hashtags.includes(keywordLower) ||
            categoryLarge.includes(keywordLower) ||
            categoryMid.includes(keywordLower)
          );
        });
      });

      // 추천 점수로 정렬하고 상위 10개 선택
      const sorted = filtered
        .map((treatment) => ({
          ...treatment,
          recommendationScore: calculateRecommendationScore(treatment),
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10);

      setRecommendedTreatments(sorted);
    } catch (error) {
      console.error("시술 추천 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = (treatment: Treatment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!treatment.treatment_id) return;

    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(treatment.treatment_id!)) {
        newSet.delete(treatment.treatment_id!);
      } else {
        newSet.add(treatment.treatment_id!);
      }

      // 로컬 스토리지에 저장
      const savedFavorites = JSON.parse(
        localStorage.getItem("favorites") || "[]"
      );
      const updatedFavorites = Array.from(newSet).map((id) => ({
        id,
        type: "procedure",
      }));
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));

      return newSet;
    });
  };

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
            key={country.id}
            onClick={() => {
              setSelectedCountry(country.id);
              setSelectedConcern(null);
              setRecommendedTreatments([]);
            }}
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
      <div className="flex flex-wrap gap-2 mb-4">
        {currentPainPoints.map((point, index) => (
          <button
            key={index}
            onClick={(e) => {
              // Ctrl/Cmd 키를 누르지 않은 경우에만 탐색 페이지로 이동
              if (!e.ctrlKey && !e.metaKey) {
                // 탐색 페이지로 이동하고 검색어와 section 파라미터 전달
                router.push(
                  `/explore?section=procedure&search=${encodeURIComponent(
                    point
                  )}`
                );
              } else {
                // Ctrl/Cmd 키를 누른 경우 기존 동작 (현재 페이지에서 추천 표시)
                handleConcernClick(point);
              }
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedConcern === point
                ? "bg-primary-main text-white border-primary-main"
                : "bg-white border border-gray-200 text-gray-700 hover:border-primary-main hover:text-primary-main"
            }`}
          >
            #{point}
          </button>
        ))}
      </div>

      {/* 선택된 고민에 대한 시술 추천 */}
      {selectedConcern && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">
              #{selectedConcern} 추천 시술
            </h4>
            <button
              onClick={() => {
                setSelectedConcern(null);
                setRecommendedTreatments([]);
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <FiX className="text-gray-600 text-lg" />
            </button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[150px] bg-gray-200 rounded-xl animate-pulse"
                  style={{ height: "200px" }}
                />
              ))}
            </div>
          ) : recommendedTreatments.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {recommendedTreatments.map((treatment) => {
                const isFavorite = favorites.has(treatment.treatment_id || 0);
                const thumbnailUrl = getThumbnailUrl(treatment);
                const price = treatment.selling_price
                  ? `${Math.round(treatment.selling_price / 10000)}만원`
                  : "가격 문의";
                const rating = treatment.rating || 0;
                const reviewCount = treatment.review_count || 0;
                const discountRate = treatment.dis_rate
                  ? `${treatment.dis_rate}%`
                  : "";

                return (
                  <div
                    key={treatment.treatment_id}
                    className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                    onClick={() => {
                      if (treatment.treatment_id) {
                        router.push(`/treatment/${treatment.treatment_id}`);
                      }
                    }}
                  >
                    {/* 이미지 - 2:1 비율 */}
                    <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                      <img
                        src={thumbnailUrl}
                        alt={treatment.treatment_name || "시술 이미지"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.dataset.fallback === "true") {
                            target.style.display = "none";
                            return;
                          }
                          target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="24"%3E🏥%3C/text%3E%3C/svg%3E';
                          target.dataset.fallback = "true";
                        }}
                      />
                      {/* 할인율 배지 */}
                      {discountRate && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                          {discountRate}
                        </div>
                      )}
                    </div>

                    {/* 카드 내용 */}
                    <div className="p-3 flex flex-col h-full">
                      <div>
                        {/* 병원명 */}
                        {treatment.hospital_name && (
                          <p className="text-xs text-gray-500 mb-1 truncate">
                            {treatment.hospital_name}
                          </p>
                        )}

                        {/* 시술명 */}
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                          {treatment.treatment_name}
                        </h4>

                        {/* 평점 */}
                        {rating > 0 && (
                          <div className="flex items-center gap-1 mb-1">
                            <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                            <span className="text-xs font-semibold">
                              {rating.toFixed(1)}
                            </span>
                            {reviewCount > 0 && (
                              <span className="text-xs text-gray-400">
                                ({reviewCount.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 가격과 버튼 - 하단 고정 */}
                      <div className="flex items-end justify-between mt-auto">
                        <div className="flex-1">
                          {/* 가격 */}
                          <p className="text-sm font-bold text-primary-main">
                            {price}
                          </p>
                        </div>

                        {/* 하트 버튼 - 세로 배치 */}
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavoriteClick(treatment, e);
                            }}
                            className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <FiHeart
                              className={`text-base ${
                                isFavorite
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">
              {selectedConcern}에 대한 추천 시술을 찾을 수 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
