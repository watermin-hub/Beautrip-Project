"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import type { EntrySource } from "@/lib/gtm";
import CommunityWriteModal from "./CommunityWriteModal";

interface ReviewRequiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onWriteClick?: () => void; // 글쓰기 버튼 클릭 시 콜백 (선택사항, 없으면 CommunityWriteModal 열기)
  onLoginSuccess?: () => void; // 로그인 성공 후 원래 동작 실행 콜백
  entrySource?: EntrySource; // GA4 이벤트용 진입 경로 (선택사항)
}

export default function ReviewRequiredPopup({
  isOpen,
  onClose,
  onWriteClick,
  onLoginSuccess,
  entrySource,
}: ReviewRequiredPopupProps) {
  const { t } = useLanguage();
  const [showCommunityWriteModal, setShowCommunityWriteModal] = useState(false);

  const handleWriteClick = () => {
    if (onWriteClick) {
      onWriteClick();
    } else {
      // onWriteClick이 없으면 기본적으로 CommunityWriteModal 열기
      setShowCommunityWriteModal(true);
    }
    onClose();
  };

  // ✅ 팝업이 열려있을 때 body 스크롤 방지 및 뒤의 클릭 차단
  useEffect(() => {
    if (isOpen) {
      // body 스크롤 방지
      document.body.style.overflow = "hidden";
      // 뒤의 모든 클릭 이벤트 차단을 위한 이벤트 리스너 추가
      const handleOverlayClick = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // 오버레이를 클릭했을 때만 닫기
        if (e.target === e.currentTarget) {
          onClose();
        }
      };
      
      const overlay = document.querySelector('.review-popup-overlay');
      if (overlay) {
        overlay.addEventListener('click', handleOverlayClick, true);
      }
      
      return () => {
        document.body.style.overflow = "";
        if (overlay) {
          overlay.removeEventListener('click', handleOverlayClick, true);
        }
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="review-popup-overlay fixed inset-0 bg-black/60 z-[100] pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {t("common.reviewRequired")}
            </h3>
            <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
              {t("common.reviewRequiredMoreInfo")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleWriteClick}
                className="flex-1 py-2.5 px-4 bg-primary-main hover:bg-primary-main/90 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t("common.write")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 커뮤니티 글 작성 모달 */}
      <CommunityWriteModal
        isOpen={showCommunityWriteModal}
        onClose={() => setShowCommunityWriteModal(false)}
        onLoginSuccess={() => {
          setShowCommunityWriteModal(false);
          // 로그인 성공 후 원래 동작 실행
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }}
        entrySource={entrySource}
      />
    </>
  );
}

