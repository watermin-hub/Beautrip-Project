"use client";

import { useState } from "react";
import { FiX, FiArrowRight } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

interface AISkinAnalysisConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function AISkinAnalysisConsentModal({
  isOpen,
  onClose,
  onAgree,
}: AISkinAnalysisConsentModalProps) {
  const { t } = useLanguage();
  const [isAgreed, setIsAgreed] = useState(false);

  if (!isOpen) return null;

  const handleAgree = () => {
    setIsAgreed(true);
    onAgree();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("ai.consent.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiX className="text-gray-700 text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          <p
            className="text-center text-sm text-gray-600 mb-4"
            dangerouslySetInnerHTML={{
              __html: t("ai.consent.duration"),
            }}
          />

          <div
            className="text-center text-xs text-gray-700 mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: t("ai.consent.description"),
            }}
          />

          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p
              className="text-xs text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: t("ai.consent.privacy"),
              }}
            />
          </div>

          <p
            className="text-center text-xs text-gray-700 mb-4"
            dangerouslySetInnerHTML={{
              __html: t("ai.consent.confirmText"),
            }}
          />

          <button
            onClick={handleAgree}
            className="w-full bg-primary-main hover:bg-[#2DB8A0] text-white py-3 rounded-lg font-semibold transition-colors mb-2 flex items-center justify-center gap-2"
          >
            {t("ai.consent.agree")}
            <FiArrowRight className="text-lg" />
          </button>

          <button
            onClick={onClose}
            className="w-full text-xs text-gray-600 underline py-2"
          >
            {t("ai.consent.disagree")}
          </button>
        </div>
      </div>
    </div>
  );
}
