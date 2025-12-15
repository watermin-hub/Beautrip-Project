"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface BannerSlide {
  id: number;
  image: string;
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
      image: "/banners/banner-1.png",
    },
    {
      id: 2,
      image: "/banners/banner-2.png",
    },
    {
      id: 3,
      image: "/banners/banner-3.png",
    },
    {
      id: 4,
      image: "/banners/banner-4.png",
    },
    {
      id: 5,
      image: "/banners/banner-5.png",
    },
    {
      id: 6,
      image: "/banners/banner-6.png",
    },
    {
      id: 7,
      image: "/banners/banner-7.png",
    },
    {
      id: 8,
      image: "/banners/banner-8.png",
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
              className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              onClick={slide.isAIBanner ? handleAIBannerClick : slide.onClick}
            >
              <Image
                src={slide.image}
                alt={`배너 ${slide.id}`}
                fill
                className="object-cover rounded-xl"
                priority={index === 0}
                unoptimized
              />
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
