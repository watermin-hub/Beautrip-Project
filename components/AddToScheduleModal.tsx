"use client";

import { useState, useEffect, useCallback } from "react";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getRecoveryInfoByCategoryMid } from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface AddToScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  treatmentName: string;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  categoryMid?: string | null;
}

export default function AddToScheduleModal({
  isOpen,
  onClose,
  onDateSelect,
  treatmentName,
  selectedStartDate,
  selectedEndDate,
  categoryMid,
}: AddToScheduleModalProps) {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // localStorage에서 여행 기간 로드
  const [travelStartDate, setTravelStartDate] = useState<string | null>(null);
  const [travelEndDate, setTravelEndDate] = useState<string | null>(null);

  // 회복 기간 정보
  const [recoveryDays, setRecoveryDays] = useState<number>(0);

  // 여행 기간 로드 함수
  const loadTravelPeriod = useCallback(() => {
    // props로 전달된 기간이 있으면 우선 사용, 없으면 localStorage에서 로드
    if (selectedStartDate && selectedEndDate) {
      setTravelStartDate(selectedStartDate);
      setTravelEndDate(selectedEndDate);
    } else {
      const travelPeriod = localStorage.getItem("travelPeriod");
      if (travelPeriod) {
        try {
          const period = JSON.parse(travelPeriod);
          if (period.start && period.end) {
            setTravelStartDate(period.start);
            setTravelEndDate(period.end);

            // 선택된 기간의 시작일로 달력 이동
            const startDate = new Date(period.start);
            setCurrentDate(startDate);
          }
        } catch (e) {
          console.error("Failed to parse travelPeriod:", e);
        }
      }
    }
  }, [selectedStartDate, selectedEndDate]);

  // 회복 기간 정보 로드
  useEffect(() => {
    const loadRecoveryInfo = async () => {
      if (categoryMid) {
        try {
          const recoveryInfo = await getRecoveryInfoByCategoryMid(categoryMid);
          if (recoveryInfo) {
            // 권장체류일수가 있으면 그것을 사용, 없으면 recoveryMax 사용
            const days =
              recoveryInfo.recommendedStayDays > 0
                ? recoveryInfo.recommendedStayDays
                : recoveryInfo.recoveryMax;
            setRecoveryDays(days);
          }
        } catch (error) {
          console.error("Failed to load recovery info:", error);
          setRecoveryDays(0);
        }
      } else {
        setRecoveryDays(0);
      }
    };

    if (isOpen && categoryMid) {
      loadRecoveryInfo();
    }
  }, [isOpen, categoryMid]);

  useEffect(() => {
    if (isOpen) {
      loadTravelPeriod();
    }
  }, [isOpen, loadTravelPeriod]);

  useEffect(() => {
    // travelPeriodUpdated 이벤트 리스너
    const handleTravelPeriodUpdate = () => {
      loadTravelPeriod();
    };

    window.addEventListener("travelPeriodUpdated", handleTravelPeriodUpdate);
    return () => {
      window.removeEventListener(
        "travelPeriodUpdated",
        handleTravelPeriodUpdate
      );
    };
  }, [loadTravelPeriod]);

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

  // 선택된 여행 기간 범위인지 확인
  const isInTravelRange = (date: Date): boolean => {
    if (!travelStartDate || !travelEndDate) return false;
    const dateStr = formatDate(date);
    const start = new Date(travelStartDate);
    const end = new Date(travelEndDate);
    const current = new Date(dateStr);
    return current >= start && current <= end;
  };

  // 여행 시작일인지 확인
  const isTravelStartDate = (date: Date): boolean => {
    if (!travelStartDate) return false;
    return formatDate(date) === travelStartDate;
  };

  // 여행 종료일인지 확인
  const isTravelEndDate = (date: Date): boolean => {
    if (!travelEndDate) return false;
    return formatDate(date) === travelEndDate;
  };

  // 회복 기간 범위인지 확인
  const isInRecoveryRange = (date: Date): boolean => {
    if (!selectedDate || recoveryDays === 0) return false;
    const dateStr = formatDate(date);
    const procedureDate = new Date(selectedDate);
    const current = new Date(dateStr);

    // 시술 날짜 다음 날부터 회복 기간 시작 (MySchedulePage와 동일한 로직)
    // recoveryDays가 3이면: 다음날(1), 그다음날(2), 마지막날(3) = 총 3일
    const recoveryStartDate = new Date(procedureDate);
    recoveryStartDate.setDate(recoveryStartDate.getDate() + 1);

    // 회복 기간 종료일 계산 (시술일 + recoveryDays)
    const recoveryEndDate = new Date(procedureDate);
    recoveryEndDate.setDate(recoveryEndDate.getDate() + recoveryDays);

    // 날짜 비교 시 시간 제거
    recoveryStartDate.setHours(0, 0, 0, 0);
    recoveryEndDate.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    return current >= recoveryStartDate && current <= recoveryEndDate;
  };

  // 회복 기간이 여행 기간 밖에 있는지 확인
  const isRecoveryOutsideTravel = (date: Date): boolean => {
    if (!selectedDate || recoveryDays === 0 || !travelEndDate) return false;
    if (!isInRecoveryRange(date)) return false;

    const dateStr = formatDate(date);
    const travelEnd = new Date(travelEndDate);
    const current = new Date(dateStr);

    travelEnd.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    // 회복 기간이 여행 종료일보다 늦으면 경고
    return current > travelEnd;
  };

  // 회복 기간이 여행 기간을 벗어나는지 확인 (전체적으로)
  const isRecoveryPeriodOutsideTravel = (): boolean => {
    if (!selectedDate || recoveryDays === 0 || !travelEndDate) return false;

    const procedureDate = new Date(selectedDate);
    const recoveryEndDate = new Date(procedureDate);
    recoveryEndDate.setDate(recoveryEndDate.getDate() + recoveryDays);
    const travelEnd = new Date(travelEndDate);

    recoveryEndDate.setHours(0, 0, 0, 0);
    travelEnd.setHours(0, 0, 0, 0);

    // 회복 기간 종료일이 여행 종료일보다 늦으면 경고
    return recoveryEndDate > travelEnd;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    const clickedDate = new Date(dateStr);

    // 과거 날짜는 선택 불가
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      return;
    }

    setSelectedDate(dateStr);
  };

  // 확인 버튼 클릭
  const handleConfirm = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
      onClose();
      setSelectedDate(null);
    }
  };

  // 달력 날짜 배열 생성
  const calendarDays: (Date | null)[] = [];

  // 빈 칸 추가 (첫 주 시작일 전)
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      {/* 모달 */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl w-full max-w-md shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{t("schedule.addToSchedule")}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiX className="text-gray-700 text-xl" />
            </button>
          </div>

          {/* 시술명 표시 */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">시술명</p>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {treatmentName}
            </p>
          </div>

          {/* 달력 */}
          <div className="p-4">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <FiChevronLeft className="text-gray-700" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {year}년 {month + 1}월
              </h3>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <FiChevronRight className="text-gray-700" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    index === 0
                      ? "text-red-500"
                      : index === 6
                      ? "text-blue-500"
                      : "text-gray-600"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="aspect-square" />;
                }

                const dateStr = formatDate(date);
                const isSelected = selectedDate === dateStr;
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                const dayOfWeek = date.getDay();
                const inTravelRange = isInTravelRange(date);
                const isTravelStart = isTravelStartDate(date);
                const isTravelEnd = isTravelEndDate(date);
                const isTodayDate = isToday(date);
                const inRecoveryRange = isInRecoveryRange(date);
                const recoveryOutsideTravel = isRecoveryOutsideTravel(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    disabled={isPast}
                    className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors relative ${
                      isPast
                        ? "text-gray-300 cursor-not-allowed bg-gray-50"
                        : isSelected
                        ? "bg-pink-500 text-white font-semibold z-10 shadow-md"
                        : recoveryOutsideTravel
                        ? "bg-orange-100 text-orange-700 border-2 border-orange-400"
                        : inRecoveryRange
                        ? "bg-purple-100 text-purple-700"
                        : isTravelStart || isTravelEnd
                        ? "bg-sky-100 text-sky-700 font-semibold"
                        : inTravelRange
                        ? "bg-sky-100 text-sky-700"
                        : isTodayDate
                        ? "text-primary-main font-semibold"
                        : dayOfWeek === 0
                        ? "text-red-500 hover:bg-red-50"
                        : dayOfWeek === 6
                        ? "text-blue-500 hover:bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 경고 메시지 - 회복 기간이 여행 기간을 벗어나는 경우 (항상 공간 확보) */}
          <div className="px-4 pb-3 h-[100px] flex items-start">
            {selectedDate && isRecoveryPeriodOutsideTravel() ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 w-full">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-800 mb-1">
                      회복 기간이 여행 기간을 벗어납니다
                    </p>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      선택한 시술의 회복 기간이 여행 종료일 이후까지 이어집니다.
                      여행 기간 내에 회복을 완료할 수 있도록 일정을
                      조정해주세요.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 하단 버튼 */}
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                selectedDate
                  ? "bg-primary-main text-white hover:bg-primary-main/90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("schedule.add")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
