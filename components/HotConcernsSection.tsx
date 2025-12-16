"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiTrendingUp, FiHeart, FiStar, FiCalendar } from "react-icons/fi";
import {
  loadTreatmentsPaginated,
  getThumbnailUrl,
  calculateRecommendationScore,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  type Treatment,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";

export default function HotConcernsSection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 필요한 만큼만 로드 (50개)
        const result = await loadTreatmentsPaginated(1, 50);
        const allTreatments = result.data;

        // 추천 점수로 정렬하고 랜덤으로 10개 선택
        const sortedTreatments = allTreatments
          .map((treatment) => ({
            ...treatment,
            recommendationScore: calculateRecommendationScore(treatment),
          }))
          .sort((a, b) => b.recommendationScore - a.recommendationScore);

        // 상위 50개 중에서 랜덤으로 10개 선택
        const top50 = sortedTreatments.slice(0, 50);
        const shuffled = [...top50].sort(() => Math.random() - 0.5);
        const random10 = shuffled.slice(0, 10);

        setTreatments(random10);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  const handleScheduleClick = (treatment: Treatment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTreatment(treatment);
    setIsScheduleModalOpen(true);
  };

  const handleDateSelect = async (date: string) => {
    if (!selectedTreatment) return;

    // 해당 날짜의 기존 일정 개수 확인 (시술 + 회복 기간 합쳐서)
    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");
    const formatDate = (dateStr: string): string => {
      return dateStr;
    };

    let countOnDate = 0;
    schedules.forEach((s: any) => {
      const procDate = new Date(s.procedureDate);
      const procDateStr = formatDate(s.procedureDate);

      if (procDateStr === date) {
        countOnDate++;
      }

      for (let i = 1; i <= (s.recoveryDays || 0); i++) {
        const recoveryDate = new Date(procDate);
        recoveryDate.setDate(recoveryDate.getDate() + i);
        const recoveryDateStr = formatDate(
          `${recoveryDate.getFullYear()}-${String(
            recoveryDate.getMonth() + 1
          ).padStart(2, "0")}-${String(recoveryDate.getDate()).padStart(
            2,
            "0"
          )}`
        );
        if (recoveryDateStr === date) {
          countOnDate++;
        }
      }
    });

    if (countOnDate >= 3) {
      alert("일정이 꽉 찼습니다! 3개 이하로 정리 후 다시 시도해 주세요.");
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
      return;
    }

    // category_mid로 회복 기간 정보 가져오기 (소분류_리스트와 매칭)
    let recoveryDays = 0;
    let recoveryText: string | null = null;

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax; // 회복기간_max 기준
        recoveryText = recoveryInfo.recoveryText;
      }
    }

    // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

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
      recoveryText, // 회복 기간 텍스트 추가
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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-primary-main" />
          <h3 className="text-lg font-bold text-gray-900">
            {t("home.hotConcerns")}
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[150px] bg-gray-100 rounded-xl animate-pulse"
              style={{ height: "200px" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FiTrendingUp className="text-primary-main" />
        <h3 className="text-lg font-bold text-gray-900">
          {t("home.hotConcerns")}
        </h3>
      </div>

      {/* 카드 슬라이드 */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {treatments.map((treatment) => {
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
              className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                {/* 찜 버튼 (위) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteClick(treatment, e);
                  }}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 transition-colors shadow-sm z-10"
                >
                  <FiHeart
                    className={`text-sm ${
                      isFavorite ? "text-red-500 fill-red-500" : "text-gray-600"
                    }`}
                  />
                </button>
                {/* 달력 버튼 (아래) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScheduleClick(treatment, e);
                  }}
                  className="absolute top-11 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 transition-colors shadow-sm z-10"
                >
                  <FiCalendar className="text-sm text-primary-main" />
                </button>
              </div>

              {/* 카드 내용 */}
              <div className="p-3">
                {/* 병원명 */}
                {treatment.hospital_name && (
                  <p className="text-xs text-gray-500 mb-1 truncate">
                    {treatment.hospital_name}
                  </p>
                )}

                {/* 시술명 */}
                <h4 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2 min-h-[2.5rem]">
                  {treatment.treatment_name}
                </h4>

                {/* 평점 */}
                {rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
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

                {/* 가격 */}
                <p className="text-sm font-bold text-primary-main">{price}</p>
              </div>
            </div>
          );
        })}
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
