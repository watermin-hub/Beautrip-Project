"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface TravelScheduleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (startDate: string, endDate: string | null, categoryId?: string | null) => void;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  onModalStateChange?: (isOpen: boolean) => void;
}

export default function TravelScheduleCalendarModal({
  isOpen,
  onClose,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
  onModalStateChange,
}: TravelScheduleCalendarModalProps) {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<string | null>(selectedStartDate || null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(selectedEndDate || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const MAIN_CATEGORIES = [
    { id: "skin", labelKey: "home.category.skin", icon: "😊" },
    { id: "scar", labelKey: "home.category.scar", icon: "✨" },
    { id: "slim", labelKey: "home.category.slim", icon: "💆‍♀️" },
    { id: "nose", labelKey: "home.category.nose", icon: "👃" },
    { id: "eyes", labelKey: "home.category.eyes", icon: "👀" },
    { id: "inject", labelKey: "home.category.inject", icon: "💉" },
    { id: "body", labelKey: "home.category.body", icon: "💪" },
    { id: "other", labelKey: "home.category.other", icon: "⋯" },
  ];

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 달력의 첫 번째 날짜와 마지막 날짜 계산
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 선택된 날짜 범위인지 확인
  const isInRange = (date: Date): boolean => {
    if (!tempStartDate) return false;
    const dateStr = formatDate(date);
    const start = new Date(tempStartDate);
    const end = tempEndDate ? new Date(tempEndDate) : null;
    const current = new Date(dateStr);
    
    if (end) {
      return current >= start && current <= end;
    }
    return dateStr === tempStartDate;
  };

  // 시작일인지 확인
  const isStartDate = (date: Date): boolean => {
    if (!tempStartDate) return false;
    return formatDate(date) === tempStartDate;
  };

  // 종료일인지 확인
  const isEndDate = (date: Date): boolean => {
    if (!tempEndDate) return false;
    return formatDate(date) === tempEndDate;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    const clickedDate = new Date(dateStr);
    
    // 과거 날짜는 선택 불가
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (clickedDate < today) return;

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // 시작일 선택 또는 재선택
      setTempStartDate(dateStr);
      setTempEndDate(null);
    } else if (tempStartDate && !tempEndDate) {
      // 종료일 선택
      const start = new Date(tempStartDate);
      if (clickedDate < start) {
        // 종료일이 시작일보다 이전이면 시작일로 변경
        setTempStartDate(dateStr);
        setTempEndDate(null);
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  // 확인 버튼 클릭
  const handleConfirm = () => {
    if (tempStartDate && tempEndDate) {
      onDateSelect(tempStartDate, tempEndDate, selectedCategoryId);
      if (onModalStateChange) {
        onModalStateChange(false);
      }
      onClose();
    }
  };

  // 모달 닫기 시 상태 업데이트
  const handleClose = () => {
    if (onModalStateChange) {
      onModalStateChange(false);
    }
    onClose();
  };

  // 달력 날짜 배열 생성
  const calendarDays: (Date | null)[] = [];
  
  // 이전 달의 마지막 날들 추가
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i));
  }

  // 현재 달의 날들 추가
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // 다음 달의 첫 날들 추가 (총 42개 셀을 채우기 위해)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push(new Date(year, month + 1, day));
  }

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // 모달 상태 변경 알림
  if (onModalStateChange && isOpen) {
    onModalStateChange(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-xs mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">{t("calendar.title")}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="text-gray-700 text-xl" />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-2.5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiChevronLeft className="text-gray-700 text-xl" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {year}년 {monthNames[month]}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiChevronRight className="text-gray-700 text-xl" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[9px] font-semibold text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                if (!date) return <div key={index} className="aspect-square"></div>;

                const isCurrentMonth = date.getMonth() === month;
                const isTodayDate = isToday(date);
                const inRange = isInRange(date);
                const isStart = isStartDate(date);
                const isEnd = isEndDate(date);

                // 과거 날짜는 비활성화
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = date < today;

                return (
                  <button
                    key={index}
                    onClick={() => !isPast && handleDateClick(date)}
                    disabled={isPast}
                    className={`aspect-square border-r border-b border-gray-100 p-0.5 transition-colors relative ${
                      !isCurrentMonth
                        ? "text-gray-300 bg-gray-50"
                        : isPast
                        ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                        : isStart || isEnd
                        ? "bg-primary-main text-white font-semibold"
                        : inRange
                        ? "bg-primary-main/20 text-primary-main font-semibold"
                        : isTodayDate
                        ? "bg-primary-light/20 text-primary-main font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs">{date.getDate()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Range Display */}
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-primary-light/10 rounded-lg">
                <p className="text-[10px] text-gray-600 mb-0.5">{t("calendar.startDate")}</p>
                <p className="text-xs font-semibold text-primary-main">
                  {tempStartDate || t("calendar.notSelected")}
                </p>
              </div>
              <div className="flex-1 p-2 bg-primary-light/10 rounded-lg">
                <p className="text-[10px] text-gray-600 mb-0.5">{t("calendar.endDate")}</p>
                <p className="text-xs font-semibold text-primary-main">
                  {tempEndDate || t("calendar.notSelected")}
                </p>
              </div>
            </div>
            
            {/* 카테고리 선택 (시작일과 종료일이 모두 선택된 경우 표시) */}
            {tempStartDate && tempEndDate && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">{t("calendar.selectCategory")}</p>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {MAIN_CATEGORIES.map((category) => {
                    const isActive = selectedCategoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`flex flex-col items-center justify-center w-[60px] h-[60px] rounded-lg border text-[10px] transition-colors flex-shrink-0 ${
                          isActive
                            ? "bg-primary-main/10 border-primary-main text-primary-main"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base mb-0.5">{category.icon}</span>
                        <span className="text-[9px] leading-tight text-center">
                          {t(category.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedCategoryId && (
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {t("common.confirm")}
                  </button>
                )}
              </div>
            )}
            
            {tempStartDate && !tempEndDate && (
              <button
                onClick={() => {}}
                disabled
                className="w-full bg-gray-200 text-gray-500 py-2 rounded-lg text-xs font-semibold transition-colors cursor-not-allowed"
              >
                {t("calendar.selectEndDate")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

