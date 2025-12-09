"use client";

import { useState } from "react";
import { FiMapPin, FiCalendar, FiTrendingUp } from "react-icons/fi";
import TravelScheduleForm, { TravelScheduleData } from "./TravelScheduleForm";
import ProcedureRecommendation from "./ProcedureRecommendation";

export default function RecommendationPage() {
  const [activeRecommendation, setActiveRecommendation] = useState<
    "category" | "schedule" | "trending"
  >("category");
  const [scheduleData, setScheduleData] = useState<TravelScheduleData | null>(
    null
  );
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleScheduleSearch = (data: TravelScheduleData) => {
    setScheduleData(data);
    setShowRecommendations(true);
  };

  return (
    <div className="bg-white">
      {/* 추천 타입 선택 */}
      <div className="sticky top-[156px] z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              setActiveRecommendation("category");
              setShowRecommendations(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeRecommendation === "category"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiMapPin className="text-sm" />
            카테고리 맞춤
          </button>
          <button
            onClick={() => {
              setActiveRecommendation("schedule");
              setShowRecommendations(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeRecommendation === "schedule"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiCalendar className="text-sm" />
            일정 맞춤
          </button>
          <button
            onClick={() => {
              setActiveRecommendation("trending");
              setShowRecommendations(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeRecommendation === "trending"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiTrendingUp className="text-sm" />
            유행 시술
          </button>
        </div>
      </div>

      {/* 추천 콘텐츠 */}
      <div className="px-4 py-6">
        {activeRecommendation === "category" && (
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              카테고리 맞춤 추천
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              개별 고민, 일정 등을 작성하면 데이터를 통해 맞춤 추천을 받을 수
              있어요.
            </p>
            <TravelScheduleForm onSearch={handleScheduleSearch} />
            {showRecommendations && scheduleData && (
              <div className="mt-4">
                <ProcedureRecommendation scheduleData={scheduleData} />
              </div>
            )}
          </div>
        )}

        {activeRecommendation === "schedule" && (
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              일정 맞춤 추천
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              개별 고민, 일정 등을 작성하면 데이터를 통해 맞춤 추천을 받을 수 있어요.
              시술별 다운타임과 통증 정보를 확인하세요.
            </p>
            <TravelScheduleForm onSearch={handleScheduleSearch} />
            {showRecommendations && scheduleData && (
              <div className="mt-4">
                <ProcedureRecommendation scheduleData={scheduleData} />
              </div>
            )}
          </div>
        )}

        {activeRecommendation === "trending" && (
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              유행 시술 맞춤 추천
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              개별 고민, 일정 등을 작성하면 데이터를 통해 답변을 받을 수 있어요.
              시술별 다운타임과 통증 정보를 확인하세요.
            </p>
            <TravelScheduleForm onSearch={handleScheduleSearch} />
            {showRecommendations && scheduleData && (
              <div className="mt-4">
                <ProcedureRecommendation scheduleData={scheduleData} />
              </div>
            )}
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3 text-gray-900">시술별 다운타임 / 통증 정보</h4>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  리쥬란 힐러
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>다운타임:</span>
                    <span className="font-medium">1-2일</span>
                  </div>
                  <div className="flex justify-between">
                    <span>통증:</span>
                    <span className="font-medium">낮음</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  인모드 리프팅
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>다운타임:</span>
                    <span className="font-medium">거의 없음</span>
                  </div>
                  <div className="flex justify-between">
                    <span>통증:</span>
                    <span className="font-medium">낮음</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

