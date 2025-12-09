"use client";

import { useState, useEffect } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface BannerSlide {
  id: number;
  brandKey: string;
  brandSubtitle?: string;
  headlineKey: string;
  subheadlineKey: string;
  descriptionKey: string;
  regulatory?: string;
  regulatory2?: string;
  gradient: string;
  onClick?: () => void;
  isAIBanner?: boolean;
}

export default function PromotionBanner() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const bannerSlides: BannerSlide[] = [
    {
      id: 1,
      brandKey: "banner.ai.brand",
      headlineKey: "banner.ai.headline",
      subheadlineKey: "banner.ai.subheadline",
      descriptionKey: "banner.ai.description",
      gradient: "from-blue-100 via-cyan-100 to-blue-200",
      isAIBanner: true,
    },
    {
      id: 2,
      brandKey: "banner.kbeauty.brand",
      headlineKey: "banner.kbeauty.headline",
      subheadlineKey: "banner.kbeauty.subheadline",
      descriptionKey: "banner.kbeauty.description",
      gradient: "from-pink-400 to-rose-500",
    },
    {
      id: 3,
      brandKey: "banner.premium.brand",
      headlineKey: "banner.premium.headline",
      subheadlineKey: "banner.premium.subheadline",
      descriptionKey: "banner.premium.description",
      gradient: "from-blue-400 to-indigo-500",
    },
    {
      id: 4,
      brandKey: "banner.summer.brand",
      headlineKey: "banner.summer.headline",
      subheadlineKey: "banner.summer.subheadline",
      descriptionKey: "banner.summer.description",
      gradient: "from-cyan-400 to-teal-500",
    },
    {
      id: 5,
      brandKey: "banner.vip.brand",
      headlineKey: "banner.vip.headline",
      subheadlineKey: "banner.vip.subheadline",
      descriptionKey: "banner.vip.description",
      gradient: "from-purple-400 to-pink-500",
    },
    {
      id: 6,
      brandKey: "banner.weekend.brand",
      headlineKey: "banner.weekend.headline",
      subheadlineKey: "banner.weekend.subheadline",
      descriptionKey: "banner.weekend.description",
      gradient: "from-orange-400 to-red-500",
    },
  ];

  const totalSlides = bannerSlides.length;

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // 5초마다 자동 슬라이드

    return () => clearInterval(interval);
  }, [totalSlides]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleAIBannerClick = () => {
    setIsConsentModalOpen(true);
  };

  const handleConsentAgree = () => {
    setIsConsentModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleCapture = (imageData: string) => {
    localStorage.setItem("capturedFaceImage", imageData);
    alert("AI 피부 분석이 완료되었습니다! (결과 페이지는 추후 구현 예정)");
  };

  return (
    <>
      <div className="mb-6 relative rounded-xl overflow-hidden">
        <div className="relative h-48">
          {bannerSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-gradient-to-r ${
                slide.gradient
              } transition-opacity duration-500 cursor-pointer ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              onClick={slide.isAIBanner ? handleAIBannerClick : slide.onClick}
            >
              <div
                className={`p-6 h-full flex flex-col justify-between ${
                  slide.isAIBanner ? "text-gray-900" : "text-white"
                }`}
              >
                {/* Brand info */}
                <div>
                  <div className="mb-3">
                    <p
                      className={`text-xs font-semibold ${
                        slide.isAIBanner ? "text-blue-600" : ""
                      }`}
                    >
                      {t(slide.brandKey)}
                    </p>
                    {slide.brandSubtitle && (
                      <p
                        className={`text-xs ${
                          slide.isAIBanner ? "text-gray-600" : "opacity-90"
                        }`}
                      >
                        {slide.brandSubtitle}
                      </p>
                    )}
                  </div>

                  {/* Headline */}
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      slide.isAIBanner ? "text-gray-900" : ""
                    }`}
                  >
                    {t(slide.headlineKey)}
                  </h2>
                  <h3
                    className={`text-xl font-semibold mb-3 ${
                      slide.isAIBanner ? "text-gray-800" : ""
                    }`}
                  >
                    {t(slide.subheadlineKey)}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-sm mb-4 ${
                      slide.isAIBanner
                        ? "text-gray-700 font-medium"
                        : "opacity-90"
                    }`}
                  >
                    {t(slide.descriptionKey)}
                  </p>
                </div>

                {/* Regulatory info */}
                {(slide.regulatory || slide.regulatory2) && (
                  <div>
                    {slide.regulatory && (
                      <p className="text-xs opacity-75 mb-2">
                        {slide.regulatory}
                      </p>
                    )}
                    {slide.regulatory2 && (
                      <p className="text-xs opacity-75">{slide.regulatory2}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Slide indicator */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-30 px-3 py-1 rounded-full text-xs z-20">
            {currentSlide + 1}/{totalSlides}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors z-20"
          >
            <IoChevronBack className="text-white text-xl" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors z-20"
          >
            <IoChevronForward className="text-white text-xl" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-white w-6"
                    : "bg-white bg-opacity-50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <AISkinAnalysisConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAgree={handleConsentAgree}
      />

      <AISkinAnalysisCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
}
