"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TravelScheduleData } from "./TravelScheduleForm";
import {
  FiStar,
  FiClock,
  FiCalendar,
  FiFilter,
  FiChevronRight,
  FiChevronLeft,
  FiHeart,
} from "react-icons/fi";
import ProcedureFilterModal, { ProcedureFilter } from "./ProcedureFilterModal";
import AddToScheduleModal from "./AddToScheduleModal";
import {
  loadTreatmentsPaginated,
  getScheduleBasedRecommendations,
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  type Treatment,
  type ScheduleBasedRecommendation,
} from "@/lib/api/beautripApi";

// 필터 옵션 상수 (ProcedureFilterModal과 동일)
const DURATION_OPTIONS = [
  { value: "same-day", label: "당일" },
  { value: "half-day", label: "반나절" },
  { value: "1-day", label: "1일" },
  { value: "2-3-days", label: "2~3일" },
  { value: "surgery", label: "수술 포함" },
];

const RECOVERY_OPTIONS = [
  { value: "same-day", label: "당일 생활 가능" },
  { value: "1-3-days", label: "1~3일" },
  { value: "4-7-days", label: "4~7일" },
  { value: "1-week-plus", label: "1주 이상" },
];

const BUDGET_OPTIONS = [
  { value: "under-50", label: "~50만원" },
  { value: "50-100", label: "50~100만원" },
  { value: "100-200", label: "100~200만원" },
  { value: "200-plus", label: "200만원+" },
];

