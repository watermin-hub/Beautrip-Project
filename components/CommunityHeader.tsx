"use client";

import { FiSend, FiEdit3 } from "react-icons/fi";
import { useState } from "react";
import ReviewFilterModal from "./ReviewFilterModal";

interface CommunityHeaderProps {
  activeTab: "categories" | "recommended" | "latest" | "popular" | "review";
  onTabChange: (
    tab: "categories" | "recommended" | "latest" | "popular" | "review"
  ) => void;
}

export default function CommunityHeader({
  activeTab,
  onTabChange,
}: CommunityHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const tabs = [
    { id: "categories" as const, label: "카테고리" },
    { id: "recommended" as const, label: "추천글" },
    { id: "latest" as const, label: "최신글" },
    { id: "popular" as const, label: "인기글" },
    { id: "review" as const, label: "후기" },
  ];

  return (
    <>
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
          <div className="flex items-center gap-3">
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

        {/* Tabs */}
        <div className="flex items-center gap-6 px-4 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`text-sm font-medium transition-colors pb-2 relative ${
                activeTab === tab.id ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
              )}
            </button>
          ))}
        </div>
      </div>
      <ReviewFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </>
  );
}
