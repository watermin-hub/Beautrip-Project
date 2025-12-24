"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  recoveryGuideContent,
  RecoveryGroupKey,
} from "@/lib/content/recoveryGuideContent";
import { FiChevronRight } from "react-icons/fi";

const recoveryGuideGroups: RecoveryGroupKey[] = [
  "jaw",
  "breast",
  "body",
  "upperFace",
  "nose",
  "eyeSurgery",
  "eyeVolume",
  "faceFat",
  "lifting",
  "procedures",
];

export default function RecoveryGuideSection() {
  const router = useRouter();
  const { language } = useLanguage();
  const content = recoveryGuideContent[language];

  const handleGuideClick = (groupKey: RecoveryGroupKey) => {
    router.push(`/community/recovery-guide/${groupKey}`);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍀</span>
          <h3 className="text-lg font-bold text-gray-900">회복 가이드</h3>
        </div>
      </div>

      {/* 회복 가이드 리스트 */}
      <div className="space-y-3">
        {recoveryGuideGroups.map((groupKey) => {
          const guide = content[groupKey];
          const title = `${guide.title}에 대한 회복 가이드🍀`;

          return (
            <button
              key={groupKey}
              onClick={() => handleGuideClick(groupKey)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-primary-light/20 text-primary-main px-2 py-0.5 rounded-full font-medium">
                      {guide.badge}
                    </span>
                    {guide.recommended && (
                      <span className="text-xs text-gray-500">
                        {guide.recommended}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                    {title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {guide.summary}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <FiChevronRight className="text-gray-400" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

