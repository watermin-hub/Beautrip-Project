"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import {
  getThumbnailUrl,
  Treatment,
  getRecoveryInfoByCategoryMid,
  parseRecoveryPeriod,
  parseProcedureTime,
  getMidCategoryRankings,
  getSmallCategoryRankings,
  toggleProcedureFavorite,
  getFavoriteStatus,
  MidCategoryRanking,
  SmallCategoryRanking,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";
import LoginRequiredPopup from "./LoginRequiredPopup";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import {
  formatPrice,
  getCurrencyFromStorage,
  getCurrencyFromLanguage,
} from "@/lib/utils/currency";

// 홈페이지와 동일한 대분류 카테고리 10개
const MAIN_CATEGORIES = [
  { id: null, name: "전체" },
  { id: "눈성형", name: "눈성형" },
  { id: "리프팅", name: "리프팅" },
  { id: "보톡스", name: "보톡스" },
  { id: "안면윤곽/양악", name: "안면윤곽/양악" },
  { id: "제모", name: "제모" },
  { id: "지방성형", name: "지방성형" },
  { id: "코성형", name: "코성형" },
  { id: "피부", name: "피부" },
  { id: "필러", name: "필러" },
  { id: "가슴성형", name: "가슴성형" },
];

// 다른 파일에서 import할 수 있도록 export (t 파라미터는 호환성을 위해 유지)
export const getMainCategories = (t?: (key: string) => string) => {
  return MAIN_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    nameKey: cat.id || "category.all", // 호환성을 위해 nameKey 추가
  }));
};

interface CategoryRankingPageProps {
  isVisible?: boolean;
  shouldStick?: boolean; // procedure 섹션 전까지만 고정
  activeSection?: string; // ExploreScrollPage의 activeSection 전달
  // 필터 관련 props
  selectedCategory?: string | null;
  selectedMidCategory?: string | null;
  midCategoriesList?: string[];
  onCategoryChange?: (categoryId: string | null) => void;
  onMidCategoryChange?: (midCategory: string | null) => void;
  // 필터바를 외부에서 렌더링할지 여부
  renderFilterBar?: boolean;
  // midCategoriesList 변경 콜백 (RankingSection에서 필터바 렌더링용)
  onMidCategoriesListChange?: (list: string[]) => void;
}

