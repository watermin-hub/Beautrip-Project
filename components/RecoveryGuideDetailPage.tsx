"use client";

import { useRouter } from "next/navigation";
import {
  recoveryGuideContent,
  RecoveryGroupKey,
} from "@/lib/content/recoveryGuideContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiChevronLeft, FiCheck, FiAlertCircle } from "react-icons/fi";

interface RecoveryGuideDetailPageProps {
  groupKey: RecoveryGroupKey;
}

export default function RecoveryGuideDetailPage({
  groupKey,
}: RecoveryGuideDetailPageProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const content = recoveryGuideContent[language][groupKey];
  const title = `${content.title}에 대한 회복 가이드🍀`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-[48px] z-[101] bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiChevronLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 line-clamp-1">
            {title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-20 pt-[96px]">
        {/* Badge & Recommended */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-primary-light/20 text-primary-main px-3 py-1.5 rounded-full font-medium">
              {content.badge}
            </span>
            {content.recommended && (
              <span className="text-sm text-gray-600 font-medium">
                {content.recommended}
              </span>
            )}
          </div>
          {content.procedures && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800">해당 시술:</span>{" "}
                {content.procedures}
              </p>
            </div>
          )}
        </div>

        {/* Weeks */}
        <div className="space-y-6">
          {content.weeks.map((week, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-5 bg-white"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {week.label}
              </h3>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                {week.subtitle}
              </h4>

              {/* Description */}
              <div className="mb-4">
                {week.description.map((desc, idx) => (
                  <p
                    key={idx}
                    className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
                  >
                    {desc}
                  </p>
                ))}
              </div>

              {/* Tips */}
              {week.tips.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheck className="text-primary-main text-sm" />
                    <h5 className="text-sm font-semibold text-gray-800">
                      이 주차에 도움 되는 팁
                    </h5>
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {week.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-700 leading-relaxed list-disc"
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cautions */}
              {week.cautions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiAlertCircle className="text-orange-500 text-sm" />
                    <h5 className="text-sm font-semibold text-gray-800">
                      권고사항
                    </h5>
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {week.cautions.map((caution, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-700 leading-relaxed list-disc"
                      >
                        {caution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quote */}
              {week.quote && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    {week.quote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {content.summaryTitle && content.summaryBody && (
          <div className="mt-8 bg-primary-light/10 border border-primary-light/30 rounded-xl p-5">
            <h3 className="text-base font-bold text-primary-main mb-3">
              {content.summaryTitle}
            </h3>
            {content.summaryBody.map((body, idx) => (
              <p
                key={idx}
                className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
              >
                {body}
              </p>
            ))}
          </div>
        )}

        {/* Closing */}
        {content.closingTitle && content.closingBody && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>👨‍⚕️👩‍⚕️</span>
              {content.closingTitle}
            </h3>
            {content.closingBody.map((body, idx) => (
              <p
                key={idx}
                className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
              >
                {body}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
