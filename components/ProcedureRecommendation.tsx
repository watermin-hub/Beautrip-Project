"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateWithDay, formatTravelPeriod } from "@/lib/utils/dateFormat";
import { TravelScheduleData } from "./TravelScheduleForm";
import {
  FiStar,
  FiClock,
  FiCalendar,
  FiFilter,
  FiChevronRight,
  FiChevronLeft,
  FiHeart,
  FiX,
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
  toggleProcedureFavorite,
  getFavoriteStatus,
  type Treatment,
  type ScheduleBasedRecommendation,
} from "@/lib/api/beautripApi";

// 필터 옵션은 ProcedureFilterModal에서 동일하게 사용

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
  const { t, language } = useLanguage();
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
  // 이전 scheduleData를 추적하여 초기 로드인지 카테고리 변경인지 구분
  const prevScheduleDataRef = useRef<TravelScheduleData | null>(null);
  // 이전 selectedCategoryId를 추적
  const prevSelectedCategoryIdRef = useRef<string | null | undefined>(
    undefined
  );

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
        // scheduleData가 변경되었는지 확인 (초기 로드 또는 일정 변경)
        const isScheduleDataChanged =
          prevScheduleDataRef.current === null ||
          prevScheduleDataRef.current.travelPeriod.start !==
            scheduleData.travelPeriod.start ||
          prevScheduleDataRef.current.travelPeriod.end !==
            scheduleData.travelPeriod.end;

        // 카테고리만 변경되었는지 확인
        const isCategoryOnlyChanged =
          prevSelectedCategoryIdRef.current !== undefined &&
          prevSelectedCategoryIdRef.current !== selectedCategoryId &&
          !isScheduleDataChanged;

        // 초기 로드 또는 일정 변경 시에만 로딩 상태 표시
        // 카테고리만 변경될 때는 로딩 상태를 전혀 변경하지 않음
        const isInitialLoad = recommendations.length === 0;
        if (
          (isInitialLoad || isScheduleDataChanged) &&
          !isCategoryOnlyChanged
        ) {
          setLoading(true);
        }

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

        console.log(
          `📥 [데이터 로드] 카테고리: "${categoryForLoad}", 로드된 시술: ${treatments.length}개`
        );

        // "피부" 카테고리 선택 시 로드된 데이터 확인
        if (categoryForLoad === "피부") {
          const pibuMids = new Set<string>();
          treatments.forEach((t: any) => {
            if (t.category_mid) pibuMids.add(t.category_mid);
          });
          console.log(
            `🔍 [피부 데이터 확인] 로드된 시술의 중분류 (${pibuMids.size}개):`,
            Array.from(pibuMids).slice(0, 20)
          );
          if (pibuMids.has("피부관리")) {
            const count = treatments.filter(
              (t: any) => t.category_mid === "피부관리"
            ).length;
            console.log(`✅ [피부관리 발견] 로드된 데이터 중 ${count}개 발견!`);
          } else {
            console.warn(
              `❌ [피부관리 없음] 로드된 200개 데이터 중 "피부관리"가 없습니다!`
            );
          }
        }

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
        // 카테고리만 변경되었을 때는 로딩 상태를 변경하지 않음
        const isScheduleDataChanged =
          prevScheduleDataRef.current === null ||
          prevScheduleDataRef.current.travelPeriod.start !==
            scheduleData.travelPeriod.start ||
          prevScheduleDataRef.current.travelPeriod.end !==
            scheduleData.travelPeriod.end;
        const isCategoryOnlyChanged =
          prevSelectedCategoryIdRef.current !== undefined &&
          prevSelectedCategoryIdRef.current !== selectedCategoryId &&
          !isScheduleDataChanged;

        if (!isCategoryOnlyChanged) {
          setLoading(false);
        }
        // scheduleData와 selectedCategoryId 업데이트
        prevScheduleDataRef.current = scheduleData;
        prevSelectedCategoryIdRef.current = selectedCategoryId;
      }
    }

    fetchData();
  }, [scheduleData, selectedCategoryId]);

  // 찜 상태 로드 (recommendations가 변경될 때마다)
  useEffect(() => {
    const loadFavorites = async () => {
      if (recommendations.length === 0) return;

      // 모든 시술의 ID 추출
      const treatmentIds = recommendations
        .flatMap((rec) => rec.treatments)
        .map((t) => t.treatment_id)
        .filter((id): id is number => id !== undefined);

      if (treatmentIds.length > 0) {
        const favoriteStatus = await getFavoriteStatus(treatmentIds);
        setFavorites(favoriteStatus);
      }
    };

    loadFavorites();
  }, [recommendations]);

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

    // 중복 체크: 같은 날짜에 동일한 시술이 있는지 확인
    const procedureName =
      selectedTreatment.treatment_name || t("common.noTreatmentName");
    const hospital =
      selectedTreatment.hospital_name || t("common.noHospitalName");
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
      recoveryGuides,
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
      // entry_source: "schedule" (일정 페이지에서 진입)
      import("@/lib/gtm").then(({ trackAddToSchedule }) => {
        trackAddToSchedule("schedule");
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

  // 여행 일수 계산
  const travelDays =
    scheduleData.travelPeriod.start && scheduleData.travelPeriod.end
      ? Math.ceil(
          (new Date(scheduleData.travelPeriod.end).getTime() -
            new Date(scheduleData.travelPeriod.start).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  // 날짜 포맷팅은 utils/dateFormat.ts의 formatDateWithDay 사용

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
        <div className="flex items-center gap-2 flex-wrap">
          <FiCalendar className="text-primary-main" />
          <span className="text-sm text-gray-700">
            {t("procedure.travelPeriod")}:{" "}
            {formatTravelPeriod(travelDays - 1, travelDays, language)}
          </span>
          {scheduleData.travelPeriod.start && scheduleData.travelPeriod.end && (
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium">
              {formatDateWithDay(scheduleData.travelPeriod.start, language)} ~{" "}
              {formatDateWithDay(scheduleData.travelPeriod.end, language)}
            </div>
          )}
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

          {/* 카테고리 버튼들 - 5개씩 2줄 그리드 (아이콘 위, 텍스트 아래 / 5:3 정도의 낮은 카드 비율) */}
          <div className="grid grid-cols-5 gap-2">
            {mainCategories.map((category) => {
              const isActive = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-medium transition-colors aspect-[5/3] ${
                    isActive
                      ? "bg-primary-main/10 text-primary-main font-bold border border-primary-main shadow-[0_0_0_1px_rgba(45,184,160,0.3)]"
                      : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  <span className="text-lg leading-none">{category.icon}</span>
                  <span className="leading-tight whitespace-nowrap">
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
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1.5">
                {(() => {
                  const keyMap: Record<string, string> = {
                    "same-day": "procedure.filterDuration.sameDay",
                    "half-day": "procedure.filterDuration.halfDay",
                    "1-day": "procedure.filterDuration.1Day",
                    "2-3-days": "procedure.filterDuration.2-3Days",
                    "surgery": "procedure.filterDuration.surgery",
                  };
                  return t(keyMap[filter.duration] || filter.duration);
                })()}
                <button
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, duration: null }))
                  }
                  className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                >
                  <FiX className="text-xs text-gray-500" />
                </button>
              </span>
            )}
            {filter.recovery && (
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1.5">
                {(() => {
                  const keyMap: Record<string, string> = {
                    "same-day": "procedure.filterRecovery.sameDay",
                    "1-3-days": "procedure.filterRecovery.1-3Days",
                    "4-7-days": "procedure.filterRecovery.4-7Days",
                    "1-week-plus": "procedure.filterRecovery.1WeekPlus",
                  };
                  return t(keyMap[filter.recovery] || filter.recovery);
                })()}
                <button
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, recovery: null }))
                  }
                  className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                >
                  <FiX className="text-xs text-gray-500" />
                </button>
              </span>
            )}
            {filter.budget && (
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1.5">
                {(() => {
                  const keyMap: Record<string, string> = {
                    "under-50": "procedure.filterBudget.under50",
                    "50-100": "procedure.filterBudget.50-100",
                    "100-200": "procedure.filterBudget.100-200",
                    "200-plus": "procedure.filterBudget.200Plus",
                  };
                  return t(keyMap[filter.budget] || filter.budget);
                })()}
                <button
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, budget: null }))
                  }
                  className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                >
                  <FiX className="text-xs text-gray-500" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 중분류별 시술 추천 - 각 중분류마다 카드 스와이프 */}
      {filteredRecommendations.length === 0 && (
        <p className="text-center text-gray-500 text-sm">
          {t("procedure.noResults")}
        </p>
      )}

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
                  {t("procedure.averageProcedureTime")}{" "}
                  {rec.averageProcedureTimeMin > 0 ||
                  rec.averageProcedureTimeMax > 0
                    ? rec.averageProcedureTimeMin ===
                      rec.averageProcedureTimeMax
                      ? `${rec.averageProcedureTimeMax}${t("procedure.procedureTime")}`
                      : `${rec.averageProcedureTimeMin}~${rec.averageProcedureTimeMax}${t("procedure.procedureTime")}`
                    : rec.averageProcedureTime > 0
                    ? `${rec.averageProcedureTime}${t("procedure.procedureTime")}`
                    : t("pdp.noInfo")}{" "}
                  · {t("procedure.recoveryPeriod")}{" "}
                  {rec.averageRecoveryPeriodMin > 0 ||
                  rec.averageRecoveryPeriodMax > 0
                    ? rec.averageRecoveryPeriodMin ===
                      rec.averageRecoveryPeriodMax
                      ? `${rec.averageRecoveryPeriodMax}${t("procedure.recoveryDays")}`
                      : `${rec.averageRecoveryPeriodMin}~${rec.averageRecoveryPeriodMax}${t("procedure.recoveryDays")}`
                    : rec.averageRecoveryPeriod > 0
                    ? `${rec.averageRecoveryPeriod}${t("procedure.recoveryDays")}`
                    : t("pdp.noInfo")}
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
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3"
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
                      : t("common.priceInquiry");
                    const isFavorited = treatment.treatment_id
                      ? favorites.has(treatment.treatment_id)
                      : false;

                    const handleFavoriteClick = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (!treatment.treatment_id) return;

                      const result = await toggleProcedureFavorite(
                        treatment.treatment_id
                      );

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

                    return (
                      <div
                        key={treatment.treatment_id}
                        className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                        onClick={() => {
                          if (treatment.treatment_id) {
                            router.push(
                              `/home/treatment/${treatment.treatment_id}`
                            );
                          }
                        }}
                      >
                        {/* 이미지 - 2:1 비율 */}
                        <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                          <img
                            src={getThumbnailUrl(treatment)}
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
                          {treatment.dis_rate && treatment.dis_rate > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                              {treatment.dis_rate}%
                            </div>
                          )}
                          {/* 찜 버튼 - 썸네일 우측 상단 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavoriteClick(e);
                            }}
                            className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors"
                          >
                            <FiHeart
                              className={`text-base ${
                                isFavorited
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-700"
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
                            {treatment.rating && treatment.rating > 0 ? (
                              <div className="flex items-center gap-1 h-[14px]">
                                <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                                <span className="text-xs font-semibold text-gray-700">
                                  {treatment.rating.toFixed(1)}
                                </span>
                                {treatment.review_count && (
                                  <span className="text-xs text-gray-400">
                                    ({treatment.review_count.toLocaleString()})
                                  </span>
                                )}
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
          treatmentName={
            selectedTreatment.treatment_name || t("common.noTreatmentName")
          }
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}
    </div>
  );
}
