"use client";

import { FiEdit3 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

type CommunityTab = "popular" | "latest" | "info" | "consultation";

interface CommunityHeaderProps {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
}

export default function CommunityHeader({
  activeTab,
  onTabChange,
}: CommunityHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const tabs = [
    { id: "popular" as const, labelKey: "community.tab.popular" },
    { id: "latest" as const, labelKey: "community.tab.latest" },
    { id: "info" as const, labelKey: "community.tab.guide" },
    { id: "consultation" as const, labelKey: "community.tab.consultation" },
  ];

  return (
    <div className="fixed top-[48px] left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 bg-white border-b border-gray-100">
      {/* Tabs - 글쓰기 버튼을 우측에 배치 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`text-base font-medium transition-colors py-1.5 relative whitespace-nowrap flex items-center ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(tab.labelKey)}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <button
            onClick={() => router.push("/explore/write")}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="글 작성하기"
          >
            <FiEdit3 className="text-gray-700 text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
