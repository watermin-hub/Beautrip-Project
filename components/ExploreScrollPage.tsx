"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "./Header";
import ExploreHeader from "./ExploreHeader";
import RankingSection from "./RankingSection";
import ProcedureListPage from "./ProcedureListPage";
import HospitalInfoPage from "./HospitalInfoPage";
import BottomNavigation from "./BottomNavigation";

export default function ExploreScrollPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string>("ranking");
  const rankingRef = useRef<HTMLDivElement>(null);
  const procedureRef = useRef<HTMLDivElement>(null);
  const hospitalRef = useRef<HTMLDivElement>(null);

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
      const headerOffset = 96; // Header(48px) + ExploreHeader(48px)
      const elementPosition = targetRef.current.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // URL 쿼리 파라미터에서 section 읽어서 해당 섹션으로 스크롤
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      // 약간의 딜레이를 주어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        scrollToSection(section);
      }, 300);
    }
  }, [searchParams]);

  // 스크롤 위치 감지하여 activeSection 업데이트
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // 약간의 오프셋

      if (
        hospitalRef.current &&
        scrollPosition >= hospitalRef.current.offsetTop
      ) {
        setActiveSection("hospital");
      } else if (
        procedureRef.current &&
        scrollPosition >= procedureRef.current.offsetTop
      ) {
        setActiveSection("procedure");
      } else {
        setActiveSection("ranking");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header hasRankingBanner={false} />
      <ExploreHeader
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      {/* 랭킹 섹션 */}
      <section
        ref={rankingRef}
        id="ranking"
        className="border-b border-gray-200 pt-[208px]"
      >
        <RankingSection
          isVisible={activeSection === "ranking"}
          activeSection={activeSection}
        />
      </section>

      {/* 전체 시술 섹션 */}
      <section
        ref={procedureRef}
        id="procedure"
        className="scroll-mt-[96px] border-b border-gray-200"
      >
        <ProcedureListPage activeSection={activeSection} />
      </section>

      {/* 전체 병원 섹션 */}
      <section ref={hospitalRef} id="hospital" className="scroll-mt-[96px]">
        <div className="sticky top-[96px] z-20 bg-white border-b border-gray-100 px-4 py-3">
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
    </div>
  );
}
