// 날짜 포맷팅 유틸리티 함수
import type { LanguageCode } from "@/contexts/LanguageContext";

// 언어별 날짜 포맷팅 함수
export function formatDateWithDay(
  dateString: string,
  language: LanguageCode = "KR"
): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayIndex = date.getDay();

  // 언어별 월 이름
  const monthNames: Record<LanguageCode, Record<number, string>> = {
    KR: {
      1: "1월",
      2: "2월",
      3: "3월",
      4: "4월",
      5: "5월",
      6: "6월",
      7: "7월",
      8: "8월",
      9: "9월",
      10: "10월",
      11: "11월",
      12: "12월",
    },
    EN: {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Aug",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec",
    },
    JP: {
      1: "1月",
      2: "2月",
      3: "3月",
      4: "4月",
      5: "5月",
      6: "6月",
      7: "7月",
      8: "8月",
      9: "9月",
      10: "10月",
      11: "11月",
      12: "12月",
    },
    CN: {
      1: "1月",
      2: "2月",
      3: "3月",
      4: "4月",
      5: "5月",
      6: "6月",
      7: "7月",
      8: "8月",
      9: "9月",
      10: "10月",
      11: "11月",
      12: "12月",
    },
  };

  // 언어별 요일 이름
  const dayNames: Record<LanguageCode, string[]> = {
    KR: ["일", "월", "화", "수", "목", "금", "토"],
    EN: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    JP: ["日", "月", "火", "水", "木", "金", "土"],
    CN: ["日", "一", "二", "三", "四", "五", "六"],
  };

  // 언어별 "일" 표시
  const dayLabel: Record<LanguageCode, string> = {
    KR: "일",
    EN: "",
    JP: "日",
    CN: "日",
  };

  const monthName = monthNames[language][month] || `${month}월`;
  const dayName = dayNames[language][dayIndex] || "";
  const currentDayLabel = dayLabel[language] || dayLabel.KR;

  if (language === "EN") {
    return `${monthName} ${day} (${dayName})`;
  } else {
    return `${monthName} ${day}${currentDayLabel} (${dayName})`;
  }
}

// 여행 기간 포맷팅 (0박 1일 형식)
export function formatTravelPeriod(
  nights: number,
  days: number,
  language: LanguageCode = "KR"
): string {
  const translations: Record<LanguageCode, { night: string; day: string }> = {
    KR: { night: "박", day: "일" },
    EN: { night: "night", day: "day" },
    JP: { night: "泊", day: "日" },
    CN: { night: "晚", day: "天" },
  };

  const { night, day } = translations[language];

  if (language === "EN") {
    return `${nights} ${nights === 1 ? night : night + "s"} ${days} ${days === 1 ? day : day + "s"}`;
  } else {
    return `${nights}${night} ${days}${day}`;
  }
}

