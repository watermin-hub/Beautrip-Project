"use client";

import { FiSearch } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";
import { uploadFaceImageToStorage } from "@/lib/api/faceImageUpload";
import { supabase } from "@/lib/supabase";
import LoginRequiredPopup from "./LoginRequiredPopup";

export default function AISkinAnalysisButton() {
  const router = useRouter();
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setUserId(session.user.id);
      } else {
        // localStorage도 확인
        const savedIsLoggedIn = localStorage.getItem("isLoggedIn");
        const savedUserId = localStorage.getItem("userId");
        if (savedIsLoggedIn === "true" && savedUserId) {
          setIsLoggedIn(true);
          setUserId(savedUserId);
        } else {
          setIsLoggedIn(false);
          setUserId(null);
        }
      }
    };
    checkAuth();
  }, []);

  const handleStartAnalysis = () => {
    // 로그인 체크
    if (!isLoggedIn || !userId) {
      setShowLoginRequiredPopup(true);
      return;
    }
    setIsConsentModalOpen(true);
  };

  const handleConsentAgree = () => {
    setIsConsentModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleCapture = async (imageData: string) => {
    setIsUploading(true);
    try {
      // 로그인 및 user_id 재확인
      if (!isLoggedIn || !userId) {
        setShowLoginRequiredPopup(true);
        setIsUploading(false);
        return;
      }

      // 찍은 사진을 localStorage에 먼저 저장 (즉시 표시용)
      localStorage.setItem("capturedFaceImage", imageData);
      
      // 최근 분석 결과 저장 (AI 리포트용)
      const recentAnalysis = {
        imageData,
        timestamp: Date.now(),
        userId,
      };
      localStorage.setItem("lastAIAnalysisResult", JSON.stringify(recentAnalysis));

      // Supabase Storage에 업로드
      const { filePath } = await uploadFaceImageToStorage(imageData);

      // 업로드 성공 후 결과 페이지로 이동
      router.push(
        `/ai-skin-analysis-result?image=${encodeURIComponent(filePath)}`
      );
    } catch (error: any) {
      console.error("이미지 업로드 오류:", error);
      // 업로드 실패 시에도 localStorage에 저장된 이미지로 결과 페이지 이동
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

      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setUserId(session.user.id);
            setShowLoginRequiredPopup(false);
            // 로그인 성공 후 동의 모달 열기
            setIsConsentModalOpen(true);
          } else {
            const savedUserId = localStorage.getItem("userId");
            if (savedUserId) {
              setIsLoggedIn(true);
              setUserId(savedUserId);
              setShowLoginRequiredPopup(false);
              setIsConsentModalOpen(true);
            }
          }
        }}
      />
    </>
  );
}
