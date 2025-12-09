"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "./Header";
import ExploreHeader from "./ExploreHeader";
import CategoryRankingPage from "./CategoryRankingPage";
import RecommendationPage from "./RecommendationPage";
import ProcedureListPage from "./ProcedureListPage";
import HospitalInfoPage from "./HospitalInfoPage";
import BottomNavigation from "./BottomNavigation";

export default function ExploreScrollPage() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("ranking");
  const rankingRef = useRef<HTMLDivElement>(null);
  const recommendationRef = useRef<HTMLDivElement>(null);
  const procedureRef = useRef<HTMLDivElement>(null);
  const hospitalRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
    
    switch (sectionId) {
      case "ranking":
        targetRef = rankingRef;
        break;
      case "recommendation":
        targetRef = recommendationRef;
        break;
      case "procedure":
        targetRef = procedureRef;
        break;
      case "hospital":
        targetRef = hospitalRef;
        break;
    }

    if (targetRef?.current) {
      const headerOffset = 96; // 헤더 높이
      const elementPosition = targetRef.current.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // 스크롤 위치 감지하여 activeSection 업데이트
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // 약간의 오프셋

      if (hospitalRef.current && scrollPosition >= hospitalRef.current.offsetTop) {
        setActiveSection("hospital");
      } else if (procedureRef.current && scrollPosition >= procedureRef.current.offsetTop) {
        setActiveSection("procedure");
      } else if (recommendationRef.current && scrollPosition >= recommendationRef.current.offsetTop) {
        setActiveSection("recommendation");
      } else {
        setActiveSection("ranking");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <ExploreHeader activeSection={activeSection} onSectionClick={scrollToSection} />

      {/* 랭킹 섹션 */}
      <section
        ref={rankingRef}
        id="ranking"
        className="scroll-mt-[96px] border-b border-gray-200"
      >
        <div className="sticky top-[96px] z-20 bg-white border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">{t("explore.section.ranking")}</h2>
          <p className="text-xs text-gray-500 mt-1">{t("explore.section.rankingDesc")}</p>
        </div>
        <CategoryRankingPage />
      </section>

      {/* 추천 섹션 */}
      <section
        ref={recommendationRef}
        id="recommendation"
        className="scroll-mt-[96px] border-b border-gray-200"
      >
        <div className="sticky top-[96px] z-20 bg-white border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">{t("explore.section.recommendation")}</h2>
          <p className="text-xs text-gray-500 mt-1">{t("explore.section.recommendationDesc")}</p>
        </div>
        <RecommendationPage />
      </section>

      {/* 시술 목록 섹션 */}
      <section
        ref={procedureRef}
        id="procedure"
        className="scroll-mt-[96px] border-b border-gray-200"
      >
        <div className="sticky top-[96px] z-20 bg-white border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">{t("explore.section.procedure")}</h2>
          <p className="text-xs text-gray-500 mt-1">{t("explore.section.procedureDesc")}</p>
        </div>
        <ProcedureListPage />
      </section>

      {/* 병원 목록 섹션 */}
      <section
        ref={hospitalRef}
        id="hospital"
        className="scroll-mt-[96px]"
      >
        <div className="sticky top-[96px] z-20 bg-white border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">추천 병원 목록</h2>
          <p className="text-xs text-gray-500 mt-1">상위 10개 추천 병원</p>
        </div>
        <HospitalInfoPage />
      </section>

      <div className="pb-20">
        <BottomNavigation />
      </div>
    </div>
  );
}

