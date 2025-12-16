"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiStar, FiCalendar } from "react-icons/fi";
import {
  loadTreatmentsPaginated,
  getKBeautyRankings,
  getThumbnailUrl,
  getRecoveryInfoByCategoryMid,
  parseRecoveryPeriod,
  parseProcedureTime,
  Treatment,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";

export default function KBeautyRankingPage() {
  const router = useRouter();
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [rankings, setRankings] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 필요한 만큼만 로드 (200개)
        // 랭킹 페이지는 플랫폼 우선순위 정렬 없이 원본 데이터 순서로 로드
        const result = await loadTreatmentsPaginated(1, 200, {
          skipPlatformSort: true,
        });
        const data = result.data;
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
  const startIndex = 0;

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
      setFavorites((prev) => {
        const next = new Set(prev);
        next.add(treatment.treatment_id!);
        return next;
      });
    }
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  // 일정 추가 핸들러
  const handleDateSelect = async (date: string) => {
    if (!selectedTreatment) return;

    // category_mid로 회복 기간 정보 가져오기
    let recoveryDays = 0;
    let recoveryText: string | null = null;

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax;
        recoveryText = recoveryInfo.recoveryText;
      }
    }

    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");

    const newSchedule = {
      id: Date.now(),
      treatmentId: selectedTreatment.treatment_id,
      procedureDate: date,
      procedureName: selectedTreatment.treatment_name || "시술명 없음",
      hospital: selectedTreatment.hospital_name || "병원명 없음",
      category:
        selectedTreatment.category_mid ||
        selectedTreatment.category_large ||
        "기타",
      categoryMid: selectedTreatment.category_mid || null,
      recoveryDays,
      recoveryText,
      procedureTime: parseProcedureTime(selectedTreatment.surgery_time) || 0,
      price: selectedTreatment.selling_price || null,
      rating: selectedTreatment.rating || 0,
      reviewCount: selectedTreatment.review_count || 0,
    };

    schedules.push(newSchedule);
    localStorage.setItem("schedules", JSON.stringify(schedules));
    window.dispatchEvent(new Event("scheduleAdded"));

    alert(`${date}에 일정이 추가되었습니다!`);
    setIsScheduleModalOpen(false);
    setSelectedTreatment(null);
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
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (treatment.treatment_id) {
                        router.push(`/treatment/${treatment.treatment_id}`);
                      }
                    }}
                  >
                    <div className="flex gap-4 p-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-primary-main text-white rounded-lg font-bold text-lg">
                        {rank}
                      </div>

                      {/* Image - 2:1 비율 */}
                      <div className="relative w-24 aspect-[2/1] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="20"%3E🏥%3C/text%3E%3C/svg%3E';
                            target.dataset.fallback = "true";
                          }}
                        />
                        {discountRate && (
                          <div className="absolute top-1 right-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                            {discountRate}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                {treatment.treatment_name || "시술명 없음"}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {treatment.hospital_name || "병원명 없음"}
                              </p>
                            </div>
                          </div>

                          {/* Categories */}
                          {(treatment.category_large ||
                            treatment.category_mid) && (
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
                        </div>

                        {/* Price/Rating and buttons - 하단 고정 */}
                        <div className="flex items-end justify-between mt-auto">
                          <div className="flex-1">
                            {price && (
                              <p className="text-gray-900 font-bold mb-1">
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

                          {/* 하트/달력 버튼 - 세로 배치 */}
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteClick(treatment);
                              }}
                              className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <FiHeart
                                className={`text-base ${
                                  isFavorite
                                    ? "text-red-500 fill-red-500"
                                    : "text-gray-400"
                                }`}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTreatment(treatment);
                                setIsScheduleModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <FiCalendar className="text-base text-primary-main" />
                            </button>
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

      {/* 일정 추가 모달 */}
      {selectedTreatment && (
        <AddToScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedTreatment(null);
          }}
          onDateSelect={handleDateSelect}
          treatmentName={selectedTreatment.treatment_name || "시술명 없음"}
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}
    </div>
  );
}
