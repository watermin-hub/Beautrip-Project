"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TravelScheduleData } from "./TravelScheduleForm";
import { FiStar, FiClock, FiCalendar, FiFilter, FiChevronRight, FiChevronLeft, FiHeart } from "react-icons/fi";
import ProcedureFilterModal, { ProcedureFilter } from "./ProcedureFilterModal";
import { 
  loadTreatments, 
  getScheduleBasedRecommendations, 
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  type Treatment,
  type ScheduleBasedRecommendation
} from "@/lib/api/beautripApi";

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
  labelKey: string;
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
  const { t } = useLanguage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<ProcedureFilter>({
    duration: null,
    recovery: null,
    budget: null,
  });
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [recommendations, setRecommendations] = useState<ScheduleBasedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPositions, setScrollPositions] = useState<Record<string, { left: number; canScrollLeft: boolean; canScrollRight: boolean }>>({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const treatments = await loadTreatments();
        setAllTreatments(treatments);
        
        // 디버깅: 첫 번째 데이터 구조 확인
        if (treatments.length > 0) {
          console.log("API 데이터 샘플:", treatments[0]);
          console.log("사용 가능한 필드:", Object.keys(treatments[0]));
        }
        
        // 일정 기반 추천 데이터 생성
        if (scheduleData.travelPeriod.start && scheduleData.travelPeriod.end) {
          const scheduleBasedRecs = getScheduleBasedRecommendations(
            treatments,
            scheduleData.procedureCategory,
            scheduleData.travelPeriod.start,
            scheduleData.travelPeriod.end
          );
          console.log("추천 결과:", scheduleBasedRecs);
          setRecommendations(scheduleBasedRecs);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [scheduleData]);

  // 여행 일수 계산
  const travelDays = scheduleData.travelPeriod.start && scheduleData.travelPeriod.end
    ? Math.ceil(
        (new Date(scheduleData.travelPeriod.end).getTime() -
          new Date(scheduleData.travelPeriod.start).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 0;

  // TODO: API 연동 후 실제 필터링 로직 구현
  // const filteredRecommendations = recommendations.filter((rec) => {
  //   // 필터 조건에 맞는 시술만 필터링
  //   return true; // 임시로 모든 시술 표시
  // });

  const handleFilterApply = (newFilter: ProcedureFilter) => {
    setFilter(newFilter);
    // TODO: 필터 적용 후 리스트 재계산
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
              [rec.categoryMid]: { left: scrollLeft, canScrollLeft, canScrollRight },
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
        <p className="text-center text-gray-500">
          {t("procedure.noResults")}
        </p>
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{t("procedure.customRecommendations")}</h3>
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

      {/* 대분류 카테고리 선택 */}
      {mainCategories.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {/* 전체 버튼 */}
            <button
              onClick={() => handleCategoryClick(null)}
              className={`flex flex-col items-center justify-center w-[70px] h-[70px] rounded-xl border text-xs transition-colors flex-shrink-0 ${
                selectedCategoryId === null
                  ? "bg-primary-main/10 border-primary-main text-primary-main"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl mb-1">전체</span>
              <span className="text-[11px] leading-tight text-center">전체</span>
            </button>
            {/* 카테고리 버튼들 */}
            {mainCategories.map((category) => {
              const isActive = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex flex-col items-center justify-center w-[70px] h-[70px] rounded-xl border text-xs transition-colors flex-shrink-0 ${
                    isActive
                      ? "bg-primary-main/10 border-primary-main text-primary-main"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl mb-1">{category.icon}</span>
                  <span className="text-[11px] leading-tight text-center">
                    {t(category.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 소요시간 기반 일정표 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FiCalendar className="text-primary-main" />
          <h4 className="font-semibold text-gray-900">{t("procedure.travelInfo")}</h4>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>{t("procedure.travelPeriod")}:</span>
            <span className="font-medium">{travelDays - 1}박 {travelDays}일</span>
          </div>
          <div className="flex justify-between">
            <span>{t("procedure.estimatedBudget")}:</span>
            <span className="font-medium text-primary-main">
              {scheduleData.estimatedBudget}
            </span>
          </div>
        </div>
      </div>

      {/* 중분류별 시술 추천 - 각 중분류마다 카드 스와이프 */}
      {recommendations.map((rec) => {
        const scrollState = scrollPositions[rec.categoryMid] || { left: 0, canScrollLeft: false, canScrollRight: true };
        
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

        return (
          <div key={rec.categoryMid} className="space-y-3">
            {/* 중분류 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">{rec.categoryMid}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("procedure.avgTime")} {rec.averageProcedureTime}{t("procedure.procedureTime")} · {t("procedure.recoveryPeriod")} {rec.averageRecoveryPeriod}{t("procedure.recoveryDays")}
                </p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {rec.treatments.length}개
              </span>
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
                {rec.treatments.map((treatment) => {
                  const recoveryPeriod = parseRecoveryPeriod(treatment.downtime);
                  const procedureTime = parseProcedureTime(treatment.surgery_time);
                  const price = treatment.selling_price 
                    ? `${Math.round(treatment.selling_price / 10000)}만원`
                    : "가격 문의";
                  const isFavorited = treatment.treatment_id ? favorites.has(treatment.treatment_id) : false;
                  
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
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex-shrink-0 w-[280px]"
            >
                      {/* 이미지 + 할인율 오버레이 */}
                      <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                        <img
                          src={getThumbnailUrl(treatment)}
                          alt={treatment.treatment_name}
                          className="w-full h-full object-cover"
                        />
                        {/* 할인율 배지 */}
                        {treatment.dis_rate && treatment.dis_rate > 0 && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {treatment.dis_rate}%
                          </div>
                        )}
                        {/* 찜 버튼 */}
                        <button
                          onClick={handleFavoriteClick}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 transition-colors shadow-sm"
                        >
                          <FiHeart
                            className={`text-sm ${
                              isFavorited ? "text-red-500 fill-red-500" : "text-gray-600"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 병원명 */}
                      <p className="text-xs text-gray-500 mb-1">{treatment.hospital_name}</p>
                      
                      {/* 시술명 */}
                      <h5 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">
                        {treatment.treatment_name}
                      </h5>

                      {/* 평점 */}
                      {treatment.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                          <span className="text-xs font-semibold">{treatment.rating.toFixed(1)}</span>
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
                              <span>{procedureTime}{t("procedure.procedureTime")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <FiClock className="text-gray-300 text-xs" />
                              <span className="text-gray-400">시간 정보 없음</span>
                </div>
                          )}
                          {recoveryPeriod > 0 ? (
                <div className="flex items-center gap-1">
                  <FiCalendar className="text-primary-main text-xs" />
                              <span>{t("procedure.recoveryPeriod")} {recoveryPeriod}{t("procedure.recoveryDays")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <FiCalendar className="text-gray-300 text-xs" />
                              <span className="text-gray-400">회복기간 정보 없음</span>
                </div>
                          )}
              </div>
                      )}

                      {/* 가격 */}
              <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {treatment.original_price && treatment.selling_price && treatment.original_price > treatment.selling_price && (
                            <span className="text-xs text-gray-400 line-through">
                              {Math.round(treatment.original_price / 10000)}만원
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

              {/* 우측 스크롤 버튼 */}
              {scrollState.canScrollRight && (
                <button
                  onClick={handleScrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                >
                  <FiChevronRight className="text-gray-700 text-lg" />
                </button>
              )}
            </div>
        </div>
        );
      })}

      {/* 맞춤 병원정보 */}
      <div className="bg-primary-light/10 rounded-xl p-4 mt-4">
        <h4 className="font-semibold text-gray-900 mb-2">{t("procedure.matchingHospital")}</h4>
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
    </div>
  );
}
