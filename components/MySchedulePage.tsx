"use client";

import { useState, useMemo } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiMapPin, FiTag, FiClock, FiArrowLeft, FiStar, FiHeart } from "react-icons/fi";
import { IoCheckmarkCircle } from "react-icons/io5";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

interface TravelPeriod {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

interface ProcedureSchedule {
  id: number;
  procedureDate: string; // 시술 날짜
  procedureName: string;
  hospital: string;
  category: string;
  recoveryDays: number; // 회복 기간 (일)
  procedureTime?: string;
  isRecovery?: boolean; // 회복 기간 표시용
}

// 예시 데이터: 일주일 여행 일정 (현재 연도 기준)
const getCurrentYear = () => new Date().getFullYear();
const EXAMPLE_TRAVEL_PERIOD: TravelPeriod = {
  start: `${getCurrentYear()}-12-15`,
  end: `${getCurrentYear()}-12-22`,
};

// 예시 시술 일정
const EXAMPLE_PROCEDURES: ProcedureSchedule[] = [
  {
    id: 1,
    procedureDate: `${getCurrentYear()}-12-16`,
    procedureName: "리쥬란 힐러",
    hospital: "강남비비의원",
    category: "피부관리",
    recoveryDays: 1,
    procedureTime: "10:00",
  },
  {
    id: 2,
    procedureDate: `${getCurrentYear()}-12-18`,
    procedureName: "인모드 리프팅",
    hospital: "압구정 클리닉",
    category: "윤곽/리프팅",
    recoveryDays: 2,
    procedureTime: "14:00",
  },
];

const clinicMarkers = [
  { id: 1, x: 15, y: 20, count: 12, label: "12개의 병원" },
  { id: 2, x: 75, y: 30, count: 4, label: "4개의 병원" },
  { id: 3, x: 40, y: 50, count: 22, label: "22개의 병원" },
  { id: 4, x: 60, y: 45, count: 9, label: "9개의 병원" },
  { id: 5, x: 25, y: 65, count: 15, label: "15개의 병원" },
  { id: 6, x: 80, y: 70, count: 7, label: "7개의 병원" },
];

const clinics = [
  {
    id: 1,
    name: "셀이즈연세메디컬의원",
    location: "남부터미널역",
    procedure: "피부미백 백옥주사",
    price: "5.5만원",
    rating: "10",
    reviewCount: "10+",
    likes: 2,
    image: "",
  },
  {
    id: 2,
    name: "장덕한방병원",
    location: "신사역",
    procedure: "재생/탄력",
    price: "16.5만원",
    rating: "10",
    reviewCount: "1+",
    likes: 3,
    image: "",
  },
  {
    id: 3,
    name: "비비의원",
    location: "강남역",
    procedure: "리쥬란 힐러",
    price: "12만원",
    rating: "9.8",
    reviewCount: "50+",
    likes: 45,
    image: "",
  },
  {
    id: 4,
    name: "다이아의원",
    location: "압구정역",
    procedure: "주름보톡스",
    price: "3.5만원",
    rating: "9.6",
    reviewCount: "100+",
    likes: 120,
    image: "",
  },
];

export default function MySchedulePage() {
  // 여행 기간 계산 (먼저 정의)
  const travelPeriod = EXAMPLE_TRAVEL_PERIOD;
  const travelStart = new Date(travelPeriod.start);
  const travelEnd = new Date(travelPeriod.end);

  const [activeTab, setActiveTab] = useState<"schedule" | "map">("schedule");
  // 초기 날짜를 현재 날짜로 설정
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // 날짜 포맷팅 함수 (먼저 정의)
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 시술 날짜와 회복 기간 계산
  const procedureDates = useMemo(() => {
    const dates: { [key: string]: ProcedureSchedule[] } = {};
    EXAMPLE_PROCEDURES.forEach((proc) => {
      const procDate = new Date(proc.procedureDate);
      const recoveryEnd = new Date(procDate);
      recoveryEnd.setDate(recoveryEnd.getDate() + proc.recoveryDays);

      // 시술 날짜
      const procDateStr = formatDate(procDate);
      if (!dates[procDateStr]) dates[procDateStr] = [];
      dates[procDateStr].push(proc);

      // 회복 기간 날짜들
      for (let i = 1; i <= proc.recoveryDays; i++) {
        const recoveryDate = new Date(procDate);
        recoveryDate.setDate(recoveryDate.getDate() + i);
        const recoveryDateStr = formatDate(recoveryDate);
        if (!dates[recoveryDateStr]) dates[recoveryDateStr] = [];
        dates[recoveryDateStr].push({ ...proc, isRecovery: true });
      }
    });
    return dates;
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 달력 계산
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 날짜가 여행 기간 내인지 확인 (시간 제거하고 날짜만 비교)
  const isTravelPeriod = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(travelStart.getFullYear(), travelStart.getMonth(), travelStart.getDate());
    const endOnly = new Date(travelEnd.getFullYear(), travelEnd.getMonth(), travelEnd.getDate());
    return dateOnly >= startOnly && dateOnly <= endOnly;
  };

  // 날짜가 시술 날짜인지 확인
  const isProcedureDate = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.some((p) => !p.isRecovery) || false;
  };

  // 날짜가 회복 기간인지 확인
  const isRecoveryPeriod = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.some((p) => p.isRecovery) || false;
  };

