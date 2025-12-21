"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiCalendar, FiChevronDown, FiX } from "react-icons/fi";
import TravelScheduleCalendarModal from "./TravelScheduleCalendarModal";
import { formatDateWithDay } from "@/lib/utils/dateFormat";
import { trackTripDateSet } from "@/lib/gtm";

interface TravelScheduleBarProps {
  onScheduleChange?: (
    startDate: string | null,
    endDate: string | null,
    categoryId?: string | null
  ) => void;
  onModalStateChange?: (isOpen: boolean) => void;
  initialOpen?: boolean; // 외부에서 모달을 열 수 있도록 하는 prop
}

export default function TravelScheduleBar({
  onScheduleChange,
  onModalStateChange,
  initialOpen = false,
}: TravelScheduleBarProps) {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // initialOpen prop이 변경되면 모달 상태 업데이트
  useEffect(() => {
    if (initialOpen) {
      setIsModalOpen(true);
      if (onModalStateChange) {
        onModalStateChange(true);
      }
    }
  }, [initialOpen, onModalStateChange]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  // localStorage에서 기존 여행 기간 로드 (내 일정과 동기화)
  useEffect(() => {
    const loadTravelPeriod = (shouldNotifyParent: boolean = false) => {
      const travelPeriod = localStorage.getItem("travelPeriod");
      if (travelPeriod) {
        try {
          const period = JSON.parse(travelPeriod);
          if (period.start && period.end) {
            setSelectedStartDate(period.start);
            setSelectedEndDate(period.end);
            // 초기 로드 시에만 부모 컴포넌트에 알림 (무한 루프 방지)
            if (shouldNotifyParent && onScheduleChange) {
              onScheduleChange(period.start, period.end);
            }
          }
        } catch (e) {
          console.error("Failed to parse travelPeriod:", e);
        }
      }
    };

    // 초기 로드 시에만 부모에게 알림
    if (isInitialLoad.current) {
      loadTravelPeriod(true);
      isInitialLoad.current = false;
    } else {
      loadTravelPeriod(false);
    }

    // travelPeriodUpdated 이벤트 리스너 (초기화 시 부모에게도 알림)
    const handleTravelPeriodUpdate = () => {
      const travelPeriod = localStorage.getItem("travelPeriod");
      if (travelPeriod) {
        try {
          const period = JSON.parse(travelPeriod);
          if (period.start && period.end) {
            setSelectedStartDate(period.start);
            setSelectedEndDate(period.end);
            // 부모 컴포넌트에도 알림
            if (onScheduleChange) {
              onScheduleChange(period.start, period.end);
            }
          }
        } catch (e) {
          console.error("Failed to parse travelPeriod:", e);
        }
      } else {
        // travelPeriod가 삭제된 경우 (초기화)
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        // 부모 컴포넌트에도 알림
        if (onScheduleChange) {
          onScheduleChange(null, null);
        }
      }
    };

    window.addEventListener("travelPeriodUpdated", handleTravelPeriodUpdate);
    return () => {
      window.removeEventListener("travelPeriodUpdated", handleTravelPeriodUpdate);
    };
  }, []); // 의존성 배열에서 onScheduleChange 제거

  const handleModalOpen = () => {
    setIsModalOpen(true);
    if (onModalStateChange) {
      onModalStateChange(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (onModalStateChange) {
      onModalStateChange(false);
    }
  };

  const handleDateSelect = (
    startDate: string,
    endDate: string | null,
    categoryId?: string | null
  ) => {
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);

    // 여행 기간을 localStorage에 저장 (MySchedulePage와 연동)
    if (startDate && endDate) {
      const travelPeriod = {
        start: startDate,
        end: endDate,
      };
      localStorage.setItem("travelPeriod", JSON.stringify(travelPeriod));
      // 여행 기간 업데이트 이벤트 발생
      window.dispatchEvent(new Event("travelPeriodUpdated"));
      
      // GTM 이벤트: trip_date_set (날짜 확정 성공 후)
      trackTripDateSet(startDate, endDate);
    }

    if (onScheduleChange) {
      onScheduleChange(startDate, endDate, categoryId);
    }
  };

  const handleClearDates = (e: React.MouseEvent) => {
    e.stopPropagation(); // 모달이 열리지 않도록 클릭 이벤트 전파 방지
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    
    // localStorage에서 여행 기간 제거
    localStorage.removeItem("travelPeriod");
    // 여행 기간 업데이트 이벤트 발생
    window.dispatchEvent(new Event("travelPeriodUpdated"));
    
    // 부모 컴포넌트에 알림
    if (onScheduleChange) {
      onScheduleChange(null, null);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    return formatDateWithDay(dateStr, language);
  };

  const getDisplayText = (): string => {
    if (selectedStartDate && selectedEndDate) {
      return `${formatDisplayDate(selectedStartDate)} ~ ${formatDisplayDate(
        selectedEndDate
      )}`;
    } else if (selectedStartDate) {
      return `${formatDisplayDate(selectedStartDate)} ~ ${t("date.selectEndDate")}`;
    }
    return "";
  };

  return (
    <>
      <div className="relative mb-3">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <FiCalendar className="text-primary-main text-lg" />
        </div>
        <input
          type="text"
          value={getDisplayText()}
          placeholder={t("home.selectSchedule")}
          onClick={handleModalOpen}
          readOnly
          className={`w-full pl-10 ${selectedStartDate && selectedEndDate ? 'pr-20' : 'pr-10'} py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent cursor-pointer`}
        />
        {selectedStartDate && selectedEndDate && (
          <button
            onClick={handleClearDates}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="날짜 선택 취소"
          >
            <FiX className="text-gray-400 text-lg hover:text-gray-600" />
          </button>
        )}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <FiChevronDown className="text-gray-400 text-lg" />
        </div>
      </div>

      <TravelScheduleCalendarModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onDateSelect={handleDateSelect}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        onModalStateChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (onModalStateChange) {
            onModalStateChange(isOpen);
          }
        }}
      />
    </>
  );
}
