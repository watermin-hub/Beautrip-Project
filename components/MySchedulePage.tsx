"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiTag,
  FiClock,
  FiArrowLeft,
  FiStar,
  FiHeart,
  FiEdit2,
} from "react-icons/fi";
import { IoCheckmarkCircle } from "react-icons/io5";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import TravelScheduleCalendarModal from "./TravelScheduleCalendarModal";
import { getRecoveryInfoByCategoryMid } from "@/lib/api/beautripApi";

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
  categoryMid?: string | null; // 중분류 (회복 기간 정보 가져오기용)
  recoveryDays: number; // 회복 기간 (일) - 회복기간_max 기준
  recoveryText?: string | null; // 회복 기간 텍스트 (1~3, 4~7, 8~14, 15~21)
  recoveryGuides?: Record<string, string | null>; // 회복 가이드 범위별 텍스트
  procedureTime?: string;
  isRecovery?: boolean; // 회복 기간 표시용
  recoveryDayIndex?: number; // 회복 기간 며칠째인지 (1 기반)
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

// 회복 카드 컴포넌트 (categoryMid로 recoveryText 동적 로드)
function RecoveryCardComponent({
  rec,
  isOutsideTravel,
}: {
  rec: ProcedureSchedule;
  isOutsideTravel: boolean;
}) {
  const [recoveryText, setRecoveryText] = useState<string | null>(rec.recoveryText || null);
  const [loadingRecoveryText, setLoadingRecoveryText] = useState(false);

  // 회복일차 범위별 텍스트 선택
  const getGuideForDay = (day?: number) => {
    if (!rec.recoveryGuides) return null;
    if (!day || day < 1) return null;

    const guides = rec.recoveryGuides;

    // 기본 구간: 1~3, 4~7, 8~14, 15~21
    // 일부 카테고리는 특정 구간 텍스트만 있는 경우가 있어
    // 해당 구간이 비어 있으면 인접 구간 텍스트를 순차적으로 fallback 합니다.
    if (day <= 3) {
      return (
        guides["1~3"] ||
        guides["4~7"] ||
        guides["8~14"] ||
        guides["15~21"] ||
        null
      );
    }
    if (day <= 7) {
      return (
        guides["4~7"] ||
        guides["1~3"] ||
        guides["8~14"] ||
        guides["15~21"] ||
        null
      );
    }
    if (day <= 14) {
      return (
        guides["8~14"] ||
        guides["4~7"] ||
        guides["1~3"] ||
        guides["15~21"] ||
        null
      );
    }
    if (day <= 21) {
      return (
        guides["15~21"] ||
        guides["8~14"] ||
        guides["4~7"] ||
        guides["1~3"] ||
        null
      );
    }
    return null;
  };

  // recoveryText가 없고 categoryMid가 있으면 동적으로 가져오기
  useEffect(() => {
    if (!recoveryText && rec.categoryMid && !loadingRecoveryText) {
      setLoadingRecoveryText(true);
      getRecoveryInfoByCategoryMid(rec.categoryMid)
        .then((recoveryInfo) => {
          if (recoveryInfo?.recoveryText) {
            setRecoveryText(recoveryInfo.recoveryText);
          }
          if (recoveryInfo?.recoveryGuides && !rec.recoveryGuides) {
            rec.recoveryGuides = recoveryInfo.recoveryGuides;
          }
        })
        .catch((error) => {
          console.warn("회복 기간 정보 로드 실패:", error);
        })
        .finally(() => {
          setLoadingRecoveryText(false);
        });
    }
  }, [rec.categoryMid, recoveryText, loadingRecoveryText]);

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm ${
        isOutsideTravel
          ? "bg-amber-50 border-amber-200"
          : "bg-green-50 border-green-200"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-gray-900">
              {rec.procedureName}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isOutsideTravel
                  ? "bg-amber-200 text-amber-800"
                  : "bg-green-200 text-green-800"
              }`}
            >
              회복 기간
            </span>
            {isOutsideTravel && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-300 text-amber-900">
                ⚠️ 여행 기간 밖
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <FiMapPin
              className={isOutsideTravel ? "text-amber-600" : "text-green-600"}
            />
            <span>{rec.hospital}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <FiTag
              className={isOutsideTravel ? "text-amber-600" : "text-green-600"}
            />
            <span>{rec.category}</span>
          </div>
          {/* 회복 일수 정보 표시 */}
          {rec.recoveryDays > 0 && (
            <div
              className={`flex items-center gap-1 text-sm font-medium mb-2 ${
                isOutsideTravel ? "text-amber-700" : "text-green-700"
              }`}
            >
              <FiClock
                className={isOutsideTravel ? "text-amber-600" : "text-green-600"}
              />
              <span>회복 기간: {rec.recoveryDays}일</span>
            </div>
          )}
          {/* 회복 가이드 표시 (해당 일차에 맞는 텍스트 우선) */}
          {(getGuideForDay(rec.recoveryDayIndex) || recoveryText) && (
            <div
              className={`text-xs text-gray-700 rounded-lg p-3 mt-2 border ${
                isOutsideTravel
                  ? "bg-white/60 border-amber-100"
                  : "bg-white/60 border-green-100"
              }`}
            >
              <p
                className={`font-semibold mb-1.5 ${
                  isOutsideTravel ? "text-amber-800" : "text-green-800"
                }`}
              >
                회복 가이드
              </p>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {getGuideForDay(rec.recoveryDayIndex) || recoveryText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MySchedulePage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "map">("schedule");
  // 초기 날짜를 현재 날짜로 설정
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);

  // 로컬스토리지에서 여행 기간 로드
  const [travelPeriod, setTravelPeriod] = useState<TravelPeriod | null>(null);

  useEffect(() => {
    const loadTravelPeriod = () => {
      const saved = localStorage.getItem("travelPeriod");
      if (saved) {
        try {
          const period = JSON.parse(saved);
          setTravelPeriod(period);
        } catch (error) {
          console.error("여행 기간 로드 실패:", error);
          setTravelPeriod(null);
        }
      } else {
        // 저장된 기간이 없으면 null (예시 데이터 사용 안 함)
        setTravelPeriod(null);
      }
    };

    loadTravelPeriod();

    // 여행 기간 변경 이벤트 리스너
    window.addEventListener("travelPeriodUpdated", loadTravelPeriod);
    return () => {
      window.removeEventListener("travelPeriodUpdated", loadTravelPeriod);
    };
  }, []);

  // 여행 기간 저장
  const handleTravelPeriodSave = (
    startDate: string,
    endDate: string | null
  ) => {
    if (!endDate) {
      alert("종료일을 선택해주세요.");
      return;
    }

    const period: TravelPeriod = {
      start: startDate,
      end: endDate,
    };

    localStorage.setItem("travelPeriod", JSON.stringify(period));
    setTravelPeriod(period);
    setIsTravelModalOpen(false);

    // 여행 기간 업데이트 이벤트 발생
    window.dispatchEvent(new Event("travelPeriodUpdated"));

    alert("여행 일정이 저장되었습니다!");
  };

  // 여행 기간 계산
  const travelStart = travelPeriod ? new Date(travelPeriod.start) : null;
  const travelEnd = travelPeriod ? new Date(travelPeriod.end) : null;

  // 날짜 포맷팅 함수 (먼저 정의)
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 로컬스토리지에서 일정 데이터 로드
  const [savedSchedules, setSavedSchedules] = useState<ProcedureSchedule[]>([]);

  useEffect(() => {
    const loadSchedules = () => {
      const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");
      // 로컬스토리지 데이터를 ProcedureSchedule 형식으로 변환
      const convertedSchedules: ProcedureSchedule[] = schedules.map(
        (s: any) => ({
          id: s.id,
          procedureDate: s.procedureDate,
          procedureName: s.procedureName,
          hospital: s.hospital,
          category: s.category,
          categoryMid: s.categoryMid || null,
          recoveryDays: s.recoveryDays || 0,
          recoveryText: s.recoveryText || null, // 회복 기간 텍스트
          recoveryGuides: s.recoveryGuides || undefined, // 회복 가이드 범위별 텍스트
          procedureTime: s.procedureTime ? `${s.procedureTime}분` : undefined,
        })
      );

      // 예시 데이터 제거 - 로컬스토리지 데이터만 사용
      setSavedSchedules(convertedSchedules);
    };

    loadSchedules();

    // 일정 추가 이벤트 리스너
    window.addEventListener("scheduleAdded", loadSchedules);
    return () => {
      window.removeEventListener("scheduleAdded", loadSchedules);
    };
  }, []);

  // 저장된 일정에 회복정보가 비어있을 때 category_mid로 보강 (권장체류일수/회복가이드)
  useEffect(() => {
    const needsUpdate = savedSchedules.some(
      (s) =>
        s.categoryMid &&
        (s.recoveryDays === 0 || !s.recoveryText || !s.recoveryGuides)
    );
    if (!needsUpdate) return;

    let cancelled = false;
    (async () => {
      const updated = await Promise.all(
        savedSchedules.map(async (s) => {
          if (
            s.categoryMid &&
            (s.recoveryDays === 0 || !s.recoveryText || !s.recoveryGuides)
          ) {
            const info = await getRecoveryInfoByCategoryMid(s.categoryMid);
            if (info) {
              return {
                ...s,
                recoveryDays:
                  info.recommendedStayDays > 0
                    ? info.recommendedStayDays
                    : info.recoveryMax || s.recoveryDays,
                recoveryText: s.recoveryText ?? info.recoveryText,
                recoveryGuides: s.recoveryGuides ?? info.recoveryGuides,
              };
            }
          }
          return s;
        })
      );

      if (cancelled) return;

      const changed = updated.some(
        (s, idx) =>
          s.recoveryDays !== savedSchedules[idx]?.recoveryDays ||
          s.recoveryText !== savedSchedules[idx]?.recoveryText
      );

      if (changed) {
        setSavedSchedules(updated);
        localStorage.setItem("schedules", JSON.stringify(updated));
        // 회복 정보 업데이트 이벤트
        window.dispatchEvent(new Event("scheduleAdded"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [savedSchedules]);

  // 시술 날짜와 회복 기간 계산 (당일 포함)
  const procedureDates = useMemo(() => {
    const dates: { [key: string]: ProcedureSchedule[] } = {};
    savedSchedules.forEach((proc) => {
      const procDate = new Date(proc.procedureDate);
      
      // 시술 날짜
      const procDateStr = formatDate(procDate);
      if (!dates[procDateStr]) dates[procDateStr] = [];
      dates[procDateStr].push(proc);

      // 회복 기간 날짜들 (시술 당일 제외)
      // recoveryDays가 3이면: 다음날(1), 그다음날(2), 마지막날(3) = 총 3일 (당일 제외)
      // 시술 당일은 시술로만 표시, 회복 기간은 다음날부터 표시
      for (let i = 1; i <= proc.recoveryDays; i++) {
        const recoveryDate = new Date(procDate);
        recoveryDate.setDate(recoveryDate.getDate() + i);
        const recoveryDateStr = formatDate(recoveryDate);
        
        if (!dates[recoveryDateStr]) dates[recoveryDateStr] = [];
        dates[recoveryDateStr].push({
          ...proc,
          isRecovery: true,
          recoveryDayIndex: i,
        });
      }
    });
    return dates;
  }, [savedSchedules]);

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
    if (!travelStart || !travelEnd) return false;
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const startOnly = new Date(
      travelStart.getFullYear(),
      travelStart.getMonth(),
      travelStart.getDate()
    );
    const endOnly = new Date(
      travelEnd.getFullYear(),
      travelEnd.getMonth(),
      travelEnd.getDate()
    );
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

  // 회복 기간이 여행 일정 밖인지 확인
  const isRecoveryOutsideTravel = (date: Date): boolean => {
    if (!travelStart || !travelEnd) return false;
    const dateStr = formatDate(date);
    const recoveryItems = procedureDates[dateStr]?.filter((p) => p.isRecovery) || [];
    if (recoveryItems.length === 0) return false;

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const startOnly = new Date(
      travelStart.getFullYear(),
      travelStart.getMonth(),
      travelStart.getDate()
    );
    const endOnly = new Date(
      travelEnd.getFullYear(),
      travelEnd.getMonth(),
      travelEnd.getDate()
    );
    
    // 회복 기간 날짜가 여행 기간 밖에 있으면 true
    return dateOnly < startOnly || dateOnly > endOnly;
  };

  // 특정 날짜의 시술 목록 가져오기 (최대 3개)
  const getProceduresForDateLimited = (date: Date): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return (procedureDates[dateStr]?.filter((p) => !p.isRecovery) || []).slice(0, 3);
  };

  // 특정 날짜의 회복 기간 목록 가져오기
  const getRecoveryForDate = (date: Date): ProcedureSchedule[] => {
    const dateStr = formatDate(date);
    return procedureDates[dateStr]?.filter((p) => p.isRecovery) || [];
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

  const selectedDateObj = selectedDate
    ? new Date(
        parseInt(selectedDate.split("-")[0]),
        parseInt(selectedDate.split("-")[1]) - 1,
        parseInt(selectedDate.split("-")[2])
      )
    : null;

  const selectedProcedures = selectedDateObj
    ? getProceduresForDate(selectedDateObj)
    : [];

  const selectedRecovery = selectedDateObj
    ? getRecoveryForDate(selectedDateObj)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FiCalendar className="text-primary-main" />
            {travelPeriod ? (
              <span className="text-gray-700 font-medium">
                여행 기간: {travelPeriod.start} ~ {travelPeriod.end}
              </span>
            ) : (
              <span className="text-gray-500">여행 기간을 설정해주세요</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // 캐시 데이터 삭제 (예시 데이터 포함 완전 삭제)
                if (
                  confirm("모든 일정과 여행 기간 데이터를 삭제하시겠습니까?")
                ) {
                  localStorage.removeItem("schedules");
                  localStorage.removeItem("travelPeriod");
                  // 완전히 비우기 (예시 데이터도 제거)
                  setTravelPeriod(null);
                  setSavedSchedules([]);
                  // 이벤트 발생
                  window.dispatchEvent(new Event("scheduleAdded"));
                  window.dispatchEvent(new Event("travelPeriodUpdated"));
                  alert("데이터가 삭제되었습니다.");
                }
              }}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1"
              title="캐시 데이터 삭제"
            >
              초기화
            </button>
            <button
              onClick={() => setIsTravelModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-main text-white text-xs font-medium rounded-lg hover:bg-primary-main/90 transition-colors"
            >
              <FiEdit2 className="text-sm" />
              {travelPeriod ? "수정" : "설정"}
            </button>
          </div>
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
                if (!date)
                  return <div key={index} className="aspect-square"></div>;

                const isCurrentMonth = date.getMonth() === month;
                const isTravel = isTravelPeriod(date);
                const isProcedure = isProcedureDate(date);
                const isRecovery = isRecoveryPeriod(date);
                const isRecoveryOutside = isRecoveryOutsideTravel(date);
                const isTodayDate = isToday(date);
                const isSelectedDate = isSelected(date);

                // 날짜별 시술/회복 목록 가져오기
                const proceduresOnDate = getProceduresForDateLimited(date);
                const recoveryOnDate = getRecoveryForDate(date);

                // 배경색 결정 우선순위: 여행일정 > 오늘 > 선택된 날짜
                let bgClass = "";
                let textClass = "";

                if (!isCurrentMonth) {
                  bgClass = "bg-gray-50";
                  textClass = "text-gray-300";
                } else if (isTravel) {
                  // 여행 기간은 시술/회복과 상관없이 항상 색칠
                  bgClass = "bg-sky-100";
                  textClass = "text-sky-700";
                } else if (isTodayDate) {
                  bgClass = "";
                  textClass = "text-primary-main font-bold";
                } else if (isSelectedDate) {
                  bgClass = "bg-primary-main/20";
                  textClass = "text-primary-main font-semibold";
                } else {
                  bgClass = "";
                  textClass = "text-gray-700";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square border-r border-b border-gray-100 p-0.5 transition-colors relative ${bgClass} ${textClass} hover:bg-gray-50`}
                  >
                    <div className="flex flex-col items-start justify-start h-full w-full p-0.5">
                      <span className="text-xs font-medium">{date.getDate()}</span>
                      
                      {/* 시술 표시 (최대 3줄) */}
                      <div className="flex flex-col gap-0.5 w-full mt-0.5">
                        {proceduresOnDate.slice(0, 3).map((proc, idx) => (
                          <div
                            key={proc.id}
                            className="w-full h-1.5 bg-purple-400 rounded-sm"
                            title={proc.procedureName}
                          />
                        ))}
                      </div>

                      {/* 회복 기간 표시 (초록색, 여행 밖이면 주황색) */}
                      {recoveryOnDate.length > 0 && proceduresOnDate.length < 3 && (
                        <div className="flex flex-col gap-0.5 w-full mt-0.5">
                          {recoveryOnDate.slice(0, 3 - proceduresOnDate.length).map((rec, idx) => (
                            <div
                              key={`recovery-${rec.id}-${idx}`}
                              className={`w-full h-1.5 rounded-sm ${
                                isRecoveryOutside
                                  ? "bg-amber-400"
                                  : "bg-green-400"
                              }`}
                              title={`${rec.procedureName} 회복 기간`}
                            />
                          ))}
                        </div>
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
              <div className="w-3 h-1.5 bg-purple-400 rounded-sm"></div>
              <span className="text-gray-600">시술</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-green-400 rounded-sm"></div>
              <span className="text-gray-600">회복 기간</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-amber-400 rounded-sm"></div>
              <span className="text-gray-600">회복 기간 (여행 밖)</span>
            </div>
          </div>

          {/* 선택된 날짜의 시술 정보 */}
          {selectedDate && (selectedProcedures.length > 0 || selectedRecovery.length > 0) && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDate} 일정 정보
              </h3>
              
              {/* 시술 카드 (보라 톤 배경) */}
              {selectedProcedures.map((proc) => (
                <div
                  key={proc.id}
                  className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">
                        {proc.procedureName}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <FiMapPin className="text-purple-600" />
                        <span>{proc.hospital}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <FiTag className="text-purple-600" />
                        <span>{proc.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-purple-700 font-medium mb-1">
                        <FiClock className="text-purple-600" />
                        <span>회복 기간: {proc.recoveryDays}일</span>
                      </div>
                      {/* 시술 당일 카드에서는 회복 가이드는 노출하지 않음 (회복일 카드에서만 안내) */}
                    </div>
                    {proc.procedureTime && (
                      <div className="text-sm font-semibold text-purple-700">
                        {proc.procedureTime}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 회복 기간 카드 (녹색 톤 배경) */}
              {selectedRecovery.map((rec, idx) => {
                // 선택한 날짜가 여행 일정 밖인지 여부를 boolean으로 변환
                const isOutsideTravel = !!(
                  selectedDateObj && isRecoveryOutsideTravel(selectedDateObj)
                );
                return (
                  <RecoveryCardComponent
                    key={`recovery-${rec.id}-${idx}`}
                    rec={rec}
                    isOutsideTravel={isOutsideTravel}
                  />
                );
              })}
            </div>
          )}

          {selectedDate && selectedProcedures.length === 0 && selectedRecovery.length === 0 && (
            <div className="mt-6 text-center py-8">
              <FiCalendar className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                선택한 날짜에 일정이 없습니다.
              </p>
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
            <h3 className="text-sm font-semibold text-gray-900">
              강남구 신사동
            </h3>
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

      {/* 여행 기간 선택 모달 */}
      <TravelScheduleCalendarModal
        isOpen={isTravelModalOpen}
        onClose={() => setIsTravelModalOpen(false)}
        onDateSelect={handleTravelPeriodSave}
        selectedStartDate={travelPeriod?.start || null}
        selectedEndDate={travelPeriod?.end || null}
      />
    </div>
  );
}
