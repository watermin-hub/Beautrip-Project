"use client";

import { FiSend, FiEdit3 } from "react-icons/fi";
import { useState } from "react";
import ReviewFilterModal from "./ReviewFilterModal";

type CommunityTab = "popular" | "latest" | "info" | "consultation";

interface CommunityHeaderProps {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
}

export default function CommunityHeader({
  activeTab,
  onTabChange,
}: CommunityHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const tabs = [
    { id: "popular" as const, label: "인기글" },
    { id: "latest" as const, label: "최신글" },
    { id: "info" as const, label: "가이드" },
    { id: "consultation" as const, label: "고민상담소" },
  ];

  return (
    <>
      <div className="fixed top-[48px] left-1/2 transform -translate-x-1/2 w-full max-w-md z-20 bg-white">
        {/* Tabs - 아이콘 2개를 우측에 배치 */}
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
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <FiSend className="text-gray-700 text-xl" />
            </button>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiEdit3 className="text-gray-700 text-xl" />
            </button>
          </div>
        </div>
      </div>
      <ReviewFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </>
  );
}
