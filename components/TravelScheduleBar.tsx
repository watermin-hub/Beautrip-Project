"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import TravelScheduleCalendarModal from "./TravelScheduleCalendarModal";

interface TravelScheduleBarProps {
  onScheduleChange?: (
    startDate: string | null,
    endDate: string | null,
    categoryId?: string | null
  ) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

export default function TravelScheduleBar({
  onScheduleChange,
  onModalStateChange,
}: TravelScheduleBarProps) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

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
    if (onScheduleChange) {
      onScheduleChange(startDate, endDate, categoryId);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = dayNames[date.getDay()];
    return `${month}월 ${day}일 (${dayName})`;
  };

  const getDisplayText = (): string => {
    if (selectedStartDate && selectedEndDate) {
      return `${formatDisplayDate(selectedStartDate)} ~ ${formatDisplayDate(
        selectedEndDate
      )}`;
    } else if (selectedStartDate) {
      return `${formatDisplayDate(selectedStartDate)} ~ 종료일 선택`;
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
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent cursor-pointer"
        />
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
