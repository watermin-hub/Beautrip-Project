"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface TravelScheduleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (
    startDate: string,
    endDate: string | null,
    categoryId?: string | null
  ) => void;
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
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<string | null>(
    selectedStartDate || null
  );
  const [tempEndDate, setTempEndDate] = useState<string | null>(
    selectedEndDate || null
  );

  // 모달 상태 변경 알림 (렌더링 후 실행) - hooks는 항상 같은 순서로 실행되어야 함
  useEffect(() => {
    if (!isOpen) return;

    if (onModalStateChange) {
      onModalStateChange(true);
    }

    return () => {
      if (onModalStateChange) {
        onModalStateChange(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // onModalStateChange는 의존성에서 제외 (무한 루프 방지)

  // 모달이 열릴 때 body scroll 막기 및 전역 이벤트 발생
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // 모달이 열렸음을 알리는 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("calendarModalOpen", { detail: { isOpen: true } })
      );
    } else {
      document.body.style.overflow = "";
      window.dispatchEvent(
        new CustomEvent("calendarModalOpen", { detail: { isOpen: false } })
      );
    }
    return () => {
      document.body.style.overflow = "";
      window.dispatchEvent(
        new CustomEvent("calendarModalOpen", { detail: { isOpen: false } })
      );
    };
  }, [isOpen]);

  // early return은 모든 hooks 호출 후에만 가능
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
      onDateSelect(tempStartDate, tempEndDate, null);
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

  // 언어별 월 이름
  const monthNames: Record<string, string[]> = {
    KR: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    EN: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    JP: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    CN: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  };

  // 언어별 요일 이름
  const dayNames: Record<string, string[]> = {
    KR: ["일", "월", "화", "수", "목", "금", "토"],
    EN: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    JP: ["日", "月", "火", "水", "木", "金", "土"],
    CN: ["日", "一", "二", "三", "四", "五", "六"],
  };

  // 언어별 "년" 표시
  const yearLabel: Record<string, string> = {
    KR: "년",
    EN: "",
    JP: "年",
    CN: "年",
  };

  const currentMonthNames = monthNames[language] || monthNames.KR;
  const currentDayNames = dayNames[language] || dayNames.KR;
  const currentYearLabel = yearLabel[language] || yearLabel.KR;

  return (
    <>
      {/* 모달 배경 - 헤더와 네비게이션을 포함한 전체 화면 덮기 */}
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={handleClose} />
      {/* 모달 컨텐츠 */}
      <div className="fixed inset-0 z-[71] flex items-center justify-center pointer-events-none">
        <div
          className="bg-white rounded-2xl w-full max-w-xs mx-4 max-h-[85vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-3 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-gray-900">
              {t("calendar.title")}
            </h2>
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
                {language === "EN" 
                  ? `${currentMonthNames[month]} ${year}`
                  : `${year}${currentYearLabel} ${currentMonthNames[month]}`
                }
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
                {currentDayNames.map((day) => (
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
                  if (!date)
                    return <div key={index} className="aspect-square"></div>;

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
                          ? "text-primary-main font-bold"
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
                  <p className="text-[10px] text-gray-600 mb-0.5">
                    {t("calendar.startDate")}
                  </p>
                  <p className="text-xs font-semibold text-primary-main">
                    {tempStartDate || t("calendar.notSelected")}
                  </p>
                </div>
                <div className="flex-1 p-2 bg-primary-light/10 rounded-lg">
                  <p className="text-[10px] text-gray-600 mb-0.5">
                    {t("calendar.endDate")}
                  </p>
                  <p className="text-xs font-semibold text-primary-main">
                    {tempEndDate || t("calendar.notSelected")}
                  </p>
                </div>
              </div>

              {/* 확인 버튼 (시작일과 종료일이 모두 선택된 경우 표시) */}
              {tempStartDate && tempEndDate && (
                <button
                  onClick={handleConfirm}
                  className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  {t("common.confirm")}
                </button>
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
    </>
  );
}
