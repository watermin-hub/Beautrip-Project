"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import RankingBanner from "./RankingBanner";
import Header from "./Header";
import TravelScheduleBar from "./TravelScheduleBar";
import HotConcernsSection from "./HotConcernsSection";
import AIAnalysisBanner from "./AIAnalysisBanner";
import PromotionBanner from "./PromotionBanner";
import AISkinAnalysisButton from "./AISkinAnalysisButton";
import PopularReviewsSection from "./PopularReviewsSection";
import OverlayBar from "./OverlayBar";
import BottomNavigation from "./BottomNavigation";
import ProcedureRecommendation from "./ProcedureRecommendation";
import CountryPainPointSection from "./CountryPainPointSection";
import LoginRequiredPopup from "./LoginRequiredPopup";
import InformationalContentSection from "./InformationalContentSection";
import type { TravelScheduleData } from "./TravelScheduleForm";
import { getMainCategories } from "./CategoryRankingPage";

export default function HomePage() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 언어 변경 시 대분류 카테고리 번역 업데이트 (랭킹 페이지와 동일)
  const MAIN_CATEGORIES = useMemo(() => {
    const categories = getMainCategories(t);
    // 아이콘 추가
    const iconMap: Record<string, string> = {
      눈성형: "👀",
      리프팅: "✨",
      보톡스: "💉",
      "안면윤곽/양악": "😊",
      제모: "🧴",
      지방성형: "💪",
      코성형: "👃",
      피부: "🌟",
      필러: "💊",
      가슴성형: "💕",
    };
    return categories.map((cat) => ({
      ...cat,
      icon: cat.id ? iconMap[cat.id] || "📋" : "📋",
    }));
  }, [t, language]);
  const [schedule, setSchedule] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const procedureRecommendationRef = useRef<HTMLDivElement>(null);
  const aiAnalysisBannerRef = useRef<HTMLDivElement>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) {
        setIsLoggedIn(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  // URL 쿼리 파라미터에서 openCalendar 확인하여 모달 열기
  useEffect(() => {
    const openCalendar = searchParams.get("openCalendar");
    if (openCalendar === "true") {
      // 모달을 먼저 열고, 약간의 딜레이 후 URL 변경
      setIsCalendarModalOpen(true);
      // URL에서 쿼리 파라미터 제거 (깔끔한 URL 유지) - 모달이 열린 후 실행
      setTimeout(() => {
        router.replace("/", { scroll: false });
      }, 100);
    }
  }, [searchParams, router]);

  // AI 피부분석 배너 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenAIAnalysis = () => {
      // AI 분석 배너로 스크롤
      if (aiAnalysisBannerRef.current) {
        const headerOffset = 96; // 헤더 높이
        const elementPosition = aiAnalysisBannerRef.current.offsetTop;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // 스크롤 후 약간의 딜레이를 두고 배너의 시작 버튼 클릭 이벤트 발생
        setTimeout(() => {
          // AIAnalysisBanner 컴포넌트 내부의 시작 버튼을 클릭하는 이벤트 발생
          const event = new CustomEvent("triggerAIAnalysis");
          window.dispatchEvent(event);
        }, 500);
      }
    };

    window.addEventListener("openAIAnalysis", handleOpenAIAnalysis);
    return () => {
      window.removeEventListener("openAIAnalysis", handleOpenAIAnalysis);
    };
  }, []);

  const handleScheduleChange = (
    start: string | null,
    end: string | null,
    categoryId?: string | null
  ) => {
    setSchedule({ start, end });
    // 일정 선택 시 전체 카테고리를 디폴트로 설정
    if (start && end && !categoryId) {
      setSelectedCategoryId(null); // null = 전체
    } else if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  };

  const handleCategoryClick = (id: string) => {
    setSelectedCategoryId((prev) => (prev === id ? null : id));
  };

  const scheduleData: TravelScheduleData | null = useMemo(() => {
    if (!schedule.start || !schedule.end) return null;

    // selectedCategoryId가 null이면 "전체"로 설정
    const categoryLabel = selectedCategoryId
      ? MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId)?.name ||
        t("category.all")
      : t("category.all");

    return {
      travelPeriod: { start: schedule.start, end: schedule.end },
      travelRegion: "서울",
      procedureCategory: categoryLabel,
      estimatedBudget: "100만원 미만",
    };
  }, [schedule.start, schedule.end, selectedCategoryId, t]);

  const hasFullSchedule = !!(schedule.start && schedule.end);

  // 1번 배너 클릭 핸들러: 로그인 체크 후 후기 작성 페이지로 이동 또는 로그인 모달 열기
  const handleBanner1Click = () => {
    if (isLoggedIn) {
      router.push("/community/write?entrySource=home");
    } else {
      setShowLoginRequiredPopup(true);
    }
  };

  // 5번 배너 클릭 핸들러: 오늘부터 2박 3일 일정 설정 후 ProcedureRecommendation 섹션으로 스크롤
  const handleBanner5Click = () => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 2); // 오늘부터 2박 3일 (오늘, 내일, 모레)

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDate(today);
    const endDateStr = formatDate(endDate);

    // 일정 설정
    handleScheduleChange(startDateStr, endDateStr);

    // ProcedureRecommendation 섹션으로 스크롤
    setTimeout(() => {
      if (procedureRecommendationRef.current) {
        const headerOffset = 96; // 헤더 높이
        const elementPosition = procedureRecommendationRef.current.offsetTop;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 300); // 일정 설정 후 DOM 업데이트 대기
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      {/* Fixed Ranking Banner - 상단 고정 */}
      <RankingBanner />
      {/* Header - 배너 아래 고정 */}
      <Header hasRankingBanner={true} />
      {/* 배너 높이(41px) + 헤더 높이(48px) = 89px, 추가 여유 공간 확보 */}
      <div className="pt-[96px] px-4 pb-20">
        {/* 헤더와 일정 입력창 사이 여백 - TravelScheduleBar 상단 테두리가 헤더에 가려지지 않도록 충분한 여백 */}
        <div className="mt-4">
          {/* 여행 일정 입력 바 (빨간 테두리 - 높은 중요도) */}
          <TravelScheduleBar
            onScheduleChange={handleScheduleChange}
            onModalStateChange={setIsCalendarModalOpen}
            initialOpen={isCalendarModalOpen}
          />
        </div>

        {/* 메인 배너 (일정 검색 완료 후에도 일정 수정 바로 밑에 표시) */}
        <PromotionBanner
          onBanner1Click={handleBanner1Click}
          onBanner5Click={handleBanner5Click}
        />

        {/* 인기 시술 → 맞춤 시술 (일정 선택 시 맞춤 시술로 대체) */}
        {scheduleData ? (
          <div
            ref={procedureRecommendationRef}
            className="mb-6 -mx-4 bg-gray-50"
          >
            <ProcedureRecommendation
              scheduleData={scheduleData}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              mainCategories={MAIN_CATEGORIES}
            />
          </div>
        ) : (
          <HotConcernsSection />
        )}

        {/* 정보성 컨텐츠 섹션 (커뮤니티에 추가 예정) */}
        <InformationalContentSection />

        {/* 미션 (출석, 활동) - 주석 처리 (나중에 사용 가능) */}
        {/* <MissionSection /> */}

        {/* 국가별 페인포인트 인기 검색어 목록 */}
        <CountryPainPointSection />

        {/* 국가별 인기 시술 - 제거됨 (해시태그 클릭 시 시술 추천으로 대체) */}
        {/* <KBeautyByCountry /> */}

        {/* AI 분석 배너 */}
        <div ref={aiAnalysisBannerRef}>
          <AIAnalysisBanner />
        </div>

        {/* 인기 급상승 리뷰 */}
        <PopularReviewsSection />

        {/* 인기 급상승 비포&애프터 리뷰 - 숨김 처리 */}
        {/* <RecentEventsSection /> */}

        {/* 리뷰 작성 버튼 */}
        <div className="mb-4">
          <button
            onClick={() => {
              if (isLoggedIn) {
                router.push("/community/write?entrySource=home");
              } else {
                setShowLoginRequiredPopup(true);
              }
            }}
            className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors shadow-md"
          >
            <span>{t("home.reviewButton")}</span>
            <span>&gt;</span>
          </button>
        </div>

        {/* 검색어 입력 - 주석 처리 */}
        {/* <SearchSection /> */}
      </div>

      {/* 플로팅 AI 피부 분석 버튼 (전역 렌더링) */}
      <AISkinAnalysisButton />

      {/* D-Day 플로팅 배너 - 제거됨 */}
      {/* <DDayBanner /> */}

      <OverlayBar />

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setShowLoginRequiredPopup(false);
          // 로그인 성공 후 후기 작성 페이지로 이동
          router.push("/community/write?entrySource=home");
        }}
      />

      <div className="pb-20">
        <BottomNavigation disabled={isCalendarModalOpen} />
      </div>
    </div>
  );
}
