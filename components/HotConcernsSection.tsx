"use client";

import { useState, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiTrendingUp, FiHeart, FiStar, FiCalendar, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import {
  getHomeHotTreatments,
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  toggleProcedureFavorite,
  getFavoriteStatus,
  hasUserWrittenReview,
  type Treatment,
} from "@/lib/api/beautripApi";
import {
  formatPrice,
  getCurrencyFromStorage,
  getCurrencyFromLanguage,
} from "@/lib/utils/currency";
import AddToScheduleModal from "./AddToScheduleModal";
import LoginRequiredPopup from "./LoginRequiredPopup";
import ReviewRequiredPopup from "./ReviewRequiredPopup";
import CommunityWriteModal from "./CommunityWriteModal";
import { supabase } from "@/lib/supabase";
import { trackAddToSchedule, trackPdpClick } from "@/lib/gtm";

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
  const [showReviewRequiredPopup, setShowReviewRequiredPopup] = useState(false);
  const [showCommunityWriteModal, setShowCommunityWriteModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);
  // 로그인 성공 후 실행할 동작 저장
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null) as MutableRefObject<HTMLDivElement | null>;
  // 스크롤 상태 관리
  const [scrollPosition, setScrollPosition] = useState({
    left: 0,
    canScrollLeft: false,
    canScrollRight: false,
  });
  // 표시할 카드 개수 (최대 3개)
  const MAX_VISIBLE_CARDS = 3;
  const visibleTreatments = treatments.slice(0, MAX_VISIBLE_CARDS);

  // 통화 설정 (언어에 따라 자동 설정, 또는 localStorage에서 가져오기)
  const currency = useMemo(() => {
    return getCurrencyFromLanguage(language) || getCurrencyFromStorage();
  }, [language]);

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

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);
      
      if (loggedIn && session?.user) {
        const hasReview = await hasUserWrittenReview(session.user.id);
        setHasWrittenReview(hasReview);
      } else {
        setHasWrittenReview(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ 초기 로드: 현재 언어로 로드 (처음부터 다른 언어로 시작해도 작동)
  const [initialLanguageLoaded, setInitialLanguageLoaded] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function fetchInitialData() {
      // 이미 같은 언어로 로드했으면 스킵
      if (initialLanguageLoaded === language && treatments.length > 0) {
        return;
      }

      try {
        setLoading(true);
        // 현재 언어로 초기 데이터 로드 (처음부터 다른 언어로 시작해도 작동)
        const hotTreatments = await getHomeHotTreatments(language, {
          limit: 10,
        });
        setTreatments(hotTreatments);
        setInitialLanguageLoaded(language);
      } catch (error) {
        console.error("인기 시술 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    // 초기 로드 또는 언어 변경 시
    if (treatments.length === 0 || initialLanguageLoaded !== language) {
      fetchInitialData();
    }
  }, [language]); // language 변경 시 실행

  // ✅ 언어 변경 시 번역만 적용 (이미 로드된 데이터가 있고, 언어만 변경된 경우)
  useEffect(() => {
    async function translateData() {
      // 초기 로드가 완료되지 않았거나, 한국어면 스킵
      if (
        treatments.length === 0 ||
        language === "KR" ||
        !initialLanguageLoaded
      ) {
        return;
      }

      // 이미 같은 언어로 로드했으면 스킵
      if (initialLanguageLoaded === language) {
        return;
      }

      try {
        setLoading(true);
        // 같은 treatment_id로 lang만 바꿔서 번역 데이터 가져오기
        const { translateTreatments } = await import(
          "@/lib/utils/translateTreatments"
        );
        const translated = await translateTreatments(treatments, language);
        setTreatments(translated);
        setInitialLanguageLoaded(language);
      } catch (error) {
        console.error("시술 번역 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    // 초기 로드가 완료된 후에만 번역 적용
    if (initialLanguageLoaded && initialLanguageLoaded !== language) {
      translateData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, initialLanguageLoaded]); // language와 initialLanguageLoaded 변경 시 실행

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

  // 초기 스크롤 상태 확인
  useEffect(() => {
    if (visibleTreatments.length > 0 && scrollRef.current) {
      const timer = setTimeout(() => {
        const element = scrollRef.current;
        if (!element) return;

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
            const thirdCardRight = thirdCard.offsetLeft + thirdCard.offsetWidth;
            maxScrollWidth = thirdCardRight - element.clientWidth;
          }
        }

        const scrollLeft = element.scrollLeft;
        const canScrollLeft = scrollLeft > 0;
        const canScrollRight = scrollLeft < maxScrollWidth - 1;
        
        setScrollPosition({
          left: scrollLeft,
          canScrollLeft,
          canScrollRight,
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visibleTreatments]);

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

    // ⚠️ 중요: category_mid_key (한국어 고정)를 사용해야 category_treattime_recovery와 매칭됨
    const categoryMidForRecovery =
      selectedTreatment.category_mid_key || selectedTreatment.category_mid;
    if (categoryMidForRecovery) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        categoryMidForRecovery,
        language
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
      categoryMid:
        selectedTreatment.category_mid_key ||
        selectedTreatment.category_mid ||
        null,
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
          <h3 className="text-lg font-bold text-gray-900" suppressHydrationWarning>
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
        <h3 className="text-lg font-bold text-gray-900" suppressHydrationWarning>
          {t("home.hotConcerns")}
        </h3>
      </div>

      {/* 카드 슬라이드 */}
      <div className="relative -mx-4 px-3">
        {/* 좌측 스크롤 버튼 */}
        {scrollPosition.canScrollLeft && (
          <button
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
          >
            <FiChevronLeft className="text-gray-700 text-lg" />
          </button>
        )}

        <div 
          ref={(el) => {
            scrollRef.current = el;
            
            // 스크롤 제한을 위한 이벤트 리스너 (모바일 터치 스크롤 방지)
            if (el) {
              const limitScroll = () => {
                const MAX_VISIBLE_CARDS = 3;
                const children = Array.from(el.children) as HTMLElement[];
                const cardElements = children.filter(
                  (child) =>
                    child.classList.contains("flex-shrink-0") &&
                    child.classList.contains("w-[150px]")
                );
                
                let maxScrollWidth = el.scrollWidth - el.clientWidth;
                if (cardElements.length >= MAX_VISIBLE_CARDS) {
                  const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
                  if (thirdCard) {
                    const thirdCardRight = thirdCard.offsetLeft + thirdCard.offsetWidth;
                    maxScrollWidth = thirdCardRight - el.clientWidth;
                  }
                }

                if (el.scrollLeft > maxScrollWidth) {
                  el.scrollLeft = maxScrollWidth;
                }

                // 스크롤 상태 업데이트
                const scrollLeft = el.scrollLeft;
                const canScrollLeft = scrollLeft > 0;
                const canScrollRight = scrollLeft < maxScrollWidth - 1;
                
                setScrollPosition({
                  left: scrollLeft,
                  canScrollLeft,
                  canScrollRight,
                });
              };

              const handleTouchMove = (e: TouchEvent) => {
                limitScroll();
                const MAX_VISIBLE_CARDS = 3;
                const children = Array.from(el.children) as HTMLElement[];
                const cardElements = children.filter(
                  (child) =>
                    child.classList.contains("flex-shrink-0") &&
                    child.classList.contains("w-[150px]")
                );
                if (cardElements.length >= MAX_VISIBLE_CARDS) {
                  const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
                  if (thirdCard) {
                    const thirdCardRight = thirdCard.offsetLeft + thirdCard.offsetWidth;
                    const maxScrollWidth = thirdCardRight - el.clientWidth;
                    if (el.scrollLeft > maxScrollWidth) {
                      e.preventDefault();
                    }
                  }
                }
              };

              el.addEventListener("touchmove", handleTouchMove, { passive: false });
              el.addEventListener("scroll", limitScroll, { passive: true });

              (el as any)._scrollLimitHandler = limitScroll;
              (el as any)._touchMoveHandler = handleTouchMove;

              setTimeout(limitScroll, 100);
            }
            
            // cleanup 함수 반환
            return () => {
              if (el) {
                if ((el as any)._scrollLimitHandler) {
                  el.removeEventListener("scroll", (el as any)._scrollLimitHandler);
                }
                if ((el as any)._touchMoveHandler) {
                  el.removeEventListener("touchmove", (el as any)._touchMoveHandler);
                }
              }
            };
          }}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          onScroll={(e) => {
            const element = e.currentTarget;
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
                const thirdCardRight = thirdCard.offsetLeft + thirdCard.offsetWidth;
                maxScrollWidth = thirdCardRight - element.clientWidth;
              }
            }

            if (element.scrollLeft > maxScrollWidth) {
              element.scrollLeft = maxScrollWidth;
            }

            const scrollLeft = element.scrollLeft;
            const canScrollLeft = scrollLeft > 0;
            const canScrollRight = scrollLeft < maxScrollWidth - 1;
            
            setScrollPosition({
              left: scrollLeft,
              canScrollLeft,
              canScrollRight,
            });
          }}
          onClick={(e) => {
            // 버튼 클릭이 아닌 경우에만 이벤트 전파 허용
            const target = e.target as HTMLElement;
            // 버튼이나 버튼의 자식 요소를 클릭한 경우 이벤트 전파 방지
            if (target.closest('button')) {
              e.stopPropagation();
            }
          }}
        >
          {visibleTreatments.map((treatment) => {
          const isFavorite = favorites.has(treatment.treatment_id || 0);
          const thumbnailUrl = getThumbnailUrl(treatment);

          // 디버깅: 가격 정보 확인
          if (treatment.treatment_id && !treatment.selling_price) {
            console.log("⚠️ [가격 정보 없음]:", {
              treatment_id: treatment.treatment_id,
              treatment_name: treatment.treatment_name,
              selling_price: treatment.selling_price,
              original_price: treatment.original_price,
              allKeys: Object.keys(treatment),
            });
          }

          // 가격 표시: KRW는 원래 형식(43만원), 다른 통화는 환율 변환
          const price =
            treatment.selling_price && treatment.selling_price > 0
              ? currency === "KRW"
                ? `${Math.round(treatment.selling_price / 10000)}만원`
                : formatPrice(treatment.selling_price, currency, t)
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
                  // GTM: PDP 클릭 이벤트 (홈 페이지에서 클릭)
                  trackPdpClick("home");
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
                        {t("common.vatIncluded")}
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

        {/* 우측 더보기 버튼 
          - 비로그인 또는 후기 미작성: 항상 표시 (클릭 시 팝업)
          - 후기 작성한 사용자: 스크롤 가능할 때만 표시 (클릭 시 스크롤, 팝업 없음)
        */}
        {treatments.length > 0 && (
          (!isLoggedIn || !hasWrittenReview) || 
          (isLoggedIn && hasWrittenReview && scrollPosition.canScrollRight)
        ) && (
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
                  currentHasWrittenReview = await hasUserWrittenReview(session.user.id);
                  setHasWrittenReview(currentHasWrittenReview);
                }
              }
              
              // 비로그인 또는 후기 미작성: 팝업만 표시
              if (!isLoggedIn || !currentHasWrittenReview) {
                setPendingAction(null); // 스크롤 동작 저장하지 않음 (3개 제한이므로)
                setShowReviewRequiredPopup(true);
                return; // 여기서 함수 종료 - 다른 동작 실행 안 함
              }
              
              // 로그인 상태이고 리뷰를 작성한 경우 스크롤 실행 (3개 제한 내에서만)
              if (scrollRef.current && scrollPosition.canScrollRight) {
                const MAX_VISIBLE_CARDS = 3;
                const children = Array.from(scrollRef.current.children) as HTMLElement[];
                const cardElements = children.filter(
                  (child) =>
                    child.classList.contains("flex-shrink-0") &&
                    child.classList.contains("w-[150px]")
                );
                
                let maxScrollWidth = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
                if (cardElements.length >= MAX_VISIBLE_CARDS) {
                  const thirdCard = cardElements[MAX_VISIBLE_CARDS - 1];
                  if (thirdCard) {
                    const thirdCardRight = thirdCard.offsetLeft + thirdCard.offsetWidth;
                    maxScrollWidth = thirdCardRight - scrollRef.current.clientWidth;
                  }
                }
                
                const newScrollLeft = Math.min(scrollRef.current.scrollLeft + 300, maxScrollWidth);
                scrollRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-lg rounded-full p-2.5 transition-all"
          >
            <FiChevronRight className="text-gray-700 text-xl" />
          </button>
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

      {/* 로그인 필요 팝업 */}
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
            
            // 리뷰를 작성했으면 팝업 닫기 (동작 저장하지 않음, 3개 제한이므로)
            if (hasReview) {
              setShowReviewRequiredPopup(false);
              setPendingAction(null);
            }
          }
        }}
      />

      {/* 커뮤니티 글 작성 모달 */}
      <CommunityWriteModal
        isOpen={showCommunityWriteModal}
        onClose={async () => {
          setShowCommunityWriteModal(false);
          // 리뷰 작성 후 상태 업데이트
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const hasReview = await hasUserWrittenReview(session.user.id);
            setHasWrittenReview(hasReview);
            // 후기 작성 완료 후 저장된 동작 실행
            if (hasReview && pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }
        }}
        entrySource="home"
      />
    </div>
  );
}
