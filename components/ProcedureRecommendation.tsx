"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateWithDay, formatTravelPeriod } from "@/lib/utils/dateFormat";
import {
  formatPrice,
  getCurrencyFromStorage,
  getCurrencyFromLanguage,
} from "@/lib/utils/currency";
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
import LoginRequiredPopup from "./LoginRequiredPopup";
import ReviewRequiredPopup from "./ReviewRequiredPopup";
import CommunityWriteModal from "./CommunityWriteModal";
import { supabase } from "@/lib/supabase";
import {
  getHomeScheduleRecommendations,
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  getRecoveryInfoByCategorySmall,
  toggleProcedureFavorite,
  getFavoriteStatus,
  hasUserWrittenReview,
  type Treatment,
  type HomeScheduleRecommendation,
} from "@/lib/api/beautripApi";
import { trackAddToSchedule, trackPdpClick } from "@/lib/gtm";

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
  id: string | null;
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
  const { t, language } = useLanguage();
  const router = useRouter();
  // 통화 설정 (언어에 따라 자동 설정, 또는 localStorage에서 가져오기)
  const currency = useMemo(() => {
    return getCurrencyFromLanguage(language) || getCurrencyFromStorage();
  }, [language]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<ProcedureFilter>({
    duration: null,
    recovery: null,
    budget: null,
  });
  const [recommendations, setRecommendations] = useState<
    HomeScheduleRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [recoveryInfoCache, setRecoveryInfoCache] = useState<
    Map<
      string,
      {
        procedureTimeMin: number;
        recoveryMax: number;
        recommendedStayDays: number;
      }
    >
  >(new Map());
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
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showReviewRequiredPopup, setShowReviewRequiredPopup] = useState(false);
  const [showCommunityWriteModal, setShowCommunityWriteModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 로그인 성공 후 실행할 동작 저장
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // 중분류 카테고리 표시 개수 (초기 5개)
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5);
  // 이전 scheduleData를 추적하여 초기 로드인지 카테고리 변경인지 구분
  const prevScheduleDataRef = useRef<TravelScheduleData | null>(null);
  // 이전 selectedCategoryId를 추적
  const prevSelectedCategoryIdRef = useRef<string | null | undefined>(
    undefined
  );
  // 초기 로드된 언어 추적 (번역 로직용)
  const [initialLanguageLoaded, setInitialLanguageLoaded] = useState<
    string | null
  >(null);

  // 중분류 중복 확인을 위한 로그 (개발용)
  useEffect(() => {
    if (
      recommendations.length > 0 &&
      scheduleData.procedureCategory === "전체"
    ) {
      // ⚠️ 핵심: 로직은 category_mid_key 사용 (한글 고정)
      const categoryMidCounts = new Map<string, Set<string>>();
      recommendations.forEach((rec) => {
        const categoryMidKey = rec.category_mid_key || rec.categoryMid;
        if (!categoryMidCounts.has(categoryMidKey)) {
          categoryMidCounts.set(categoryMidKey, new Set());
        }
        // 해당 중분류가 속한 대분류 확인
        rec.treatments.forEach((treatment) => {
          if (treatment.category_large) {
            categoryMidCounts
              .get(categoryMidKey)!
              .add(treatment.category_large);
          }
        });
      });

      // 중복된 중분류 확인 (같은 중분류가 여러 대분류에 속한 경우)
      const duplicates: string[] = [];
      categoryMidCounts.forEach((categoryLarges, categoryMidKey) => {
        if (categoryLarges.size > 1) {
          // UI 표시용으로 category_mid 찾기
          const rec = recommendations.find(
            (r) => (r.category_mid_key || r.categoryMid) === categoryMidKey
          );
          const displayName =
            rec?.category_mid || rec?.categoryMid || categoryMidKey;
          duplicates.push(
            `${displayName} (대분류: ${Array.from(categoryLarges).join(", ")})`
          );
        }
      });

      // 중복 체크는 개발 환경에서만 로깅
      if (duplicates.length > 0 && process.env.NODE_ENV === "development") {
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

  // ✅ 초기 데이터 로드 (일정/카테고리 변경 시)
  useEffect(() => {
    async function fetchInitialData() {
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

        // 일정 기반 추천 데이터 조회
        // ⚠️ 중요: 초기 로드 시에만 현재 언어로 로드, 언어 변경은 번역 로직에서 처리
        if (scheduleData.travelPeriod.start && scheduleData.travelPeriod.end) {
          // selectedCategoryId를 한글 카테고리 ID로 변환
          // ⚠️ 중요: mainCategories의 id는 한글 고정이므로, 이를 그대로 사용
          // SQL 함수에서 vi.category_large와 tm.category_large 모두 확인하므로 안전
          let categoryToUse: string | null = null;

          // ⚠️ 핵심: selectedCategoryId가 명시적으로 null이면 "전체" 선택이므로 무조건 null 사용
          // (scheduleData.procedureCategory는 무시)
          if (selectedCategoryId === null) {
            categoryToUse = null; // 전체 카테고리
          } else if (selectedCategoryId !== undefined) {
            // mainCategories에서 선택된 카테고리의 id를 사용 (한글 고정)
            // SQL 함수에서 vi.category_large와 tm.category_large 모두 확인하므로
            // id(한글)를 전달해도 번역된 카테고리와 매칭됨
            const selectedCategory = mainCategories.find(
              (cat) => cat.id === selectedCategoryId
            );
            // id는 한글 고정이므로 그대로 사용
            categoryToUse = selectedCategory?.id || selectedCategoryId;
          } else {
            // selectedCategoryId가 undefined인 경우 (초기 로드 시)
            // scheduleData.procedureCategory가 있으면 그것을 사용 (하지만 "전체"는 제외)
            if (
              scheduleData.procedureCategory &&
              scheduleData.procedureCategory !== "전체"
            ) {
              categoryToUse = scheduleData.procedureCategory;
            }
            // 그 외에는 null로 유지 (전체 카테고리)
          }

          // ✅ 백엔드 스펙에 맞춤: 권장값 사용 (카테고리 3, 카테고리당 5)
          const scheduleRecs = await getHomeScheduleRecommendations(
            scheduleData.travelPeriod.start,
            scheduleData.travelPeriod.end,
            categoryToUse,
            language,
            {
              limitCategories: 3, // 백엔드 권장값
              limitPerCategory: 5, // 백엔드 권장값
            }
          );
          setRecommendations(scheduleRecs);
        } else {
          // 일정이 없으면 빈 배열
          setRecommendations([]);
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

    // 초기 로드 또는 일정/카테고리 변경 시 실행
    // language는 제외: 언어 변경은 별도 useEffect에서 처리
    fetchInitialData();
  }, [scheduleData, selectedCategoryId, mainCategories]); // language 제외: 별도 useEffect에서 처리

  // 로그인 상태 확인 및 리뷰 작성 이력 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      // 로그인 상태일 때 리뷰 작성 이력 확인
      if (loggedIn && session?.user) {
        const hasReview = await hasUserWrittenReview(session.user.id);
        setHasWrittenReview(hasReview);
      } else {
        setHasWrittenReview(false);
      }
    };
    checkAuth();
  }, []);

  // 초기 로드 완료 시 언어 저장 (일정/카테고리 변경 시에만 업데이트)
  useEffect(() => {
    if (recommendations.length > 0) {
      // 일정이나 카테고리가 변경되었는지 확인
      const isScheduleDataChanged =
        prevScheduleDataRef.current === null ||
        prevScheduleDataRef.current.travelPeriod.start !==
          scheduleData.travelPeriod.start ||
        prevScheduleDataRef.current.travelPeriod.end !==
          scheduleData.travelPeriod.end;

      // 일정이 변경되었거나 아직 언어가 저장되지 않았으면 저장
      // ⚠️ 언어 변경은 번역 로직에서 처리하므로, 여기서는 일정/카테고리 변경 시에만 업데이트
      if (isScheduleDataChanged || !initialLanguageLoaded) {
        setInitialLanguageLoaded(language);
      }
      // 일정이 변경되지 않았고 이미 언어가 저장되어 있으면 유지 (번역 로직에서 처리)
    } else {
      // 데이터가 없으면 리셋
      setInitialLanguageLoaded(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recommendations.length,
    scheduleData.travelPeriod.start,
    scheduleData.travelPeriod.end,
  ]); // language 제외: 번역 로직에서 처리

  // ✅ 언어 변경 시 RPC를 다시 호출 (번역 대신 백엔드에서 언어별 데이터 가져오기)
  useEffect(() => {
    async function reloadWithNewLanguage() {
      // 초기 로드가 완료되지 않았거나, 데이터가 없으면 스킵
      if (recommendations.length === 0 || !initialLanguageLoaded) {
        return;
      }

      // 이미 같은 언어로 로드했으면 스킵
      if (initialLanguageLoaded === language) {
        return;
      }

      // 일정이 없으면 스킵
      if (!scheduleData.travelPeriod.start || !scheduleData.travelPeriod.end) {
        return;
      }

      try {
        setLoading(true);
        
        // 카테고리 선택 상태 유지
        let categoryToUse: string | null = null;
        if (selectedCategoryId === null) {
          categoryToUse = null;
        } else if (selectedCategoryId !== undefined) {
          const selectedCategory = mainCategories.find(
            (cat) => cat.id === selectedCategoryId
          );
          categoryToUse = selectedCategory?.id || selectedCategoryId;
        }

        // RPC를 다시 호출하여 새로운 언어로 데이터 가져오기
        const scheduleRecs = await getHomeScheduleRecommendations(
          scheduleData.travelPeriod.start,
          scheduleData.travelPeriod.end,
          categoryToUse,
          language,
          {
            limitCategories: 3,
            limitPerCategory: 5,
          }
        );

        setRecommendations(scheduleRecs);
        setInitialLanguageLoaded(language);
      } catch (error) {
        console.error("언어 변경 시 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    // 초기 로드가 완료된 후에만 언어 변경 처리
    if (initialLanguageLoaded && initialLanguageLoaded !== language) {
      reloadWithNewLanguage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, initialLanguageLoaded]); // language와 initialLanguageLoaded 변경 시 실행

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

    // ⚠️ 중요: category_mid_key (한국어 고정)를 사용해야 category_treattime_recovery와 매칭됨
    const categoryMidForRecovery =
      selectedTreatment.category_mid_key || selectedTreatment.category_mid;
    if (categoryMidForRecovery) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        categoryMidForRecovery,
        language
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

  // ✅ category_small 기준 recovery 정보 미리 로드
  useEffect(() => {
    const loadRecoveryInfo = async () => {
      if (recommendations.length === 0) return;

      const cache = new Map<
        string,
        {
          procedureTimeMin: number;
          recoveryMax: number;
          recommendedStayDays: number;
        }
      >();

      // 모든 treatment의 category_small 수집
      const categorySmalls = new Set<string>();
      recommendations.forEach((rec) => {
        rec.treatments.forEach((treatment) => {
          if (treatment.category_small) {
            categorySmalls.add(treatment.category_small);
          }
        });
      });

      // 각 category_small에 대한 recovery 정보 로드
      await Promise.all(
        Array.from(categorySmalls).map(async (categorySmall) => {
          const recoveryInfo = await getRecoveryInfoByCategorySmall(
            categorySmall,
            language
          );
          if (recoveryInfo) {
            cache.set(categorySmall, {
              procedureTimeMin: recoveryInfo.procedureTimeMin,
              recoveryMax: recoveryInfo.recoveryMax,
              recommendedStayDays: recoveryInfo.recommendedStayDays,
            });
          }
        })
      );

      setRecoveryInfoCache(cache);
    };

    loadRecoveryInfo();
  }, [recommendations, language]);

  // 필터링된 추천 데이터
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    // 필터 적용
    if (filter.duration) {
      filtered = filtered
        .map((rec) => {
          const filteredTreatments = rec.treatments.filter((treatment) => {
            // ✅ category_small 기준으로 category_treattime_recovery에서 시술시간 가져오기
            let procedureTime = 0;
            if (treatment.category_small) {
              const cached = recoveryInfoCache.get(treatment.category_small);
              if (cached) {
                procedureTime = cached.procedureTimeMin || 0;
              }
            }
            // fallback: treatment.surgery_time 사용
            if (procedureTime === 0) {
              procedureTime = parseProcedureTime(treatment.surgery_time);
            }

            switch (filter.duration) {
              case "under-30":
                return procedureTime > 0 && procedureTime <= 30; // 30분 이하
              case "30-60":
                return procedureTime > 30 && procedureTime <= 60; // 30분~60분
              case "60-90":
                return procedureTime > 60 && procedureTime <= 90; // 60분~90분
              case "90-120":
                return procedureTime > 90 && procedureTime <= 120; // 90분~120분
              case "over-120":
                return procedureTime > 120; // 120분 이상
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
            // ✅ category_small 기준으로 category_treattime_recovery에서 회복기간 가져오기
            let recoveryPeriod = 0;
            if (treatment.category_small) {
              const cached = recoveryInfoCache.get(treatment.category_small);
              if (cached) {
                // 권장체류일수가 있으면 우선 사용, 없으면 회복기간_max 사용
                recoveryPeriod =
                  cached.recommendedStayDays > 0
                    ? cached.recommendedStayDays
                    : cached.recoveryMax;
              }
            }
            // fallback: treatment.downtime 사용
            if (recoveryPeriod === 0) {
              recoveryPeriod = parseRecoveryPeriod(treatment.downtime);
            }

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
  }, [recommendations, filter, recoveryInfoCache]);

  const handleFilterApply = (newFilter: ProcedureFilter) => {
    setFilter(newFilter);
  };

  const hasActiveFilters =
    filter.duration !== null ||
    filter.recovery !== null ||
    filter.budget !== null;

  // 스크롤 핸들러
  // ⚠️ 핵심: 로직은 category_mid_key 사용 (한글 고정)
  const handleScroll = (categoryMidKey: string) => {
    const element = scrollRefs.current[categoryMidKey];
    if (!element) return;

    // 최대 표시 가능한 카드 수 (3개)
    const MAX_VISIBLE_CARDS = 3;

    // 실제 카드 요소들을 통해 정확한 너비 계산
    const cardElements = element.querySelectorAll(
      '[class*="w-\\[150px\\]"], .flex-shrink-0'
    );
    let maxScrollWidth = 0;

    if (cardElements.length >= MAX_VISIBLE_CARDS) {
      // 첫 번째 카드의 위치
      const firstCard = cardElements[0] as HTMLElement;
      // 세 번째 카드의 끝 위치
      const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1] as HTMLElement;
      const firstCardRect = firstCard.getBoundingClientRect();
      const thirdCardRect = thirdCard.getBoundingClientRect();
      const containerRect = element.getBoundingClientRect();

      // 세 번째 카드의 끝이 컨테이너의 시작점에서 얼마나 떨어져 있는지
      maxScrollWidth =
        thirdCardRect.right - containerRect.left - element.clientWidth;

      // 안전하게 음수 방지 및 카드 너비 기준으로 재계산
      if (maxScrollWidth < 0 || !firstCardRect.width) {
        // fallback: 카드 너비 150px + gap 8px 기준
        const cardWidth = firstCardRect.width || 150;
        const gap = 8;
        maxScrollWidth = (cardWidth + gap) * (MAX_VISIBLE_CARDS - 1);
      }
    } else {
      // 카드가 3개 미만이면 스크롤 제한 없음 (기존 로직)
      maxScrollWidth = element.scrollWidth;
    }

    const scrollLeft = element.scrollLeft;

    // 3개 카드 이상 스크롤되지 않도록 제한 (모바일 스크롤도 방지)
    if (scrollLeft > maxScrollWidth) {
      element.scrollTo({ left: maxScrollWidth, behavior: "auto" });
      // 강제로 스크롤 위치 재설정 (이중 체크)
      requestAnimationFrame(() => {
        if (element.scrollLeft > maxScrollWidth) {
          element.scrollLeft = maxScrollWidth;
        }
      });
      return;
    }

    const canScrollLeft = scrollLeft > 0;
    // 최대 3개만 보이도록 제한하므로, 스크롤 가능 여부도 제한된 너비 기준으로 계산
    const canScrollRight = scrollLeft < maxScrollWidth - 1; // 1px 여유

    setScrollPositions((prev) => ({
      ...prev,
      [categoryMidKey]: { left: scrollLeft, canScrollLeft, canScrollRight },
    }));
  };

  // 초기 스크롤 상태 확인 (category_mid_key 기준)
  useEffect(() => {
    if (recommendations.length > 0) {
      const timer = setTimeout(() => {
        recommendations.forEach((rec) => {
          const categoryMidKey = rec.category_mid_key || rec.categoryMid;
          const element = scrollRefs.current[categoryMidKey];
          if (element) {
            const scrollLeft = element.scrollLeft;

            // 최대 스크롤 위치 계산 (3개 카드 제한)
            const MAX_VISIBLE_CARDS = 3;
            const children = Array.from(element.children) as HTMLElement[];
            const cardElements = children.filter(
              (child) =>
                child.classList.contains("flex-shrink-0") &&
                child.classList.contains("w-[150px]")
            );

            let maxScrollWidth = element.scrollWidth - element.clientWidth;
            if (cardElements.length >= MAX_VISIBLE_CARDS) {
              const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
              if (thirdCard) {
                const thirdCardRight =
                  thirdCard.offsetLeft + thirdCard.offsetWidth;
                maxScrollWidth = thirdCardRight - element.clientWidth;
              }
            }

            const canScrollLeft = scrollLeft > 0;
            const canScrollRight = scrollLeft < maxScrollWidth - 1;

            setScrollPositions((prev) => ({
              ...prev,
              [categoryMidKey]: {
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
              <span className="font-bold">ALL</span>
            </button>
          </div>

          {/* 카테고리 버튼들 - 5개씩 2줄 그리드 (아이콘 위, 텍스트 아래 / 5:3 정도의 낮은 카드 비율) */}
          <div className="grid grid-cols-5 gap-2">
            {mainCategories
              .filter((category) => category.id !== null) // "전체" 항목 제외
              .map((category) => {
                const isActive = selectedCategoryId === category.id;
                // 영어일 때는 2줄까지 허용, 다른 언어는 한 줄
                const isEnglish = language === "EN";
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-medium transition-colors aspect-[5/3] ${
                      isActive
                        ? "bg-primary-main/10 text-primary-main font-bold border border-primary-main shadow-[0_0_0_1px_rgba(45,184,160,0.3)]"
                        : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-100"
                    }`}
                    title={category.name}
                  >
                    <span className="text-lg leading-none">
                      {category.icon}
                    </span>
                    <span
                      className={`leading-tight text-center ${
                        isEnglish
                          ? "line-clamp-2 break-words"
                          : "line-clamp-1 truncate"
                      }`}
                    >
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
                    surgery: "procedure.filterDuration.surgery",
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
        // ⚠️ 핵심: 로직은 category_mid_key 사용 (한글 고정)
        const categoryMidKey = rec.category_mid_key || rec.categoryMid;
        // UI 표시는 category_mid 사용 (언어별)
        const categoryMidDisplay = rec.category_mid || rec.categoryMid;

        const scrollState = scrollPositions[categoryMidKey] || {
          left: 0,
          canScrollLeft: false,
          canScrollRight: true,
        };

        const handleScrollLeft = () => {
          const element = scrollRefs.current[categoryMidKey];
          if (element) {
            element.scrollBy({ left: -300, behavior: "smooth" });
          }
        };

        const handleScrollRight = async () => {
          const element = scrollRefs.current[categoryMidKey];
          if (!element) return;

          // 최대 스크롤 위치 계산 (3개 카드 제한)
          const MAX_VISIBLE_CARDS = 3;
          const children = Array.from(element.children) as HTMLElement[];
          const cardElements = children.filter(
            (child) =>
              child.classList.contains("flex-shrink-0") &&
              child.classList.contains("w-[150px]")
          );

          let maxScrollWidth = element.scrollWidth;
          if (cardElements.length >= MAX_VISIBLE_CARDS) {
            const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
            if (thirdCard) {
              const thirdCardRight =
                thirdCard.offsetLeft + thirdCard.offsetWidth;
              maxScrollWidth = thirdCardRight - element.clientWidth;
            }
          }

          // 이미 최대 스크롤 위치에 도달했으면 스크롤하지 않음
          if (element.scrollLeft >= maxScrollWidth - 1) {
            return;
          }

          // 비로그인 시 바로 ReviewRequiredPopup 표시
          if (!isLoggedIn) {
            // 스크롤 동작을 저장하고 팝업 표시
            setPendingAction(() => {
              const element = scrollRefs.current[categoryMidKey];
              if (element) {
                const newScrollLeft = Math.min(
                  element.scrollLeft + 300,
                  maxScrollWidth
                );
                element.scrollTo({ left: newScrollLeft, behavior: "smooth" });
              }
            });
            setShowReviewRequiredPopup(true);
            return;
          }

          // 로그인 상태이지만 리뷰를 작성하지 않은 경우 ReviewRequiredPopup 표시
          if (!hasWrittenReview) {
            // 스크롤 동작을 저장하고 팝업 표시
            setPendingAction(() => {
              const element = scrollRefs.current[categoryMidKey];
              if (element) {
                const newScrollLeft = Math.min(
                  element.scrollLeft + 300,
                  maxScrollWidth
                );
                element.scrollTo({ left: newScrollLeft, behavior: "smooth" });
              }
            });
            setShowReviewRequiredPopup(true);
            return;
          }

          // 로그인 상태이고 리뷰를 작성한 경우 스크롤 실행 (3개 제한 내에서)
          const newScrollLeft = Math.min(
            element.scrollLeft + 300,
            maxScrollWidth
          );
          element.scrollTo({ left: newScrollLeft, behavior: "smooth" });
        };

        // 더보기 기능 (10개 카드 추가)
        const handleShowMore = async () => {
          // 비로그인 시 바로 ReviewRequiredPopup 표시
          if (!isLoggedIn) {
            // 더보기 동작을 저장하고 팝업 표시
            setPendingAction(() => {
              setVisibleTreatmentsCount((prev) => ({
                ...prev,
                [categoryMidKey]: (prev[categoryMidKey] || 3) + 10,
              }));
            });
            setShowReviewRequiredPopup(true);
            return;
          }

          // 로그인 상태이지만 리뷰를 작성하지 않은 경우 ReviewRequiredPopup 표시
          if (!hasWrittenReview) {
            // 더보기 동작을 저장하고 팝업 표시
            setPendingAction(() => {
              setVisibleTreatmentsCount((prev) => ({
                ...prev,
                [categoryMidKey]: (prev[categoryMidKey] || 3) + 10,
              }));
            });
            setShowReviewRequiredPopup(true);
            return;
          }

          // 로그인 상태이고 리뷰를 작성한 경우 더보기 실행
          setVisibleTreatmentsCount((prev) => ({
            ...prev,
            [categoryMidKey]: (prev[categoryMidKey] || 3) + 10,
          }));
        };

        // 현재 표시된 카드 수
        const currentVisibleCount = visibleTreatmentsCount[categoryMidKey] || 3;
        const hasMoreTreatments = rec.treatments.length > currentVisibleCount;
        // 우측 버튼 표시 조건: 스크롤 가능하거나 더보기 가능할 때
        const shouldShowRightButton =
          scrollState.canScrollRight || hasMoreTreatments;

        return (
          <div key={categoryMidKey} className="space-y-3">
            {/* 중분류 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  {categoryMidDisplay}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("procedure.averageProcedureTime")}{" "}
                  {(rec.averageProcedureTimeMin ?? 0) > 0 ||
                  (rec.averageProcedureTimeMax ?? 0) > 0
                    ? rec.averageProcedureTimeMin ===
                      rec.averageProcedureTimeMax
                      ? `${rec.averageProcedureTimeMax}${t(
                          "procedure.procedureTime"
                        )}`
                      : `${rec.averageProcedureTimeMin}~${
                          rec.averageProcedureTimeMax
                        }${t("procedure.procedureTime")}`
                    : (rec.averageProcedureTime ?? 0) > 0
                    ? `${rec.averageProcedureTime}${t(
                        "procedure.procedureTime"
                      )}`
                    : t("pdp.noInfo")}{" "}
                  · {t("procedure.recoveryPeriod")}{" "}
                  {(rec.averageRecoveryPeriodMin ?? 0) > 0 ||
                  (rec.averageRecoveryPeriodMax ?? 0) > 0
                    ? rec.averageRecoveryPeriodMin ===
                      rec.averageRecoveryPeriodMax
                      ? `${rec.averageRecoveryPeriodMax}${t(
                          "procedure.recoveryDays"
                        )}`
                      : `${rec.averageRecoveryPeriodMin}~${
                          rec.averageRecoveryPeriodMax
                        }${t("procedure.recoveryDays")}`
                    : (rec.averageRecoveryPeriod ?? 0) > 0
                    ? `${rec.averageRecoveryPeriod}${t(
                        "procedure.recoveryDays"
                      )}`
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
                  scrollRefs.current[categoryMidKey] = el;

                  // 스크롤 제한을 위한 이벤트 리스너 (모바일 터치 스크롤 방지)
                  if (el) {
                    const limitScroll = () => {
                      const MAX_VISIBLE_CARDS = 3;
                      // 카드 요소 찾기 (flex-shrink-0 클래스와 w-[150px] 클래스를 가진 요소)
                      const children = Array.from(el.children) as HTMLElement[];
                      const cardElements = children.filter(
                        (child) =>
                          child.classList.contains("flex-shrink-0") &&
                          child.classList.contains("w-[150px]")
                      );

                      if (cardElements.length >= MAX_VISIBLE_CARDS) {
                        const firstCard = cardElements[0];
                        const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];

                        if (firstCard && thirdCard) {
                          // 첫 번째 카드의 시작 위치 (상대적)
                          const firstCardLeft = firstCard.offsetLeft;
                          // 세 번째 카드의 끝 위치
                          const thirdCardRight =
                            thirdCard.offsetLeft + thirdCard.offsetWidth;
                          // 최대 스크롤 위치 = 세 번째 카드의 끝 - 컨테이너 너비
                          const maxScrollWidth =
                            thirdCardRight - el.clientWidth;

                          if (el.scrollLeft > maxScrollWidth) {
                            el.scrollLeft = maxScrollWidth;
                          }
                        }
                      }
                    };

                    // touchmove와 scroll 이벤트로 모바일 스크롤 제한
                    const handleTouchMove = (e: TouchEvent) => {
                      limitScroll();
                      // 스크롤이 제한되었으면 기본 동작 방지 (필요시)
                      if (
                        el.scrollLeft >=
                        el.scrollWidth - el.clientWidth - 50
                      ) {
                        const MAX_VISIBLE_CARDS = 3;
                        const children = Array.from(
                          el.children
                        ) as HTMLElement[];
                        const cardElements = children.filter(
                          (child) =>
                            child.classList.contains("flex-shrink-0") &&
                            child.classList.contains("w-[150px]")
                        );
                        if (cardElements.length >= MAX_VISIBLE_CARDS) {
                          const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
                          if (thirdCard) {
                            const thirdCardRight =
                              thirdCard.offsetLeft + thirdCard.offsetWidth;
                            const maxScrollWidth =
                              thirdCardRight - el.clientWidth;
                            if (el.scrollLeft > maxScrollWidth) {
                              e.preventDefault();
                            }
                          }
                        }
                      }
                    };

                    el.addEventListener("touchmove", handleTouchMove, {
                      passive: false,
                    });
                    el.addEventListener("scroll", limitScroll, {
                      passive: true,
                    });

                    // cleanup을 위한 저장
                    (el as any)._scrollLimitHandler = limitScroll;
                    (el as any)._touchMoveHandler = handleTouchMove;

                    // 초기 체크
                    setTimeout(limitScroll, 100);
                  }

                  // cleanup 함수 반환
                  return () => {
                    if (el) {
                      if ((el as any)._scrollLimitHandler) {
                        el.removeEventListener(
                          "scroll",
                          (el as any)._scrollLimitHandler
                        );
                      }
                      if ((el as any)._touchMoveHandler) {
                        el.removeEventListener(
                          "touchmove",
                          (el as any)._touchMoveHandler
                        );
                      }
                    }
                  };
                }}
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3"
                onScroll={(e) => {
                  handleScroll(categoryMidKey);
                  // 스크롤 제한 재확인
                  const element = e.currentTarget;
                  const MAX_VISIBLE_CARDS = 3;
                  const children = Array.from(
                    element.children
                  ) as HTMLElement[];
                  const cardElements = children.filter(
                    (child) =>
                      child.classList.contains("flex-shrink-0") &&
                      child.classList.contains("w-[150px]")
                  );

                  if (cardElements.length >= MAX_VISIBLE_CARDS) {
                    const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
                    if (thirdCard) {
                      const thirdCardRight =
                        thirdCard.offsetLeft + thirdCard.offsetWidth;
                      const maxScrollWidth =
                        thirdCardRight - element.clientWidth;

                      if (element.scrollLeft > maxScrollWidth) {
                        element.scrollLeft = maxScrollWidth;
                      }
                    }
                  }
                }}
                onClick={(e) => {
                  // 버튼 클릭이 아닌 경우에만 이벤트 전파 허용
                  const target = e.target as HTMLElement;
                  // 버튼이나 버튼의 자식 요소를 클릭한 경우 이벤트 전파 방지
                  if (target.closest("button")) {
                    e.stopPropagation();
                  }
                }}
              >
                {rec.treatments
                  .slice(0, visibleTreatmentsCount[categoryMidKey] || 3)
                  .map((treatment) => {
                    const recoveryPeriod = parseRecoveryPeriod(
                      treatment.downtime
                    );
                    const procedureTime = parseProcedureTime(
                      treatment.surgery_time
                    );
                    const price = formatPrice(
                      treatment.selling_price,
                      currency,
                      t
                    );
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
                        // 로그인이 필요한 경우 안내 팝업 표시
                        if (
                          result.error?.includes("로그인이 필요") ||
                          result.error?.includes("로그인")
                        ) {
                          setIsInfoModalOpen(true);
                        } else {
                          console.error("찜하기 처리 실패:", result.error);
                        }
                      }
                    };

                    return (
                      <div
                        key={treatment.treatment_id}
                        className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                        onClick={() => {
                          if (treatment.treatment_id) {
                            // GTM: PDP 클릭 이벤트 (홈 페이지에서 클릭)
                            trackPdpClick("home");
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
                  onClick={async (e) => {
                    // 이벤트 전파 방지 (카드 스크롤 방지)
                    e.stopPropagation();
                    e.preventDefault();

                    // 후기 작성 이력 다시 확인 (최신 상태 확인)
                    let currentHasWrittenReview = hasWrittenReview;
                    if (isLoggedIn) {
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      if (session?.user) {
                        currentHasWrittenReview = await hasUserWrittenReview(
                          session.user.id
                        );
                        setHasWrittenReview(currentHasWrittenReview);
                      }
                    }

                    // 비로그인 또는 후기 미작성: 팝업만 표시
                    if (!isLoggedIn || !currentHasWrittenReview) {
                      if (hasMoreTreatments) {
                        setPendingAction(() => {
                          setVisibleTreatmentsCount((prev) => ({
                            ...prev,
                            [categoryMidKey]: (prev[categoryMidKey] || 3) + 10,
                          }));
                        });
                      } else if (scrollState.canScrollRight) {
                        const element = scrollRefs.current[categoryMidKey];
                        if (element) {
                          const MAX_VISIBLE_CARDS = 3;
                          const children = Array.from(
                            element.children
                          ) as HTMLElement[];
                          const cardElements = children.filter(
                            (child) =>
                              child.classList.contains("flex-shrink-0") &&
                              child.classList.contains("w-[150px]")
                          );
                          let maxScrollWidth =
                            element.scrollWidth - element.clientWidth;
                          if (cardElements.length >= MAX_VISIBLE_CARDS) {
                            const thirdCard =
                              cardElements[MAX_VISIBLE_CARDS - 1];
                            if (thirdCard) {
                              const thirdCardRight =
                                thirdCard.offsetLeft + thirdCard.offsetWidth;
                              maxScrollWidth =
                                thirdCardRight - element.clientWidth;
                            }
                          }
                          setPendingAction(() => {
                            const element = scrollRefs.current[categoryMidKey];
                            if (element) {
                              const newScrollLeft = Math.min(
                                element.scrollLeft + 300,
                                maxScrollWidth
                              );
                              element.scrollTo({
                                left: newScrollLeft,
                                behavior: "smooth",
                              });
                            }
                          });
                        }
                      }
                      setShowReviewRequiredPopup(true);
                      return; // 여기서 함수 종료 - 다른 동작 실행 안 함
                    }

                    // 후기 작성한 사용자: 팝업 없이 동작만 실행
                    if (hasMoreTreatments) {
                      handleShowMore();
                    } else if (scrollState.canScrollRight) {
                      handleScrollRight();
                    }
                  }}
                  onMouseDown={(e) => {
                    // 마우스 다운 시에도 이벤트 전파 방지 (스크롤 방지)
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => {
                    // 터치 시작 시에도 이벤트 전파 방지 (스크롤 방지)
                    e.stopPropagation();
                    e.preventDefault();
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
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();

            // 후기 작성 이력 다시 확인 (최신 상태 확인)
            let currentHasWrittenReview = hasWrittenReview;
            if (isLoggedIn) {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (session?.user) {
                currentHasWrittenReview = await hasUserWrittenReview(
                  session.user.id
                );
                setHasWrittenReview(currentHasWrittenReview);
              }
            }

            // 비로그인 또는 후기 미작성: 팝업만 표시
            if (!isLoggedIn || !currentHasWrittenReview) {
              setPendingAction(() => {
                setVisibleCategoriesCount((prev) => prev + 10);
              });
              setShowReviewRequiredPopup(true);
              return; // 여기서 함수 종료 - 다른 동작 실행 안 함
            }

            // 후기 작성한 사용자: 팝업 없이 동작만 실행
            setVisibleCategoriesCount((prev) => prev + 10);
          }}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
        >
          {t("common.seeMoreWithCount", {
            count: recommendations.length - visibleCategoriesCount,
          })}
        </button>
      )}

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
          categoryMid={
            selectedTreatment.category_mid_key ||
            selectedTreatment.category_mid ||
            null
          }
        />
      )}

      {/* 안내 팝업 모달 */}
      {isInfoModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setIsInfoModalOpen(false)}
          />
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

      {/* 로그인 모달 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
        }}
      />

      {/* 후기 작성 필요 팝업 */}
      <ReviewRequiredPopup
        isOpen={showReviewRequiredPopup}
        onClose={() => {
          setShowReviewRequiredPopup(false);
          setPendingAction(null); // 팝업 닫을 때 저장된 동작 초기화
        }}
        onWriteClick={() => {
          setShowCommunityWriteModal(true);
        }}
        onLoginSuccess={async () => {
          // 로그인 성공 후 리뷰 작성 이력 다시 확인
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const hasReview = await hasUserWrittenReview(session.user.id);
            setHasWrittenReview(hasReview);
            setIsLoggedIn(true);

            // 리뷰를 작성했으면 저장된 동작 실행
            if (hasReview && pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }
        }}
        entrySource="home"
      />

      {/* 커뮤니티 글 작성 모달 */}
      <CommunityWriteModal
        isOpen={showCommunityWriteModal}
        onClose={() => setShowCommunityWriteModal(false)}
        entrySource="home"
      />
    </div>
  );
}
