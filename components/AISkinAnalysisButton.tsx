"use client";

import { FiSearch } from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";
import { uploadFaceImageToStorage } from "@/lib/api/faceImageUpload";

export default function AISkinAnalysisButton() {
  const router = useRouter();
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleStartAnalysis = () => {
    setIsConsentModalOpen(true);
  };

  const handleConsentAgree = () => {
    setIsConsentModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleCapture = async (imageData: string) => {
    setIsUploading(true);
    try {
      // Supabase Storage에 업로드
      const { filePath } = await uploadFaceImageToStorage(imageData);

      // 업로드 성공 후 결과 페이지로 이동
      router.push(
        `/ai-skin-analysis-result?image=${encodeURIComponent(filePath)}`
      );
    } catch (error: any) {
      console.error("이미지 업로드 오류:", error);
      // 업로드 실패 시 임시로 localStorage에 저장하고 결과 페이지로 이동
      localStorage.setItem("capturedFaceImage", imageData);
      router.push("/ai-skin-analysis-result");
      alert(
        `업로드 중 오류가 발생했습니다: ${error?.message ?? "알 수 없는 오류"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* 플로팅 버튼 - 사용자 디자인 이미지로 전체 교체 (모바일 최적화 - 우측 하단) */}
      <div className="fixed bottom-20 right-0 left-0 z-40 pointer-events-none max-w-md mx-auto">
        <button
          onClick={handleStartAnalysis}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="pointer-events-auto absolute bottom-0 right-4 transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
          style={{
            // 터치 영역 확보 (최소 44x44px)
            minWidth: "56px",
            minHeight: "56px",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
          aria-label="AI 피부 분석 시작"
        >
          {!imageError ? (
            <img
              src={
                isHovered
                  ? "/ai-skin-analysis-button-hover.png"
                  : "/ai-skin-analysis-button.png"
              }
              alt="AI 피부 분석"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pink-200 hover:bg-pink-300 active:bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
              <FiSearch className="text-xl sm:text-2xl text-pink-700" />
            </div>
          )}
        </button>
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
        isUploading={isUploading}
      />
    </>
  );
}
