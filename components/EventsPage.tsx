"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { IoArrowBack } from "react-icons/io5";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";

interface EventBanner {
  id: number;
  image: string;
  title?: string;
  onClick?: () => void;
}

export default function EventsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // 언어별 배너 이미지 URL 생성 함수
  const getBannerImageUrl = (bannerNumber: number): string => {
    const langCode = language.toLowerCase(); // KR -> kr, EN -> en, etc.
    return `https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/${langCode}_bn_${bannerNumber}.png`;
  };

  // 배너 데이터 - 각 배너에 클릭 동작 추가
  const eventBanners: EventBanner[] = useMemo(
    () => [
      {
        id: 1,
        image: getBannerImageUrl(1),
        title: "이벤트 1",
      },
      {
        id: 2,
        image: getBannerImageUrl(2),
        title: "이벤트 2",
        onClick: () => {
          // 2번 배너: AI 피부 분석 모달 열기
          setIsConsentModalOpen(true);
        },
      },
      {
        id: 3,
        image: getBannerImageUrl(3),
        title: "이벤트 3",
        onClick: () => {
          // 3번 배너: TOP20 정보 페이지로 이동
          router.push("/community/info/top20");
        },
      },
      {
        id: 4,
        image: getBannerImageUrl(4),
        title: "이벤트 4",
        onClick: () => {
          // 4번 배너: 여행지 추천 페이지로 이동
          router.push("/community/info/travel-recommendation");
        },
      },
      {
        id: 5,
        image: getBannerImageUrl(5),
        title: "이벤트 5",
        onClick: () => {
          // 5번 배너: 커뮤니티 정보 컨텐츠 탭으로 이동
          router.push("/community?tab=info");
        },
      },
      {
        id: 6,
        image: getBannerImageUrl(6),
        title: "이벤트 6",
      },
      {
        id: 7,
        image: getBannerImageUrl(7),
        title: "이벤트 7",
        onClick: () => {
          // 7번 배너: TOP20 정보 페이지로 이동
          router.push("/community/info/top20");
        },
      },
      {
        id: 8,
        image: getBannerImageUrl(8),
        title: "이벤트 8",
      },
    ],
    [language, router]
  );

  const handleBannerClick = (banner: EventBanner) => {
    if (banner.onClick) {
      banner.onClick();
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoArrowBack className="text-xl text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">이벤트</h1>
        </div>
      </div>

      {/* 배너 리스트 */}
      <div className="px-4 py-6">
        <div className="flex flex-col gap-4">
          {eventBanners.map((banner) => (
            <div
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              className="relative w-full h-48 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <Image
                src={banner.image}
                alt={banner.title || `이벤트 배너 ${banner.id}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              {/* 호버 시 오버레이 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
            </div>
          ))}
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
    </div>
  );
}