interface Recommendation {
  id: number;
  procedure: string;
  hospital: string;
  price: string;
  rating: string;
  procedureTime: string;
  recoveryPeriod: string;
  matchesBudget: boolean;
  category: string;
  subCategory?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ProcedureRecommendationProps {
  scheduleData: TravelScheduleData;
  selectedCategoryId?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
  mainCategories?: Category[];
}

// 카테고리별 시술 데이터
const PROCEDURES_BY_CATEGORY: Record<string, Recommendation[]> = {
  피부관리: [
    {
      id: 1,
      procedure: "리쥬란 힐러",
      hospital: "강남비비의원",
      price: "12만원",
      rating: "9.8",
      procedureTime: "30분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "피부관리",
      subCategory: "필러",
    },
    {
      id: 2,
      procedure: "써마지",
      hospital: "압구정 클리닉",
      price: "35만원",
      rating: "9.7",
      procedureTime: "90분",
      recoveryPeriod: "0일",
      matchesBudget: true,
      category: "피부관리",
      subCategory: "리프팅",
    },
    {
      id: 3,
      procedure: "울쎄라",
      hospital: "신사역 메디컬",
      price: "45만원",
      rating: "9.9",
      procedureTime: "60분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "피부관리",
      subCategory: "리프팅",
    },
    {
      id: 4,
      procedure: "프락셀",
      hospital: "홍대 의원",
      price: "15만원",
      rating: "9.6",
      procedureTime: "30분",
      recoveryPeriod: "2일",
      matchesBudget: true,
      category: "피부관리",
      subCategory: "레이저",
    },
    {
      id: 5,
      procedure: "아쿠아필",
      hospital: "강남 피부과",
      price: "8만원",
      rating: "9.5",
      procedureTime: "20분",
      recoveryPeriod: "0일",
      matchesBudget: true,
      category: "피부관리",
      subCategory: "관리",
    },
  ],
  "흉터/자국": [
    {
      id: 6,
      procedure: "프락셀 스카",
      hospital: "강남비비의원",
      price: "20만원",
      rating: "9.8",
      procedureTime: "40분",
      recoveryPeriod: "3일",
      matchesBudget: true,
      category: "흉터/자국",
      subCategory: "레이저",
    },
    {
      id: 7,
      procedure: "마이크로 니들링",
      hospital: "압구정 클리닉",
      price: "12만원",
      rating: "9.6",
      procedureTime: "30분",
      recoveryPeriod: "2일",
      matchesBudget: true,
      category: "흉터/자국",
      subCategory: "시술",
    },
    {
      id: 8,
      procedure: "CO2 레이저",
      hospital: "신사역 메디컬",
      price: "25만원",
      rating: "9.7",
      procedureTime: "45분",
      recoveryPeriod: "5일",
      matchesBudget: true,
      category: "흉터/자국",
      subCategory: "레이저",
    },
  ],
  "윤곽/리프팅": [
    {
      id: 9,
      procedure: "인모드 리프팅",
      hospital: "신사역 메디컬",
      price: "25만원",
      rating: "9.9",
      procedureTime: "60분",
      recoveryPeriod: "2일",
      matchesBudget: true,
      category: "윤곽/리프팅",
      subCategory: "리프팅",
    },
    {
      id: 10,
      procedure: "슈링크 유니버스",
      hospital: "홍대 의원",
      price: "18만원",
      rating: "9.7",
      procedureTime: "45분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "윤곽/리프팅",
      subCategory: "리프팅",
    },
    {
      id: 11,
      procedure: "울쎄라 더블",
      hospital: "강남비비의원",
      price: "50만원",
      rating: "9.8",
      procedureTime: "90분",
      recoveryPeriod: "2일",
      matchesBudget: true,
      category: "윤곽/리프팅",
      subCategory: "리프팅",
    },
    {
      id: 12,
      procedure: "실리프팅",
      hospital: "압구정 클리닉",
      price: "30만원",
      rating: "9.6",
      procedureTime: "30분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "윤곽/리프팅",
      subCategory: "실",
    },
  ],
  코성형: [
    {
      id: 13,
      procedure: "코필러",
      hospital: "강남비비의원",
      price: "15만원",
      rating: "9.7",
      procedureTime: "20분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "코성형",
      subCategory: "필러",
    },
    {
      id: 14,
      procedure: "코 리프팅",
      hospital: "압구정 클리닉",
      price: "22만원",
      rating: "9.8",
      procedureTime: "30분",
      recoveryPeriod: "2일",
      matchesBudget: true,
      category: "코성형",
      subCategory: "리프팅",
    },
  ],
  눈성형: [
    {
      id: 15,
      procedure: "눈밑 필러",
      hospital: "신사역 메디컬",
      price: "18만원",
      rating: "9.7",
      procedureTime: "25분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "눈성형",
      subCategory: "필러",
    },
    {
      id: 16,
      procedure: "눈밑 지방재배치",
      hospital: "강남비비의원",
      price: "35만원",
      rating: "9.9",
      procedureTime: "60분",
      recoveryPeriod: "3일",
      matchesBudget: true,
      category: "눈성형",
      subCategory: "수술",
    },
  ],
  "보톡스/필러": [
    {
      id: 17,
      procedure: "보톡스",
      hospital: "압구정 클리닉",
      price: "8만원",
      rating: "9.6",
      procedureTime: "15분",
      recoveryPeriod: "0일",
      matchesBudget: true,
      category: "보톡스/필러",
      subCategory: "보톡스",
    },
    {
      id: 18,
      procedure: "쥬베룩",
      hospital: "강남비비의원",
      price: "12만원",
      rating: "9.8",
      procedureTime: "20분",
      recoveryPeriod: "0일",
      matchesBudget: true,
      category: "보톡스/필러",
      subCategory: "보톡스",
    },
    {
      id: 19,
      procedure: "볼륨 필러",
      hospital: "신사역 메디컬",
      price: "25만원",
      rating: "9.7",
      procedureTime: "30분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "보톡스/필러",
      subCategory: "필러",
    },
    {
      id: 20,
      procedure: "리쥬란",
      hospital: "홍대 의원",
      price: "15만원",
      rating: "9.6",
      procedureTime: "25분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "보톡스/필러",
      subCategory: "필러",
    },
  ],
  "체형/지방": [
    {
      id: 21,
      procedure: "지방분해 주사",
      hospital: "강남비비의원",
      price: "20만원",
      rating: "9.7",
      procedureTime: "30분",
      recoveryPeriod: "1일",
      matchesBudget: true,
      category: "체형/지방",
      subCategory: "주사",
    },
    {
      id: 22,
      procedure: "쿨스컬핑",
      hospital: "압구정 클리닉",
      price: "35만원",
      rating: "9.8",
      procedureTime: "60분",
      recoveryPeriod: "2일",
      matchesBudget: true,
      category: "체형/지방",
      subCategory: "시술",
    },
  ],
  기타: [
    {
      id: 23,
      procedure: "제모 레이저",
      hospital: "신사역 메디컬",
      price: "10만원",
      rating: "9.5",
      procedureTime: "20분",
      recoveryPeriod: "0일",
      matchesBudget: true,
      category: "기타",
      subCategory: "레이저",
    },
    {
      id: 24,
      procedure: "문신 제거",
      hospital: "홍대 의원",
      price: "15만원",
      rating: "9.6",
      procedureTime: "30분",
      recoveryPeriod: "3일",
      matchesBudget: true,
      category: "기타",
      subCategory: "레이저",
    },
  ],
};

// 간단한 알고리즘: 시술 기간과 회복 기간을 고려한 추천
function calculateRecommendations(data: TravelScheduleData): Recommendation[] {
  const daysDiff =
    data.travelPeriod.start && data.travelPeriod.end
      ? Math.ceil(
          (new Date(data.travelPeriod.end).getTime() -
            new Date(data.travelPeriod.start).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 7;

  // 선택된 카테고리에 맞는 시술 가져오기
  const categoryProcedures =
    PROCEDURES_BY_CATEGORY[data.procedureCategory] || [];

  // 카테고리에 시술이 없으면 전체 시술 중에서 선택
  const allProcedures = Object.values(PROCEDURES_BY_CATEGORY).flat();
  const recommendations =
    categoryProcedures.length > 0 ? categoryProcedures : allProcedures;

  // 여행 기간에 맞는 시술만 필터링 (최소 2개 이상은 항상 표시)
  const filtered = recommendations.filter((rec) => {
    const totalDays = parseInt(rec.recoveryPeriod) + 1;
    return daysDiff >= totalDays;
  });

  // 필터링 결과가 1개 이하이면 최소 2개는 표시 (회복 기간이 짧은 것 우선)
  if (filtered.length <= 1) {
    return recommendations
      .sort((a, b) => parseInt(a.recoveryPeriod) - parseInt(b.recoveryPeriod))
      .slice(0, Math.max(2, filtered.length));
  }

  return filtered;
}

export default function ProcedureRecommendation({
  scheduleData,
  selectedCategoryId,
  onCategoryChange,
  mainCategories = [],
}: ProcedureRecommendationProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<ProcedureFilter>({
    duration: null,
    recovery: null,
    budget: null,
  });
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [recommendations, setRecommendations] = useState<
    ScheduleBasedRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [scrollPositions, setScrollPositions] = useState<
    Record<
      string,
      { left: number; canScrollLeft: boolean; canScrollRight: boolean }
    >
  >({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // 중분류 카테고리 표시 개수 (초기 5개)
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5);

  // 중분류 중복 확인을 위한 로그 (개발용)
  useEffect(() => {
    if (
      recommendations.length > 0 &&
      scheduleData.procedureCategory === "전체"
    ) {
      const categoryMidCounts = new Map<string, Set<string>>();
      recommendations.forEach((rec) => {
        if (!categoryMidCounts.has(rec.categoryMid)) {
          categoryMidCounts.set(rec.categoryMid, new Set());
        }
        // 해당 중분류가 속한 대분류 확인
        rec.treatments.forEach((treatment) => {
          if (treatment.category_large) {
            categoryMidCounts
              .get(rec.categoryMid)!
              .add(treatment.category_large);
          }
        });
      });

      // 중복된 중분류 확인 (같은 중분류가 여러 대분류에 속한 경우)
      const duplicates: string[] = [];
      categoryMidCounts.forEach((categoryLarges, categoryMid) => {
        if (categoryLarges.size > 1) {
          duplicates.push(
            `${categoryMid} (대분류: ${Array.from(categoryLarges).join(", ")})`
          );
        }
      });

      if (duplicates.length > 0) {
        console.warn(
          "⚠️ 데이터 상 중분류 중복 발견 (다른 대분류에 같은 중분류 이름 존재):",
          duplicates
        );
      }
    }
  }, [recommendations, scheduleData.procedureCategory]);
  // 각 중분류별 시술 표시 개수 (초기 3개)
  const [visibleTreatmentsCount, setVisibleTreatmentsCount] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // selectedCategoryId를 한국어 카테고리 이름으로 변환
        let categoryForLoad: string | undefined;
        if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
          const selectedCategory = mainCategories.find(
            (cat) => cat.id === selectedCategoryId
          );
          categoryForLoad = selectedCategory?.name || selectedCategoryId;
        } else if (scheduleData.procedureCategory !== "전체") {
          categoryForLoad = scheduleData.procedureCategory;
        }

        // 필요한 만큼만 로드 (200개 - 일정 기반 추천에 충분)
        const result = await loadTreatmentsPaginated(1, 200, {
          categoryLarge: categoryForLoad,
        });
        const treatments = result.data;
        setAllTreatments(treatments);

        // 일정 기반 추천 데이터 생성
        if (scheduleData.travelPeriod.start && scheduleData.travelPeriod.end) {
          // selectedCategoryId를 한국어 카테고리 이름으로 변환
          let categoryToUse: string;
          if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
            // mainCategories에서 선택된 카테고리의 name을 찾기
            const selectedCategory = mainCategories.find(
              (cat) => cat.id === selectedCategoryId
            );
            categoryToUse = selectedCategory?.name || selectedCategoryId;
          } else {
            categoryToUse = scheduleData.procedureCategory || "전체";
          }
          const scheduleBasedRecs = await getScheduleBasedRecommendations(
            treatments,
            categoryToUse,
            scheduleData.travelPeriod.start,
            scheduleData.travelPeriod.end
          );
          setRecommendations(scheduleBasedRecs);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scheduleData, selectedCategoryId]);

  // 일정 추가 핸들러
  const handleDateSelect = async (date: string) => {
    if (!selectedTreatment) return;

    // category_mid로 회복 기간 정보 가져오기 (소분류_리스트와 매칭)
    let recoveryDays = 0;
    let recoveryText: string | null = null;
    let recommendedStayDays = 0;
    let recoveryGuides: Record<string, string | null> | undefined = undefined;

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recommendedStayDays = recoveryInfo.recommendedStayDays || 0;
        recoveryDays = recoveryInfo.recoveryMax; // 회복기간_max 기준 (fallback)
        recoveryText = recoveryInfo.recoveryText;
        recoveryGuides = recoveryInfo.recoveryGuides;
      }
    }

