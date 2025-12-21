"use client";

import { Suspense } from "react";
import ConcernPostForm from "@/components/ConcernPostForm";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ConcernPostWritePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleBack = () => {
    router.push("/community/write");
  };

  const handleSubmit = () => {
    // 후기 목록 새로고침을 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent("reviewAdded"));
    router.push("/community");
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 sticky top-[48px] bg-white z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {t("writePage.concernPostWrite")}
          </h2>
        </div>
      </div>

      {/* Form - 양옆 간격과 상단 여백 추가 */}
      <div className="px-6 pt-16 pb-24">
        <Suspense
          fallback={
            <div className="p-4 text-center text-gray-500">로딩 중...</div>
          }
        >
          <ConcernPostForm onBack={handleBack} onSubmit={handleSubmit} />
        </Suspense>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
