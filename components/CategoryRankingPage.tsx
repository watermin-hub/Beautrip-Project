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
  loadTreatmentsPaginated,
  getThumbnailUrl,
  Treatment,
  CATEGORY_MAPPING,
  getRecoveryInfoByCategoryMid,
  parseRecoveryPeriod,
  parseProcedureTime,
} from "@/lib/api/beautripApi";
import AddToScheduleModal from "./AddToScheduleModal";
import { useRankingData } from "@/contexts/RankingDataContext";

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

export default function CategoryRankingPage() {
  const router = useRouter();

  // ✅ 캐시된 전체 데이터 사용
  const { allTreatments, loading: contextLoading } = useRankingData();

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = 전체
  const [selectedMidCategory, setSelectedMidCategory] = useState<string | null>(
    null
  ); // 선택된 중분류
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5); // 초기 5개 표시
  const [visibleTreatmentsCount, setVisibleTreatmentsCount] = useState(20); // 중분류 선택 시 표시할 시술 개수
  const [isAddToScheduleModalOpen, setIsAddToScheduleModalOpen] =
    useState(false);
  const [selectedTreatmentForSchedule, setSelectedTreatmentForSchedule] =
    useState<Treatment | null>(null);

  // ✅ 캐시된 데이터에서 필터링 (API 호출 없이)
  const treatments = useMemo(() => {
    if (contextLoading || allTreatments.length === 0) {
      return [];
    }

    let filtered = allTreatments;

    // 대분류 필터링
    if (selectedCategory !== null) {
      filtered = filtered.filter((t) => {
        const categoryLarge = t.category_large || "";
        return (
          categoryLarge === selectedCategory ||
          categoryLarge.includes(selectedCategory) ||
          selectedCategory.includes(categoryLarge)
        );
      });
    }

    // 중분류 필터링
    if (selectedMidCategory !== null) {
      filtered = filtered.filter((t) => {
        const categoryMid = t.category_mid || "";
        return (
          categoryMid === selectedMidCategory ||
          categoryMid.includes(selectedMidCategory) ||
          selectedMidCategory.includes(categoryMid)
        );
      });
    }

    console.log(
      `[CategoryRankingPage] 대분류 "${selectedCategory || "전체"}"${
        selectedMidCategory ? `, 중분류 "${selectedMidCategory}"` : ""
      } 필터링 완료: ${filtered.length}개 (전체 ${allTreatments.length}개 중)`
    );

    return filtered;
  }, [allTreatments, selectedCategory, selectedMidCategory, contextLoading]);

  // 로딩 상태 동기화
  useEffect(() => {
    setLoading(contextLoading);
  }, [contextLoading]);

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const procedureFavorites = savedFavorites
      .filter((f: any) => f.type === "procedure")
      .map((f: any) => f.id);
    setFavorites(new Set(procedureFavorites));
  }, []);

  // 선택된 대분류에 속한 중분류 목록 추출
  // API에서 이미 대분류로 필터링된 데이터를 받아오므로,
  // 여기서는 단순히 중분류만 추출하면 됩니다.
  const midCategories = useMemo(() => {
    const midCategorySet = new Set<string>();

    treatments.forEach((t) => {
      if (t.category_mid) {
        midCategorySet.add(t.category_mid);
      }
    });

    // 인코딩이 깨져서 "�" 문자가 포함된 중분류는 필터링하여 표시하지 않음
    const sorted = Array.from(midCategorySet)
      .filter((name) => !name.includes("�"))
      .sort();

    console.log(
      `[CategoryRankingPage] 대분류 "${
        selectedCategory || "전체"
      }"의 중분류 개수(필터 후): ${sorted.length}개`,
      sorted.slice(0, 10) // 처음 10개만 로그
    );
    return sorted;
  }, [treatments, selectedCategory]);

  // =========================
  // Ranking Config & Utilities
  // =========================
  const DEDUPE_LIMIT_PER_NAME = 2; // 같은 시술명 최대 노출 개수(추천: 2)

  // 0~1 정규화
  const normalize01 = (v: number, min: number, max: number) => {
    if (max <= min) return 0;
    return (v - min) / (max - min);
  };

  // 같은 key(시술명) 도배 방지: 리스트에서 key별 최대 limit개만 남김 (원래 순서 유지)
  const limitByKey = <T,>(
    items: T[],
    getKey: (item: T) => string,
    limit: number
  ) => {
    const counts = new Map<string, number>();
    const result: T[] = [];

    for (const item of items) {
      const key = (getKey(item) || "").trim();
      const c = counts.get(key) || 0;

      if (!key) {
        // key가 없는 데이터는 그대로 포함(혹은 제외 정책도 가능)
        result.push(item);
        continue;
      }

      if (c < limit) {
        result.push(item);
        counts.set(key, c + 1);
      }
    }
    return result;
  };

  // 데이터 전체 평균 평점(베이지안 보정에서 사용하는 기준)
  const globalAvgRating = useMemo(() => {
    const arr = treatments
      .map((t) => t.rating)
      .filter((r): r is number => typeof r === "number" && r > 0);
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }, [treatments]);

  // 베이지안 평점: 리뷰 적은 고평점 과대평가 방지
  const bayesianRating = (R: number, v: number, C: number, m = 20) => {
    const vv = Math.max(0, v);
    const RR = Math.max(0, R);
    return (vv / (vv + m)) * RR + (m / (vv + m)) * C;
  };

  // 중분류 선택 시 해당 중분류의 소분류별 랭킹 생성
  const smallCategoryRankings = useMemo(() => {
    if (selectedMidCategory === null) {
      return [];
    }

    // API에서 이미 중분류로 필터링된 데이터를 받아오므로,
    // 여기서는 소분류별로 그룹화만 하면 됩니다.
    let filtered = treatments;

    // 추가 필터링 (혹시 모를 경우를 대비)
    if (selectedCategory !== null) {
      filtered = filtered.filter((t) => {
        const categoryLarge = t.category_large || "";
        return (
          categoryLarge === selectedCategory ||
          categoryLarge.includes(selectedCategory) ||
          selectedCategory.includes(categoryLarge)
        );
      });
    }

    // 중분류 필터링
    filtered = filtered.filter((t) => {
      const categoryMid = t.category_mid || "";
      return (
        categoryMid === selectedMidCategory ||
        categoryMid.includes(selectedMidCategory) ||
        selectedMidCategory.includes(categoryMid)
      );
    });

    // 소분류별로 그룹화
    const smallCategoryMap = new Map<string, Treatment[]>();
    filtered.forEach((treatment) => {
      const smallCategory =
        treatment.category_small || treatment.treatment_name || "기타";
      if (!smallCategoryMap.has(smallCategory)) {
        smallCategoryMap.set(smallCategory, []);
      }
      smallCategoryMap.get(smallCategory)!.push(treatment);
    });

    // 각 소분류별로 랭킹 생성
    const rankings: Array<{
      categorySmall: string;
      treatments: Treatment[];
      averageRating: number;
      totalReviews: number;
    }> = [];

    smallCategoryMap.forEach((treatmentList, categorySmall) => {
      // ✅ 개선된 정렬: 베이지안 보정 평점 + 리뷰 수(로그)
      const sorted = [...treatmentList].sort((a, b) => {
        const va = a.review_count || 0;
        const vb = b.review_count || 0;

        // 카드 내부도 "리뷰 적은 고평점" 방지: 베이지안 보정 평점 사용
        const adjA = bayesianRating(a.rating || 0, va, globalAvgRating, 20);
        const adjB = bayesianRating(b.rating || 0, vb, globalAvgRating, 20);

        const scoreA = adjA * 0.6 + Math.log10(va + 1) * 0.4;
        const scoreB = adjB * 0.6 + Math.log10(vb + 1) * 0.4;

        return scoreB - scoreA;
      });

      // ✅ 같은 treatment_name이 연달아 나오지 않도록 필터링
      const dedupedByTreatmentName: Treatment[] = [];
      let lastTreatmentName = "";

      for (const treatment of sorted) {
        const currentTreatmentName = treatment.treatment_name || "";

        // 같은 treatment_name이면 스킵 (연속으로 나오지 않도록)
        if (
          currentTreatmentName === lastTreatmentName &&
          currentTreatmentName !== ""
        ) {
          continue;
        }

        dedupedByTreatmentName.push(treatment);
        lastTreatmentName = currentTreatmentName;
      }

      // ✅ 캐러셀에서도 같은 시술명 도배 방지 (추가 안전장치)
      const dedupedSorted = limitByKey(
        dedupedByTreatmentName,
        (t) => t.treatment_name || "",
        DEDUPE_LIMIT_PER_NAME
      );

      const averageRating =
        dedupedSorted.reduce((sum, t) => sum + (t.rating || 0), 0) /
          dedupedSorted.length || 0;
      const totalReviews = dedupedSorted.reduce(
        (sum, t) => sum + (t.review_count || 0),
        0
      );

      rankings.push({
        categorySmall,
        treatments: dedupedSorted,
        averageRating,
        totalReviews,
      });
    });

    // ✅ 개선된 소분류 랭킹 정렬: 베이지안 보정 평점 + 로그 스케일 정규화
    // 리뷰 수와 시술 개수는 로그 스케일 + 정규화로 안정적으로 반영
    const reviewLogs = rankings.map((r) =>
      Math.log10((r.totalReviews || 0) + 1)
    );
    const countLogs = rankings.map((r) =>
      Math.log10((r.treatments.length || 0) + 1)
    );

    const rMin = Math.min(...reviewLogs, 0);
    const rMax = Math.max(...reviewLogs, 1);
    const cMin = Math.min(...countLogs, 0);
    const cMax = Math.max(...countLogs, 1);

    rankings.sort((a, b) => {
      const treatmentCountA = a.treatments.length;
      const treatmentCountB = b.treatments.length;
      const reviewCountA = a.totalReviews || 0;
      const reviewCountB = b.totalReviews || 0;
      const avgRatingA = a.averageRating || 0;
      const avgRatingB = b.averageRating || 0;

      // 1) 베이지안 보정 평균 평점 (리뷰 적은 소분류 과대평가 방지)
      const adjRatingA = bayesianRating(
        avgRatingA,
        reviewCountA,
        globalAvgRating,
        20
      );
      const adjRatingB = bayesianRating(
        avgRatingB,
        reviewCountB,
        globalAvgRating,
        20
      );

      // ✅ 리뷰가 너무 적은 경우(5개 미만) 강한 페널티 부여
      const reviewPenaltyA =
        reviewCountA < 5 ? Math.pow(reviewCountA / 5, 2) : 1;
      const reviewPenaltyB =
        reviewCountB < 5 ? Math.pow(reviewCountB / 5, 2) : 1;

      // ✅ 시술 개수가 너무 적은 경우(3개 미만) 강한 페널티 부여
      const countPenaltyA =
        treatmentCountA < 3 ? Math.pow(treatmentCountA / 3, 1.5) : 1;
      const countPenaltyB =
        treatmentCountB < 3 ? Math.pow(treatmentCountB / 3, 1.5) : 1;

      // 2) 리뷰 수(로그+정규화) - 페널티 적용
      const revScoreA =
        normalize01(Math.log10(reviewCountA + 1), rMin, rMax) * reviewPenaltyA;
      const revScoreB =
        normalize01(Math.log10(reviewCountB + 1), rMin, rMax) * reviewPenaltyB;

      // 3) 시술 개수(로그+정규화) - 보편성/신뢰도 지표 + 페널티 적용
      const countLogA = Math.log10(treatmentCountA + 1);
      const countLogB = Math.log10(treatmentCountB + 1);
      const countScoreA =
        Math.pow(normalize01(countLogA, cMin, cMax), 0.7) * countPenaltyA;
      const countScoreB =
        Math.pow(normalize01(countLogB, cMin, cMax), 0.7) * countPenaltyB;

      // 종합 점수 계산 (가중치: 보정 평점 40%, 리뷰 수 30%, 시술 개수 30%)
      // 리뷰 1-2개, 시술 1-2개인 항목은 페널티로 인해 하위로 밀려남
      const scoreA = adjRatingA * 0.4 + revScoreA * 0.3 + countScoreA * 0.3;
      const scoreB = adjRatingB * 0.4 + revScoreB * 0.3 + countScoreB * 0.3;

      return scoreB - scoreA;
    });

    return rankings;
  }, [treatments, selectedCategory, selectedMidCategory]);

  // 중분류별로 그룹화된 랭킹 생성 (중분류 미선택 시)
  const midCategoryRankings = useMemo(() => {
    if (selectedMidCategory !== null) {
      return []; // 중분류 선택 시 중분류 랭킹은 표시하지 않음
    }

    // API에서 이미 대분류로 필터링된 데이터를 받아오므로,
    // 여기서는 추가 필터링이 필요 없습니다.
    // 하지만 혹시 모를 경우를 대비해 정확한 매칭만 확인
    let filtered = treatments;
    if (selectedCategory !== null) {
      filtered = treatments.filter((t) => {
        const categoryLarge = t.category_large || "";
        // 정확한 매칭 또는 포함 관계 확인
        return (
          categoryLarge === selectedCategory ||
          categoryLarge.includes(selectedCategory) ||
          selectedCategory.includes(categoryLarge)
        );
      });
    }

    // 중분류별로 그룹화
    const midCategoryMap = new Map<string, Treatment[]>();
    filtered.forEach((treatment) => {
      const midCategory = treatment.category_mid || "기타";
      if (!midCategoryMap.has(midCategory)) {
        midCategoryMap.set(midCategory, []);
      }
      midCategoryMap.get(midCategory)!.push(treatment);
    });

    // 각 중분류별로 시술들을 평점/리뷰순으로 정렬하고 랭킹 생성
    const rankings: Array<{
      categoryMid: string;
      treatments: Treatment[];
      averageRating: number;
      totalReviews: number;
    }> = [];

    midCategoryMap.forEach((treatmentList, midCategory) => {
      // ✅ 개선된 정렬: 베이지안 보정 평점 + 리뷰 수(로그)
      const sorted = [...treatmentList].sort((a, b) => {
        const va = a.review_count || 0;
        const vb = b.review_count || 0;

        // 카드 내부도 "리뷰 적은 고평점" 방지: 베이지안 보정 평점 사용
        const adjA = bayesianRating(a.rating || 0, va, globalAvgRating, 20);
        const adjB = bayesianRating(b.rating || 0, vb, globalAvgRating, 20);

        const scoreA = adjA * 0.6 + Math.log10(va + 1) * 0.4;
        const scoreB = adjB * 0.6 + Math.log10(vb + 1) * 0.4;

        return scoreB - scoreA;
      });

      // ✅ 같은 treatment_name이 연달아 나오지 않도록 필터링
      const dedupedSorted: Treatment[] = [];
      let lastTreatmentName = "";

      for (const treatment of sorted) {
        const currentTreatmentName = treatment.treatment_name || "";

        // 같은 treatment_name이면 스킵 (연속으로 나오지 않도록)
        if (
          currentTreatmentName === lastTreatmentName &&
          currentTreatmentName !== ""
        ) {
          continue;
        }

        dedupedSorted.push(treatment);
        lastTreatmentName = currentTreatmentName;
      }

      // 평균 평점과 총 리뷰 수는 전체 시술 기준으로 계산
      const averageRating =
        dedupedSorted.reduce((sum, t) => sum + (t.rating || 0), 0) /
          dedupedSorted.length || 0;
      const totalReviews = dedupedSorted.reduce(
        (sum, t) => sum + (t.review_count || 0),
        0
      );

      rankings.push({
        categoryMid: midCategory,
        treatments: dedupedSorted, // 중복 제거된 시술 목록
        averageRating,
        totalReviews,
      });
    });

    // 디버깅: 중분류별 시술 개수 확인
    if (selectedCategory) {
      console.log(
        `🔍 [중분류 랭킹] 대분류 "${selectedCategory}" - 중분류별 시술 개수:`,
        rankings.slice(0, 10).map((r) => ({
          중분류: r.categoryMid,
          시술개수: r.treatments.length,
          리뷰수: r.totalReviews,
        }))
      );
    }

    // 디버깅: 눈성형 관련 중분류 확인
    if (!selectedCategory || selectedCategory === null) {
      const eyeRelated = rankings.filter((r) => {
        const mid = (r.categoryMid || "").toLowerCase();
        return (
          mid.includes("눈") ||
          mid.includes("eye") ||
          mid.includes("안검") ||
          mid.includes("쌍수")
        );
      });
      if (eyeRelated.length > 0) {
        console.log(
          `🔍 [중분류 랭킹] 눈성형 관련 중분류 ${eyeRelated.length}개 발견:`,
          eyeRelated.slice(0, 5).map((r) => ({
            중분류: r.categoryMid,
            시술개수: r.treatments.length,
            리뷰수: r.totalReviews,
            평균평점: r.averageRating.toFixed(2),
          }))
        );
      }
    }

    // ✅ 최소 기준 필터링: 리뷰 0개 또는 시술 1개인 항목은 랭킹에서 제외
    const filteredRankings = rankings.filter((r) => {
      const reviewCount = r.totalReviews || 0;
      const treatmentCount = r.treatments.length || 0;

      // 리뷰가 0개이거나 시술이 1개 이하인 경우 제외
      if (reviewCount === 0 || treatmentCount <= 1) {
        console.log(
          `🚫 [필터링 제외] ${r.categoryMid}: 리뷰 ${reviewCount}개, 시술 ${treatmentCount}개`
        );
        return false;
      }

      return true;
    });

    console.log(
      `🔍 [랭킹 필터링] 원본 ${rankings.length}개 → 필터링 후 ${filteredRankings.length}개 (리뷰 0개 또는 시술 1개 제외)`
    );

    // 필터링 후에도 리뷰 0개나 시술 1개인 항목이 있는지 재확인
    const invalidItems = filteredRankings.filter(
      (r) => (r.totalReviews || 0) === 0 || (r.treatments.length || 0) <= 1
    );
    if (invalidItems.length > 0) {
      console.warn(
        `⚠️ [필터링 오류] 여전히 ${invalidItems.length}개 항목이 필터링되지 않음:`,
        invalidItems.map((r) => ({
          중분류: r.categoryMid,
          리뷰수: r.totalReviews,
          시술개수: r.treatments.length,
        }))
      );
    }

    // ✅ 개선된 중분류 랭킹 정렬: 베이지안 보정 평점 + 로그 스케일 정규화
    // 리뷰 수와 시술 개수는 로그 스케일 + 정규화로 안정적으로 반영
    const reviewLogs = filteredRankings.map((r) =>
      Math.log10((r.totalReviews || 0) + 1)
    );
    const countLogs = filteredRankings.map((r) =>
      Math.log10((r.treatments.length || 0) + 1)
    );

    const rMin = Math.min(...reviewLogs, 0);
    const rMax = Math.max(...reviewLogs, 1);
    const cMin = Math.min(...countLogs, 0);
    const cMax = Math.max(...countLogs, 1);

    filteredRankings.sort((a, b) => {
      const treatmentCountA = a.treatments.length;
      const treatmentCountB = b.treatments.length;
      const reviewCountA = a.totalReviews || 0;
      const reviewCountB = b.totalReviews || 0;
      const avgRatingA = a.averageRating || 0;
      const avgRatingB = b.averageRating || 0;

      // 1) 베이지안 보정 평균 평점 (리뷰 적은 중분류 과대평가 방지)
      const adjRatingA = bayesianRating(
        avgRatingA,
        reviewCountA,
        globalAvgRating,
        20
      );
      const adjRatingB = bayesianRating(
        avgRatingB,
        reviewCountB,
        globalAvgRating,
        20
      );

      // ✅ 리뷰가 너무 적은 경우(5개 미만) 강한 페널티 부여
      const reviewPenaltyA =
        reviewCountA < 5 ? Math.pow(reviewCountA / 5, 2) : 1;
      const reviewPenaltyB =
        reviewCountB < 5 ? Math.pow(reviewCountB / 5, 2) : 1;

      // ✅ 시술 개수가 너무 적은 경우(3개 미만) 강한 페널티 부여
      const countPenaltyA =
        treatmentCountA < 3 ? Math.pow(treatmentCountA / 3, 1.5) : 1;
      const countPenaltyB =
        treatmentCountB < 3 ? Math.pow(treatmentCountB / 3, 1.5) : 1;

      // 2) 리뷰 수(로그+정규화) - 페널티 적용
      const revScoreA =
        normalize01(Math.log10(reviewCountA + 1), rMin, rMax) * reviewPenaltyA;
      const revScoreB =
        normalize01(Math.log10(reviewCountB + 1), rMin, rMax) * reviewPenaltyB;

      // 3) 시술 개수(로그+정규화) - 보편성/신뢰도 지표 + 페널티 적용
      const countLogA = Math.log10(treatmentCountA + 1);
      const countLogB = Math.log10(treatmentCountB + 1);
      const countScoreA =
        Math.pow(normalize01(countLogA, cMin, cMax), 0.7) * countPenaltyA;
      const countScoreB =
        Math.pow(normalize01(countLogB, cMin, cMax), 0.7) * countPenaltyB;

      // 종합 점수 계산 (가중치 조정: 보정 평점 40%, 리뷰 수 30%, 시술 개수 30%)
      // 리뷰 1-2개, 시술 1-2개인 항목은 페널티로 인해 하위로 밀려남
      const scoreA = adjRatingA * 0.4 + revScoreA * 0.3 + countScoreA * 0.3;
      const scoreB = adjRatingB * 0.4 + revScoreB * 0.3 + countScoreB * 0.3;

      return scoreB - scoreA;
    });

    return filteredRankings;
  }, [treatments, selectedCategory, selectedMidCategory]);

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
        handleScroll(ranking.categoryMid);
      }, 200);
      return () => clearTimeout(timer);
    });
  }, [midCategoryRankings]);

  // 스크롤 위치 초기화 (소분류 랭킹)
  useEffect(() => {
    smallCategoryRankings.forEach((ranking) => {
      const timer = setTimeout(() => {
        handleScroll(ranking.categorySmall);
      }, 200);
      return () => clearTimeout(timer);
    });
  }, [smallCategoryRankings]);

  const handleFavoriteClick = (treatment: Treatment, e: React.MouseEvent) => {
    e.stopPropagation();
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
        const newSet = new Set(prev);
        newSet.add(treatment.treatment_id!);
        return newSet;
      });
    }
    window.dispatchEvent(new Event("favoritesUpdated"));
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
      alert("일정이 꽉 찼습니다! 3개 이하로 정리 후 다시 시도해 주세요.");
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

    // 일정 추가
    const newSchedule = {
      id: Date.now(),
      treatmentId: selectedTreatmentForSchedule.treatment_id,
      procedureDate: date,
      procedureName:
        selectedTreatmentForSchedule.treatment_name || "시술명 없음",
      hospital: selectedTreatmentForSchedule.hospital_name || "병원명 없음",
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
    localStorage.setItem("schedules", JSON.stringify(schedules));
    window.dispatchEvent(new Event("scheduleAdded"));

    alert(`${date}에 일정이 추가되었습니다!`);
    setIsAddToScheduleModalOpen(false);
    setSelectedTreatmentForSchedule(null);
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
      {/* Category Filter Tags - 텍스트만 2줄 그리드 */}
      <div className="sticky top-[156px] z-20 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          {/* "ALL 전체" 버튼 - 위에 작은 글씨로 */}
          <div className="mb-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedMidCategory(null);
              }}
              className={`text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? "text-primary-main font-bold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              전체
            </button>
          </div>

          {/* 카테고리 버튼들 - 텍스트만 5개씩 2줄 그리드 */}
          <div className="grid grid-cols-5 gap-2">
            {MAIN_CATEGORIES.filter((cat) => cat.id !== null).map(
              (category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id || "all"}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedMidCategory(null); // 카테고리 변경 시 중분류 초기화
                    }}
                    className={`text-xs font-medium transition-colors py-1.5 px-2 rounded-lg ${
                      isSelected
                        ? "text-primary-main font-bold bg-primary-main/10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* 중분류 해시태그 필터 */}
        {midCategories.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedMidCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedMidCategory === null
                    ? "bg-gray-900 text-white border border-gray-900"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
              >
                전체
              </button>
              {midCategories.map((midCategory) => {
                const isSelected = selectedMidCategory === midCategory;
                return (
                  <button
                    key={midCategory}
                    onClick={() => {
                      setSelectedMidCategory(midCategory);
                      setVisibleTreatmentsCount(20); // 중분류 선택 시 초기화
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

      {/* 컨텐츠 섹션 */}
      <div className="px-4 py-6 space-y-6">
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
                  const scrollState = scrollPositions[
                    ranking.categorySmall
                  ] || {
                    left: 0,
                    canScrollLeft: false,
                    canScrollRight: true,
                  };

                  const handleScrollLeft = () => {
                    const element = scrollRefs.current[ranking.categorySmall];
                    if (element) {
                      element.scrollBy({ left: -300, behavior: "smooth" });
                    }
                  };

                  const handleScrollRight = () => {
                    const element = scrollRefs.current[ranking.categorySmall];
                    if (element) {
                      element.scrollBy({ left: 300, behavior: "smooth" });
                    }
                  };

                  return (
                    <div key={ranking.categorySmall} className="space-y-4">
                      {/* 소분류 헤더 with 순위 */}
                      <div className="flex items-start gap-4">
                        <span className="text-primary-main text-4xl font-bold leading-none">
                          {rank}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            {ranking.categorySmall}
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                              <span className="text-sm font-semibold text-gray-900">
                                {ranking.averageRating > 0
                                  ? ranking.averageRating.toFixed(1)
                                  : "-"}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              리뷰 {ranking.totalReviews.toLocaleString()}개
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
                            scrollRefs.current[ranking.categorySmall] = el;
                          }}
                          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                          onScroll={() => handleScroll(ranking.categorySmall)}
                        >
                          {ranking.treatments.map((treatment) => {
                            const treatmentId = treatment.treatment_id || 0;
                            const isFavorited = favorites.has(treatmentId);
                            const thumbnailUrl = getThumbnailUrl(treatment);
                            const price = treatment.selling_price
                              ? `${Math.round(
                                  treatment.selling_price / 10000
                                )}만원`
                              : "가격 문의";

                            return (
                              <div
                                key={treatmentId}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-[160px] cursor-pointer flex flex-col"
                                onClick={() => {
                                  router.push(`/treatment/${treatmentId}`);
                                }}
                              >
                                {/* 이미지 - 2:1 비율 */}
                                <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                                  <img
                                    src={thumbnailUrl}
                                    alt={treatment.treatment_name}
                                    className="w-full h-full object-cover"
                                  />
                                  {treatment.dis_rate &&
                                    treatment.dis_rate > 0 && (
                                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {treatment.dis_rate}%
                                      </div>
                                    )}
                                </div>

                                {/* 카드 내용 */}
                                <div className="p-3 flex flex-col h-full">
                                  <div>
                                    <h5 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
                                      {treatment.treatment_name}
                                    </h5>
                                    {/* category_small - treatment_name과 별점 사이에 배치 */}
                                    {treatment.category_small && (
                                      <p className="text-sm font-medium text-gray-700 line-clamp-1 mb-1">
                                        {treatment.category_small}
                                      </p>
                                    )}
                                    {/* 별점/리뷰 */}
                                    <div className="flex items-center gap-1 text-[11px] text-gray-600 mb-1">
                                      <FiStar className="text-yellow-400 fill-yellow-400 text-[12px]" />
                                      <span className="font-semibold">
                                        {treatment.rating
                                          ? treatment.rating.toFixed(1)
                                          : "-"}
                                      </span>
                                      <span>
                                        ({treatment.review_count || 0}개 리뷰)
                                      </span>
                                    </div>
                                  </div>

                                  {/* 가격/병원명과 버튼 - 하단 고정 */}
                                  <div className="flex items-end justify-between mt-auto">
                                    <div className="flex-1">
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
                                      <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                                        {treatment.hospital_name ||
                                          "병원명 없음"}{" "}
                                        · 서울
                                      </p>
                                    </div>

                                    {/* 하트/달력 버튼 - 세로 배치 */}
                                    <div className="flex flex-col gap-1.5">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFavoriteClick(treatment, e);
                                        }}
                                        className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                                      >
                                        <FiHeart
                                          className={`text-base ${
                                            isFavorited
                                              ? "text-red-500 fill-red-500"
                                              : "text-gray-600"
                                          }`}
                                        />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToScheduleClick(
                                            treatment,
                                            e
                                          );
                                        }}
                                        className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
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

              {/* 더보기 버튼 - 소분류 카테고리 */}
              {smallCategoryRankings.length > visibleCategoriesCount && (
                <div className="text-center pt-4">
                  <button
                    onClick={() =>
                      setVisibleCategoriesCount((prev) => prev + 5)
                    }
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
                const scrollState = scrollPositions[ranking.categoryMid] || {
                  left: 0,
                  canScrollLeft: false,
                  canScrollRight: true,
                };

                const handleScrollLeft = () => {
                  const element = scrollRefs.current[ranking.categoryMid];
                  if (element) {
                    element.scrollBy({ left: -300, behavior: "smooth" });
                  }
                };

                const handleScrollRight = () => {
                  const element = scrollRefs.current[ranking.categoryMid];
                  if (element) {
                    element.scrollBy({ left: 300, behavior: "smooth" });
                  }
                };

                return (
                  <div key={ranking.categoryMid} className="space-y-4">
                    {/* 중분류 헤더 with 순위 */}
                    <div className="flex items-start gap-4">
                      <span className="text-primary-main text-4xl font-bold leading-none">
                        {rank}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {ranking.categoryMid}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {getCategoryDescription(ranking.categoryMid)}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                            <span className="text-sm font-semibold text-gray-900">
                              {ranking.averageRating > 0
                                ? ranking.averageRating.toFixed(1)
                                : "-"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            리뷰 {ranking.totalReviews.toLocaleString()}개
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
                          scrollRefs.current[ranking.categoryMid] = el;
                        }}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                        onScroll={() => handleScroll(ranking.categoryMid)}
                      >
                        {ranking.treatments.map((treatment) => {
                          const treatmentId = treatment.treatment_id || 0;
                          const isFavorited = favorites.has(treatmentId);
                          const thumbnailUrl = getThumbnailUrl(treatment);
                          const price = treatment.selling_price
                            ? `${Math.round(
                                treatment.selling_price / 10000
                              )}만원`
                            : "가격 문의";

                          return (
                            <div
                              key={treatmentId}
                              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-[160px] cursor-pointer flex flex-col"
                              onClick={() => {
                                router.push(`/treatment/${treatmentId}`);
                              }}
                            >
                              {/* 이미지 - 2:1 비율 */}
                              <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                                <img
                                  src={thumbnailUrl}
                                  alt={treatment.treatment_name}
                                  className="w-full h-full object-cover"
                                />
                                {/* 할인율 배지 */}
                                {treatment.dis_rate &&
                                  treatment.dis_rate > 0 && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                      {treatment.dis_rate}%
                                    </div>
                                  )}
                                {/* 통역 가능 뱃지 (예시) */}
                                <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                                  통역
                                </div>
                              </div>

                              {/* 카드 내용 */}
                              <div className="p-3 flex flex-col h-full">
                                <div>
                                  {/* 시술명 */}
                                  <h5 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
                                    {treatment.treatment_name}
                                  </h5>

                                  {/* category_small - treatment_name과 별점 사이에 배치 */}
                                  {treatment.category_small && (
                                    <p className="text-sm font-medium text-gray-700 line-clamp-1 mb-1">
                                      {treatment.category_small}
                                    </p>
                                  )}

                                  {/* 별점/리뷰 */}
                                  <div className="flex items-center gap-1 text-[11px] text-gray-600 mb-1">
                                    <FiStar className="text-yellow-400 fill-yellow-400 text-[12px]" />
                                    <span className="font-semibold">
                                      {treatment.rating
                                        ? treatment.rating.toFixed(1)
                                        : "-"}
                                    </span>
                                    <span>
                                      ({treatment.review_count || 0}개 리뷰)
                                    </span>
                                  </div>
                                </div>

                                {/* 가격/병원명과 버튼 - 하단 고정 */}
                                <div className="flex items-end justify-between mt-auto">
                                  <div className="flex-1">
                                    {/* 가격 / 부가세 */}
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

                                    {/* 병원명 / 위치(예시) */}
                                    <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                                      {treatment.hospital_name || "병원명 없음"}{" "}
                                      · 서울
                                    </p>
                                  </div>

                                  {/* 하트/달력 버튼 - 세로 배치 */}
                                  <div className="flex flex-col gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFavoriteClick(treatment, e);
                                      }}
                                      className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                      <FiHeart
                                        className={`text-base ${
                                          isFavorited
                                            ? "text-red-500 fill-red-500"
                                            : "text-gray-600"
                                        }`}
                                      />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToScheduleClick(treatment, e);
                                      }}
                                      className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
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
                  onClick={() => setVisibleCategoriesCount((prev) => prev + 5)}
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
            selectedTreatmentForSchedule.treatment_name || "시술명 없음"
          }
          categoryMid={selectedTreatmentForSchedule.category_mid || null}
        />
      )}
    </div>
  );
}
