"use client";

import { useState } from "react";
import { FiCalendar, FiMapPin, FiTag, FiDollarSign } from "react-icons/fi";
import { IoChevronDown } from "react-icons/io5";
import { useLanguage } from "@/contexts/LanguageContext";

interface TravelScheduleFormProps {
  onSearch: (data: TravelScheduleData) => void;
}

export interface TravelScheduleData {
  travelPeriod: { start: string; end: string };
  travelRegion: string;
  procedureCategory: string;
  estimatedBudget: string;
}

export default function TravelScheduleForm({
  onSearch,
}: TravelScheduleFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<TravelScheduleData>({
    travelPeriod: { start: "", end: "" },
    travelRegion: "서울",
    procedureCategory: "전체",
    estimatedBudget: "100만원 미만",
  });

  const handleDateSelect = (type: "start" | "end") => {
    // 실제로는 달력 라이브러리 사용
    const date = prompt(
      `여행 ${
        type === "start" ? "시작" : "종료"
      } 날짜를 선택해주세요 (YYYY-MM-DD)`
    );
    if (date) {
      setFormData({
        ...formData,
        travelPeriod: { ...formData.travelPeriod, [type]: date },
      });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <h3 className="text-lg font-bold mb-4 text-gray-900">여행 일정 입력</h3>
      <div className="space-y-3">
        {/* 여행 기간 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            여행 기간
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FiCalendar className="text-primary-main text-lg" />
              </div>
              <input
                type="text"
                value={formData.travelPeriod.start}
                placeholder={t("placeholder.startDate")}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent cursor-pointer"
                onClick={() => handleDateSelect("start")}
                readOnly
              />
            </div>
            <span className="text-gray-400">~</span>
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FiCalendar className="text-primary-main text-lg" />
              </div>
              <input
                type="text"
                value={formData.travelPeriod.end}
                placeholder={t("placeholder.endDate")}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent cursor-pointer"
                onClick={() => handleDateSelect("end")}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 여행 지역 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            여행 지역
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FiMapPin className="text-primary-main text-lg" />
            </div>
            <select
              value={formData.travelRegion}
              onChange={(e) =>
                setFormData({ ...formData, travelRegion: e.target.value })
              }
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent appearance-none"
            >
              <option>서울</option>
              <option>부산</option>
              <option>제주</option>
              <option>강남</option>
              <option>홍대</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <IoChevronDown className="text-gray-400 text-lg" />
            </div>
          </div>
        </div>

        {/* 시술 카테고리 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            시술 카테고리
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FiTag className="text-primary-main text-lg" />
            </div>
            <select
              value={formData.procedureCategory}
              onChange={(e) =>
                setFormData({ ...formData, procedureCategory: e.target.value })
              }
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent appearance-none"
            >
              <option>전체</option>
              <option>눈성형</option>
              <option>코성형</option>
              <option>리프팅</option>
              <option>피부</option>
              <option>보톡스/필러</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <IoChevronDown className="text-gray-400 text-lg" />
            </div>
          </div>
        </div>

        {/* 추정 예산 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            추정 예산
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FiDollarSign className="text-primary-main text-lg" />
            </div>
            <select
              value={formData.estimatedBudget}
              onChange={(e) =>
                setFormData({ ...formData, estimatedBudget: e.target.value })
              }
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent appearance-none"
            >
              <option>100만원 미만</option>
              <option>100만원 ~ 300만원</option>
              <option>300만원 ~ 500만원</option>
              <option>500만원 ~ 1000만원</option>
              <option>1000만원 이상</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <IoChevronDown className="text-gray-400 text-lg" />
            </div>
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={() => onSearch(formData)}
          className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-3 rounded-lg text-sm font-semibold transition-colors mt-4"
        >
          일정 기반 시술 추천
        </button>
      </div>
    </div>
  );
}
