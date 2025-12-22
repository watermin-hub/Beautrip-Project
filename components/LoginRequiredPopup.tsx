"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import LoginModal from "./LoginModal";
import { useState } from "react";

interface LoginRequiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginRequiredPopup({
  isOpen,
  onClose,
  onLoginSuccess,
}: LoginRequiredPopupProps) {
  const { t } = useLanguage();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 로그인 모달이 열리면 팝업 닫기
  const handleOpenLogin = () => {
    // 로그인 모달을 먼저 열고 팝업 닫기
    // 이렇게 하면 팝업이 즉시 사라지고 로그인 모달만 보임
    setShowLoginModal(true);
    onClose();
  };

  if (!isOpen && !showLoginModal) return null;

  return (
    <>
      {/* 팝업이 열려있고 로그인 모달이 닫혀있을 때만 렌더링 */}
      {isOpen && !showLoginModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl pointer-events-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {t("common.loginRequired")}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t("common.loginRequiredMoreInfo")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleOpenLogin}
                    className="flex-1 py-2.5 px-4 bg-primary-main hover:bg-primary-main/90 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.login")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }}
      />
    </>
  );
}
