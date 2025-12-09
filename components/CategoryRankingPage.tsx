"use client";

import { useState, useEffect, useMemo } from "react";
import { FiHeart, FiStar } from "react-icons/fi";
import { IoChevronForward } from "react-icons/io5";
import {
  FiLayers,
  FiZap,
  FiEye,
  FiSmile,
  FiCircle,
  FiGrid,
} from "react-icons/fi";
import {
  loadTreatments,
  getTreatmentRankings,
  TreatmentRanking,
  getThumbnailUrl,
  Treatment,
} from "@/lib/api/beautripApi";

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 초기 카테고리 목록 (실제 데이터 로드 전 기본값)
// 실제로는 API 데이터를 확인한 후 availableCategories로 업데이트됩니다
const categories: Category[] = [
  { id: "all", label: "전체", icon: FiGrid },
  { id: "리프팅", label: "리프팅", icon: FiZap },
  { id: "피부", label: "피부", icon: FiCircle },
  { id: "눈", label: "눈", icon: FiEye },
  { id: "코", label: "코", icon: FiSmile },
  { id: "입술", label: "입", icon: FiSmile },
  { id: "볼", label: "볼", icon: FiCircle },
  { id: "쁘띠", label: "쁘띠", icon: FiLayers },
];

export default function CategoryRankingPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [availableCategories, setAvailableCategories] =
    useState<Category[]>(categories);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadTreatments();
        setTreatments(data);

        // 실제 데이터에서 사용 가능한 카테고리 추출
        const largeCategories = new Set<string>();
        const midCategories = new Set<string>();

        data.forEach((treatment) => {
          if (treatment.category_large) {
            largeCategories.add(treatment.category_large);
          }
          if (treatment.category_mid) {
            midCategories.add(treatment.category_mid);
          }
        });

        // 실제 존재하는 카테고리만 필터링
        const actualCategories = categories.filter((cat) => {
          if (cat.id === "all") return true;
          return largeCategories.has(cat.id) || midCategories.has(cat.id);
        });

        // 실제 데이터에 있는 카테고리 추가 (카테고리 목록에 없는 경우)
        largeCategories.forEach((cat) => {
          if (!categories.find((c) => c.id === cat)) {
            // 카테고리 이름에 따라 적절한 아이콘 매핑
            let iconComponent = FiCircle; // 기본값
            if (cat.includes("피부") || cat.includes("스킨"))
              iconComponent = FiCircle;
            else if (cat.includes("리프팅") || cat.includes("리프트"))
              iconComponent = FiZap;
            else if (cat.includes("눈")) iconComponent = FiEye;
            else if (cat.includes("코")) iconComponent = FiSmile;
            else if (cat.includes("입")) iconComponent = FiSmile;

            actualCategories.push({
              id: cat,
              label: cat,
              icon: iconComponent,
            });
          }
        });

        setAvailableCategories(actualCategories);

        // 디버깅: 실제 카테고리 값 출력
        console.log("실제 카테고리 (대분류):", Array.from(largeCategories));
        console.log("실제 카테고리 (중분류):", Array.from(midCategories));
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const procedureFavorites = savedFavorites
      .filter((f: any) => f.type === "procedure")
      .map((f: any) => f.id);
    setFavorites(new Set(procedureFavorites));
  }, []);

  // 카테고리별 랭킹 생성
  const rankings = useMemo(() => {
    let filtered = treatments;
    if (selectedCategory !== "all") {
      filtered = treatments.filter((t) => {
        const largeMatch = t.category_large === selectedCategory;
        const midMatch = t.category_mid === selectedCategory;
        // 시술명에도 카테고리 키워드가 포함되어 있는지 확인
        const nameMatch = t.treatment_name
          ?.toLowerCase()
          .includes(selectedCategory.toLowerCase());
        return largeMatch || midMatch || nameMatch;
      });

      // 디버깅: 필터링된 결과 확인
      console.log(
        `카테고리 "${selectedCategory}" 필터링 결과:`,
        filtered.length,
        "개"
      );
    }

    const rankings = getTreatmentRankings(filtered);
    console.log(`생성된 랭킹 수:`, rankings.length);

    return rankings.slice(0, 10); // 상위 10개만 표시 (스크롤 페이지용)
  }, [treatments, selectedCategory]);

  const handleFavoriteClick = (treatment: Treatment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!treatment.treatment_id) return;

    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = favorites.has(treatment.treatment_id);

    if (isFavorite) {
      const updated = savedFavorites.filter(
        (f: any) => !(f.id === treatment.treatment_id && f.type === "procedure")
      );
      localStorage.setItem("favorites", JSON.stringify(updated));
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(treatment.treatment_id!);
        return newSet;
      });
    } else {
      const newFavorite = {
        id: treatment.treatment_id,
        title: treatment.treatment_name,
        clinic: treatment.hospital_name,
        price: treatment.selling_price,
        rating: treatment.rating,
        reviewCount: treatment.review_count,
        type: "procedure" as const,
      };
      localStorage.setItem(
        "favorites",
        JSON.stringify([...savedFavorites, newFavorite])
      );
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.add(treatment.treatment_id!);
        return newSet;
      });
    }
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Category Filter Tags */}
      <div className="sticky top-[156px] z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {availableCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary-light/20 text-primary-main"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <IconComponent className="text-base" />
                <span className="text-xs font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ranking Sections */}
      <div className="px-4 py-6 space-y-8">
        {rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">
              {selectedCategory === "all"
                ? "랭킹 데이터가 없습니다."
                : `"${
                    availableCategories.find((c) => c.id === selectedCategory)
                      ?.label || selectedCategory
                  }" 카테고리의 랭킹 데이터가 없습니다.`}
            </p>
            <p className="text-sm text-gray-500">
              다른 카테고리를 선택해보세요.
            </p>
          </div>
        ) : (
          rankings.map((ranking, index) => {
            const rank = index + 1;
            const topTreatment = ranking.topTreatments[0];
            const thumbnailUrl = topTreatment
              ? getThumbnailUrl(topTreatment)
              : "https://via.placeholder.com/400x300/667eea/ffffff?text=🏥";

            return (
              <div key={ranking.treatmentName} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-start gap-4">
                  <span className="text-primary-main text-4xl font-bold leading-none">
                    {rank}
                  </span>
                  <div className="flex-1 pt-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {ranking.treatmentName}
                    </h2>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                        <span className="text-gray-900 font-semibold text-sm">
                          {ranking.averageRating > 0
                            ? ranking.averageRating.toFixed(1)
                            : "-"}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        리뷰 {ranking.totalReviews}개
                      </span>
                      {ranking.averagePrice > 0 && (
                        <span className="text-gray-500 text-xs">
                          평균{" "}
                          {new Intl.NumberFormat("ko-KR").format(
                            Math.round(ranking.averagePrice / 10000)
                          )}
                          만원
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {ranking.topTreatments.map((treatment) => {
                    const isFavorite = favorites.has(
                      treatment.treatment_id || 0
                    );
                    const treatmentThumbnail = getThumbnailUrl(treatment);
                    const price = treatment.selling_price
                      ? new Intl.NumberFormat("ko-KR").format(
                          treatment.selling_price
                        ) + "원"
                      : "";
                    const rating = treatment.rating || 0;
                    const reviewCount = treatment.review_count || 0;
                    const discountRate = treatment.dis_rate
                      ? `${treatment.dis_rate}%`
                      : "";

                    return (
                      <div
                        key={treatment.treatment_id}
                        className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                      >
                        {/* Image */}
                        <div className="relative w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={treatmentThumbnail}
                            alt={treatment.treatment_name || "시술 이미지"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/400x300/667eea/ffffff?text=🏥";
                            }}
                          />
                          {discountRate && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                              {discountRate}
                            </div>
                          )}
                          <div className="absolute top-3 right-3 flex gap-2 z-10">
                            <button
                              onClick={(e) => handleFavoriteClick(treatment, e)}
                              className="bg-white bg-opacity-90 p-2 rounded-full shadow-sm hover:bg-opacity-100 transition-colors"
                            >
                              <FiHeart
                                className={`text-lg ${
                                  isFavorite
                                    ? "text-red-500 fill-red-500"
                                    : "text-gray-700"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Title Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-8">
                            <p className="text-white font-bold text-base drop-shadow-lg">
                              {treatment.treatment_name}
                            </p>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4">
                          {/* Clinic Info */}
                          {treatment.hospital_name && (
                            <div className="mb-2">
                              <p className="text-gray-900 font-semibold text-sm">
                                {treatment.hospital_name}
                              </p>
                            </div>
                          )}

                          {/* Price */}
                          {price && (
                            <p className="text-gray-900 font-bold text-lg mb-3">
                              {price}
                              {treatment.vat_info && ` ${treatment.vat_info}`}
                            </p>
                          )}

                          {/* Rating & Reviews */}
                          {(rating > 0 || reviewCount > 0) && (
                            <div className="flex items-center justify-between mb-4">
                              {rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                                  <span className="text-gray-900 font-semibold text-sm">
                                    {rating.toFixed(1)}
                                  </span>
                                  {reviewCount > 0 && (
                                    <span className="text-gray-500 text-xs">
                                      ({reviewCount}개)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          {treatment.event_url && (
                            <div className="flex gap-2">
                              <a
                                href={treatment.event_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-primary-main hover:bg-[#2DB8A0] active:bg-primary-light text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm text-center"
                              >
                                상세보기
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* More indicator */}
                  {ranking.treatments.length > 3 && (
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      <IoChevronForward className="text-gray-400 text-2xl" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
