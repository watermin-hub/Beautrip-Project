"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  const { t, language } = useLanguage();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // 언어별 배너 이미지 URL 생성 함수
  const getBannerImageUrl = (bannerNumber: number): string => {
    const langCode = language.toLowerCase(); // KR -> kr, EN -> en, etc.
    return `https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/${langCode}_bn_${bannerNumber}.png`;
  };

  // 배너 슬라이드 데이터 (언어에 따라 동적으로 생성)
  const bannerSlides: BannerSlide[] = useMemo(
    () => [
      {
        id: 1,
        image: getBannerImageUrl(1),
      },
      {
        id: 2,
        image: getBannerImageUrl(2),
        onClick: () => {
          // 2번 배너: AI 피부 분석 모달 열기
          setIsConsentModalOpen(true);
        },
      },
      {
        id: 3,
        image: getBannerImageUrl(3),
        onClick: () => {
          // 3번 배너: TOP20 정보 페이지로 이동
          router.push("/community/info/top20");
        },
      },
      {
        id: 4,
        image: getBannerImageUrl(4),
        onClick: () => {
          // 4번 배너: 여행지 추천 페이지로 이동
          router.push("/community/info/travel-recommendation");
        },
      },
      {
        id: 5,
        image: getBannerImageUrl(5),
        onClick: () => {
          // 5번 배너: 커뮤니티 정보 컨텐츠 탭으로 이동
          router.push("/community?tab=info");
        },
      },
      {
        id: 6,
        image: getBannerImageUrl(6),
      },
      {
        id: 7,
        image: getBannerImageUrl(7),
        onClick: () => {
          // 7번 배너: TOP20 정보 페이지로 이동
          router.push("/community/info/top20");
        },
      },
      {
        id: 8,
        image: getBannerImageUrl(8),
      },
    ],
    [language, router]
  );

  const totalSlides = bannerSlides.length;

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // 5초마다 자동 슬라이드

    return () => clearInterval(interval);
  }, [totalSlides]);

  // 언어 변경 시 첫 번째 슬라이드로 리셋
  useEffect(() => {
    setCurrentSlide(0);
  }, [language]);

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

  const handleBannerClick = () => {
    // 배너 클릭 시 이벤트 페이지로 이동
    router.push("/events");
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
              onClick={slide.onClick || handleBannerClick}
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
          <button
            onClick={(e) => {
              e.stopPropagation(); // 배너 클릭 이벤트와 충돌 방지
              handleBannerClick();
            }}
            className="absolute bottom-4 right-4 bg-black bg-opacity-30 px-3 py-1 rounded-full text-xs z-20 text-white cursor-pointer hover:bg-opacity-50 transition-colors"
          >
            {currentSlide + 1}/{totalSlides}
          </button>

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
