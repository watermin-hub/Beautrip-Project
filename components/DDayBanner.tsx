"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { FiCalendar, FiChevronRight } from "react-icons/fi";

export default function DDayBanner() {
  const { t } = useLanguage();
  // TODO: 실제 사용자 데이터에서 가져오기
  const upcomingDate = new Date();
  upcomingDate.setDate(upcomingDate.getDate() + 5); // 5일 후 예시
  const today = new Date();
  const diffTime = upcomingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // D-Day가 지난 경우 표시하지 않음
  if (diffDays <= 0) return null;

  return (
    <div className="fixed bottom-24 right-0 left-0 z-40 pointer-events-none max-w-md mx-auto">
      <div className="pointer-events-auto absolute bottom-0 right-4 bg-gradient-to-br from-primary-main to-primary-light text-white rounded-2xl p-4 shadow-lg w-[180px] animate-bounce">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-white" />
          <span className="text-xs font-semibold">{t("dday.title")}</span>
        </div>
        <button className="text-white/80 hover:text-white">
          <FiChevronRight className="text-sm" />
        </button>
      </div>
      <div className="mb-2">
        <p className="text-2xl font-bold">{diffDays}</p>
        <p className="text-xs text-white/90">{t("dday.daysUntil")}</p>
      </div>
      <p className="text-xs text-white/80">압구정 클리닉</p>
      </div>
    </div>
  );
}

