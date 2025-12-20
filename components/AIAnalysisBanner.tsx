"use client";

import { useState, useEffect } from "react";
import { FiZap } from "react-icons/fi";
import AISkinAnalysisConsentModal from "./AISkinAnalysisConsentModal";
import AISkinAnalysisCameraModal from "./AISkinAnalysisCameraModal";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadFaceImageToStorage } from "@/lib/api/faceImageUpload";
import { supabase } from "@/lib/supabase";
import LoginModal from "./LoginModal";

export default function AIAnalysisBanner() {
  const { t } = useLanguage();
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

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
      setShowLoginModal(true);
      return;
    }
    setIsConsentModalOpen(true);
  };

  // 외부에서 AI 분석 시작 이벤트 리스너
  useEffect(() => {
    const handleTriggerAIAnalysis = () => {
      handleStartAnalysis();
    };

    window.addEventListener("triggerAIAnalysis", handleTriggerAIAnalysis);
    return () => {
      window.removeEventListener("triggerAIAnalysis", handleTriggerAIAnalysis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId]);

  const handleConsentAgree = () => {
    setIsConsentModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleCapture = async (imageData: string) => {
    setIsUploading(true);
    try {
      // 로그인 및 user_id 재확인
      if (!isLoggedIn || !userId) {
        alert("로그인이 필요합니다.");
        setShowLoginModal(true);
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
        isUploading={isUploading}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setUserId(session.user.id);
            setShowLoginModal(false);
            // 로그인 성공 후 동의 모달 열기
            setIsConsentModalOpen(true);
          } else {
            const savedUserId = localStorage.getItem("userId");
            if (savedUserId) {
              setIsLoggedIn(true);
              setUserId(savedUserId);
              setShowLoginModal(false);
              setIsConsentModalOpen(true);
            }
          }
        }}
      />
    </>
  );
}
