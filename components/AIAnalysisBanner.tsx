"use client";

import { useState } from "react";
import { FiZap } from "react-icons/fi";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AIAnalysisBanner() {
  const { t } = useLanguage();
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const router = useRouter();

  const handleStartAnalysis = () => {
    setIsConsentModalOpen(true);
  };

  const handleConsentAgree = () => {
    setIsConsentModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleCapture = (imageData: string) => {
    // 이미지를 localStorage에 저장
    localStorage.setItem("capturedFaceImage", imageData);
    // 결과 페이지로 이동 (나중에 구현)
    // router.push("/ai-skin-analysis-result");
    alert("AI 피부 분석이 완료되었습니다! (결과 페이지는 추후 구현 예정)");
  };

  return (
    <>
      <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-primary-light/20 to-primary-main/20 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <FiZap className="text-primary-main text-xl" />
            <h3 className="text-lg font-bold text-gray-900">
              {t("banner.ai.title")}
            </h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">{t("banner.ai.desc")}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAnalysis}
              className="bg-primary-main hover:bg-[#2DB8A0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {t("banner.ai.start")}
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              {t("banner.ai.reviews")}
            </button>
          </div>
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-10">
          <div className="w-24 h-24 bg-primary-main rounded-full"></div>
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
