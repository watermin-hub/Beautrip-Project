"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiEdit3 } from "react-icons/fi";
import Header from "./Header";
import ExploreHeader from "./ExploreHeader";
import RankingSection from "./RankingSection";
import ProcedureListPage from "./ProcedureListPage";
import HospitalInfoPage from "./HospitalInfoPage";
import BottomNavigation from "./BottomNavigation";
import CommunityWriteModal from "./CommunityWriteModal";

export default function ExploreScrollPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string>("ranking");
  const rankingRef = useRef<HTMLDivElement>(null);
  const procedureRef = useRef<HTMLDivElement>(null);
  const hospitalRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);

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
      // 약간의 딜레이를 주어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        scrollToSection(section);
      }, 300);
    }
  }, [searchParams]);

  // 스크롤 위치 감지하여 activeSection 업데이트
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

      {/* 랭킹 섹션 - pt 제거하고 scroll-mt로 앵커 스크롤 처리 */}
      <section
        ref={rankingRef}
        id="ranking"
        className="border-b border-gray-200 scroll-mt-[112px]"
      >
        <RankingSection
          isVisible={activeSection === "ranking"}
          activeSection={activeSection}
        />
      </section>

      {/* 전체 시술 섹션 */}
      <section ref={procedureRef} id="procedure" className="scroll-mt-[112px]">
        <ProcedureListPage activeSection={activeSection} />
      </section>

      {/* 리뷰 작성 CTA 섹션 (전체 시술과 전체 병원 사이) */}
      {!hasWrittenReview && (
        <div className="px-4 py-6 bg-white border-b border-gray-200">
          <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-primary-main/30 text-center">
            <FiEdit3 className="text-primary-main text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900 mb-1">
              리뷰를 작성하면
            </p>
            <p className="text-xs text-gray-600 mb-3">
              더 많은 시술 정보를 볼 수 있어요!
            </p>
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-primary-main hover:bg-[#2DB8A0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              리뷰 작성하기
            </button>
          </div>
        </div>
      )}

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

      {/* 커뮤니티 글쓰기 모달 */}
      <CommunityWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => {
          setIsWriteModalOpen(false);
          // 리뷰 작성 후 상태 업데이트
          const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
          setHasWrittenReview(reviews.length > 0);
        }}
      />
    </div>
  );
}