  // 날짜의 시술 정보 가져오기
  const getProceduresForDate = (date: Date): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.filter((p) => !p.isRecovery) || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return formatDate(date) === selectedDate;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(formatDate(date));
  };

  // 달력 날짜 배열 생성
  const calendarDays: (Date | null)[] = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push(new Date(year, month + 1, day));
  }

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const selectedProcedures = selectedDate
    ? getProceduresForDate(
        new Date(
          parseInt(selectedDate.split("-")[0]),
          parseInt(selectedDate.split("-")[1]) - 1,
          parseInt(selectedDate.split("-")[2])
        )
      )
    : [];

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">내 일정</h1>
      </div>

      {/* 여행 기간 표시 */}
      <div className="px-4 py-3 bg-primary-light/10 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <FiCalendar className="text-primary-main" />
          <span className="text-gray-700 font-medium">
            여행 기간: {travelPeriod.start} ~ {travelPeriod.end}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[96px] z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-6 px-4 py-3">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`text-sm font-medium transition-colors pb-1 relative ${
              activeTab === "schedule" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiCalendar className="text-lg" />
              <span>여행 일정</span>
            </div>
            {activeTab === "schedule" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`text-sm font-medium transition-colors pb-1 relative ${
              activeTab === "map" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiMapPin className="text-lg" />
              <span>지도</span>
            </div>
            {activeTab === "map" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "schedule" && (
        <div className="px-4 py-4">
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
              const isTravel = isTravelPeriod(date);
              const isProcedure = isProcedureDate(date);
              const isRecovery = isRecoveryPeriod(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);

              // 오늘 날짜는 배경색 없이 글자색만 강조
              // 여행 기간은 하늘색 배경
              // 시술 날짜는 빨간색 배경
              // 회복 기간은 주황색 배경
              let bgClass = "";
              let textClass = "";
              
              if (!isCurrentMonth) {
                bgClass = "bg-gray-50";
                textClass = "text-gray-300";
              } else if (isTodayDate) {
                bgClass = "";
                textClass = "text-primary-main font-bold";
              } else if (isSelectedDate) {
                bgClass = "bg-primary-main/20";
                textClass = "text-primary-main font-semibold";
              } else if (isProcedure) {
                bgClass = "bg-red-100";
                textClass = "text-red-700 font-semibold";
              } else if (isRecovery) {
                bgClass = "bg-orange-100";
                textClass = "text-orange-700";
              } else if (isTravel) {
                bgClass = "bg-sky-100";
                textClass = "text-sky-700";
              } else {
                bgClass = "";
                textClass = "text-gray-700";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square border-r border-b border-gray-100 p-1 transition-colors relative ${bgClass} ${textClass} hover:bg-gray-50`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm">{date.getDate()}</span>
                    {isProcedure && isCurrentMonth && (
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-0.5"></span>
                    )}
                    {isRecovery && !isProcedure && isCurrentMonth && (
                      <span className="w-2 h-2 bg-orange-400 rounded-full mt-0.5"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-sky-100 border border-sky-300 rounded"></div>
            <span className="text-gray-600">여행 기간</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">시술 날짜</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-gray-600">회복 기간</span>
          </div>
        </div>

        {/* 선택된 날짜의 시술 정보 */}
        {selectedDate && selectedProcedures.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedDate} 시술 정보
            </h3>
            {selectedProcedures.map((proc) => (
              <div
                key={proc.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {proc.procedureName}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <FiMapPin className="text-primary-main" />
                      <span>{proc.hospital}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <FiTag className="text-primary-main" />
                      <span>{proc.category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-primary-main font-medium">
                      <FiClock className="text-primary-main" />
                      <span>회복 기간: {proc.recoveryDays}일</span>
                    </div>
                  </div>
                  {proc.procedureTime && (
                    <div className="text-sm font-semibold text-primary-main">
                      {proc.procedureTime}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDate && selectedProcedures.length === 0 && (
          <div className="mt-6 text-center py-8">
            <FiCalendar className="text-gray-300 text-4xl mx-auto mb-2" />
            <p className="text-gray-500 text-sm">선택한 날짜에 시술 일정이 없습니다.</p>
          </div>
        )}
      </div>
      )}

      {activeTab === "map" && (
        <>
          {/* Map Header */}
          <div className="sticky top-[144px] z-30 bg-white border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <FiArrowLeft className="text-gray-700 text-xl" />
              </button>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.includes("appointment")
                      ? "bg-primary-main text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <IoCheckmarkCircle className="inline mr-1" />앱 예약 가능
                </button>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-[60vh] bg-gray-100 overflow-hidden">
            {/* Map Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
                  backgroundSize: "20px 20px",
                }}
              ></div>
            </div>

            {/* Subway Lines */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-green-500 opacity-60"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-red-500 opacity-60"></div>

            {/* Station Marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-20 h-20 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">신사역</span>
              </div>
            </div>

            {/* Clinic Cluster Markers */}
            {clinicMarkers.map((marker) => (
              <div
                key={marker.id}
                className="absolute bg-primary-main text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer hover:bg-primary-light transition-colors"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {marker.label}
              </div>
            ))}

            {/* Road Labels */}
            <div className="absolute top-10 left-4 text-xs text-gray-600 font-medium">
              강남대로
            </div>
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
              도산대로
            </div>
            <div className="absolute top-1/2 right-4 text-xs text-gray-600 font-medium">
              3호선
            </div>

            {/* Additional POIs */}
            <div className="absolute top-20 right-10 text-xs text-gray-500">
              GS25
            </div>
            <div className="absolute bottom-20 left-20 text-xs text-gray-500">
              스타벅스
            </div>
          </div>

          {/* Location Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">강남구 신사동</h3>
          </div>

          {/* Clinic Cards */}
          <div className="px-4 py-4">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Image */}
                  <div className="w-full h-40 bg-gradient-to-br from-primary-light/20 to-primary-main/30 relative">
                    {/* Placeholder for profile image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md">
                        <span className="text-primary-main text-3xl">👤</span>
                      </div>
                    </div>
                    {/* Procedure name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white font-semibold text-sm">
                        {clinic.procedure}
                      </p>
                    </div>
                    <button className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors relative">
                      {clinic.likes ? (
                        <>
                          <FiHeart className="text-primary-main fill-primary-main text-lg" />
                          {clinic.likes > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary-main text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                              {clinic.likes}
                            </span>
                          )}
                        </>
                      ) : (
                        <FiHeart className="text-gray-700 text-lg" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-gray-900 font-semibold text-sm mb-1">
                      {clinic.name}
                    </p>
                    {clinic.location && (
                      <p className="text-gray-500 text-xs mb-2">
                        {clinic.location}
                      </p>
                    )}
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {clinic.procedure}
                    </p>
                    <p className="text-gray-900 font-bold text-lg mb-3">
                      {clinic.price} VAT 포함
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                        <span className="text-gray-900 font-semibold text-sm">
                          {clinic.rating}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({clinic.reviewCount})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-primary-main hover:bg-[#2DB8A0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                        상세보기
                      </button>
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                        문의하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="pb-20">
        <BottomNavigation />
      </div>
    </div>
  );
}

