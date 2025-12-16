"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function Top20InfoPage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  // 언어에 따른 이미지 URL 매핑
  const imageUrls: Record<string, string> = {
    KR: "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/top20/top20_kr.png",
    CN: "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/top20/top20_cn.png",
    EN: "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/top20/top20_en.png",
    JP: "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/top20/top20_jp.png",
  };

  // 현재 언어에 맞는 이미지 URL 가져오기 (기본값: 한국어)
  const currentImageUrl = imageUrls[language] || imageUrls.KR;

  // 제목 (언어별 번역)
  const title = t("community.top20.title");

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiChevronLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 line-clamp-1">
            {title}
          </h1>
        </div>
      </div>

      {/* 컨텐츠 - padding 제거하고 이미지를 꽉 채움 */}
      <div className="w-full">
        <img
          src={currentImageUrl}
          alt={title}
          className="w-full h-auto object-contain"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 이미지로 대체
            const target = e.target as HTMLImageElement;
            target.src = imageUrls.KR;
          }}
        />
      </div>
    </div>
  );
}
