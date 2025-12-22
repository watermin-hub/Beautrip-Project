"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiEdit3, FiChevronUp } from "react-icons/fi";
import Header from "./Header";
import ExploreHeader from "./ExploreHeader";
import RankingSection from "./RankingSection";
import ProcedureListPage from "./ProcedureListPage";
import HospitalInfoPage from "./HospitalInfoPage";
import BottomNavigation from "./BottomNavigation";

export default function ExploreScrollPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string>("ranking");
  const rankingRef = useRef<HTMLDivElement>(null);
  const procedureRef = useRef<HTMLDivElement>(null);
  const hospitalRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);
  const [showProcedureSection, setShowProcedureSection] = useState(true);
  const [showTopButton, setShowTopButton] = useState(false);

  // 리뷰 작성 여부 확인
  useEffect(() => {
    try {
      const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
      const hasReview = Array.isArray(reviews) && reviews.length > 0;
      setHasWrittenReview(hasReview);
    } catch (error) {
      console.error("[ExploreScrollPage] localStorage 읽기 오류:", error);
      setHasWrittenReview(false);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    let targetRef: React.RefObject<HTMLDivElement> | null = null;

    switch (sectionId) {
      case "ranking":
        targetRef = rankingRef;
        break;
      case "procedure":
        targetRef = procedureRef;
        break;
      case "hospital":
        targetRef = hospitalRef;
        break;
    }

    if (targetRef?.current) {
      isAutoScrolling.current = true;
      setActiveSection(sectionId); // ✅ 먼저 확정 (랭킹 헤더 즉시 내려감)

      const baseOffset = 112; // Header(48px) + ExploreHeader(약 56px)
      // sticky로 변경되어 레이아웃 흐름 안에 있으므로, 자연스럽게 밀려 올라감
      // procedure/hospital로 갈 때는 랭킹 sticky 영역을 확실히 벗어나게 하기 위한 여유 오프셋
      // (실제로는 sticky가 자연스럽게 밀려 올라가므로, 기본 오프셋만으로도 충분)
      const extraRankingSticky = 0; // sticky는 부모 경계 안에서 자연스럽게 동작

      const headerOffset =
        sectionId === "ranking"
          ? baseOffset // 랭킹으로 갈 때는 기본 오프셋
          : baseOffset + extraRankingSticky; // procedure/hospital로 갈 때는 랭킹 sticky 영역 확실히 벗어나게

      const elementPosition = targetRef.current.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // ✅ 스무스 스크롤 끝날 시간만큼 잠금 해제 (대충 500~700ms)
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 600);
    }
  };

  // URL 쿼리 파라미터에서 section 읽어서 해당 섹션으로 스크롤
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      // procedure 섹션으로 이동할 때는 ProcedureListPage를 0.5초 지연 표시
      if (section === "procedure") {
        const searchQuery = searchParams.get("search");
        setShowProcedureSection(false);
        // 랭킹이 먼저 로드되도록 0.5초 후에 ProcedureListPage 표시
        setTimeout(() => {
          setShowProcedureSection(true);
          // ProcedureListPage가 DOM에 렌더링될 때까지 기다린 후 스크롤
          const checkAndScroll = () => {
            if (procedureRef.current) {
              // 검색어가 있으면 검색 결과 로딩을 위해 추가 딜레이
              const scrollDelay = searchQuery ? 800 : 0;
              setTimeout(() => {
                scrollToSection(section);
              }, scrollDelay);
            } else {
              // 아직 DOM에 없으면 50ms 후 다시 시도
              setTimeout(checkAndScroll, 50);
            }
          };
          checkAndScroll();
        }, 500);
      } else {
        // 다른 섹션으로 이동할 때는 즉시 표시
        setShowProcedureSection(true);
        // 약간의 딜레이를 주어 DOM이 완전히 렌더링된 후 스크롤
        setTimeout(() => {
          scrollToSection(section);
        }, 300);
      }
    } else {
      // section 파라미터가 없으면 즉시 표시
      setShowProcedureSection(true);
    }
  }, [searchParams]);

  // 스크롤 위치 감지하여 activeSection 업데이트 및 TOP 버튼 표시
  useEffect(() => {
    const handleScroll = () => {
      if (isAutoScrolling.current) return; // ✅ 자동 스크롤 중엔 덮어쓰기 금지

      const HEADER_OFFSET = 112; // Header(48px) + ExploreHeader(약 56px)

      // 섹션의 시작점이 헤더 아래로 들어왔는지 getBoundingClientRect()로 정확하게 판정
      const procTop =
        procedureRef.current?.getBoundingClientRect().top ?? Infinity;
      const hospTop =
        hospitalRef.current?.getBoundingClientRect().top ?? Infinity;

      // 섹션의 시작점이 헤더 아래로 들어오면 그 섹션 활성
      if (hospTop <= HEADER_OFFSET + 1) {
        setActiveSection("hospital");
      } else if (procTop <= HEADER_OFFSET + 1) {
        setActiveSection("procedure");
      } else {
        setActiveSection("ranking");
      }

      // 스크롤이 300px 이상 내려갔을 때 TOP 버튼 표시
      setShowTopButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // TOP 버튼 클릭 시 상단으로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header hasRankingBanner={false} />
      <ExploreHeader
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      {/* 랭킹 섹션 - pt 제거하고 scroll-mt로 앵커 스크롤 처리 */}
      <section
        ref={rankingRef}
        id="ranking"
        className="border-b border-gray-200 scroll-mt-[112px] relative"
      >
        <RankingSection
          isVisible={activeSection === "ranking"}
          activeSection={activeSection}
        />
      </section>

      {/* 전체 시술 섹션 */}
      {showProcedureSection && (
        <section
          ref={procedureRef}
          id="procedure"
          className="scroll-mt-[112px]"
        >
          <ProcedureListPage activeSection={activeSection} />
        </section>
      )}

      {/* 리뷰 작성 CTA 섹션 (전체 시술과 전체 병원 사이) */}
      <div className="px-4 py-6 bg-white border-b border-gray-200">
        <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-primary-main/30 text-center">
          <FiEdit3 className="text-primary-main text-2xl mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {t("explore.reviewCTA.title")}
          </p>
          <p className="text-xs text-gray-600 mb-3">
            {t("explore.reviewCTA.description")}
          </p>
          <button
            onClick={() => router.push("/community/write")}
            className="bg-primary-main hover:bg-[#2DB8A0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {t("explore.reviewCTA.button")}
          </button>
        </div>
      </div>

      {/* 전체 병원 섹션 */}
      <section ref={hospitalRef} id="hospital" className="scroll-mt-[112px]">
        <div className="sticky top-[104px] z-20 bg-white border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">
            {t("explore.section.hospital")}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {t("explore.section.hospitalDesc")}
          </p>
        </div>
        <HospitalInfoPage />
      </section>

      <div className="pb-20">
        <BottomNavigation />
      </div>

      {/* TOP 버튼 - 우측 하단 (모바일 최적화) */}
      {showTopButton && (
        <div className="fixed bottom-20 z-40 right-0 left-0 flex justify-end pointer-events-none max-w-md mx-auto px-2">
          <button
            onClick={scrollToTop}
            className="w-7 h-7 bg-gray-800/80 hover:bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 pointer-events-auto"
            aria-label="맨 위로"
          >
            <FiChevronUp className="text-xs" />
          </button>
        </div>
      )}

    </div>
  );
}
