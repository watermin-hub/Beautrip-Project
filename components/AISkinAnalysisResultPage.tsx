"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiHeart, FiChevronRight } from "react-icons/fi";
import {
  getRandomAnalysisResult,
  type SkinAnalysisResult,
} from "@/lib/aiAnalysisTemplates";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface AISkinAnalysisResultPageProps {
  imageUrl?: string;
}

export default function AISkinAnalysisResultPage({
  imageUrl,
}: AISkinAnalysisResultPageProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  
  // 디버깅: imageUrl 확인
  useEffect(() => {
    console.log("🔍 AISkinAnalysisResultPage - imageUrl:", imageUrl);
  }, [imageUrl]);
  const [gaugeWidth, setGaugeWidth] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("스킨 / 토너");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  const diagramVectorRef = useRef<HTMLDivElement>(null);
  const detailItemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // 랜덤 결과 선택
    let randomResult: SkinAnalysisResult | null = null;
    try {
      randomResult = getRandomAnalysisResult();
      console.log("✅ AI 분석 결과 생성 성공:", randomResult);
      setResult(randomResult);
      setGaugeWidth(0);
    } catch (error) {
      console.error("❌ AI 분석 결과 생성 실패:", error);
      // 에러 발생 시 기본 결과라도 표시
      try {
        randomResult = getRandomAnalysisResult();
        setResult(randomResult);
        setGaugeWidth(0);
      } catch (fallbackError) {
        console.error("❌ Fallback 결과 생성도 실패:", fallbackError);
      }
    }

    // 게이지 애니메이션
    if (randomResult) {
      setTimeout(() => {
        setGaugeWidth(randomResult!.score);
      }, 300);
    }

    // 스크롤 애니메이션 설정
    setTimeout(() => {
      const diagramObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              entry.target.classList.add("animate");
              diagramObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5, rootMargin: "0px" }
      );

      if (diagramVectorRef.current) {
        diagramObserver.observe(diagramVectorRef.current);
      }
    }, 100);

    setTimeout(() => {
      const detailObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              detailObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3, rootMargin: "0px" }
      );

      detailItemsRef.current.forEach((item) => {
        if (item) detailObserver.observe(item);
      });
    }, 100);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
          <p className="text-gray-600">{t("ai.result.loading")}</p>
        </div>
      </div>
    );
  }

  const categories = [
    t("ai.result.categories.skin"),
    t("ai.result.categories.lotion"),
    t("ai.result.categories.serum"),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      {/* 뒤로가기 버튼이 있는 헤더 */}
      <div className="sticky top-[48px] z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {t("ai.result.title")}
          </h1>
          <div className="w-10" /> {/* 공간 맞추기 */}
        </div>
      </div>

      <div className="max-w-md mx-auto bg-white">
        {/* 결과 헤더 */}
        <div className="text-center pt-16 pb-4 px-5">
          <p className="text-xs text-gray-400">{t("ai.result.subtitle")}</p>
        </div>

        {/* 분석된 얼굴 섹션 */}
        <div className="px-5 mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            {t("ai.result.faceSection")}
          </h2>
        </div>

        {/* 결과 이미지 */}
        <div className="text-center mb-[-6px] px-5 relative">
          {imageUrl ? (
            <div className="relative w-[297px] h-[238px] mx-auto">
              <img
                src={imageUrl}
                alt={t("ai.result.faceAlt")}
                className="w-full h-full rounded-[10px] object-cover mx-auto face-image-soft"
                onLoad={() => {
                  console.log("이미지 렌더링 성공:", imageUrl);
                }}
                onError={(e) => {
                  console.error("이미지 렌더링 실패:", imageUrl);
                  // 에러 발생 시 localStorage에서 다시 시도
                  const localImage = localStorage.getItem("capturedFaceImage");
                  if (localImage && e.currentTarget.src !== localImage) {
                    console.log("localStorage 이미지로 재시도");
                    e.currentTarget.src = localImage;
                  }
                }}
              />
              {/* 뽀샤시한 오버레이 효과 */}
              <div className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none"></div>
            </div>
          ) : (
            <div className="w-[297px] h-[238px] rounded-[10px] bg-gray-200 mx-auto flex items-center justify-center">
              <p className="text-gray-400 text-sm">{t("ai.result.noImage")}</p>
            </div>
          )}
        </div>

        {/* 점수 섹션 */}
        <div className="bg-white py-8 mb-[13px]">
          <div className="text-center text-lg font-bold text-gray-900 mb-5 px-5">
            {t("ai.result.scoreSentence", { score: result.score })}
          </div>
          <div className="w-[362px] h-[22px] bg-gray-200 rounded-[10px] mx-auto relative overflow-hidden">
            <div
              className="h-full rounded-[10px] transition-all duration-1000 ease-out"
              style={{
                width: `${gaugeWidth}%`,
                background: `linear-gradient(135deg, ${result.colorScheme.primary}, ${result.colorScheme.primary}30)`,
              }}
            />
          </div>
        </div>

        {/* 요약 섹션 */}
        <div className="bg-white py-5 mb-[13px]">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">
            {t("ai.result.summarySection")}
          </h2>
          <div className="w-[250px] min-h-[193px] bg-white border border-gray-200 rounded-[10px] mx-auto mb-5 p-5 relative overflow-visible">
            <div className="w-[153px] h-[153px] relative mx-auto">
              {/* 다이어그램 레이블 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-900 text-center whitespace-nowrap z-10">
                {result.diagramLabels.top}
              </div>
              <div className="absolute top-[24%] right-[-10px] text-[10px] text-gray-900 text-right whitespace-nowrap z-10">
                {result.diagramLabels.rightTop}
              </div>
              <div className="absolute top-[68%] right-[-10px] text-[10px] text-gray-900 text-right whitespace-nowrap z-10">
                {result.diagramLabels.rightBottom}
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-900 text-center whitespace-nowrap z-10">
                {result.diagramLabels.bottom}
              </div>
              <div className="absolute top-[68%] left-[-10px] text-[10px] text-gray-900 text-left whitespace-nowrap z-10">
                {result.diagramLabels.leftBottom}
              </div>
              <div className="absolute top-[24%] left-[-10px] text-[10px] text-gray-900 text-left whitespace-nowrap z-10">
                {result.diagramLabels.leftTop}
              </div>

              {/* 차트 영역 (실제 차트 이미지가 있다면 여기에) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] z-20">
                <div className="w-full h-full rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="text-xs text-gray-400">
                    {t("ai.result.chartLabel")}
                  </div>
                </div>
              </div>

              {/* 벡터 그래프 (애니메이션) */}
              <div
                ref={diagramVectorRef}
                className="diagram-vector absolute top-[42%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[79px] h-[74px] z-30 flex items-center justify-center"
              >
                <div className="w-full h-full opacity-0 scale-[0.05] diagram-vector-inner">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${result.colorScheme.primary}40, ${result.colorScheme.secondary}20)`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 text-xs leading-relaxed text-gray-900 text-center">
            {result.summary.split("\n").map((line, idx) => (
              <span key={idx}>
                {line}
                {idx < result.summary.split("\n").length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>

        {/* 추천 성분 섹션 */}
        <div className="bg-white py-5 mb-[13px]">
          <div className="flex justify-between items-center px-5 mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {t("ai.result.recommendedIngredients")}
            </h2>
            <button className="flex items-center gap-1 text-xs text-gray-600">
              <span>{t("common.seeMore")}</span>
              <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-6">
            {result.recommendedIngredients.map((ingredient, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start mb-3 last:mb-0"
              >
                <div className="flex gap-3 items-start">
                  <span
                    className="text-base font-semibold"
                    style={{ color: result.colorScheme.primary }}
                  >
                    {ingredient.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 w-[70px]">
                    {ingredient.name}
                  </span>
                </div>
                <span className="text-xs text-gray-600 w-[240px] leading-[1.9]">
                  {ingredient.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 성분 섹션 */}
        <div className="bg-white py-5 mb-[13px]">
          <div className="flex justify-between items-center px-5 mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {t("ai.result.cautionIngredients")}
            </h2>
            <button className="flex items-center gap-1 text-xs text-gray-600">
              <span>{t("common.seeMore")}</span>
              <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-6">
            {result.cautionIngredients.map((ingredient, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start mb-3 last:mb-0"
              >
                <div className="flex gap-3 items-start">
                  <span className="text-base font-semibold text-red-500">
                    {ingredient.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 w-[70px]">
                    {ingredient.name}
                  </span>
                </div>
                <span className="text-xs text-gray-600 w-[240px] leading-[1.9]">
                  {ingredient.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 세부 분석 섹션 */}
        <div className="bg-white py-5 mb-[13px]">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-5">
            {t("ai.result.detailAnalysis")}
          </h2>
          {result.detailAnalysis.map((item, idx) => (
            <div key={idx}>
              <div
                ref={(el) => {
                  if (el) detailItemsRef.current[idx] = el;
                }}
                className="px-5 mb-5 fade-up-item"
              >
                <div
                  className="text-sm font-bold mb-1"
                  style={{ color: result.colorScheme.accent }}
                >
                  {item.title}
                </div>
                <div className="text-xs text-gray-900 leading-relaxed pl-4">
                  {item.description}
                </div>
              </div>
              {idx < result.detailAnalysis.length - 1 && (
                <div className="h-px bg-gray-200 mx-5 mb-5"></div>
              )}
            </div>
          ))}
        </div>

        {/* 제품 추천 섹션 */}
        <div className="bg-white py-5 mb-[13px]">
          <div className="flex justify-between items-center px-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("ai.result.recommendedProcedures")}
            </h2>
            <div className="relative">
              <button
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <span>{selectedCategory}</span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`transform transition-transform ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" />
                </svg>
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute top-7 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 min-w-[140px] z-10">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        selectedCategory === cat
                          ? "text-primary-main font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="px-5">
            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
              {t("ai.result.proceduresComingSoon")}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* 뽀샤시한 이미지 필터 효과 */
        .face-image-soft {
          filter: brightness(1.08) contrast(1.02) saturate(1.15) blur(0.4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1),
            0 4px 12px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: filter 0.3s ease, transform 0.3s ease;
          transform: scale(1);
        }

        .face-image-soft:hover {
          filter: brightness(1.1) contrast(1.03) saturate(1.2) blur(0.3px);
          transform: scale(1.01);
        }

        /* 이미지 로딩 애니메이션 */
        .face-image-soft {
          animation: fadeInImage 0.5s ease-in-out;
        }

        @keyframes fadeInImage {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .diagram-vector-inner {
          transition: opacity 800ms ease-in-out, transform 800ms ease-in-out;
        }

        .diagram-vector.animate .diagram-vector-inner {
          opacity: 1;
          transform: scale(1);
        }

        .fade-up-item {
          opacity: 0;
          transform: translateX(30px);
        }

        .fade-up-item.is-in {
          animation: fadeUp 1200ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        }

        .fade-up-item:nth-of-type(1).is-in {
          animation-delay: 0.2s;
        }
        .fade-up-item:nth-of-type(2).is-in {
          animation-delay: 0.4s;
        }
        .fade-up-item:nth-of-type(3).is-in {
          animation-delay: 0.6s;
        }
        .fade-up-item:nth-of-type(4).is-in {
          animation-delay: 0.8s;
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <BottomNavigation />
    </div>
  );
}