    // 권장체류일수가 있으면 우선 사용
    if (recommendedStayDays > 0) {
      recoveryDays = recommendedStayDays;
    } else if (recoveryDays === 0) {
      // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
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
      recoveryText, // 회복 기간 텍스트 추가
      recoveryGuides,
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

  // 여행 일수 계산
  const travelDays =
    scheduleData.travelPeriod.start && scheduleData.travelPeriod.end
      ? Math.ceil(
          (new Date(scheduleData.travelPeriod.end).getTime() -
            new Date(scheduleData.travelPeriod.start).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  // 필터링된 추천 데이터
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    // 필터 적용
    if (filter.duration) {
      filtered = filtered
        .map((rec) => {
          const filteredTreatments = rec.treatments.filter((treatment) => {
            const procedureTime = parseProcedureTime(treatment.surgery_time);
            switch (filter.duration) {
              case "same-day":
                return procedureTime <= 30; // 30분 이하
              case "half-day":
                return procedureTime > 30 && procedureTime <= 120; // 30분~2시간
              case "1-day":
                return procedureTime > 120 && procedureTime <= 480; // 2시간~8시간
              case "2-3-days":
                return procedureTime > 480; // 8시간 이상
              case "surgery":
                return procedureTime >= 60; // 1시간 이상 (수술 포함)
              default:
                return true;
            }
          });
          return { ...rec, treatments: filteredTreatments };
        })
        .filter((rec) => rec.treatments.length > 0);
    }

    if (filter.recovery) {
      filtered = filtered
        .map((rec) => {
          const filteredTreatments = rec.treatments.filter((treatment) => {
            const recoveryPeriod = parseRecoveryPeriod(treatment.downtime);
            switch (filter.recovery) {
              case "same-day":
                return recoveryPeriod === 0 || recoveryPeriod <= 1;
              case "1-3-days":
                return recoveryPeriod >= 1 && recoveryPeriod <= 3;
              case "4-7-days":
                return recoveryPeriod >= 4 && recoveryPeriod <= 7;
              case "1-week-plus":
                return recoveryPeriod >= 8;
              default:
                return true;
            }
          });
          return { ...rec, treatments: filteredTreatments };
        })
        .filter((rec) => rec.treatments.length > 0);
    }

    if (filter.budget) {
      filtered = filtered
        .map((rec) => {
          const filteredTreatments = rec.treatments.filter((treatment) => {
            const price = treatment.selling_price || 0;
            switch (filter.budget) {
              case "under-50":
                return price < 500000; // 50만원 미만
              case "50-100":
                return price >= 500000 && price < 1000000; // 50~100만원
              case "100-200":
                return price >= 1000000 && price < 2000000; // 100~200만원
              case "200-plus":
                return price >= 2000000; // 200만원 이상
              default:
                return true;
            }
          });
          return { ...rec, treatments: filteredTreatments };
        })
        .filter((rec) => rec.treatments.length > 0);
    }

    return filtered;
  }, [recommendations, filter]);

  const handleFilterApply = (newFilter: ProcedureFilter) => {
    setFilter(newFilter);
  };

  const hasActiveFilters =
    filter.duration !== null ||
    filter.recovery !== null ||
    filter.budget !== null;

  // 스크롤 핸들러
  const handleScroll = (categoryMid: string) => {
    const element = scrollRefs.current[categoryMid];
    if (!element) return;

    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    const canScrollLeft = scrollLeft > 0;
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 10;

    setScrollPositions((prev) => ({
      ...prev,
      [categoryMid]: { left: scrollLeft, canScrollLeft, canScrollRight },
    }));
  };

  // 초기 스크롤 상태 확인
  useEffect(() => {
    if (recommendations.length > 0) {
      const timer = setTimeout(() => {
        recommendations.forEach((rec) => {
          const element = scrollRefs.current[rec.categoryMid];
          if (element) {
            const scrollLeft = element.scrollLeft;
            const scrollWidth = element.scrollWidth;
            const clientWidth = element.clientWidth;
            const canScrollLeft = scrollLeft > 0;
            const canScrollRight = scrollLeft < scrollWidth - clientWidth - 10;

            setScrollPositions((prev) => ({
              ...prev,
              [rec.categoryMid]: {
                left: scrollLeft,
                canScrollLeft,
                canScrollRight,
              },
            }));
          }
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [recommendations]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-center text-gray-500">{t("procedure.loading")}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="text-center text-gray-500">{t("procedure.noResults")}</p>
      </div>
    );
  }

  // 카테고리 변경 핸들러
  const handleCategoryClick = (categoryId: string | null) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">
          {t("procedure.customRecommendations")}
        </h3>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            hasActiveFilters
              ? "bg-primary-main text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FiFilter className="text-xs" />
          {t("procedure.filter")}
          {hasActiveFilters && (
            <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
              {
                [filter.duration, filter.recovery, filter.budget].filter(
                  (f) => f !== null
                ).length
              }
            </span>
          )}
        </button>
      </div>

      {/* 여행 기간 정보 - 맞춤 시술 추천 바로 아래 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-primary-main" />
          <span className="text-sm text-gray-700">
            {t("procedure.travelPeriod")}: {travelDays - 1}박 {travelDays}일
          </span>
        </div>
      </div>

      {/* 대분류 카테고리 선택 - 통합된 2줄 그리드 */}
      {mainCategories.length > 0 && (
        <div className="mb-4">
          {/* "ALL 전체" 버튼 - 위에 따로 배치 */}
          <div className="mb-2">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategoryId === null
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="font-bold">ALL</span> 전체
            </button>
          </div>

          {/* 카테고리 버튼들 - 5개씩 2줄 그리드 */}
          <div className="grid grid-cols-5 gap-2">
            {mainCategories.map((category) => {
              const isActive = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary-main/10 text-primary-main font-bold border border-primary-main"
                      : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base leading-none">
                    {category.icon}
                  </span>
                  <span className="text-[10px] leading-tight">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 필터로 선택한 항목들 표시 */}
      {hasActiveFilters && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {filter.duration && (
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                {DURATION_OPTIONS.find((opt) => opt.value === filter.duration)
                  ?.label || filter.duration}
              </span>
            )}
            {filter.recovery && (
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                {RECOVERY_OPTIONS.find((opt) => opt.value === filter.recovery)
                  ?.label || filter.recovery}
              </span>
            )}
            {filter.budget && (
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                {BUDGET_OPTIONS.find((opt) => opt.value === filter.budget)
                  ?.label || filter.budget}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 중분류별 시술 추천 - 각 중분류마다 카드 스와이프 */}
      {filteredRecommendations.slice(0, visibleCategoriesCount).map((rec) => {
        const scrollState = scrollPositions[rec.categoryMid] || {
          left: 0,
          canScrollLeft: false,
          canScrollRight: true,
        };

        const handleScrollLeft = () => {
          const element = scrollRefs.current[rec.categoryMid];
          if (element) {
            element.scrollBy({ left: -300, behavior: "smooth" });
          }
        };

        const handleScrollRight = () => {
          const element = scrollRefs.current[rec.categoryMid];
          if (element) {
            element.scrollBy({ left: 300, behavior: "smooth" });
          }
        };

        // 더보기 기능 (10개 카드 추가)
        const handleShowMore = () => {
          setVisibleTreatmentsCount((prev) => ({
            ...prev,
            [rec.categoryMid]: (prev[rec.categoryMid] || 3) + 10,
          }));
        };

        // 현재 표시된 카드 수
        const currentVisibleCount =
          visibleTreatmentsCount[rec.categoryMid] || 3;
        const hasMoreTreatments = rec.treatments.length > currentVisibleCount;
        // 우측 버튼 표시 조건: 스크롤 가능하거나 더보기 가능할 때
        const shouldShowRightButton =
          scrollState.canScrollRight || hasMoreTreatments;

        return (
          <div key={rec.categoryMid} className="space-y-3">
            {/* 중분류 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  {rec.categoryMid}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  평균 시술시간{" "}
                  {rec.averageProcedureTimeMin > 0 ||
                  rec.averageProcedureTimeMax > 0
                    ? rec.averageProcedureTimeMin ===
                      rec.averageProcedureTimeMax
                      ? `${rec.averageProcedureTimeMax}분`
                      : `${rec.averageProcedureTimeMin}~${rec.averageProcedureTimeMax}분`
                    : rec.averageProcedureTime > 0
                    ? `${rec.averageProcedureTime}분`
                    : "정보 없음"}{" "}
                  · 회복기간{" "}
                  {rec.averageRecoveryPeriodMin > 0 ||
                  rec.averageRecoveryPeriodMax > 0
                    ? rec.averageRecoveryPeriodMin ===
                      rec.averageRecoveryPeriodMax
                      ? `${rec.averageRecoveryPeriodMax}일`
                      : `${rec.averageRecoveryPeriodMin}~${rec.averageRecoveryPeriodMax}일`
                    : rec.averageRecoveryPeriod > 0
                    ? `${rec.averageRecoveryPeriod}일`
                    : "정보 없음"}
                </p>
              </div>
            </div>

            {/* 카드 스와이프 컨테이너 */}
            <div className="relative">
              {/* 좌측 스크롤 버튼 */}
              {scrollState.canScrollLeft && (
                <button
                  onClick={handleScrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                >
                  <FiChevronLeft className="text-gray-700 text-lg" />
                </button>
              )}

              {/* 카드 스크롤 영역 */}
              <div
                ref={(el) => {
                  scrollRefs.current[rec.categoryMid] = el;
                }}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                onScroll={() => handleScroll(rec.categoryMid)}
              >
                {rec.treatments
                  .slice(0, visibleTreatmentsCount[rec.categoryMid] || 3)
                  .map((treatment) => {
                    const recoveryPeriod = parseRecoveryPeriod(
                      treatment.downtime
                    );
                    const procedureTime = parseProcedureTime(
                      treatment.surgery_time
                    );
                    const price = treatment.selling_price
                      ? `${Math.round(treatment.selling_price / 10000)}만원`
                      : "가격 문의";
                    const isFavorited = treatment.treatment_id
                      ? favorites.has(treatment.treatment_id)
                      : false;

                    const handleFavoriteClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (treatment.treatment_id) {
                        setFavorites((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(treatment.treatment_id!)) {
                            newSet.delete(treatment.treatment_id!);
                          } else {
                            newSet.add(treatment.treatment_id!);
                          }
                          return newSet;
                        });
                        // TODO: 로컬 스토리지 또는 API에 저장
                      }
                    };

                    return (
                      <div
                        key={treatment.treatment_id}
                        className="flex-shrink-0 w-[150px] cursor-pointer"
                        onClick={() => {
                          if (treatment.treatment_id) {
                            router.push(`/treatment/${treatment.treatment_id}`);
                          }
                        }}
                      >
                        {/* 이미지 + 할인율 오버레이 - 2:1 비율 */}
                        <div className="w-full aspect-[2/1] bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                          <img
                            src={getThumbnailUrl(treatment)}
                            alt={treatment.treatment_name}
                            className="w-full h-full object-cover"
                          />
                          {/* 할인율 배지 */}
                          {treatment.dis_rate && treatment.dis_rate > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-20">
                              {treatment.dis_rate}%
                            </div>
                          )}
                          {/* 찜 버튼 (위) */}
                          <button
                            onClick={handleFavoriteClick}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 transition-colors shadow-sm z-20"
                          >
                            <FiHeart
                              className={`text-sm ${
                                isFavorited
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                          {/* 달력 버튼 (아래) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTreatment(treatment);
                              setIsScheduleModalOpen(true);
                            }}
                            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 transition-colors shadow-sm z-20"
                          >
                            <FiCalendar className="text-sm text-primary-main" />
                          </button>
                        </div>

                        {/* 병원명 */}
                        <p className="text-xs text-gray-500 mb-1">
                          {treatment.hospital_name}
                        </p>

                        {/* 시술명 */}
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">
                          {treatment.treatment_name}
                        </h5>

                        {/* 평점 */}
                        {treatment.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                            <span className="text-xs font-semibold">
                              {treatment.rating.toFixed(1)}
                            </span>
                            {treatment.review_count && (
                              <span className="text-xs text-gray-400">
                                ({treatment.review_count.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}

                        {/* 시술 시간 및 회복 기간 */}
                        {(procedureTime > 0 || recoveryPeriod > 0) && (
                          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                            {procedureTime > 0 ? (
                              <div className="flex items-center gap-1">
                                <FiClock className="text-primary-main text-xs" />
                                <span>
                                  {procedureTime}
                                  {t("procedure.procedureTime")}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <FiClock className="text-gray-300 text-xs" />
                                <span className="text-gray-400">
                                  시간 정보 없음
                                </span>
                              </div>
                            )}
                            {recoveryPeriod > 0 ? (
                              <div className="flex items-center gap-1">
                                <FiCalendar className="text-primary-main text-xs" />
                                <span>
                                  {t("procedure.recoveryPeriod")}{" "}
                                  {recoveryPeriod}
                                  {t("procedure.recoveryDays")}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <FiCalendar className="text-gray-300 text-xs" />
                                <span className="text-gray-400">
                                  회복기간 정보 없음
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 가격 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {treatment.original_price &&
                              treatment.selling_price &&
                              treatment.original_price >
                                treatment.selling_price && (
                                <span className="text-xs text-gray-400 line-through">
                                  {Math.round(treatment.original_price / 10000)}
                                  만원
                                </span>
                              )}
                            <span className="text-base font-bold text-primary-main">
                              {price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 우측 스크롤/더보기 버튼 */}
              {shouldShowRightButton && (
                <button
                  onClick={() => {
                    // 더보기 가능하면 더보기 우선 실행, 그 외에는 스크롤
                    if (hasMoreTreatments) {
                      handleShowMore();
                    } else if (scrollState.canScrollRight) {
                      handleScrollRight();
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-lg rounded-full p-2.5 transition-all"
                >
                  <FiChevronRight className="text-gray-700 text-xl" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* 더보기 버튼 - 중분류 카테고리 (5개 초과 시 표시) */}
      {recommendations.length > visibleCategoriesCount && (
        <button
          onClick={() => setVisibleCategoriesCount((prev) => prev + 10)}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
        >
          더보기 ({recommendations.length - visibleCategoriesCount}개 카테고리
          더)
        </button>
      )}

      {/* 맞춤 병원정보 */}
      <div className="bg-primary-light/10 rounded-xl p-4 mt-4">
        <h4 className="font-semibold text-gray-900 mb-2">
          {t("procedure.matchingHospital")}
        </h4>
        <p className="text-sm text-gray-700 mb-3">
          {t("procedure.hospitalRecommendation")}
        </p>
        <button className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
          {t("procedure.viewHospitalInfo")}
        </button>
      </div>

      {/* Filter Modal */}
      <ProcedureFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFilterApply}
        currentFilter={filter}
      />

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
        />
      )}
    </div>
  );
}
