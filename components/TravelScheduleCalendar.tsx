"use client";

import { useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiMapPin, FiTag } from "react-icons/fi";

interface ScheduleItem {
  id: number;
  date: string;
  title: string;
  location?: string;
  category?: string;
  time?: string;
}

// 샘플 일정 데이터
const sampleSchedules: ScheduleItem[] = [
  {
    id: 1,
    date: "2024-01-15",
    title: "피부미백 백옥주사",
    location: "셀이즈연세메디컬의원",
    category: "피부",
    time: "10:00",
  },
  {
    id: 2,
    date: "2024-01-16",
    title: "주름보톡스",
    location: "다이아의원",
    category: "보톡스/필러",
    time: "14:00",
  },
  {
    id: 3,
    date: "2024-01-18",
    title: "리쥬란 힐러",
    location: "비비의원",
    category: "재생/탄력",
    time: "11:00",
  },
];

export default function TravelScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  // 특정 날짜에 일정이 있는지 확인
  const hasSchedule = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return sampleSchedules.some((schedule) => schedule.date === dateStr);
  };

  // 특정 날짜의 일정 가져오기
  const getSchedulesForDate = (date: Date): ScheduleItem[] => {
    const dateStr = formatDate(date);
    return sampleSchedules.filter((schedule) => schedule.date === dateStr);
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

  // 선택된 날짜인지 확인
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    const dateStr = formatDate(date);
    return dateStr === selectedDate;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
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

  const selectedSchedules = selectedDate
    ? getSchedulesForDate(
        new Date(
          parseInt(selectedDate.split("-")[0]),
          parseInt(selectedDate.split("-")[1]) - 1,
          parseInt(selectedDate.split("-")[2])
        )
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiChevronLeft className="text-gray-700 text-xl" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {year}년 {monthNames[month]}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiChevronRight className="text-gray-700 text-xl" />
        </button>
      </div>

      {/* 캘린더 그리드 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {dayNames.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) return <div key={index} className="aspect-square"></div>;

            const isCurrentMonth = date.getMonth() === month;
            const hasScheduleOnDate = hasSchedule(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`aspect-square border-r border-b border-gray-100 p-1 transition-colors relative ${
                  !isCurrentMonth
                    ? "text-gray-300 bg-gray-50"
                    : isSelectedDate
                    ? "bg-primary-main/10 text-primary-main font-semibold"
                    : isTodayDate
                    ? "bg-primary-light/20 text-primary-main font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-sm">{date.getDate()}</span>
                  {hasScheduleOnDate && isCurrentMonth && (
                    <span className="w-1.5 h-1.5 bg-primary-main rounded-full mt-0.5"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜의 일정 목록 */}
      {selectedDate && selectedSchedules.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {selectedDate} 일정
          </h3>
          {selectedSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    {schedule.title}
                  </h4>
                  {schedule.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <FiMapPin className="text-primary-main" />
                      <span>{schedule.location}</span>
                    </div>
                  )}
                  {schedule.category && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FiTag className="text-primary-main" />
                      <span>{schedule.category}</span>
                    </div>
                  )}
                </div>
                {schedule.time && (
                  <div className="text-sm font-semibold text-primary-main">
                    {schedule.time}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDate && selectedSchedules.length === 0 && (
        <div className="mt-6 text-center py-8">
          <FiCalendar className="text-gray-300 text-4xl mx-auto mb-2" />
          <p className="text-gray-500 text-sm">선택한 날짜에 일정이 없습니다.</p>
        </div>
      )}

      {!selectedDate && (
        <div className="mt-6 text-center py-8">
          <FiCalendar className="text-gray-300 text-4xl mx-auto mb-2" />
          <p className="text-gray-500 text-sm">날짜를 선택하면 일정을 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}

