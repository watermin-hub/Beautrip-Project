"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiTag,
  FiClock,
  FiArrowLeft,
  FiStar,
  FiHeart,
  FiEdit2,
  FiX,
} from "react-icons/fi";
import { IoCheckmarkCircle } from "react-icons/io5";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import TravelScheduleCalendarModal from "./TravelScheduleCalendarModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTravelPeriod, formatDateWithDay } from "@/lib/utils/dateFormat";
import {
  getRecoveryInfoByCategoryMid,
  findRecoveryGuideByCategorySmall,
  loadTreatmentsPaginated,
  loadTreatmentById,
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  type Treatment,
  saveSchedule,
  getSavedSchedules,
  deleteSavedSchedule,
  type SavedSchedule,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";

/**
 * 받침 유무에 따라 "와" 또는 "과"를 반환하는 함수
 * @param text - 받침을 확인할 텍스트 (단일 단어 또는 "+"로 연결된 여러 단어)
 * @returns "와" (받침 없음) 또는 "과" (받침 있음)
 */
function getWaOrGwa(text: string): string {
  if (!text || text.length === 0) return "과";

  // "+"로 연결된 경우 마지막 단어를 확인
  const words = text.split("+").map((w) => w.trim());
  const lastWord = words[words.length - 1];

  if (!lastWord || lastWord.length === 0) return "과";

  // 마지막 문자 가져오기
  const lastChar = lastWord[lastWord.length - 1];
  const charCode = lastChar.charCodeAt(0);

  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (charCode >= 0xac00 && charCode <= 0xd7a3) {
    // 받침 확인: (유니코드 - 0xAC00) % 28
    // 0이면 받침 없음, 0이 아니면 받침 있음
    const hasBatchim = (charCode - 0xac00) % 28 !== 0;
    return hasBatchim ? "과" : "와";
  }

  // 한글이 아닌 경우 (영문, 숫자 등) 기본값으로 "과" 반환
  // 영문의 경우 마지막 글자가 자음/모음에 따라 다를 수 있지만,
  // 일반적으로 "과"를 사용하는 것이 안전
  return "과";
}

interface TravelPeriod {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

interface ProcedureSchedule {
  id: number;
  procedureDate: string; // 시술 날짜
  procedureName: string;
  hospital: string;
  category: string;
  categoryMid?: string | null; // 중분류 (회복 기간 정보 가져오기용)
  categorySmall?: string | null; // 소분류 (회복 가이드 매칭용)
  recoveryDays: number; // 회복 기간 (일) - 회복기간_max 기준
  recoveryText?: string | null; // 회복 기간 텍스트 (1~3, 4~7, 8~14, 15~21)
  recoveryGuides?: Record<string, string | null>; // 회복 가이드 범위별 텍스트
  procedureTime?: string;
  isRecovery?: boolean; // 회복 기간 표시용
  recoveryDayIndex?: number; // 회복 기간 며칠째인지 (1 기반)
  treatmentId?: number; // 시술 ID (category_small 가져오기용)
}

// 예시 데이터: 일주일 여행 일정 (현재 연도 기준)
const getCurrentYear = () => new Date().getFullYear();
const EXAMPLE_TRAVEL_PERIOD: TravelPeriod = {
  start: `${getCurrentYear()}-12-15`,
  end: `${getCurrentYear()}-12-22`,
};

// 예시 시술 일정
const EXAMPLE_PROCEDURES: ProcedureSchedule[] = [
  {
    id: 1,
    procedureDate: `${getCurrentYear()}-12-16`,
    procedureName: "리쥬란 힐러",
    hospital: "강남비비의원",
    category: "피부관리",
    recoveryDays: 1,
    procedureTime: "10:00",
  },
  {
    id: 2,
    procedureDate: `${getCurrentYear()}-12-18`,
    procedureName: "인모드 리프팅",
    hospital: "압구정 클리닉",
    category: "윤곽/리프팅",
    recoveryDays: 2,
    procedureTime: "14:00",
  },
];

const clinicMarkers = [
  { id: 1, x: 15, y: 20, count: 12, label: "12개의 병원" },
  { id: 2, x: 75, y: 30, count: 4, label: "4개의 병원" },
  { id: 3, x: 40, y: 50, count: 22, label: "22개의 병원" },
  { id: 4, x: 60, y: 45, count: 9, label: "9개의 병원" },
  { id: 5, x: 25, y: 65, count: 15, label: "15개의 병원" },
  { id: 6, x: 80, y: 70, count: 7, label: "7개의 병원" },
];

const clinics = [
  {
    id: 1,
    name: "셀이즈연세메디컬의원",
    location: "남부터미널역",
    procedure: "피부미백 백옥주사",
    price: "5.5만원",
    rating: "10",
    reviewCount: "10+",
    likes: 2,
    image: "",
  },
  {
    id: 2,
    name: "장덕한방병원",
    location: "신사역",
    procedure: "재생/탄력",
    price: "16.5만원",
    rating: "10",
    reviewCount: "1+",
    likes: 3,
    image: "",
  },
  {
    id: 3,
    name: "비비의원",
    location: "강남역",
    procedure: "리쥬란 힐러",
    price: "12만원",
    rating: "9.8",
    reviewCount: "50+",
    likes: 45,
    image: "",
  },
  {
    id: 4,
    name: "다이아의원",
    location: "압구정역",
    procedure: "주름보톡스",
    price: "3.5만원",
    rating: "9.6",
    reviewCount: "100+",
    likes: 120,
    image: "",
  },
];

// 비슷한 시술 추천 컴포넌트 (소분류 기준)
function SimilarProcedureRecommendation({
  categorySmall,
  currentProcedureId,
  currentProcedureName,
  travelPeriod,
}: {
  categorySmall: string | null;
  currentProcedureId?: number;
  currentProcedureName: string;
  travelPeriod: TravelPeriod | null;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [similarTreatments, setSimilarTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [recoveryInfoMap, setRecoveryInfoMap] = useState<
    Record<number, number>
  >({});

  // 비슷한 시술 로드
  useEffect(() => {
    const loadSimilarTreatments = async () => {
      if (!categorySmall) {
        setSimilarTreatments([]);
        return;
      }

      setLoading(true);
      try {
        // 같은 소분류의 시술들을 로드
        const trimmedCategorySmall = categorySmall.trim();

        const result = await loadTreatmentsPaginated(1, 100, {
          categorySmall: trimmedCategorySmall,
        });

        // 이미 일정에 추가된 시술 제외
        const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");
        const scheduledTreatmentIds = new Set(
          schedules
            .map((s: any) => s.treatmentId)
            .filter((id: any) => id !== undefined && id !== null)
        );

        // 현재 시술도 제외
        if (currentProcedureId) {
          scheduledTreatmentIds.add(currentProcedureId);
        }

        // 소분류 정규화 함수 (공백 제거, 대소문자 통일)
        const normalizeCategorySmall = (
          cat: string | null | undefined
        ): string => {
          if (!cat) return "";
          return cat.trim().toLowerCase();
        };

        const normalizedCategorySmall = normalizeCategorySmall(categorySmall);

        const filtered = result.data.filter((treatment) => {
          const treatmentCategorySmall = normalizeCategorySmall(
            treatment.category_small
          );

          const matches =
            treatment.treatment_id &&
            !scheduledTreatmentIds.has(treatment.treatment_id) &&
            treatment.treatment_name !== currentProcedureName &&
            treatmentCategorySmall === normalizedCategorySmall;

          return matches;
        });

        // 최대 3개만 표시
        const limitedTreatments = filtered.slice(0, 3);
        setSimilarTreatments(limitedTreatments);

        // 회복 기간 정보 로드
        const recoveryMap: Record<number, number> = {};
        await Promise.all(
          limitedTreatments.map(async (treatment) => {
            if (treatment.treatment_id && treatment.category_mid) {
              try {
                const recoveryInfo = await getRecoveryInfoByCategoryMid(
                  treatment.category_mid
                );
                if (recoveryInfo) {
                  recoveryMap[treatment.treatment_id] =
                    recoveryInfo.recommendedStayDays > 0
                      ? recoveryInfo.recommendedStayDays
                      : recoveryInfo.recoveryMax || 0;
                }
              } catch (error) {
                // 회복 정보 로드 실패 시 무시
              }
            }
          })
        );
        setRecoveryInfoMap(recoveryMap);
      } catch (error) {
        console.error("비슷한 시술 로드 실패:", error);
        setSimilarTreatments([]);
      } finally {
        setLoading(false);
      }
    };

    loadSimilarTreatments();
  }, [categorySmall, currentProcedureId, currentProcedureName]);

  // 중복 시술 체크 헬퍼 함수
  const isDuplicateProcedure = (
    schedules: any[],
    date: string,
    treatmentId: number | undefined,
    procedureName: string,
    hospital: string
  ): boolean => {
    return schedules.some((s: any) => {
      // 같은 날짜인지 확인
      if (s.procedureDate !== date) return false;

      // treatmentId가 있으면 treatmentId로 비교
      if (treatmentId && s.treatmentId) {
        return s.treatmentId === treatmentId;
      }

      // treatmentId가 없으면 procedureName과 hospital 조합으로 비교
      return s.procedureName === procedureName && s.hospital === hospital;
    });
  };

  // 일정 추가 핸들러
  const handleDateSelect = async (date: string) => {
    if (!selectedTreatment) return;

    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");

    // 중복 체크
    const procedureName =
      selectedTreatment.treatment_name || t("common.noTreatmentName");
    const hospital =
      selectedTreatment.hospital_name || t("common.noHospitalName");
    const treatmentId = selectedTreatment.treatment_id;

    if (
      isDuplicateProcedure(
        schedules,
        date,
        treatmentId,
        procedureName,
        hospital
      )
    ) {
      alert(t("alert.duplicateSchedule"));
      return;
    }

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
        recoveryGuides = recoveryInfo.recoveryGuides;
      }
    }

    // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
    if (recoveryDays === 0) {
      const { parseRecoveryPeriod } = await import("@/lib/api/beautripApi");
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

    const newId =
      schedules.length > 0
        ? Math.max(...schedules.map((s: any) => s.id)) + 1
        : 1;

    const newSchedule = {
      id: newId,
      procedureDate: date,
      procedureName: procedureName,
      hospital: hospital,
      category: selectedTreatment.category_large || "",
      categoryMid: selectedTreatment.category_mid || null,
      categorySmall: selectedTreatment.category_small || null,
      recoveryDays,
      recoveryText,
      recoveryGuides,
      treatmentId: treatmentId,
    };

    schedules.push(newSchedule);

    // localStorage 저장 시도 (에러 처리 추가)
    try {
      const schedulesJson = JSON.stringify(schedules);
      localStorage.setItem("schedules", schedulesJson);
      window.dispatchEvent(new Event("scheduleAdded"));
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
      alert(t("alert.scheduleAdded"));
    } catch (error: any) {
      console.error("일정 저장 실패:", error);
      if (error.name === "QuotaExceededError") {
        alert(t("alert.storageFull"));
      } else {
        alert(`일정 저장 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  if (!categorySmall || similarTreatments.length === 0) {
    return null;
  }

  // HotConcernsSection과 동일한 카드 형식으로 렌더링
  if (loading || similarTreatments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-5 space-y-3">
        {/* 서브 타이틀: "~~~와(과) 비슷한 시술이에요" */}
        <p className="text-sm font-semibold text-gray-700">
          {currentProcedureName}
          {getWaOrGwa(currentProcedureName)} 비슷한 시술이에요
        </p>

        {/* 연관 시술 카드들 - HotConcernsSection과 동일한 형식 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3">
          {similarTreatments.map((treatment) => {
            const thumbnailUrl = getThumbnailUrl(treatment);
            const price = treatment.selling_price
              ? `${Math.round(treatment.selling_price / 10000)}만원`
              : t("common.priceInquiry");
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
                    router.push(
                      `/schedule/treatment/${treatment.treatment_id}`
                    );
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

                  {/* 하단 정보 */}
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
                        setSelectedTreatment(treatment);
                        setIsScheduleModalOpen(true);
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
          treatmentName={
            selectedTreatment.treatment_name || t("common.noTreatmentName")
          }
          selectedStartDate={travelPeriod?.start || null}
          selectedEndDate={travelPeriod?.end || null}
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}
    </>
  );
}

// 저장된 일정 탭 컴포넌트
function SavedSchedulesTab({
  travelPeriod,
  savedSchedules,
  onScheduleClick,
  formatDate,
  monthNames,
  dayNames,
}: {
  travelPeriod: TravelPeriod | null;
  savedSchedules: ProcedureSchedule[];
  onScheduleClick?: (schedule: SavedSchedule) => void;
  formatDate: (date: Date) => string;
  monthNames: string[];
  dayNames: string[];
}) {
  const { t, language } = useLanguage();
  const [savedSchedulesList, setSavedSchedulesList] = useState<SavedSchedule[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<SavedSchedule | null>(null);
  const [selectedScheduleProcedures, setSelectedScheduleProcedures] = useState<
    ProcedureSchedule[]
  >([]);
  const [selectedScheduleTravelPeriod, setSelectedScheduleTravelPeriod] =
    useState<TravelPeriod | null>(null);
  const [selectedScheduleCurrentDate, setSelectedScheduleCurrentDate] =
    useState(new Date());
  const [selectedScheduleSelectedDate, setSelectedScheduleSelectedDate] =
    useState<string | null>(null);

  // 저장된 일정 목록 로드
  useEffect(() => {
    loadSavedSchedules();

    // 저장된 일정 업데이트 이벤트 리스너
    const handleSavedScheduleUpdate = () => {
      loadSavedSchedules();
    };
    window.addEventListener("savedScheduleUpdated", handleSavedScheduleUpdate);

    return () => {
      window.removeEventListener(
        "savedScheduleUpdated",
        handleSavedScheduleUpdate
      );
    };
  }, []);

  const loadSavedSchedules = async () => {
    setLoading(true);
    try {
      const result = await getSavedSchedules();
      if (result.success && result.schedules) {
        setSavedSchedulesList(result.schedules);
      }
    } catch (error) {
      console.error("저장된 일정 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 저장된 일정 클릭 핸들러 (탭 내에서 달력 표시)
  const handleScheduleClickInTab = async (schedule: SavedSchedule) => {
    try {
      // schedule_period 파싱 (예: "25.12.19~25.12.20")
      const periodMatch = schedule.schedule_period.match(
        /(\d{2})\.(\d{2})\.(\d{2})~(\d{2})\.(\d{2})\.(\d{2})/
      );
      if (!periodMatch) {
        alert(t("alert.invalidScheduleFormat"));
        return;
      }

      const [, startYear, startMonth, startDay, endYear, endMonth, endDay] =
        periodMatch;
      const year = 2000 + parseInt(startYear);
      const startDate = `${year}-${startMonth}-${startDay}`;
      const endDate = `${year}-${endMonth}-${endDay}`;

      // travelPeriod 설정
      const newTravelPeriod: TravelPeriod = {
        start: startDate,
        end: endDate,
      };
      setSelectedScheduleTravelPeriod(newTravelPeriod);

      // treatment_ids로 각 시술 정보 로드
      const newSchedules: ProcedureSchedule[] = [];
      for (let i = 0; i < schedule.treatment_ids.length; i++) {
        const treatmentId = schedule.treatment_ids[i];
        try {
          const treatment = await loadTreatmentById(treatmentId);
          if (!treatment) continue;

          // 회복 기간 정보 가져오기
          let recoveryDays = 0;
          let recoveryText: string | null = null;
          let recoveryGuides: Record<string, string | null> | undefined =
            undefined;

          if (treatment.category_mid) {
            const recoveryInfo = await getRecoveryInfoByCategoryMid(
              treatment.category_mid
            );
            if (recoveryInfo) {
              recoveryDays = recoveryInfo.recoveryMax;
              recoveryText = recoveryInfo.recoveryText;
              recoveryGuides = recoveryInfo.recoveryGuides;
            }
          }

          // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
          if (recoveryDays === 0) {
            recoveryDays = parseRecoveryPeriod(treatment.downtime) || 0;
          }

          // 시술 날짜는 treatment_dates 배열에서 인덱스로 가져오고, 없으면 여행 시작일로 설정
          const procedureDate = schedule.treatment_dates?.[i] || startDate;

          const newId =
            newSchedules.length > 0
              ? Math.max(...newSchedules.map((s) => s.id)) + 1
              : 1;

          newSchedules.push({
            id: newId,
            procedureDate: procedureDate,
            procedureName:
              treatment.treatment_name || t("common.noTreatmentName"),
            hospital: treatment.hospital_name || t("common.noHospitalName"),
            category: treatment.category_large || "",
            categoryMid: treatment.category_mid || null,
            categorySmall: treatment.category_small || null,
            recoveryDays,
            recoveryText,
            recoveryGuides,
            treatmentId: treatment.treatment_id,
          });
        } catch (error) {
          console.error(`시술 ID ${treatmentId} 로드 실패:`, error);
        }
      }

      if (newSchedules.length === 0) {
        alert(t("alert.loadScheduleError"));
        return;
      }

      setSelectedSchedule(schedule);
      setSelectedScheduleProcedures(newSchedules);
      setSelectedScheduleCurrentDate(new Date(startDate));
    } catch (error) {
      console.error("저장된 일정 로드 실패:", error);
      alert(t("alert.loadSavedScheduleError"));
    }
  };

  // 저장된 일정 삭제
  const handleDeleteSavedSchedule = async (scheduleId: string) => {
    if (!confirm(t("confirm.deleteSavedSchedule"))) {
      return;
    }

    try {
      const result = await deleteSavedSchedule(scheduleId);
      if (result.success) {
        alert(t("alert.scheduleDeleted"));
        loadSavedSchedules();
      } else {
        alert(result.error || "일정 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("일정 삭제 실패:", error);
      alert(t("alert.scheduleDeleteFailed"));
    }
  };

  // 선택된 일정의 달력 계산
  const selectedScheduleProcedureDates = useMemo(() => {
    if (!selectedScheduleProcedures.length) return {};
    const dates: { [key: string]: ProcedureSchedule[] } = {};

    // formatDate를 내부에서 정의하여 의존성 문제 방지
    const formatDateLocal = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    selectedScheduleProcedures.forEach((proc) => {
      const procDate = new Date(proc.procedureDate);
      const procDateStr = formatDateLocal(procDate);
      if (!dates[procDateStr]) dates[procDateStr] = [];
      dates[procDateStr].push(proc);

      for (let i = 1; i <= proc.recoveryDays; i++) {
        const recoveryDate = new Date(procDate);
        recoveryDate.setDate(recoveryDate.getDate() + i);
        const recoveryDateStr = formatDateLocal(recoveryDate);
        if (!dates[recoveryDateStr]) dates[recoveryDateStr] = [];
        dates[recoveryDateStr].push({
          ...proc,
          isRecovery: true,
          recoveryDayIndex: i,
        });
      }
    });
    return dates;
  }, [selectedScheduleProcedures]);

  const selectedScheduleYear = selectedScheduleCurrentDate.getFullYear();
  const selectedScheduleMonth = selectedScheduleCurrentDate.getMonth();
  const selectedScheduleFirstDay = new Date(
    selectedScheduleYear,
    selectedScheduleMonth,
    1
  );
  const selectedScheduleLastDay = new Date(
    selectedScheduleYear,
    selectedScheduleMonth + 1,
    0
  );
  const selectedScheduleDaysInMonth = selectedScheduleLastDay.getDate();
  const selectedScheduleStartingDay = selectedScheduleFirstDay.getDay();

  const selectedScheduleCalendarDays: (Date | null)[] = [];
  const selectedSchedulePrevMonthLastDay = new Date(
    selectedScheduleYear,
    selectedScheduleMonth,
    0
  ).getDate();
  for (let i = selectedScheduleStartingDay - 1; i >= 0; i--) {
    selectedScheduleCalendarDays.push(
      new Date(
        selectedScheduleYear,
        selectedScheduleMonth - 1,
        selectedSchedulePrevMonthLastDay - i
      )
    );
  }
  for (let day = 1; day <= selectedScheduleDaysInMonth; day++) {
    selectedScheduleCalendarDays.push(
      new Date(selectedScheduleYear, selectedScheduleMonth, day)
    );
  }
  const selectedScheduleRemainingDays =
    42 - selectedScheduleCalendarDays.length;
  for (let day = 1; day <= selectedScheduleRemainingDays; day++) {
    selectedScheduleCalendarDays.push(
      new Date(selectedScheduleYear, selectedScheduleMonth + 1, day)
    );
  }

  // formatDate, monthNames, dayNames는 MySchedulePage에서 정의된 것을 사용

  const isSelectedScheduleTravelPeriod = (date: Date): boolean => {
    if (!selectedScheduleTravelPeriod) return false;
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    // 시간 부분을 제거하고 날짜만 비교
    const startDate = new Date(selectedScheduleTravelPeriod.start);
    const startOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const endDate = new Date(selectedScheduleTravelPeriod.end);
    const endOnly = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    return dateOnly >= startOnly && dateOnly <= endOnly;
  };

  const isSelectedScheduleProcedureDate = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return (
      selectedScheduleProcedureDates[dateStr]?.some((p) => !p.isRecovery) ||
      false
    );
  };

  const isSelectedScheduleRecoveryPeriod = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return (
      selectedScheduleProcedureDates[dateStr]?.some((p) => p.isRecovery) ||
      false
    );
  };

  const getSelectedScheduleProceduresForDate = (
    date: Date
  ): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return (
      selectedScheduleProcedureDates[dateStr]?.filter((p) => !p.isRecovery) ||
      []
    );
  };

  const getSelectedScheduleRecoveryForDate = (
    date: Date
  ): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return (
      selectedScheduleProcedureDates[dateStr]?.filter((p) => p.isRecovery) || []
    );
  };

  return (
    <div className="px-4 py-4">
      {/* 선택된 일정의 달력 (세로 크기만 줄임) */}
      {selectedSchedule && selectedScheduleTravelPeriod && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedSchedule.schedule_period}
            </h3>
            <button
              onClick={() => {
                setSelectedSchedule(null);
                setSelectedScheduleProcedures([]);
                setSelectedScheduleTravelPeriod(null);
                setSelectedScheduleSelectedDate(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              닫기
            </button>
          </div>

          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() =>
                setSelectedScheduleCurrentDate(
                  new Date(selectedScheduleYear, selectedScheduleMonth - 1, 1)
                )
              }
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiChevronLeft className="text-gray-700 text-lg" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {selectedScheduleYear}
              {language === "KR"
                ? "년"
                : language === "EN"
                ? ""
                : language === "JP"
                ? "年"
                : "年"}{" "}
              {monthNames[selectedScheduleMonth]}
            </h2>
            <button
              onClick={() =>
                setSelectedScheduleCurrentDate(
                  new Date(selectedScheduleYear, selectedScheduleMonth + 1, 1)
                )
              }
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiChevronRight className="text-gray-700 text-lg" />
            </button>
          </div>

          {/* 캘린더 그리드 (세로 크기만 줄임) */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-xs font-semibold text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {selectedScheduleCalendarDays.map((date, index) => {
                if (!date)
                  return (
                    <div
                      key={index}
                      className="h-12 border-r border-b border-gray-100"
                    ></div>
                  );

                const isCurrentMonth =
                  date.getMonth() === selectedScheduleMonth;
                const isTravel = isSelectedScheduleTravelPeriod(date);
                const isProcedure = isSelectedScheduleProcedureDate(date);
                const isRecovery = isSelectedScheduleRecoveryPeriod(date);
                const isSelected =
                  selectedScheduleSelectedDate === formatDate(date);

                let bgClass = "";
                let textClass = "";

                if (!isCurrentMonth) {
                  bgClass = "bg-gray-50";
                  textClass = "text-gray-300";
                } else if (isTravel) {
                  bgClass = "bg-sky-100";
                  textClass = "text-sky-700";
                } else if (isSelected) {
                  bgClass = "bg-primary-main/10";
                  textClass = "text-primary-main font-semibold";
                } else {
                  bgClass = "";
                  textClass = "text-gray-700";
                }

                const proceduresOnDate =
                  getSelectedScheduleProceduresForDate(date);
                const recoveryOnDate = getSelectedScheduleRecoveryForDate(date);

                return (
                  <button
                    key={index}
                    onClick={() =>
                      setSelectedScheduleSelectedDate(formatDate(date))
                    }
                    className={`h-12 border-r border-b border-gray-100 p-0.5 transition-colors relative ${bgClass} ${textClass} hover:bg-gray-50`}
                  >
                    <div className="flex flex-col items-start justify-start h-full w-full p-0.5">
                      <span className="text-xs font-medium">
                        {date.getDate()}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full mt-0.5">
                        {proceduresOnDate.slice(0, 3).map((proc, idx) => (
                          <div
                            key={proc.id}
                            className="w-full h-1 bg-primary-main rounded-sm"
                            title={proc.procedureName}
                          />
                        ))}
                      </div>
                      {recoveryOnDate.length > 0 &&
                        proceduresOnDate.length < 3 && (
                          <div className="flex flex-col gap-0.5 w-full mt-0.5">
                            {recoveryOnDate
                              .slice(0, 3 - proceduresOnDate.length)
                              .map((rec, idx) => (
                                <div
                                  key={`recovery-${rec.id}-${idx}`}
                                  className="w-full h-1 bg-yellow-400 rounded-sm"
                                  title={`${rec.procedureName} 회복 기간`}
                                />
                              ))}
                          </div>
                        )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택된 날짜의 시술 정보 */}
          {selectedScheduleSelectedDate && (
            <div className="space-y-3">
              {getSelectedScheduleProceduresForDate(
                new Date(selectedScheduleSelectedDate)
              ).map((proc) => (
                <div
                  key={proc.id}
                  className="bg-primary-light/10 border border-primary-main rounded-xl p-4"
                >
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    {proc.procedureName}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMapPin className="text-primary-main" />
                    <span>{proc.hospital}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 저장된 일정 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          {savedSchedulesList.length > 0 && (
            <button
              onClick={async () => {
                if (
                  !confirm(
                    t("schedule.deleteAllConfirm").replace(
                      "{count}",
                      savedSchedulesList.length.toString()
                    )
                  )
                ) {
                  return;
                }

                try {
                  let successCount = 0;
                  let failCount = 0;

                  for (const schedule of savedSchedulesList) {
                    if (schedule.id) {
                      const result = await deleteSavedSchedule(schedule.id);
                      if (result.success) {
                        successCount++;
                      } else {
                        failCount++;
                      }
                    }
                  }

                  if (failCount === 0) {
                    alert(`모든 일정(${successCount}개)이 삭제되었습니다.`);
                  } else {
                    alert(
                      `${successCount}개 삭제 성공, ${failCount}개 삭제 실패`
                    );
                  }

                  loadSavedSchedules();
                  // 선택된 일정도 초기화
                  setSelectedSchedule(null);
                  setSelectedScheduleProcedures([]);
                  setSelectedScheduleTravelPeriod(null);
                  setSelectedScheduleSelectedDate(null);
                } catch (error) {
                  console.error("일괄 삭제 실패:", error);
                  alert(t("alert.bulkDeleteError"));
                }
              }}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              모두 지우기
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">{t("common.loading")}</p>
          </div>
        ) : savedSchedulesList.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-1">
              {t("schedule.noSavedSchedules")}
            </p>
            <p className="text-gray-400 text-xs">
              일정을 저장하면 여기서 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedSchedulesList.map((schedule) => {
              // 날짜 형식 변환: "25.12.21~25.12.25" → "25년 12월 21일 ~ 25년 12월 25일 (4박 5일)"
              const formatSchedulePeriod = (period: string): string => {
                const match = period.match(
                  /(\d{2})\.(\d{2})\.(\d{2})~(\d{2})\.(\d{2})\.(\d{2})/
                );
                if (!match) return period;

                const [
                  ,
                  startYear,
                  startMonth,
                  startDay,
                  endYear,
                  endMonth,
                  endDay,
                ] = match;
                const year = 2000 + parseInt(startYear);
                const startDate = new Date(
                  year,
                  parseInt(startMonth) - 1,
                  parseInt(startDay)
                );
                const endDate = new Date(
                  year,
                  parseInt(endMonth) - 1,
                  parseInt(endDay)
                );

                // 박수 계산
                const nights =
                  Math.floor(
                    (endDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) || 0;
                const days = nights + 1;

                // 날짜 포맷팅
                const startDateStr = formatDateWithDay(
                  startDate.toISOString().split("T")[0],
                  language
                );
                const endDateStr = formatDateWithDay(
                  endDate.toISOString().split("T")[0],
                  language
                );
                const periodStr = formatTravelPeriod(nights, days, language);

                return `${startDateStr} ~ ${endDateStr} (${periodStr})`;
              };

              // 시술별 날짜 정보 가져오기 (배열)
              const treatmentDates = schedule.treatment_dates || [];
              const names = schedule.treatment_names || [];
              const ids = schedule.treatment_ids || [];

              return (
                <div
                  key={schedule.id}
                  onClick={async () => {
                    // 저장된 일정 탭 내에서 달력 표시 (탭 변경하지 않음)
                    await handleScheduleClickInTab(schedule);
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiCalendar className="text-primary-main" />
                        <h4 className="text-base font-semibold text-gray-900">
                          {formatSchedulePeriod(schedule.schedule_period)}
                        </h4>
                      </div>
                      {schedule.created_at && (
                        <p className="text-xs text-gray-400">
                          {t("schedule.savedDate")}{" "}
                          {(() => {
                            const date = new Date(schedule.created_at);
                            const year = String(date.getFullYear()).slice(-2);
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            return `${year}-${month}-${day}`;
                          })()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        schedule.id && handleDeleteSavedSchedule(schedule.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      title="삭제"
                    >
                      <FiX className="text-gray-500 text-lg" />
                    </button>
                  </div>

                  {/* 시술 목록 (날짜와 함께 표시) */}
                  {(names.length > 0 || ids.length > 0) && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 font-medium">
                        시술
                      </p>
                      <div className="space-y-1.5">
                        {names.length > 0
                          ? names.map((name, i) => {
                              const treatmentId = ids[i];
                              // treatment_dates는 배열이므로 인덱스로 접근
                              const dateStr = treatmentDates[i]
                                ? (() => {
                                    const date = new Date(treatmentDates[i]!);
                                    const month = date.getMonth() + 1;
                                    const day = date.getDate();
                                    if (language === "KR") {
                                      return `${month}월 ${day}일`;
                                    } else if (language === "EN") {
                                      return `${monthNames[month - 1]} ${day}`;
                                    } else if (language === "JP") {
                                      return `${month}月 ${day}日`;
                                    } else {
                                      return `${month}月 ${day}日`;
                                    }
                                  })()
                                : "";

                              return (
                                <div
                                  key={`n-${i}`}
                                  className="text-sm text-gray-700"
                                >
                                  {dateStr ? `${dateStr} - ` : ""}
                                  {name || `#${treatmentId || ""}`}
                                </div>
                              );
                            })
                          : ids.map((id, i) => {
                              // treatment_dates는 배열이므로 인덱스로 접근
                              const dateStr = treatmentDates[i]
                                ? (() => {
                                    const date = new Date(treatmentDates[i]!);
                                    const month = date.getMonth() + 1;
                                    const day = date.getDate();
                                    if (language === "KR") {
                                      return `${month}월 ${day}일`;
                                    } else if (language === "EN") {
                                      return `${monthNames[month - 1]} ${day}`;
                                    } else if (language === "JP") {
                                      return `${month}月 ${day}日`;
                                    } else {
                                      return `${month}月 ${day}日`;
                                    }
                                  })()
                                : "";

                              return (
                                <div
                                  key={`id-${id}`}
                                  className="text-sm text-gray-700"
                                >
                                  {dateStr ? `${dateStr} - ` : ""}#${id}
                                </div>
                              );
                            })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 회복 카드 컴포넌트 (categoryMid로 recoveryText 동적 로드)
function RecoveryCardComponent({
  rec,
  isOutsideTravel,
  onDelete,
}: {
  rec: ProcedureSchedule;
  isOutsideTravel: boolean;
  onDelete: (id: number) => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [recoveryText, setRecoveryText] = useState<string | null>(
    rec.recoveryText || null
  );
  const [loadingRecoveryText, setLoadingRecoveryText] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // 회복일차 범위별 텍스트 선택
  const getGuideForDay = (day?: number) => {
    if (!rec.recoveryGuides) return null;
    if (!day || day < 1) return null;

    const guides = rec.recoveryGuides;

    // 기본 구간: 1~3, 4~7, 8~14, 15~21
    // 일부 카테고리는 특정 구간 텍스트만 있는 경우가 있어
    // 해당 구간이 비어 있으면 인접 구간 텍스트를 순차적으로 fallback 합니다.
    if (day <= 3) {
      return (
        guides["1~3"] ||
        guides["4~7"] ||
        guides["8~14"] ||
        guides["15~21"] ||
        null
      );
    }
    if (day <= 7) {
      return (
        guides["4~7"] ||
        guides["1~3"] ||
        guides["8~14"] ||
        guides["15~21"] ||
        null
      );
    }
    if (day <= 14) {
      return (
        guides["8~14"] ||
        guides["4~7"] ||
        guides["1~3"] ||
        guides["15~21"] ||
        null
      );
    }
    if (day <= 21) {
      return (
        guides["15~21"] ||
        guides["8~14"] ||
        guides["4~7"] ||
        guides["1~3"] ||
        null
      );
    }
    return null;
  };

  // recoveryText가 없고 categoryMid가 있으면 동적으로 가져오기
  useEffect(() => {
    if (!recoveryText && rec.categoryMid && !loadingRecoveryText) {
      setLoadingRecoveryText(true);
      getRecoveryInfoByCategoryMid(rec.categoryMid)
        .then((recoveryInfo) => {
          if (recoveryInfo?.recoveryText) {
            setRecoveryText(recoveryInfo.recoveryText);
          }
          if (recoveryInfo?.recoveryGuides && !rec.recoveryGuides) {
            rec.recoveryGuides = recoveryInfo.recoveryGuides;
          }
        })
        .catch((error) => {
          // 회복 기간 정보 로드 실패 시 무시
        })
        .finally(() => {
          setLoadingRecoveryText(false);
        });
    }
  }, [rec.categoryMid, recoveryText, loadingRecoveryText]);

  // 카드 클릭 핸들러 - 회복 가이드로 이동
  const handleCardClick = async () => {
    if (isNavigating) return;

    try {
      setIsNavigating(true);

      // categorySmall이 있으면 바로 사용
      let categorySmall = rec.categorySmall;

      // categorySmall이 없고 treatmentId가 있으면 원본 시술 데이터에서 가져오기
      if (!categorySmall && rec.treatmentId) {
        const { loadTreatmentsPaginated } = await import(
          "@/lib/api/beautripApi"
        );
        // 전체를 가져오지 않고 특정 treatment_id만 찾기
        const treatments = await loadTreatmentsPaginated(1, 1000);
        const treatment =
          treatments.data?.find((t) => t.treatment_id === rec.treatmentId) ??
          null;
        if (treatment?.category_small) {
          categorySmall = treatment.category_small;
        }
      }

      // categorySmall이 있으면 categorySmall로 찾기
      if (categorySmall) {
        const { findRecoveryGuideByCategorySmall } = await import(
          "@/lib/api/beautripApi"
        );
        // 현재 언어 가져오기 (클라이언트 사이드에서만 가능)
        const currentLanguage =
          typeof window !== "undefined"
            ? (localStorage.getItem("language") as string) || "KR"
            : "KR";
        const recoveryGuideId = await findRecoveryGuideByCategorySmall(
          categorySmall,
          currentLanguage
        );

        if (recoveryGuideId) {
          router.push(`/community/recovery-guide/${recoveryGuideId}`);
          return;
        }
      }

      // categorySmall이 없거나 실패했고 categoryMid가 있으면 categoryMid로 category_small 찾기 시도
      if (!categorySmall && rec.categoryMid) {
        const { getCategorySmallByCategoryMid } = await import(
          "@/lib/api/beautripApi"
        );
        const foundCategorySmall = await getCategorySmallByCategoryMid(
          rec.categoryMid
        );
        if (foundCategorySmall) {
          categorySmall = foundCategorySmall;

          // 찾은 categorySmall로 회복 가이드 찾기
          const { findRecoveryGuideByCategorySmall } = await import(
            "@/lib/api/beautripApi"
          );
          const recoveryGuideId = await findRecoveryGuideByCategorySmall(
            categorySmall
          );
          if (recoveryGuideId) {
            router.push(`/community/recovery-guide/${recoveryGuideId}`);
            return;
          }
        }

        // categoryMid로 직접 회복 가이드 찾기 시도 (fallback)
        const { getRecoveryGuideIdByCategory } = await import(
          "@/lib/api/beautripApi"
        );
        const recoveryGuideIdByCategory = await getRecoveryGuideIdByCategory(
          rec.categoryMid
        );
        if (recoveryGuideIdByCategory) {
          router.push(`/community/recovery-guide/${recoveryGuideIdByCategory}`);
          return;
        }
      }

      // 모든 방법 실패
      alert(
        `해당 시술에 대한 회복 가이드를 찾을 수 없습니다.\n시술명: ${
          rec.procedureName
        }\n소분류: ${categorySmall || "없음"}\n중분류: ${
          rec.categoryMid || "없음"
        }`
      );
    } catch (error) {
      console.error("❌ 회복 가이드 찾기 실패:", error);
      alert(t("alert.loadRecoveryGuideError"));
    } finally {
      setIsNavigating(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t("confirm.deleteRecoverySchedule"))) {
      onDelete(rec.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md relative ${
        isOutsideTravel
          ? "bg-red-50 border-red-200 hover:border-red-300"
          : "bg-yellow-50 border-yellow-200 hover:border-yellow-300"
      } ${isNavigating ? "opacity-70" : ""}`}
    >
      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        className={`absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm transition-colors z-10 ${
          isOutsideTravel ? "hover:bg-red-50" : "hover:bg-yellow-50"
        }`}
        title="삭제"
      >
        <FiX
          className={`text-sm ${
            isOutsideTravel ? "text-red-600" : "text-yellow-600"
          }`}
        />
      </button>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900 mb-1.5 pr-10">
            {rec.procedureName}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 flex-wrap">
            <div className="flex items-center gap-1">
              <FiMapPin
                className={isOutsideTravel ? "text-red-600" : "text-yellow-600"}
              />
              <span>{rec.hospital}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiTag
                className={isOutsideTravel ? "text-red-600" : "text-yellow-600"}
              />
              <span>{rec.category}</span>
            </div>
          </div>
          {/* 회복 일수 정보 표시 */}
          {rec.recoveryDays > 0 && (
            <div
              className={`flex items-center gap-2 text-sm font-medium mb-2 flex-wrap ${
                isOutsideTravel ? "text-red-700" : "text-yellow-700"
              }`}
            >
              <div className="flex items-center gap-1">
                <FiClock
                  className={
                    isOutsideTravel ? "text-red-600" : "text-yellow-600"
                  }
                />
                <span>
                  {t("schedule.recoveryPeriod")}: {rec.recoveryDays}
                  {t("date.day")}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                  isOutsideTravel
                    ? "bg-red-200 text-red-900"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {t("schedule.recoveryPeriod")}
                {rec.recoveryDayIndex ? ` D+${rec.recoveryDayIndex}` : ""}
              </span>
              {isOutsideTravel && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-300 text-red-950 whitespace-nowrap">
                  ⚠️ {t("schedule.recoveryPeriodOutside")}
                </span>
              )}
            </div>
          )}
          {/* 회복 가이드 표시 (해당 일차에 맞는 텍스트 우선) */}
          {(getGuideForDay(rec.recoveryDayIndex) || recoveryText) && (
            <div
              className={`text-xs text-gray-700 rounded-lg p-3 mt-2 border bg-white/60 ${
                isOutsideTravel ? "border-red-100" : "border-yellow-100"
              }`}
            >
              <p
                className={`font-semibold mb-1.5 ${
                  isOutsideTravel ? "text-red-800" : "text-yellow-800"
                }`}
              >
                회복 가이드
              </p>
              <p className="text-gray-700 leading-relaxed">
                {(getGuideForDay(rec.recoveryDayIndex) || recoveryText || "")
                  .replace(/\n/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MySchedulePage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"schedule" | "saved">("schedule");

  // URL 쿼리 파라미터에서 탭 확인
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "saved") {
        setActiveTab("saved");
      } else if (tab === "schedule") {
        setActiveTab("schedule");
      }
    }
  }, []);
  // 초기 날짜를 현재 날짜로 설정
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);

  // 로컬스토리지에서 여행 기간 로드
  const [travelPeriod, setTravelPeriod] = useState<TravelPeriod | null>(null);

  useEffect(() => {
    const loadTravelPeriod = () => {
      const saved = localStorage.getItem("travelPeriod");
      if (saved) {
        try {
          const period = JSON.parse(saved);
          setTravelPeriod(period);
        } catch (error) {
          console.error("여행 기간 로드 실패:", error);
          setTravelPeriod(null);
        }
      } else {
        // 저장된 기간이 없으면 null (예시 데이터 사용 안 함)
        setTravelPeriod(null);
      }
    };

    loadTravelPeriod();

    // 여행 기간 변경 이벤트 리스너
    window.addEventListener("travelPeriodUpdated", loadTravelPeriod);
    return () => {
      window.removeEventListener("travelPeriodUpdated", loadTravelPeriod);
    };
  }, []);

  // 여행 기간 저장
  const handleTravelPeriodSave = (
    startDate: string,
    endDate: string | null
  ) => {
    if (!endDate) {
      alert(t("alert.selectEndDate"));
      return;
    }

    const period: TravelPeriod = {
      start: startDate,
      end: endDate,
    };

    localStorage.setItem("travelPeriod", JSON.stringify(period));
    setTravelPeriod(period);
    setIsTravelModalOpen(false);

    // 여행 기간 업데이트 이벤트 발생
    window.dispatchEvent(new Event("travelPeriodUpdated"));

    alert(t("alert.travelScheduleSaved"));
  };

  // 여행 기간 계산
  const travelStart = travelPeriod ? new Date(travelPeriod.start) : null;
  const travelEnd = travelPeriod ? new Date(travelPeriod.end) : null;

  // 날짜 포맷팅 함수 (먼저 정의)
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 로컬스토리지에서 일정 데이터 로드
  const [savedSchedules, setSavedSchedules] = useState<ProcedureSchedule[]>([]);

  useEffect(() => {
    const loadSchedules = () => {
      const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");
      // 로컬스토리지 데이터를 ProcedureSchedule 형식으로 변환
      const convertedSchedules: ProcedureSchedule[] = schedules.map(
        (s: any) => ({
          id: s.id,
          procedureDate: s.procedureDate,
          procedureName: s.procedureName,
          hospital: s.hospital,
          category: s.category,
          categoryMid: s.categoryMid || null,
          categorySmall: s.categorySmall || null,
          recoveryDays: s.recoveryDays || 0,
          recoveryText: s.recoveryText || null, // 회복 기간 텍스트
          recoveryGuides: s.recoveryGuides || undefined, // 회복 가이드 범위별 텍스트
          procedureTime: s.procedureTime ? `${s.procedureTime}분` : undefined,
          treatmentId: s.treatmentId || undefined, // 시술 ID 추가
        })
      );

      // 예시 데이터 제거 - 로컬스토리지 데이터만 사용
      setSavedSchedules(convertedSchedules);
    };

    loadSchedules();

    // 일정 추가 이벤트 리스너
    window.addEventListener("scheduleAdded", loadSchedules);
    return () => {
      window.removeEventListener("scheduleAdded", loadSchedules);
    };
  }, []);

  // 저장된 일정에 categorySmall이 없으면 treatmentId로 원본 데이터에서 가져오기
  useEffect(() => {
    const needsCategorySmallUpdate = savedSchedules.some(
      (s) => s.treatmentId && !s.categorySmall
    );

    if (needsCategorySmallUpdate) {
      (async () => {
        const updated = await Promise.all(
          savedSchedules.map(async (s) => {
            if (s.treatmentId && !s.categorySmall) {
              try {
                console.log("📦 [일정 로드] categorySmall 찾는 중...", {
                  treatmentId: s.treatmentId,
                  procedureName: s.procedureName,
                });
                // 특정 treatment_id로 직접 조회
                const treatment = await loadTreatmentById(s.treatmentId);
                if (treatment?.category_small) {
                  console.log(
                    "✅ [일정 로드] categorySmall 찾음:",
                    treatment.category_small
                  );
                  return {
                    ...s,
                    categorySmall: treatment.category_small,
                  };
                } else {
                  console.warn(
                    `⚠️ [일정 로드] treatment_id ${s.treatmentId}의 category_small이 없습니다.`,
                    {
                      treatment_id: treatment?.treatment_id,
                      treatment_name: treatment?.treatment_name,
                      category_mid: treatment?.category_mid,
                      category_small: treatment?.category_small,
                    }
                  );
                }
              } catch (error) {
                console.error("❌ [일정 로드] categorySmall 로드 실패:", error);
              }
            }
            return s;
          })
        );

        const changed = updated.some(
          (s, idx) => s.categorySmall !== savedSchedules[idx]?.categorySmall
        );

        if (changed) {
          setSavedSchedules(updated);
          localStorage.setItem("schedules", JSON.stringify(updated));
          window.dispatchEvent(new Event("scheduleAdded"));
        }
      })();
    }
  }, [savedSchedules]);

  // 저장된 일정에 회복정보가 비어있을 때 category_mid로 보강 (권장체류일수/회복가이드)
  useEffect(() => {
    const needsUpdate = savedSchedules.some(
      (s) =>
        s.categoryMid &&
        (s.recoveryDays === 0 || !s.recoveryText || !s.recoveryGuides)
    );
    if (!needsUpdate) return;

    let cancelled = false;
    (async () => {
      const updated = await Promise.all(
        savedSchedules.map(async (s) => {
          if (
            s.categoryMid &&
            (s.recoveryDays === 0 || !s.recoveryText || !s.recoveryGuides)
          ) {
            const info = await getRecoveryInfoByCategoryMid(s.categoryMid);
            if (info) {
              return {
                ...s,
                recoveryDays:
                  info.recommendedStayDays > 0
                    ? info.recommendedStayDays
                    : info.recoveryMax || s.recoveryDays,
                recoveryText: s.recoveryText ?? info.recoveryText,
                recoveryGuides: s.recoveryGuides ?? info.recoveryGuides,
              };
            }
          }
          return s;
        })
      );

      if (cancelled) return;

      const changed = updated.some(
        (s, idx) =>
          s.recoveryDays !== savedSchedules[idx]?.recoveryDays ||
          s.recoveryText !== savedSchedules[idx]?.recoveryText
      );

      if (changed) {
        setSavedSchedules(updated);
        localStorage.setItem("schedules", JSON.stringify(updated));
        // 회복 정보 업데이트 이벤트
        window.dispatchEvent(new Event("scheduleAdded"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [savedSchedules]);

  // 시술 날짜와 회복 기간 계산 (당일 포함)
  const procedureDates = useMemo(() => {
    const dates: { [key: string]: ProcedureSchedule[] } = {};
    savedSchedules.forEach((proc) => {
      const procDate = new Date(proc.procedureDate);

      // 시술 날짜
      const procDateStr = formatDate(procDate);
      if (!dates[procDateStr]) dates[procDateStr] = [];
      dates[procDateStr].push(proc);

      // 회복 기간 날짜들 (시술 당일 제외)
      // recoveryDays가 3이면: 다음날(1), 그다음날(2), 마지막날(3) = 총 3일 (당일 제외)
      // 시술 당일은 시술로만 표시, 회복 기간은 다음날부터 표시
      for (let i = 1; i <= proc.recoveryDays; i++) {
        const recoveryDate = new Date(procDate);
        recoveryDate.setDate(recoveryDate.getDate() + i);
        const recoveryDateStr = formatDate(recoveryDate);

        if (!dates[recoveryDateStr]) dates[recoveryDateStr] = [];
        dates[recoveryDateStr].push({
          ...proc,
          isRecovery: true,
          recoveryDayIndex: i,
        });
      }
    });
    return dates;
  }, [savedSchedules]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 달력 계산
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 날짜가 여행 기간 내인지 확인 (시간 제거하고 날짜만 비교)
  const isTravelPeriod = (date: Date): boolean => {
    if (!travelStart || !travelEnd) return false;
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    // travelStart와 travelEnd가 Date 객체가 아닐 수 있으므로 안전하게 처리
    const startDate =
      travelStart instanceof Date ? travelStart : new Date(travelStart);
    const startOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const endDate = travelEnd instanceof Date ? travelEnd : new Date(travelEnd);
    const endOnly = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    return dateOnly >= startOnly && dateOnly <= endOnly;
  };

  // 날짜가 시술 날짜인지 확인
  const isProcedureDate = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.some((p) => !p.isRecovery) || false;
  };

  // 날짜가 회복 기간인지 확인
  const isRecoveryPeriod = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.some((p) => p.isRecovery) || false;
  };

  // 회복 기간이 여행 일정 밖인지 확인
  const isRecoveryOutsideTravel = (date: Date): boolean => {
    if (!travelStart || !travelEnd) return false;
    const dateStr = formatDate(date);
    const recoveryItems =
      procedureDates[dateStr]?.filter((p) => p.isRecovery) || [];
    if (recoveryItems.length === 0) return false;

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const startOnly = new Date(
      travelStart.getFullYear(),
      travelStart.getMonth(),
      travelStart.getDate()
    );
    const endOnly = new Date(
      travelEnd.getFullYear(),
      travelEnd.getMonth(),
      travelEnd.getDate()
    );

    // 회복 기간 날짜가 여행 기간 밖에 있으면 true
    return dateOnly < startOnly || dateOnly > endOnly;
  };

  // 특정 날짜의 시술 목록 가져오기 (최대 3개)
  const getProceduresForDateLimited = (date: Date): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return (procedureDates[dateStr]?.filter((p) => !p.isRecovery) || []).slice(
      0,
      3
    );
  };

  // 특정 날짜의 회복 기간 목록 가져오기 (최대 3개, 시술과 합쳐서)
  const getRecoveryForDateLimited = (
    date: Date,
    proceduresCount: number
  ): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    const maxRecovery = Math.max(0, 3 - proceduresCount); // 남은 라인 수만큼만
    return (procedureDates[dateStr]?.filter((p) => p.isRecovery) || []).slice(
      0,
      maxRecovery
    );
  };

  // 특정 날짜의 회복 기간 목록 가져오기
  const getRecoveryForDate = (date: Date): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.filter((p) => p.isRecovery) || [];
  };

  // 같은 시술이 이전/다음 날짜에 있는지 확인 (이어지게 표시용)
  const getProcedureContinuity = (
    date: Date,
    procedure: ProcedureSchedule
  ): { isStart: boolean; isEnd: boolean; isMiddle: boolean } => {
    if (!procedure.treatmentId) {
      return { isStart: true, isEnd: true, isMiddle: false };
    }

    const dateStr = formatDate(date);
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDate(prevDate);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = formatDate(nextDate);

    const hasPrev =
      procedureDates[prevDateStr]?.some(
        (p) =>
          !p.isRecovery &&
          p.treatmentId === procedure.treatmentId &&
          p.procedureName === procedure.procedureName
      ) || false;
    const hasNext =
      procedureDates[nextDateStr]?.some(
        (p) =>
          !p.isRecovery &&
          p.treatmentId === procedure.treatmentId &&
          p.procedureName === procedure.procedureName
      ) || false;

    return {
      isStart: !hasPrev,
      isEnd: !hasNext,
      isMiddle: hasPrev && hasNext,
    };
  };

  // 날짜의 시술 정보 가져오기
  const getProceduresForDate = (date: Date): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.filter((p) => !p.isRecovery) || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return formatDate(date) === selectedDate;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(formatDate(date));
  };

  // 달력 날짜 배열 생성
  const calendarDays: (Date | null)[] = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push(new Date(year, month + 1, day));
  }

  // 언어별 월 이름
  const monthNames =
    language === "KR"
      ? [
          "1월",
          "2월",
          "3월",
          "4월",
          "5월",
          "6월",
          "7월",
          "8월",
          "9월",
          "10월",
          "11월",
          "12월",
        ]
      : language === "EN"
      ? [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ]
      : language === "JP"
      ? [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月",
        ]
      : [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月",
        ];

  // 언어별 요일 이름
  const dayNames =
    language === "KR"
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : language === "EN"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : language === "JP"
      ? ["日", "月", "火", "水", "木", "金", "土"]
      : ["日", "一", "二", "三", "四", "五", "六"];

  const selectedDateObj = selectedDate
    ? new Date(
        parseInt(selectedDate.split("-")[0]),
        parseInt(selectedDate.split("-")[1]) - 1,
        parseInt(selectedDate.split("-")[2])
      )
    : null;

  const selectedProcedures = selectedDateObj
    ? getProceduresForDate(selectedDateObj)
    : [];

  const selectedRecovery = selectedDateObj
    ? getRecoveryForDate(selectedDateObj)
    : [];

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">내 일정</h1>
      </div>

      {/* 여행 기간 표시 */}
      <div className="px-4 py-3 bg-primary-light/10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FiCalendar className="text-primary-main" />
            {travelPeriod ? (
              <span className="text-gray-700 font-medium">
                {t("schedule.travelPeriodLabel")} {travelPeriod.start} ~{" "}
                {travelPeriod.end}
              </span>
            ) : (
              <span className="text-gray-500">
                {t("schedule.setTravelPeriod")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // 캐시 데이터 삭제 (예시 데이터 포함 완전 삭제)
                if (confirm(t("confirm.deleteAllData"))) {
                  localStorage.removeItem("schedules");
                  localStorage.removeItem("travelPeriod");
                  // 완전히 비우기 (예시 데이터도 제거)
                  setTravelPeriod(null);
                  setSavedSchedules([]);
                  // 이벤트 발생 (홈과 동기화)
                  window.dispatchEvent(new Event("scheduleAdded"));
                  window.dispatchEvent(new Event("travelPeriodUpdated"));
                  alert(t("confirm.dataDeleted"));
                }
              }}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1"
              title="캐시 데이터 삭제"
            >
              {t("schedule.reset")}
            </button>
            <button
              onClick={() => setIsTravelModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-main text-white text-xs font-medium rounded-lg hover:bg-primary-main/90 transition-colors"
            >
              <FiEdit2 className="text-sm" />
              {travelPeriod ? t("schedule.edit") : t("schedule.set")}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[96px] z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-6 px-4 py-3">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`text-sm font-medium transition-colors pb-1 relative ${
              activeTab === "schedule" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiCalendar className="text-lg" />
              <span>{t("schedule.travelSchedule")}</span>
            </div>
            {activeTab === "schedule" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`text-sm font-medium transition-colors pb-1 relative ${
              activeTab === "saved" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiCalendar className="text-lg" />
              <span>{t("schedule.savedSchedule")}</span>
            </div>
            {activeTab === "saved" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "schedule" && (
        <div className="px-4 py-4">
          {/* 저장하기 버튼 - 여행 일정 탭 상단에 배치 */}
          <div className="mb-4">
            <button
              onClick={async () => {
                if (!travelPeriod) {
                  alert(t("alert.setTravelPeriodFirst"));
                  return;
                }

                if (savedSchedules.length === 0) {
                  alert(t("alert.noScheduleToSave"));
                  return;
                }

                // 일정 기간 포맷팅 (예: "25.12.14~25.12.20")
                const formatPeriod = (start: string, end: string) => {
                  const startDate = new Date(start);
                  const endDate = new Date(end);
                  const startStr = `${String(startDate.getFullYear()).slice(
                    -2
                  )}.${String(startDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}.${String(startDate.getDate()).padStart(2, "0")}`;
                  const endStr = `${String(endDate.getFullYear()).slice(
                    -2
                  )}.${String(endDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}.${String(endDate.getDate()).padStart(2, "0")}`;
                  return `${startStr}~${endStr}`;
                };

                const periodStr = formatPeriod(
                  travelPeriod.start,
                  travelPeriod.end
                );
                const treatmentIds = savedSchedules
                  .map((s) => s.treatmentId)
                  .filter(
                    (id): id is number => id !== undefined && id !== null
                  );

                if (treatmentIds.length === 0) {
                  alert(t("alert.noTreatmentToSave"));
                  return;
                }

                // treatment_dates 배열 생성: treatment_ids와 같은 순서로 (string|null)[]
                // treatment_ids의 각 id에 대응하는 날짜를 찾아서 배열로 만듦
                const treatmentDates: (string | null)[] = treatmentIds.map(
                  (id) => {
                    const schedule = savedSchedules.find(
                      (s) => s.treatmentId === id
                    );
                    // procedureDate가 있으면 로컬 시간 기준으로 YYYY-MM-DD 형식으로 변환
                    // toISOString()은 UTC 기준이라 시차 문제가 발생할 수 있음
                    if (schedule?.procedureDate) {
                      const date = new Date(schedule.procedureDate);
                      // 로컬 시간 기준으로 YYYY-MM-DD 형식 생성
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      return `${year}-${month}-${day}`;
                    }
                    return null; // 날짜가 없으면 null
                  }
                );

                // 디버깅용 체크 (날짜 형식 확인)
                console.log("payload 체크:", {
                  treatment_ids: treatmentIds,
                  treatment_ids_isArray: Array.isArray(treatmentIds),
                  treatment_dates: treatmentDates,
                  treatment_dates_isArray: Array.isArray(treatmentDates),
                  treatment_dates_sample: treatmentDates[0], // 첫 번째 날짜 샘플
                  isDateString: treatmentDates[0]
                    ? /^\d{4}-\d{2}-\d{2}$/.test(treatmentDates[0])
                    : null, // "YYYY-MM-DD" 형식인지 확인
                  lengths_match: treatmentIds.length === treatmentDates.length,
                });

                try {
                  const result = await saveSchedule(
                    periodStr,
                    treatmentIds,
                    treatmentDates
                  );
                  if (result.success) {
                    alert(t("alert.scheduleSaved"));
                    // 저장된 일정 목록 재조회를 위한 이벤트 발생
                    window.dispatchEvent(new Event("savedScheduleUpdated"));
                  } else {
                    // 에러 메시지 개선
                    const errorMessage =
                      result.error || "일정 저장에 실패했습니다.";
                    if (
                      errorMessage.includes("saved_schedules") ||
                      errorMessage.includes("table")
                    ) {
                      alert(
                        "일정 저장 기능이 아직 준비되지 않았습니다. 관리자에게 문의해주세요."
                      );
                    } else if (errorMessage.includes("로그인")) {
                      if (confirm(t("confirm.loginRequiredToSave"))) {
                        router.push("/mypage");
                      }
                    } else {
                      alert(errorMessage);
                    }
                  }
                } catch (error: any) {
                  console.error("일정 저장 실패:", error);
                  const errorMessage =
                    error?.message || "일정 저장에 실패했습니다.";
                  if (
                    errorMessage.includes("saved_schedules") ||
                    errorMessage.includes("table")
                  ) {
                    alert(
                      "일정 저장 기능이 아직 준비되지 않았습니다. 관리자에게 문의해주세요."
                    );
                  } else {
                    alert(errorMessage);
                  }
                }
              }}
              disabled={!travelPeriod || savedSchedules.length === 0}
              className="w-full bg-primary-main text-white py-3 rounded-lg font-semibold hover:bg-primary-main/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiCalendar className="text-lg" />
              {t("schedule.saveCurrentSchedule")}
            </button>
            {!travelPeriod && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t("schedule.saveAfterSettingPeriod")}
              </p>
            )}
            {travelPeriod && savedSchedules.length === 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                저장할 일정이 없습니다.
              </p>
            )}
          </div>

          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiChevronLeft className="text-gray-700 text-xl" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {year}
              {language === "KR"
                ? "년"
                : language === "EN"
                ? ""
                : language === "JP"
                ? "年"
                : "年"}{" "}
              {monthNames[month]}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiChevronRight className="text-gray-700 text-xl" />
            </button>
          </div>

          {/* 캘린더 그리드 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                if (!date)
                  return <div key={index} className="aspect-square"></div>;

                const isCurrentMonth = date.getMonth() === month;
                const isTravel = isTravelPeriod(date);
                const isProcedure = isProcedureDate(date);
                const isRecovery = isRecoveryPeriod(date);
                const isRecoveryOutside = isRecoveryOutsideTravel(date);
                const isTodayDate = isToday(date);
                const isSelectedDate = isSelected(date);

                // 날짜별 시술/회복 목록 가져오기 (하루에 최대 3개 라인)
                const proceduresOnDate = getProceduresForDateLimited(date);
                const recoveryOnDate = getRecoveryForDateLimited(
                  date,
                  proceduresOnDate.length
                );

                // 배경색 결정 우선순위: 여행일정 > 오늘 > 선택된 날짜
                let bgClass = "";
                let textClass = "";

                if (!isCurrentMonth) {
                  bgClass = "bg-gray-50";
                  textClass = "text-gray-300";
                } else if (isTravel) {
                  // 여행 기간은 시술/회복과 상관없이 항상 색칠
                  bgClass = "bg-sky-100";
                  textClass = "text-sky-700";
                } else if (isTodayDate) {
                  bgClass = "";
                  textClass = "text-primary-main font-bold";
                } else if (isSelectedDate) {
                  bgClass = "bg-primary-main/10";
                  textClass = "text-primary-main font-semibold";
                } else {
                  bgClass = "";
                  textClass = "text-gray-700";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square border-r border-b border-gray-100 p-0.5 transition-colors relative ${bgClass} ${textClass} hover:bg-gray-50`}
                  >
                    <div className="flex flex-col items-start justify-start h-full w-full p-0.5">
                      <span
                        className={`text-xs ${
                          isTodayDate ? "font-bold" : "font-medium"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {/* 시술 표시 (이어지게 표시) - mint 계열 */}
                      <div className="flex flex-col gap-0.5 w-full mt-0.5">
                        {proceduresOnDate.map((proc, idx) => {
                          const continuity = getProcedureContinuity(date, proc);
                          // 이전 날짜에 같은 시술이 있으면 왼쪽 모서리를 둥글게 하지 않음
                          // 다음 날짜에 같은 시술이 있으면 오른쪽 모서리를 둥글게 하지 않음
                          const roundedClass = continuity.isStart
                            ? continuity.isEnd
                              ? "rounded-sm"
                              : "rounded-l-sm"
                            : continuity.isEnd
                            ? "rounded-r-sm"
                            : "";

                          return (
                            <div
                              key={proc.id}
                              className={`w-full h-1.5 bg-primary-main ${roundedClass}`}
                              title={proc.procedureName}
                            />
                          );
                        })}
                      </div>

                      {/* 회복 기간 표시 (yellow 계열, 여행 밖이면 더 진한 yellow) */}
                      {recoveryOnDate.length > 0 && (
                        <div className="flex flex-col gap-0.5 w-full mt-0.5">
                          {recoveryOnDate.map((rec, idx) => {
                            const continuity = getProcedureContinuity(
                              date,
                              rec
                            );
                            const roundedClass = continuity.isStart
                              ? continuity.isEnd
                                ? "rounded-sm"
                                : "rounded-l-sm"
                              : continuity.isEnd
                              ? "rounded-r-sm"
                              : "";

                            return (
                              <div
                                key={`recovery-${rec.id}-${idx}`}
                                className={`w-full h-1.5 ${roundedClass} ${
                                  isRecoveryOutside
                                    ? "bg-red-500"
                                    : "bg-yellow-400"
                                }`}
                                title={`${rec.procedureName} 회복 기간`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-sky-100 border border-sky-300 rounded"></div>
              <span className="text-gray-600">
                {t("schedule.travelPeriod")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-primary-main rounded-sm"></div>
              <span className="text-gray-600">{t("label.procedure")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-yellow-400 rounded-sm"></div>
              <span className="text-gray-600">
                {t("schedule.recoveryPeriod")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-red-500 rounded-sm"></div>
              <span className="text-gray-600">
                {t("schedule.recoveryPeriodOutside")}
              </span>
            </div>
          </div>

          {/* 선택된 날짜의 시술 정보 */}
          {selectedDate &&
            (selectedProcedures.length > 0 || selectedRecovery.length > 0) && (
              <div className="mt-6 space-y-3">
                {/* 시술 카드 (red 계열 배경) */}
                {selectedProcedures.map((proc) => {
                  const handleCardClick = () => {
                    if (proc.treatmentId) {
                      router.push(`/schedule/treatment/${proc.treatmentId}`);
                    } else {
                      alert(t("alert.loadTreatmentDetailError"));
                    }
                  };

                  const handleDelete = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (confirm(t("confirm.deleteSchedule"))) {
                      const schedules = JSON.parse(
                        localStorage.getItem("schedules") || "[]"
                      );
                      const updatedSchedules = schedules.filter(
                        (s: any) => s.id !== proc.id
                      );
                      localStorage.setItem(
                        "schedules",
                        JSON.stringify(updatedSchedules)
                      );
                      window.dispatchEvent(new Event("scheduleAdded"));
                      alert(t("alert.scheduleDeleted"));
                    }
                  };

                  return (
                    <div
                      key={proc.id}
                      onClick={handleCardClick}
                      className="bg-primary-light/10 border border-primary-main rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary-main/80 relative"
                    >
                      {/* 삭제 버튼 */}
                      <button
                        onClick={handleDelete}
                        className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:bg-primary-light/20 transition-colors z-10"
                        title="삭제"
                      >
                        <FiX className="text-primary-main text-sm" />
                      </button>

                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900 mb-1.5 pr-10">
                            {proc.procedureName}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <FiMapPin className="text-primary-main" />
                              <span>{proc.hospital}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiTag className="text-primary-main" />
                              <span>{proc.category}</span>
                            </div>
                          </div>
                          {proc.recoveryDays > 0 && (
                            <div className="flex items-center gap-2 text-sm text-primary-main font-medium mb-2 flex-wrap">
                              <div className="flex items-center gap-1">
                                <FiClock className="text-primary-main" />
                                <span>
                                  {t("schedule.recoveryPeriod")}:{" "}
                                  {proc.recoveryDays}
                                  {t("date.day")}
                                </span>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-primary-main/20 text-primary-main">
                                시술 일자 D-DAY
                              </span>
                            </div>
                          )}
                          {/* 시술 당일 카드에서는 회복 가이드는 노출하지 않음 (회복일 카드에서만 안내) */}
                        </div>
                        {proc.procedureTime && (
                          <div className="text-sm font-semibold text-primary-main">
                            {proc.procedureTime}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 회복 기간 카드 (yellow 계열 배경) */}
                {selectedRecovery.map((rec, idx) => {
                  // 선택한 날짜가 여행 일정 밖인지 여부를 boolean으로 변환
                  const isOutsideTravel = !!(
                    selectedDateObj && isRecoveryOutsideTravel(selectedDateObj)
                  );

                  const handleDeleteRecovery = (id: number) => {
                    const schedules = JSON.parse(
                      localStorage.getItem("schedules") || "[]"
                    );
                    const updatedSchedules = schedules.filter(
                      (s: any) => s.id !== id
                    );
                    localStorage.setItem(
                      "schedules",
                      JSON.stringify(updatedSchedules)
                    );
                    window.dispatchEvent(new Event("scheduleAdded"));
                    alert("일정이 삭제되었습니다.");
                  };

                  return (
                    <RecoveryCardComponent
                      key={`recovery-${rec.id}-${idx}`}
                      rec={rec}
                      isOutsideTravel={isOutsideTravel}
                      onDelete={handleDeleteRecovery}
                    />
                  );
                })}

                {/* 연관 시술 추천 섹션 - 회복 기간 카드 다음에 표시 (후순위) */}
                {/* 연관 시술 추천 큰 제목 */}
                {selectedProcedures.some((proc) => proc.categorySmall) && (
                  <div className="mt-6 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      연관 시술 추천
                    </h3>
                  </div>
                )}

                {/* 각 시술 카드별 연관 시술 추천 섹션 */}
                {selectedProcedures.map((proc) => {
                  console.log("🔍 [시술 카드] 연관 추천 체크:", {
                    procedureName: proc.procedureName,
                    categorySmall: proc.categorySmall,
                    treatmentId: proc.treatmentId,
                  });

                  if (!proc.categorySmall) {
                    console.warn(
                      `⚠️ [시술 카드] "${proc.procedureName}"의 categorySmall이 없어서 추천을 표시하지 않습니다.`
                    );
                    return null;
                  }

                  return (
                    <div key={`similar-${proc.id}`} className="mt-2">
                      <SimilarProcedureRecommendation
                        categorySmall={proc.categorySmall}
                        currentProcedureId={proc.treatmentId}
                        currentProcedureName={proc.procedureName}
                        travelPeriod={travelPeriod}
                      />
                    </div>
                  );
                })}
              </div>
            )}

          {selectedDate &&
            selectedProcedures.length === 0 &&
            selectedRecovery.length === 0 && (
              <div className="mt-6 text-center py-8">
                <FiCalendar className="text-gray-300 text-4xl mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  선택한 날짜에 일정이 없습니다.
                </p>
              </div>
            )}
        </div>
      )}

      {activeTab === "saved" && (
        <SavedSchedulesTab
          travelPeriod={travelPeriod}
          savedSchedules={savedSchedules}
          formatDate={formatDate}
          monthNames={monthNames}
          dayNames={dayNames}
          // onScheduleClick은 더 이상 사용하지 않음 (저장된 일정 탭 내에서 달력 표시)
        />
      )}

      <div className="pb-20">
        <BottomNavigation />
      </div>

      {/* 여행 기간 선택 모달 */}
      <TravelScheduleCalendarModal
        isOpen={isTravelModalOpen}
        onClose={() => setIsTravelModalOpen(false)}
        onDateSelect={handleTravelPeriodSave}
        selectedStartDate={travelPeriod?.start || null}
        selectedEndDate={travelPeriod?.end || null}
      />
    </div>
  );
}