export default function CategoryRankingPage({
  isVisible = true,
  shouldStick = true,
  activeSection = "ranking",
  selectedCategory: externalSelectedCategory,
  selectedMidCategory: externalSelectedMidCategory,
  midCategoriesList: externalMidCategoriesList,
  onCategoryChange: externalOnCategoryChange,
  onMidCategoryChange: externalOnMidCategoryChange,
  renderFilterBar = true,
  onMidCategoriesListChange,
}: CategoryRankingPageProps) {
  const { t, language } = useLanguage();
  const router = useRouter();

  // 통화 설정 (언어에 따라 자동 설정, 또는 localStorage에서 가져오기)
  const currency = useMemo(() => {
    return getCurrencyFromLanguage(language) || getCurrencyFromStorage();
  }, [language]);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로드 여부
  // 필터 state: 외부에서 제공되면 사용, 없으면 내부에서 관리
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<
    string | null
  >(null);
  const [internalSelectedMidCategory, setInternalSelectedMidCategory] =
    useState<string | null>(null);

  const selectedCategory =
    externalSelectedCategory !== undefined
      ? externalSelectedCategory
      : internalSelectedCategory;
  const selectedMidCategory =
    externalSelectedMidCategory !== undefined
      ? externalSelectedMidCategory
      : internalSelectedMidCategory;

  const setSelectedCategory =
    externalOnCategoryChange || setInternalSelectedCategory;
  const setSelectedMidCategory =
    externalOnMidCategoryChange || setInternalSelectedMidCategory;
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5); // 초기 5개 표시
  const [isAddToScheduleModalOpen, setIsAddToScheduleModalOpen] =
    useState(false);
  const [selectedTreatmentForSchedule, setSelectedTreatmentForSchedule] =
    useState<Treatment | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  // 스크롤 버튼 클릭 횟수 추적 (카테고리별)
  const [scrollButtonClickCount, setScrollButtonClickCount] = useState<
    Record<string, number>
  >({});

  // ✅ RPC 기반 랭킹 데이터
  const [midCategoryRankings, setMidCategoryRankings] = useState<
    MidCategoryRanking[]
  >([]);
  const [smallCategoryRankings, setSmallCategoryRankings] = useState<
    SmallCategoryRanking[]
  >([]);
  const [internalMidCategoriesList, setMidCategoriesList] = useState<string[]>(
    []
  ); // 중분류 목록 유지용
  const [error, setError] = useState<string | null>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      // localStorage 먼저 확인
      const savedIsLoggedIn = localStorage.getItem("isLoggedIn");
      if (savedIsLoggedIn === "true") {
        setIsLoggedIn(true);
        return;
      }

      // Supabase 세션 확인
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // 로그인 상태 변경 감지
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setIsLoggedIn(!!session);
        if (session) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userId", session.user.id);
        } else {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userId");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // 찜한 항목 로드 (Supabase에서)
  useEffect(() => {
    const loadFavorites = async () => {
      // 모든 랭킹 데이터에서 treatment_id 수집
      const allTreatmentIds: number[] = [];

      // 중분류 랭킹에서 treatments 수집
      midCategoryRankings.forEach((ranking) => {
        ranking.treatments.forEach((treatment) => {
          if (treatment.treatment_id) {
            allTreatmentIds.push(treatment.treatment_id);
          }
        });
      });

      // 소분류 랭킹에서 treatments 수집
      smallCategoryRankings.forEach((ranking) => {
        ranking.treatments.forEach((treatment) => {
          if (treatment.treatment_id) {
            allTreatmentIds.push(treatment.treatment_id);
          }
        });
      });

      if (allTreatmentIds.length > 0) {
        // 중복 제거
        const uniqueIds = Array.from(new Set(allTreatmentIds));
        const favoriteStatus = await getFavoriteStatus(uniqueIds);
        setFavorites(favoriteStatus);
      }
    };

    if (midCategoryRankings.length > 0 || smallCategoryRankings.length > 0) {
      loadFavorites();
    }
  }, [midCategoryRankings, smallCategoryRankings]);

  // 같은 썸네일이 연속으로 나오지 않도록 섞는 함수
  const shuffleByThumbnail = useMemo(() => {
    return (treatments: Treatment[]): Treatment[] => {
      if (treatments.length === 0) return [];

      // 썸네일 URL별로 그룹화
      const thumbnailGroups = new Map<string, Treatment[]>();
      treatments.forEach((treatment) => {
        const thumbnailUrl = getThumbnailUrl(treatment);
        if (!thumbnailGroups.has(thumbnailUrl)) {
          thumbnailGroups.set(thumbnailUrl, []);
        }
        thumbnailGroups.get(thumbnailUrl)!.push(treatment);
      });

      // 그룹이 1개면 원래 순서 유지
      if (thumbnailGroups.size <= 1) {
        return treatments;
      }

      // 각 그룹에서 하나씩 번갈아가며 가져오기 (round-robin)
      const result: Treatment[] = [];
      const groups = Array.from(thumbnailGroups.values());
      const groupIndices = new Array(groups.length).fill(0);
      let currentGroupIndex = 0;
      let attempts = 0;
      const maxAttempts = treatments.length * 2; // 무한 루프 방지

      while (result.length < treatments.length && attempts < maxAttempts) {
        attempts++;
        let added = false;

        // 현재 그룹부터 시작해서 다른 썸네일을 가진 항목 찾기
        for (let i = 0; i < groups.length; i++) {
          const groupIndex = (currentGroupIndex + i) % groups.length;
          const group = groups[groupIndex];
          const index = groupIndices[groupIndex];

          if (index < group.length) {
            const candidate = group[index];
            const candidateThumbnail = getThumbnailUrl(candidate);

            // 첫 번째 항목이거나 이전 항목과 썸네일이 다르면 추가
            if (
              result.length === 0 ||
              getThumbnailUrl(result[result.length - 1]) !== candidateThumbnail
            ) {
              result.push(candidate);
              groupIndices[groupIndex]++;
              currentGroupIndex = (groupIndex + 1) % groups.length;
              added = true;
              break;
            }
          }
        }

        // 같은 썸네일이 연속으로 나올 수밖에 없는 경우 (모든 남은 항목이 같은 썸네일)
        if (!added) {
          // 남은 항목 중 하나를 추가 (어쩔 수 없이 연속될 수 있음)
          for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const index = groupIndices[i];
            if (index < group.length) {
              result.push(group[index]);
              groupIndices[i]++;
              currentGroupIndex = (i + 1) % groups.length;
              break;
            }
          }
        }
      }

      // 남은 항목이 있으면 추가 (안전장치)
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        while (groupIndices[i] < group.length) {
          result.push(group[groupIndices[i]]);
          groupIndices[i]++;
        }
      }

      return result;
    };
  }, []);

  // 선택된 대분류에 속한 중분류 목록 추출
  // API에서 이미 대분류로 필터링된 데이터를 받아오므로,
  // 여기서는 단순히 중분류만 추출하면 됩니다.
  const midCategories = useMemo(() => {
    const midCategorySet = new Set<string>();

    midCategoryRankings.forEach((ranking) => {
      if (ranking.category_mid) {
        midCategorySet.add(ranking.category_mid);
      }
    });

    // 인코딩이 깨져서 "�" 문자가 포함된 중분류는 필터링하여 표시하지 않음
    const sorted = Array.from(midCategorySet)
      .filter((name) => !name.includes("�"))
      .sort();

    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[CategoryRankingPage] 대분류 "${
          selectedCategory || "전체"
        }"의 중분류 개수(필터 후): ${sorted.length}개`,
        sorted.slice(0, 10) // 처음 10개만 로그
      );
    }
    return sorted;
  }, [midCategoryRankings]);

  // midCategoriesList: externalMidCategoriesList가 제공되면 사용, 없으면 내부 state 또는 useMemo 결과 사용
  const midCategoriesList =
    externalMidCategoriesList || internalMidCategoriesList || midCategories;

  // midCategories (useMemo) 변경 시 외부에 알림 (RankingSection에서 필터바 렌더링용)
  useEffect(() => {
    if (
      onMidCategoriesListChange &&
      !externalMidCategoriesList &&
      midCategories.length > 0
    ) {
      onMidCategoriesListChange(midCategories);
    }
  }, [midCategories, externalMidCategoriesList, onMidCategoriesListChange]);

  // ✅ 초기 데이터 로드 (한국어로 먼저 로드)
  useEffect(() => {
    const loadInitialRankings = async () => {
      try {
        // 초기 로드일 때만 로딩 화면 표시
        if (isInitialLoad) {
          setLoading(true);
        }
        setError(null);

        if (selectedMidCategory !== null) {
          // 소분류 랭킹 로드 (현재 언어로 로드)
          const result = await getSmallCategoryRankings(
            selectedMidCategory,
            20,
            2,
            20,
            language // ✅ 현재 언어로 로드
          );
          if (result.success && result.data) {
            // RPC가 flat row로 반환하므로 category_small_key로 그룹화
            const rows = result.data as any[];
            const grouped = new Map<string, any>();

            for (const r of rows) {
              const key = r.category_small_key;
              if (!key) continue;

              if (!grouped.has(key)) {
                grouped.set(key, {
                  category_small_key: r.category_small_key,
                  category_rank: r.category_rank,
                  category_score: r.category_score,
                  average_rating: r.average_rating,
                  total_reviews: r.total_reviews,
                  treatment_count: r.treatment_count,
                  treatments: [],
                });
              }

              // 시술 카드 객체로 push
              grouped.get(key).treatments.push({
                treatment_id: r.treatment_id,
                treatment_name: r.treatment_name,
                hospital_id: r.hospital_id,
                hospital_name: r.hospital_name,
                category_large: r.category_large,
                category_mid: r.category_mid,
                category_small: r.category_small,
                rating: r.rating,
                review_count: r.review_count,
                selling_price: r.selling_price,
                dis_rate: r.dis_rate,
                vat_info: r.vat_info,
                main_image_url: r.main_img_url || r.main_image_url,
                card_score: r.card_score,
                treatment_rank: r.treatment_rank,
              });
            }

            const smallGrouped = Array.from(grouped.values()).sort(
              (a, b) =>
                (a.category_rank ?? 999999) - (b.category_rank ?? 999999)
            );

            setSmallCategoryRankings(smallGrouped);
            setMidCategoryRankings([]);
          } else {
            setError(result.error || "소분류 랭킹을 불러올 수 없습니다.");
            setSmallCategoryRankings([]);
          }
        } else {
          // 중분류 랭킹 로드 (현재 언어로 로드)
          console.log("🔍 [CategoryRankingPage] 중분류 랭킹 로드 시작:", {
            selectedCategory,
            language,
          });
          const result = await getMidCategoryRankings(
            selectedCategory,
            20,
            2,
            20,
            language // ✅ 현재 언어로 로드
          );
          console.log("📊 [CategoryRankingPage] 중분류 랭킹 결과:", {
            success: result.success,
            dataLength: result.data?.length || 0,
            error: result.error,
          });
          if (result.success && result.data) {
            // RPC가 flat row로 반환하므로 category_mid로 그룹화
            const rows = result.data as any[];
            const grouped = new Map<string, any>();

            for (const r of rows) {
              const key = r.category_mid;
              if (!key) continue;

              if (!grouped.has(key)) {
                // ✅ 백엔드 v2 RPC에서 집계 필드를 제공하므로 그대로 사용
                grouped.set(key, {
                  category_mid: r.category_mid,
                  category_rank: r.category_rank,
                  category_score: r.category_score,
                  average_rating: r.average_rating,
                  total_reviews: r.total_reviews,
                  treatment_count: r.treatment_count,
                  treatments: [],
                });
              }

              // 시술 카드 객체로 push
              // ✅ 백엔드 v2 RPC 반환 컬럼:
              //    - 시술 단위: category_mid_key, category_mid, treatment_id, treatment_name,
              //      hospital_id, hospital_name, rating, review_count, main_img_url
              //    - 집계 필드: category_rank, category_score, average_rating, total_reviews, treatment_count
              // ✅ getMidCategoryRankings에서 이미 main_img_url → main_image_url로 매핑됨
              grouped.get(key).treatments.push({
                treatment_id: r.treatment_id,
                treatment_name: r.treatment_name,
                hospital_id: r.hospital_id,
                hospital_name: r.hospital_name,
                category_large: r.category_large || selectedCategory || null, // RPC에서 반환되지 않을 수 있으므로 fallback
                category_mid: r.category_mid,
                category_small: r.category_small || null, // RPC에서 반환되지 않을 수 있음
                rating: r.rating,
                review_count: r.review_count,
                selling_price: r.selling_price || null, // RPC에서 반환되지 않을 수 있음
                dis_rate: r.dis_rate || null, // RPC에서 반환되지 않을 수 있음
                vat_info: r.vat_info || null, // RPC에서 반환되지 않을 수 있음
                main_image_url: r.main_image_url, // 이미 getMidCategoryRankings에서 매핑됨
                card_score: r.card_score || null, // RPC에서 반환되지 않을 수 있음
                treatment_rank: r.treatment_rank || null, // RPC에서 반환되지 않을 수 있음
              });
            }

            // ✅ 백엔드 v2 RPC에서 이미 집계 필드를 제공하므로 계산 불필요
            // 동일한 category_mid_key를 가진 row들은 집계 값이 모두 동일함 (백엔드 검증 완료)
            // category_rank 기준으로 정렬 (백엔드에서 이미 정렬된 순서)
            const midGrouped = Array.from(grouped.values()).sort(
              (a, b) =>
                (a.category_rank || 999999) - (b.category_rank || 999999)
            );

            setMidCategoryRankings(midGrouped);
            setSmallCategoryRankings([]);

            // 중분류 목록도 저장 (필터 유지용)
            const midCategorySet = new Set<string>();
            midGrouped.forEach((ranking) => {
              if (ranking.category_mid) {
                midCategorySet.add(ranking.category_mid);
              }
            });
            // 인코딩이 깨져서 "" 문자가 포함된 중분류는 필터링하여 표시하지 않음 (라인 95와 동일)
            const sorted = Array.from(midCategorySet)
              .filter((name) => name && name.trim() !== "")
              .sort();
            // externalMidCategoriesList가 없을 때만 내부 state 업데이트
            if (!externalMidCategoriesList) {
              setMidCategoriesList(sorted);
            }
            // 외부 콜백이 있으면 호출 (RankingSection에서 필터바 업데이트용)
            if (onMidCategoriesListChange) {
              onMidCategoriesListChange(sorted);
            }
          } else {
            setError(result.error || "중분류 랭킹을 불러올 수 없습니다.");
            setMidCategoryRankings([]);
            if (!externalMidCategoriesList) {
              setMidCategoriesList([]);
            }
            if (onMidCategoriesListChange) {
              onMidCategoriesListChange([]);
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "랭킹 데이터 로드 실패";
        setError(errorMessage);
        console.error("❌ [랭킹 로드 실패]:", err);
      } finally {
        setLoading(false);
        setIsInitialLoad(false); // 첫 로드 완료 후 플래그 해제
      }
    };

    // 초기 로드 또는 카테고리 변경 시 실행
    loadInitialRankings();
  }, [selectedCategory, selectedMidCategory, language]); // ✅ language 추가: 언어 변경 시에도 재로드

  // 스크롤 관련 상태
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scrollPositions, setScrollPositions] = useState<
    Record<
      string,
      { left: number; canScrollLeft: boolean; canScrollRight: boolean }
    >
  >({});

  // 스크롤 위치 확인
  const handleScroll = (categoryMid: string) => {
    const element = scrollRefs.current[categoryMid];
    if (element) {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      setScrollPositions((prev) => ({
        ...prev,
        [categoryMid]: {
          left: scrollLeft,
          canScrollLeft: scrollLeft > 0,
          canScrollRight: scrollLeft < scrollWidth - clientWidth - 10,
        },
      }));
    }
  };

  // 스크롤 위치 초기화 (중분류 랭킹)
  useEffect(() => {
    midCategoryRankings.forEach((ranking) => {
      const timer = setTimeout(() => {
        handleScroll(ranking.category_mid);
      }, 200);
      return () => clearTimeout(timer);
    });
  }, [midCategoryRankings]);

  // 스크롤 위치 초기화 (소분류 랭킹)
  useEffect(() => {
    smallCategoryRankings.forEach((ranking) => {
      const timer = setTimeout(() => {
        handleScroll(ranking.category_small_key);
      }, 200);
      return () => clearTimeout(timer);
    });
  }, [smallCategoryRankings]);

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

  // 일정에 추가 핸들러
  const handleAddToScheduleClick = (
    treatment: Treatment,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedTreatmentForSchedule(treatment);
    setIsAddToScheduleModalOpen(true);
  };

  // 일정 추가 확인
  const handleScheduleDateSelect = async (date: string) => {
    if (!selectedTreatmentForSchedule) return;

    // 해당 날짜의 기존 일정 개수 확인
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
      setIsAddToScheduleModalOpen(false);
      return;
    }

    // 회복 기간 정보 가져오기
    let recoveryDays = 0;
    let recoveryText: string | null = null;
    let recoveryGuides: Record<string, string | null> | undefined = undefined;

    if (selectedTreatmentForSchedule.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatmentForSchedule.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax;
        recoveryText = recoveryInfo.recoveryText;
        recoveryGuides = recoveryInfo.recoveryGuides;
      }
    }

    if (recoveryDays === 0) {
      recoveryDays =
        parseRecoveryPeriod(selectedTreatmentForSchedule.downtime) || 0;
    }

    // 중복 체크: 같은 날짜에 동일한 시술이 있는지 확인
    const procedureName =
      selectedTreatmentForSchedule.treatment_name ||
      t("common.noTreatmentName");
    const hospital =
      selectedTreatmentForSchedule.hospital_name || t("common.noHospitalName");
    const treatmentId = selectedTreatmentForSchedule.treatment_id;

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
      setIsAddToScheduleModalOpen(false);
      setSelectedTreatmentForSchedule(null);
      return;
    }

    // 일정 추가
    const newSchedule = {
      id: Date.now(),
      treatmentId: treatmentId,
      procedureDate: date,
      procedureName: procedureName,
      hospital: hospital,
      category:
        selectedTreatmentForSchedule.category_mid ||
        selectedTreatmentForSchedule.category_large ||
        "기타",
      categoryMid: selectedTreatmentForSchedule.category_mid || null,
      recoveryDays,
      recoveryText,
      recoveryGuides,
      procedureTime:
        parseProcedureTime(selectedTreatmentForSchedule.surgery_time) || 0,
      price: selectedTreatmentForSchedule.selling_price || null,
      rating: selectedTreatmentForSchedule.rating || 0,
      reviewCount: selectedTreatmentForSchedule.review_count || 0,
    };

    schedules.push(newSchedule);

    // localStorage 저장 시도 (에러 처리 추가)
    try {
      const schedulesJson = JSON.stringify(schedules);
      localStorage.setItem("schedules", schedulesJson);
      window.dispatchEvent(new Event("scheduleAdded"));
      alert(`${date}에 일정이 추가되었습니다!`);
      setIsAddToScheduleModalOpen(false);
      setSelectedTreatmentForSchedule(null);
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
          <p className="text-gray-600">랭킹 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">
            랭킹 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              // 다시 로드하기 위해 카테고리 상태를 트리거
              const currentCategory = selectedCategory;
              const currentMidCategory = selectedMidCategory;
              setSelectedCategory(null);
              setSelectedMidCategory(null);
              setTimeout(() => {
                setSelectedCategory(currentCategory);
                if (currentMidCategory) {
                  setSelectedMidCategory(currentMidCategory);
                }
              }, 100);
            }}
            className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-main/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (categoryId: string): string => {
    const iconMap: Record<string, string> = {
      눈성형: "👀",
      리프팅: "✨",
      보톡스: "💉",
      "안면윤곽/양악": "😊",
      제모: "💫",
      지방성형: "🏃",
      코성형: "👃",
      피부: "🌟",
      필러: "💎",
      가슴성형: "💕",
    };
    return iconMap[categoryId] || "📋";
  };

  // 중분류별 설명 텍스트 매핑 (시술 설명 스타일)
  const getCategoryDescription = (categoryMid: string): string => {
    const descriptions: Record<string, string> = {
      주름보톡스:
        "주름이 많은 부위에 주사하여 톡! 하고 주름을 펴주고 주름 예방 효과도 기대할 수 있어요.",
      근육보톡스:
        "근육을 이완시켜 주름을 예방하고 개선하는 효과가 있어요. 이마, 눈가, 미간 등 주름이 생기기 쉬운 부위에 주사하여 자연스러운 표정을 유지할 수 있어요.",
      백옥주사:
        "글루타치온 성분이 피부를 밝게 해주며, 항산화 작용을 동반하여 노화 방지에도 효과적이에요.",
      리프팅:
        "피부 탄력을 개선하고 처진 피부를 리프팅하여 더욱 젊어 보이게 해줍니다.",
      초음파리프팅:
        "초음파 에너지를 이용해 피부 깊숙이 열을 가하여 콜라겐을 재생하고 피부를 탄력 있게 만들어요.",
      레이저리프팅:
        "레이저를 이용해 피부 표면과 깊은 부분을 동시에 개선하여 주름을 완화하고 피부 톤을 개선해요.",
      실리프팅:
        "실을 이용해 처진 피부를 당겨올려 즉각적인 리프팅 효과를 주는 시술이에요.",
      필러: "볼륨을 채워주고 윤곽을 개선하여 자연스러운 미모를 연출합니다.",
      보톡스: "근육을 이완시켜 주름을 예방하고 개선하는 효과가 있습니다.",
      쌍꺼풀:
        "눈의 아름다운 라인을 만들어주는 시술로, 자연스러운 쌍꺼풀을 만들어 눈매를 더욱 선명하게 해줍니다.",
      눈매교정:
        "눈의 모양과 각도를 교정하여 더욱 밝고 선명한 눈매를 만들어주는 시술이에요.",
      눈지방성형:
        "눈 주변의 지방을 재배치하거나 제거하여 눈밑 주름과 다크서클을 개선하는 시술입니다.",
      하안검성형:
        "눈밑 처짐과 주름을 개선하여 더욱 밝고 젊은 눈매를 만들어주는 시술이에요.",
      상안검성형:
        "눈꺼풀 처짐을 개선하고 눈을 더 크고 선명하게 보이게 해주는 시술입니다.",
      코재수술:
        "이전 코성형 결과를 개선하거나 보완하는 재수술로, 더욱 자연스럽고 만족스러운 코 모양을 만들어줍니다.",
      "V라인 교정":
        "턱선을 날카롭고 V자 형태로 만들어주는 시술로, 얼굴 윤곽을 더욱 세련되게 만들어요.",
      광대교정:
        "돌출된 광대뼈를 줄이거나 조절하여 얼굴 윤곽을 부드럽고 자연스럽게 만드는 시술입니다.",
      근육묶기:
        "턱 근육을 묶어 사각턱을 완화하고 얼굴 라인을 더욱 부드럽게 만들어주는 시술이에요.",
      얼굴제모:
        "얼굴의 불필요한 털을 제거하여 더욱 깔끔하고 매끄러운 피부를 만들어주는 시술입니다.",
      바디제모:
        "몸의 불필요한 털을 제거하여 깔끔하고 매끄러운 피부를 만들어주는 시술이에요.",
      바디리프팅:
        "몸의 처진 피부를 당겨올려 탄력 있고 탄탄한 몸매를 만들어주는 시술입니다.",
      리프팅거상:
        "리프팅과 거상을 함께 진행하여 얼굴 전체의 처짐을 개선하고 더욱 젊어 보이게 해주는 시술이에요.",
      가슴모양교정:
        "가슴의 모양과 위치를 개선하여 더욱 아름답고 균형 잡힌 가슴 라인을 만들어주는 시술입니다.",
      가슴재수술:
        "이전 가슴성형 결과를 개선하거나 보완하는 재수술로, 더욱 자연스럽고 만족스러운 결과를 만들어줍니다.",
      여드름: "여드름 치료를 통해 피부와 외모를 개선할 수 있는 시술이에요.",
      트임: "눈의 모양을 개선하고 더욱 선명하고 아름다운 눈매를 만들어주는 시술이에요.",
      얼굴지방이식:
        "자신의 지방을 얼굴에 이식하여 볼륨을 채우고 주름을 개선하여 더욱 젊고 탄력 있는 피부를 만들어주는 시술이에요.",
    };

    // 매핑된 설명이 있으면 사용
    if (descriptions[categoryMid]) {
      return descriptions[categoryMid];
    }

    // 매핑되지 않은 중분류는 동적으로 구체적인 설명 생성
    // 기본 템플릿 대신 중분류명을 분석하여 구체적인 설명 생성
    const mid = categoryMid.toLowerCase();

    // 패턴 매칭으로 구체적인 설명 생성
    if (mid.includes("보톡스") || mid.includes("보톡")) {
      return "근육을 이완시켜 주름을 예방하고 개선하는 효과가 있어요. 이마, 눈가, 미간 등 주름이 생기기 쉬운 부위에 주사하여 자연스러운 표정을 유지할 수 있어요.";
    }
    if (mid.includes("필러")) {
      return "볼륨을 채워주고 윤곽을 개선하여 자연스러운 미모를 연출합니다.";
    }
    if (mid.includes("리프팅")) {
      return "피부 탄력을 개선하고 처진 피부를 리프팅하여 더욱 젊어 보이게 해줍니다.";
    }
    if (mid.includes("제모")) {
      return "불필요한 털을 제거하여 깔끔하고 매끄러운 피부를 만들어주는 시술이에요.";
    }
    if (mid.includes("성형") || mid.includes("수술")) {
      return "외모를 개선하고 더욱 아름다운 모습을 만들어주는 시술입니다.";
    }
    if (mid.includes("교정")) {
      return "얼굴 윤곽이나 모양을 개선하여 더욱 균형 잡힌 외모를 만들어주는 시술이에요.";
    }
    if (mid.includes("주사")) {
      return "주사 형태로 시행되는 시술로, 피부 개선과 외모 향상에 효과적이에요.";
    }
    if (mid.includes("레이저")) {
      return "레이저를 이용해 피부를 개선하고 외모를 향상시키는 시술입니다.";
    }

    // 패턴 매칭 실패 시에도 기본 템플릿 대신 더 구체적인 설명
    return `${categoryMid}을 통해 피부와 외모를 개선할 수 있는 시술이에요.`;
  };

  return (
    <div className="bg-white">
      {/* 필터바는 RankingSection에서 sticky로 렌더링되므로 여기서는 제거 */}
      {/* 컨텐츠 섹션 - 상단 고정 헤더(탭바 + 필터바) 때문에 내용이 가려지지 않도록 padding-top 추가 */}
      <div className="px-4 space-y-6">
        {/* 중분류 선택 시: 소분류별 랭킹 표시 */}
        {selectedMidCategory !== null ? (
          smallCategoryRankings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">
                "{selectedMidCategory}" 카테고리의 소분류 데이터가 없습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    #{selectedMidCategory}
                  </h3>
                  <p className="text-sm text-gray-600">
                    총 {smallCategoryRankings.length}개의 소분류
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMidCategory(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  전체 보기
                </button>
              </div>

              {smallCategoryRankings
                .slice(0, visibleCategoriesCount)
                .map((ranking, index) => {
                  const rank = index + 1;
                  const isTenthItem = index === 9; // 10위 (0-based index 9)
                  const scrollState = scrollPositions[
                    ranking.category_small_key
                  ] || {
                    left: 0,
                    canScrollLeft: false,
                    canScrollRight: true,
                  };

                  const handleScrollLeft = () => {
                    const element =
                      scrollRefs.current[ranking.category_small_key];
                    if (element) {
                      element.scrollBy({ left: -300, behavior: "smooth" });
                    }
                  };

                  const handleScrollRight = () => {
                    if (!isLoggedIn) {
                      const key = ranking.category_small_key;
                      const currentCount = scrollButtonClickCount[key] || 0;
                      const newCount = currentCount + 1;
                      setScrollButtonClickCount((prev) => ({
                        ...prev,
                        [key]: newCount,
                      }));

                      if (newCount >= 2) {
                        setIsInfoModalOpen(true);
                        // 카운트 리셋
                        setScrollButtonClickCount((prev) => ({
                          ...prev,
                          [key]: 0,
                        }));
                      } else {
                        // 스크롤은 정상적으로 실행
                        const element =
                          scrollRefs.current[ranking.category_small_key];
                        if (element) {
                          element.scrollBy({ left: 300, behavior: "smooth" });
                        }
                      }
                    } else {
                      const element =
                        scrollRefs.current[ranking.category_small_key];
                      if (element) {
                        element.scrollBy({ left: 300, behavior: "smooth" });
                      }
                    }
                  };

                  return (
                    <div
                      key={`${ranking.category_small_key}-${ranking.category_rank}-${index}`}
                    >
                      <div className="space-y-4">
                        {/* 소분류 헤더 with 순위 */}
                        <div className="flex items-start gap-4">
                          <span className="text-primary-main text-4xl font-bold leading-none">
                            {rank}
                          </span>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                              {ranking.category_small_key}
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {ranking.average_rating &&
                                  ranking.average_rating > 0
                                    ? ranking.average_rating.toFixed(1)
                                    : "-"}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                리뷰{" "}
                                {(ranking.total_reviews || 0).toLocaleString()}
                                개
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 카드 스크롤 컨테이너 */}
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
                              scrollRefs.current[ranking.category_small_key] =
                                el;
                            }}
                            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3"
                            onScroll={() =>
                              handleScroll(ranking.category_small_key)
                            }
                          >
                            {shuffleByThumbnail(ranking.treatments || []).map(
                              (treatment) => {
                                const treatmentId = treatment.treatment_id || 0;
                                const isFavorited = favorites.has(treatmentId);
                                const thumbnailUrl = getThumbnailUrl(treatment);
                                const price =
                                  treatment.selling_price &&
                                  treatment.selling_price > 0
                                    ? currency === "KRW"
                                      ? `${Math.round(
                                          treatment.selling_price / 10000
                                        )}만원`
                                      : formatPrice(
                                          treatment.selling_price,
                                          currency,
                                          t
                                        )
                                    : t("common.priceInquiry");

                                return (
                                  <div
                                    key={treatmentId}
                                    className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                                    onClick={() => {
                                      router.push(
                                        `/explore/treatment/${treatmentId}`
                                      );
                                    }}
                                  >
                                    {/* 이미지 - 2:1 비율 */}
                                    <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                                      <img
                                        src={thumbnailUrl}
                                        alt={
                                          treatment.treatment_name ||
                                          "시술 이미지"
                                        }
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target =
                                            e.target as HTMLImageElement;
                                          if (
                                            target.dataset.fallback === "true"
                                          ) {
                                            target.style.display = "none";
                                            return;
                                          }
                                          target.src =
                                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="24"%3E🏥%3C/text%3E%3C/svg%3E';
                                          target.dataset.fallback = "true";
                                        }}
                                      />
                                      {/* 할인율 배지 */}
                                      {treatment.dis_rate &&
                                        treatment.dis_rate > 0 && (
                                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                                            {treatment.dis_rate}%
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
                                        {treatment.rating &&
                                        treatment.rating > 0 ? (
                                          <div className="flex items-center gap-1 h-[14px]">
                                            <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                                            <span className="text-xs font-semibold text-gray-700">
                                              {treatment.rating.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              ({treatment.review_count || 0})
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
                                            handleAddToScheduleClick(
                                              treatment,
                                              e
                                            );
                                          }}
                                          className="p-1.5 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-colors flex-shrink-0 relative z-10"
                                        >
                                          <FiCalendar className="text-base text-primary-main" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
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
                    </div>
                  );
                })}

              {/* 더보기 버튼 - 소분류 카테고리 */}
              {smallCategoryRankings.length > visibleCategoriesCount && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        setIsInfoModalOpen(true);
                      } else {
                        setVisibleCategoriesCount((prev) => prev + 5);
                      }
                    }}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    더보기 (
                    {smallCategoryRankings.length - visibleCategoriesCount}개
                    더)
                  </button>
                </div>
              )}
            </>
          )
        ) : /* 중분류 미선택 시: 중분류별 랭킹 표시 */ midCategoryRankings.length ===
          0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">
              {selectedCategory === null
                ? "랭킹 데이터가 없습니다."
                : `"${
                    MAIN_CATEGORIES.find((c) => c.id === selectedCategory)
                      ?.name || selectedCategory
                  }" 카테고리의 랭킹 데이터가 없습니다.`}
            </p>
            <p className="text-sm text-gray-500">
              다른 카테고리를 선택해보세요.
            </p>
          </div>
        ) : (
          <>
            {midCategoryRankings
              .slice(0, visibleCategoriesCount)
              .map((ranking, index) => {
                const rank = index + 1;
                const scrollState = scrollPositions[ranking.category_mid] || {
                  left: 0,
                  canScrollLeft: false,
                  canScrollRight: true,
                };

                const handleScrollLeft = () => {
                  const element = scrollRefs.current[ranking.category_mid];
                  if (element) {
                    element.scrollBy({ left: -300, behavior: "smooth" });
                  }
                };

                const handleScrollRight = () => {
                  if (!isLoggedIn) {
                    const key = ranking.category_mid;
                    const currentCount = scrollButtonClickCount[key] || 0;
                    const newCount = currentCount + 1;
                    setScrollButtonClickCount((prev) => ({
                      ...prev,
                      [key]: newCount,
                    }));

                    if (newCount >= 2) {
                      setIsInfoModalOpen(true);
                      // 카운트 리셋
                      setScrollButtonClickCount((prev) => ({
                        ...prev,
                        [key]: 0,
                      }));
                    } else {
                      // 스크롤은 정상적으로 실행
                      const element = scrollRefs.current[ranking.category_mid];
                      if (element) {
                        element.scrollBy({ left: 300, behavior: "smooth" });
                      }
                    }
                  } else {
                    const element = scrollRefs.current[ranking.category_mid];
                    if (element) {
                      element.scrollBy({ left: 300, behavior: "smooth" });
                    }
                  }
                };

                return (
                  <div
                    key={`${ranking.category_mid}-${ranking.category_rank}-${index}`}
                    className="space-y-4"
                  >
                    {/* 중분류 헤더 with 순위 */}
                    <div className="flex items-start gap-4">
                      <span className="text-primary-main text-4xl font-bold leading-none">
                        {rank}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {ranking.category_mid}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {getCategoryDescription(ranking.category_mid)}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                            <span className="text-sm font-semibold text-gray-900">
                              {ranking.average_rating &&
                              ranking.average_rating > 0
                                ? ranking.average_rating.toFixed(1)
                                : "-"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            리뷰 {(ranking.total_reviews || 0).toLocaleString()}
                            개
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 카드 스크롤 컨테이너 */}
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
                          scrollRefs.current[ranking.category_mid] = el;
                        }}
                        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-3"
                        onScroll={() => handleScroll(ranking.category_mid)}
                      >
                        {shuffleByThumbnail(ranking.treatments || []).map(
                          (treatment) => {
                            const treatmentId = treatment.treatment_id || 0;
                            const isFavorited = favorites.has(treatmentId);
                            const thumbnailUrl = getThumbnailUrl(treatment);
                            const price =
                              treatment.selling_price &&
                              treatment.selling_price > 0
                                ? currency === "KRW"
                                  ? `${Math.round(
                                      treatment.selling_price / 10000
                                    )}만원`
                                  : formatPrice(
                                      treatment.selling_price,
                                      currency,
                                      t
                                    )
                                : t("common.priceInquiry");

                            return (
                              <div
                                key={treatmentId}
                                className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                                onClick={() => {
                                  router.push(
                                    `/explore/treatment/${treatmentId}`
                                  );
                                }}
                              >
                                {/* 이미지 - 2:1 비율 */}
                                <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                                  <img
                                    src={thumbnailUrl}
                                    alt={
                                      treatment.treatment_name || "시술 이미지"
                                    }
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
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
                                  {treatment.dis_rate &&
                                    treatment.dis_rate > 0 && (
                                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                                        {treatment.dis_rate}%
                                      </div>
                                    )}
                                  {/* 통역 가능 뱃지 (예시) */}
                                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold z-10">
                                    통역
                                  </div>
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
                                    {treatment.rating &&
                                    treatment.rating > 0 ? (
                                      <div className="flex items-center gap-1 h-[14px]">
                                        <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                                        <span className="text-xs font-semibold text-gray-700">
                                          {treatment.rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          ({treatment.review_count || 0})
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
                                        handleAddToScheduleClick(treatment, e);
                                      }}
                                      className="p-1.5 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-colors flex-shrink-0 relative z-10"
                                    >
                                      <FiCalendar className="text-base text-primary-main" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
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

            {/* 더보기 버튼 - 중분류 카테고리 */}
            {midCategoryRankings.length > visibleCategoriesCount && (
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      setIsInfoModalOpen(true);
                    } else {
                      setVisibleCategoriesCount((prev) => prev + 5);
                    }
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  더보기
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 일정 추가 모달 */}
      {selectedTreatmentForSchedule && (
        <AddToScheduleModal
          isOpen={isAddToScheduleModalOpen}
          onClose={() => {
            setIsAddToScheduleModalOpen(false);
            setSelectedTreatmentForSchedule(null);
          }}
          onDateSelect={handleScheduleDateSelect}
          treatmentName={
            selectedTreatmentForSchedule.treatment_name ||
            t("common.noTreatmentName")
          }
          categoryMid={selectedTreatmentForSchedule.category_mid || null}
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

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
          setIsLoggedIn(true);
          // 로그인 성공 후 더보기 기능 자동 실행
          setVisibleCategoriesCount((prev) => prev + 5);
        }}
      />
    </div>
  );
}

// 필터바 JSX를 외부에서 사용할 수 있도록 export
export function CategoryFilterBar({
  selectedCategory,
  selectedMidCategory,
  midCategoriesList,
  onCategoryChange,
  onMidCategoryChange,
  mainCategories = MAIN_CATEGORIES,
}: {
  selectedCategory: string | null;
  selectedMidCategory: string | null;
  midCategoriesList: string[];
  onCategoryChange: (categoryId: string | null) => void;
  onMidCategoryChange: (midCategory: string | null) => void;
  mainCategories?: Array<{ id: string | null; name: string; nameKey?: string }>;
}) {
  return (
    <div className="bg-white">
      <div className="px-4 pt-2 pb-3">
        {/* "ALL 전체" 버튼 - 위에 작은 글씨로 */}
        <div className="mb-2">
          <button
            onClick={() => {
              onCategoryChange(null);
              onMidCategoryChange(null);
            }}
            className={`text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "text-primary-main font-bold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            전체
          </button>
        </div>

        {/* 카테고리 버튼들 - 텍스트만 5개씩 2줄 그리드 */}
        <div className="grid grid-cols-5 gap-x-4 gap-y-3">
          {mainCategories
            .filter((cat) => cat.id !== null)
            .map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id || "all"}
                  onClick={() => {
                    onCategoryChange(category.id);
                    onMidCategoryChange(null);
                  }}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? "text-primary-main font-bold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
        </div>
      </div>
      {/* 중분류 해시태그 필터 */}
      {midCategoriesList.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => onMidCategoryChange(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedMidCategory === null
                  ? "bg-gray-900 text-white border border-gray-900"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
            >
              전체
            </button>
            {midCategoriesList.map((midCategory) => {
              const isSelected = selectedMidCategory === midCategory;
              return (
                <button
                  key={midCategory}
                  onClick={() => {
                    onMidCategoryChange(midCategory);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-gray-900 text-white border border-gray-900"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  #{midCategory}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
