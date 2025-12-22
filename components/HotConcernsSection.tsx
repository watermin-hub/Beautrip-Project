"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiTrendingUp, FiHeart, FiStar, FiCalendar } from "react-icons/fi";
import {
  getHomeHotTreatments,
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  toggleProcedureFavorite,
  getFavoriteStatus,
  type Treatment,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";
import LoginRequiredPopup from "./LoginRequiredPopup";

export default function HotConcernsSection() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // RPC로 인기 시술 조회 (서버에서 점수 산정/정렬/랜덤 셔플까지 처리)
        const hotTreatments = await getHomeHotTreatments(language, {
          limit: 10,
        });
        setTreatments(hotTreatments);
      } catch (error) {
        console.error("인기 시술 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [language]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (treatments.length === 0) return;

      const treatmentIds = treatments
        .map((t) => t.treatment_id)
        .filter((id): id is number => id !== undefined);

      if (treatmentIds.length > 0) {
        const favoriteStatus = await getFavoriteStatus(treatmentIds);
        setFavorites(favoriteStatus);
      }
    };

    loadFavorites();
  }, [treatments]);

  const handleFavoriteClick = async (
    treatment: Treatment,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
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
      // 로그인이 필요한 경우 안내 팝업 표시
      if (result.error?.includes("로그인이 필요") || result.error?.includes("로그인")) {
        setIsInfoModalOpen(true);
      } else {
        console.error("찜하기 처리 실패:", result.error);
      }
    }
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
      alert(t("alert.scheduleFull"));
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
      return;
    }

    // category_mid로 회복 기간 정보 가져오기 (소분류_리스트와 매칭)
    let recoveryDays = 0;
    let recoveryText: string | null = null;
    let recoveryGuides: Record<string, string | null> | undefined = undefined;

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax; // 회복기간_max 기준
        recoveryText = recoveryInfo.recoveryText;
        recoveryGuides = recoveryInfo.recoveryGuides; // 회복 가이드 범위별 텍스트 추가
      }
    }

    // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

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
      recoveryText, // 회복 기간 텍스트 추가
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
      // entry_source: "home" (홈에서 진입)
      import("@/lib/gtm").then(({ trackAddToSchedule }) => {
        trackAddToSchedule("home");
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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-primary-main" />
          <h3 className="text-lg font-bold text-gray-900">
            {t("home.hotConcerns")}
          </h3>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3">
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
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3">
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
              className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => {
                if (treatment.treatment_id) {
                  router.push(`/home/treatment/${treatment.treatment_id}`);
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
                {/* 찜 버튼 - 썸네일 우측 상단 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteClick(treatment, e);
                  }}
                  className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors"
                >
                  <FiHeart
                    className={`text-base ${
                      isFavorite ? "text-red-500 fill-red-500" : "text-gray-700"
                    }`}
                  />
                </button>
              </div>

              {/* 카드 내용 - 균형 좋은 간격 */}
              <div className="p-2.5 flex flex-col min-h-[116px]">
                {/* 상단 콘텐츠 */}
                <div className="space-y-1.5">
                  {/* 시술명 */}
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px] leading-5">
                    {treatment.treatment_name}
                  </h4>

                  {/* 평점 */}
                  {rating > 0 ? (
                    <div className="flex items-center gap-1 h-[14px]">
                      <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                      <span className="text-xs font-semibold text-gray-700">
                        {rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({reviewCount.toLocaleString()})
                      </span>
                    </div>
                  ) : (
                    <div className="h-[14px]" />
                  )}

                  {/* 병원명 */}
                  {treatment.hospital_name ? (
                    <p className="text-xs text-gray-600 line-clamp-1 h-[16px]">
                      {treatment.hospital_name}
                    </p>
                  ) : (
                    <div className="h-[16px]" />
                  )}
                </div>

                {/* 하단 정보 - 적당한 간격 */}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  {/* 가격 */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-primary-main">
                      {price}
                    </span>
                    {treatment.vat_info && (
                      <span className="text-[10px] text-gray-500">
                        {treatment.vat_info}
                      </span>
                    )}
                  </div>

                  {/* 일정 추가 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScheduleClick(treatment, e);
                    }}
                    className="p-1.5 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-colors flex-shrink-0"
                  >
                    <FiCalendar className="text-base text-primary-main" />
                  </button>
                </div>
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
          treatmentName={selectedTreatment.treatment_name || t("common.noTreatmentName")}
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}

      {/* 안내 팝업 모달 */}
      {isInfoModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setIsInfoModalOpen(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl pointer-events-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {t("common.loginRequired")}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t("common.loginRequiredMoreInfo")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsInfoModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      setIsInfoModalOpen(false);
                      setShowLoginRequiredPopup(true);
                    }}
                    className="flex-1 py-2.5 px-4 bg-primary-main hover:bg-primary-main/90 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.login")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
        }}
      />
    </div>
  );
}
