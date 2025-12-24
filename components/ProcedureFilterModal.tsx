"use client";

import { useState, useMemo, useEffect } from "react";
import { FiX, FiFilter } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

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

export default function ProcedureFilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilter,
}: ProcedureFilterModalProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<ProcedureFilter>(currentFilter);

  const DURATION_OPTIONS = useMemo(
    () => [
      { value: "under-30", label: t("procedure.filterDuration.under30") },
      { value: "30-60", label: t("procedure.filterDuration.30-60") },
      { value: "60-90", label: t("procedure.filterDuration.60-90") },
      { value: "90-120", label: t("procedure.filterDuration.90-120") },
      { value: "over-120", label: t("procedure.filterDuration.over120") },
    ],
    [t]
  );

  const RECOVERY_OPTIONS = useMemo(
    () => [
      { value: "same-day", label: t("procedure.filterRecovery.sameDay") },
      { value: "1-3-days", label: t("procedure.filterRecovery.1-3Days") },
      { value: "4-7-days", label: t("procedure.filterRecovery.4-7Days") },
      { value: "1-week-plus", label: t("procedure.filterRecovery.1WeekPlus") },
    ],
    [t]
  );

  const BUDGET_OPTIONS = useMemo(
    () => [
      { value: "under-50", label: t("procedure.filterBudget.under50") },
      { value: "50-100", label: t("procedure.filterBudget.50-100") },
      { value: "100-200", label: t("procedure.filterBudget.100-200") },
      { value: "200-plus", label: t("procedure.filterBudget.200Plus") },
    ],
    [t]
  );

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

  // 필터 모달이 열릴 때 헤더와 네비게이션 바 비활성화
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(
        new CustomEvent("filterModalOpen", { detail: { isOpen: true } })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("filterModalOpen", { detail: { isOpen: false } })
      );
    }
    return () => {
      window.dispatchEvent(
        new CustomEvent("filterModalOpen", { detail: { isOpen: false } })
      );
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[70]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[71] max-w-md mx-auto shadow-2xl animate-slide-up pb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiFilter className="text-primary-main" />
            <h3 className="text-lg font-bold text-gray-900">{t("procedure.filter")}</h3>
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
              {t("procedure.filterDuration")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option) => {
                const isSelected = filter.duration === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick("duration", option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary-main text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <button
                        type="button"
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter((prev) => ({ ...prev, duration: null }));
                        }}
                      >
                        <FiX className="text-xs" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 회복기간 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {t("procedure.filterRecovery")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {RECOVERY_OPTIONS.map((option) => {
                const isSelected = filter.recovery === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick("recovery", option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary-main text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <button
                        type="button"
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter((prev) => ({ ...prev, recovery: null }));
                        }}
                      >
                        <FiX className="text-xs" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 예산 비용 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {t("procedure.filterBudget")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((option) => {
                const isSelected = filter.budget === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick("budget", option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary-main text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <button
                        type="button"
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter((prev) => ({ ...prev, budget: null }));
                        }}
                      >
                        <FiX className="text-xs" />
                      </button>
                    )}
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
            {t("procedure.filterReset")}
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
            {t("procedure.filterSearch")}
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

