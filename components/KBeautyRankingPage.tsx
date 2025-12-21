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
  toggleProcedureFavorite,
  getFavoriteStatus,
  Treatment,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function KBeautyRankingPage() {
  const { t } = useLanguage();
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
    const loadFavorites = async () => {
      if (rankings.length === 0) return;

      const treatmentIds = rankings
        .map((t) => t.treatment_id)
        .filter((id): id is number => id !== undefined);

      if (treatmentIds.length > 0) {
        const favoriteStatus = await getFavoriteStatus(treatmentIds);
        setFavorites(favoriteStatus);
      }
    };

    loadFavorites();
  }, [rankings]);

  // 상위 10개만 표시 (스크롤 페이지용)
  const displayRankings = rankings.slice(0, 10);
  const startIndex = 0;

  const handleFavoriteClick = async (treatment: Treatment) => {
    if (!treatment.treatment_id) return;

    const result = await toggleProcedureFavorite(treatment.treatment_id);

    if (result.success) {
      // Supabase 업데이트 성공 시 로컬 상태 업데이트
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (result.isFavorite) {
          newSet.add(treatment.treatment_id!);
        } else {
          newSet.delete(treatment.treatment_id!);
        }
        return newSet;
      });
      window.dispatchEvent(new Event("favoritesUpdated"));
    } else {
      console.error("찜하기 처리 실패:", result.error);
    }
  };

  // 일정 추가 핸들러
  const handleDateSelect = async (date: string) => {
    if (!selectedTreatment) return;

    // category_mid로 회복 기간 정보 가져오기
    let recoveryDays = 0;
    let recoveryText: string | null = null;
    let recoveryGuides: Record<string, string | null> | undefined = undefined;

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax;
        recoveryText = recoveryInfo.recoveryText;
        recoveryGuides = recoveryInfo.recoveryGuides; // 회복 가이드 범위별 텍스트 추가
      }
    }

    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");

    // 중복 체크: 같은 날짜에 동일한 시술이 있는지 확인
    const procedureName = selectedTreatment.treatment_name || t("common.noTreatmentName");
    const hospital = selectedTreatment.hospital_name || t("common.noHospitalName");
    const treatmentId = selectedTreatment.treatment_id;

    const isDuplicate = schedules.some((s: any) => {
      if (s.procedureDate !== date) return false;
      // treatmentId가 있으면 treatmentId로 비교
      if (treatmentId && s.treatmentId) {
        return s.treatmentId === treatmentId;
      }
      // treatmentId가 없으면 procedureName과 hospital 조합으로 비교
      return s.procedureName === procedureName && s.hospital === hospital;
    });

    if (isDuplicate) {
      alert(t("alert.duplicateSchedule"));
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
      return;
    }

    const newSchedule = {
      id: Date.now(),
      treatmentId: treatmentId,
      procedureDate: date,
      procedureName: procedureName,
      hospital: hospital,
      category:
        selectedTreatment.category_mid ||
        selectedTreatment.category_large ||
        "기타",
      categoryMid: selectedTreatment.category_mid || null,
      recoveryDays,
      recoveryText,
      recoveryGuides, // 회복 가이드 범위별 텍스트 추가
      procedureTime: parseProcedureTime(selectedTreatment.surgery_time) || 0,
      price: selectedTreatment.selling_price || null,
      rating: selectedTreatment.rating || 0,
      reviewCount: selectedTreatment.review_count || 0,
    };

    schedules.push(newSchedule);

    // localStorage 저장 시도 (에러 처리 추가)
    try {
      const schedulesJson = JSON.stringify(schedules);
      localStorage.setItem("schedules", schedulesJson);
      window.dispatchEvent(new Event("scheduleAdded"));
      
      // GTM 이벤트: add_to_schedule (일정 추가 성공 후)
      // entry_source: "ranking" (랭킹 페이지에서 진입)
      import("@/lib/gtm").then(({ trackAddToSchedule }) => {
        trackAddToSchedule("ranking");
      });
      
      alert(`${date}에 일정이 추가되었습니다!`);
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
    } catch (error: any) {
      console.error("일정 저장 실패:", error);
      if (error.name === "QuotaExceededError") {
        alert(t("alert.storageFull"));
      } else {
        alert(`일정 저장 중 오류가 발생했습니다: ${error.message}`);
      }
    }
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
      <div className="px-4 pt-4 pb-6">
        <h3 className="text-lg font-bold mb-2 text-gray-900">
          {t("kbeauty.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {t("kbeauty.description")}
        </p>

        {rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{t("kbeauty.empty")}</p>
          </div>
        ) : (
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
                      router.push(
                        `/explore/treatment/${treatment.treatment_id}`
                      );
                    }
                  }}
                >
                  <div className="flex gap-3 p-3">
                    {/* Rank Badge - 더 작고 세련되게 */}
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-md font-bold text-sm">
                      {rank}
                    </div>

                    {/* Image - 2:1 비율, 더 크게 */}
                    <div className="relative w-32 aspect-[2/1] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
                        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold z-10">
                          {discountRate}
                        </div>
                      )}
                      {/* 찜 버튼 - 썸네일 우측 상단 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(treatment);
                        }}
                        className="absolute top-1.5 right-1.5 bg-white bg-opacity-90 p-1.5 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors"
                      >
                        <FiHeart
                          className={`text-sm ${
                            isFavorite
                              ? "text-red-500 fill-red-500"
                              : "text-gray-700"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug">
                              {treatment.treatment_name || t("common.noTreatmentName")}
                            </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {treatment.hospital_name || t("common.noHospitalName")}
                            </p>

                        {/* Categories */}
                        {(treatment.category_large ||
                          treatment.category_mid) && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {treatment.category_large && (
                              <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-[10px] font-medium">
                                {treatment.category_large}
                              </span>
                            )}
                            {treatment.category_mid && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">
                                {treatment.category_mid}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-2">
                            {rating > 0 && (
                              <div className="flex items-center gap-1">
                              <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                              <span className="text-gray-900 font-semibold text-xs">
                                  {rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {reviewCount > 0 && (
                            <span className="text-gray-500 text-[10px]">
                                리뷰 {reviewCount}개
                              </span>
                            )}
                          </div>
                        </div>

                      {/* Price and Calendar button - 하단 고정 */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        {price && (
                          <p className="text-primary-main font-bold text-sm">
                            {price}
                          </p>
                        )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTreatment(treatment);
                              setIsScheduleModalOpen(true);
                            }}
                          className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <FiCalendar className="text-base text-primary-main" />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
          treatmentName={selectedTreatment.treatment_name || t("common.noTreatmentName")}
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}
    </div>
  );
}
