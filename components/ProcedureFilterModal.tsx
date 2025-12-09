"use client";

import { useState } from "react";
import { FiX, FiFilter } from "react-icons/fi";

export interface ProcedureFilter {
  duration: string | null; // 소요시간 기반 일정표
  recovery: string | null; // 회복기간
  budget: string | null; // 예산 비용
}

interface ProcedureFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filter: ProcedureFilter) => void;
  currentFilter: ProcedureFilter;
}

const DURATION_OPTIONS = [
  { value: "same-day", label: "당일" },
  { value: "half-day", label: "반나절" },
  { value: "1-day", label: "1일" },
  { value: "2-3-days", label: "2~3일" },
  { value: "surgery", label: "수술 포함" },
];

const RECOVERY_OPTIONS = [
  { value: "same-day", label: "당일 생활 가능" },
  { value: "1-3-days", label: "1~3일" },
  { value: "4-7-days", label: "4~7일" },
  { value: "1-week-plus", label: "1주 이상" },
];

const BUDGET_OPTIONS = [
  { value: "under-50", label: "~50만원" },
  { value: "50-100", label: "50~100만원" },
  { value: "100-200", label: "100~200만원" },
  { value: "200-plus", label: "200만원+" },
];

export default function ProcedureFilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilter,
}: ProcedureFilterModalProps) {
  const [filter, setFilter] = useState<ProcedureFilter>(currentFilter);

  const handleOptionClick = (
    type: "duration" | "recovery" | "budget",
    value: string
  ) => {
    setFilter((prev) => ({
      ...prev,
      [type]: prev[type] === value ? null : value,
    }));
  };

  const handleApply = () => {
    onApply(filter);
    onClose();
  };

  const handleReset = () => {
    const resetFilter: ProcedureFilter = {
      duration: null,
      recovery: null,
      budget: null,
    };
    setFilter(resetFilter);
    // 초기화만 하고 모달은 열어둠
  };

  const hasActiveFilters =
    filter.duration !== null ||
    filter.recovery !== null ||
    filter.budget !== null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-w-md mx-auto shadow-2xl animate-slide-up pb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiFilter className="text-primary-main" />
            <h3 className="text-lg font-bold text-gray-900">필터</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 max-h-[60vh] overflow-y-auto">
          {/* 소요시간 기반 일정표 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              소요시간 기반 일정표
            </h4>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option) => {
                const isSelected = filter.duration === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick("duration", option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary-main text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 회복기간 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              회복기간
            </h4>
            <div className="flex flex-wrap gap-2">
              {RECOVERY_OPTIONS.map((option) => {
                const isSelected = filter.recovery === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick("recovery", option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary-main text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 예산 비용 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              예산 비용
            </h4>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((option) => {
                const isSelected = filter.budget === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick("budget", option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary-main text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer - 네비게이션 바 위에 확실히 보이도록 고정 */}
        <div className="sticky bottom-0 bg-white px-4 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg text-sm font-semibold transition-colors"
          >
            초기화
          </button>
          <button
            onClick={handleApply}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
              hasActiveFilters
                ? "bg-primary-main hover:bg-[#2DB8A0] text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!hasActiveFilters}
          >
            찾기
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

