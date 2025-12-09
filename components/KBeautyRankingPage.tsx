"use client";

import { useState, useEffect, useMemo } from "react";
import { FiHeart, FiStar } from "react-icons/fi";
import { loadTreatments, getKBeautyRankings, getThumbnailUrl, Treatment } from "@/lib/api/beautripApi";

export default function KBeautyRankingPage() {
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [rankings, setRankings] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadTreatments();
        setAllTreatments(data);
        const kbeautyRankings = getKBeautyRankings(data);
        setRankings(kbeautyRankings);
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

  // 상위 10개만 표시 (스크롤 페이지용)
  const displayRankings = rankings.slice(0, 10);

  const handleFavoriteClick = (treatment: Treatment) => {
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
      setFavorites((prev) => new Set([...prev, treatment.treatment_id!]));
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
    <div className="min-h-screen bg-white">
      <div className="px-4 py-6">
        <h3 className="text-lg font-bold mb-2 text-gray-900">
          K-beauty 인기 랭킹
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          K-beauty 트렌드를 반영한 인기 시술 랭킹입니다.
        </p>

        {rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">K-beauty 시술이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              총 {rankings.length}개의 K-beauty 시술 중 상위 10개를 표시합니다.
            </div>

            <div className="space-y-4">
              {displayRankings.map((treatment, index) => {
                const rank = startIndex + index + 1;
                const isFavorite = favorites.has(treatment.treatment_id || 0);
                const thumbnailUrl = getThumbnailUrl(treatment);
                const price = treatment.selling_price
                  ? new Intl.NumberFormat("ko-KR").format(treatment.selling_price) + "원"
                  : "";
                const rating = treatment.rating || 0;
                const reviewCount = treatment.review_count || 0;
                const discountRate = treatment.dis_rate ? `${treatment.dis_rate}%` : "";

                return (
                  <div
                    key={treatment.treatment_id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-primary-main text-white rounded-lg font-bold text-lg">
                        {rank}
                      </div>

                      {/* Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={thumbnailUrl}
                          alt={treatment.treatment_name || "시술 이미지"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/200x200/667eea/ffffff?text=🏥";
                          }}
                        />
                        {discountRate && (
                          <div className="absolute top-1 right-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                            {discountRate}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                              {treatment.treatment_name || "시술명 없음"}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {treatment.hospital_name || "병원명 없음"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleFavoriteClick(treatment)}
                            className="flex-shrink-0 ml-2 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            <FiHeart
                              className={`text-lg ${
                                isFavorite
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Categories */}
                        {(treatment.category_large || treatment.category_mid) && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {treatment.category_large && (
                              <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-medium">
                                {treatment.category_large}
                              </span>
                            )}
                            {treatment.category_mid && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                                {treatment.category_mid}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between">
                          {price && (
                            <p className="text-gray-900 font-bold">
                              {price}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {rating > 0 && (
                              <div className="flex items-center gap-1">
                                <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                                <span className="text-gray-900 font-semibold text-sm">
                                  {rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {reviewCount > 0 && (
                              <span className="text-gray-500 text-xs">
                                리뷰 {reviewCount}개
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 페이지네이션 제거 (스크롤 페이지에서는 상위 10개만 표시) */}
          </>
        )}
      </div>
    </div>
  );
}

