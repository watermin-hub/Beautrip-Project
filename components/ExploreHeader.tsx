"use client";

import { useRouter } from "next/navigation";
import { FiHeart } from "react-icons/fi";

interface ExploreHeaderProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export default function ExploreHeader({
  activeSection,
  onSectionClick,
}: ExploreHeaderProps) {
  const router = useRouter();

  const sections = [
    { id: "ranking", label: "랭킹" },
    { id: "procedure", label: "전체 시술•수술" },
    { id: "hospital", label: "전체 병원" },
  ];

  return (
    <div className="fixed top-[89px] left-1/2 transform -translate-x-1/2 w-full max-w-md z-[45] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">탐색</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/favorites")}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors relative"
          >
            <FiHeart className="text-gray-700 text-xl" />
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`text-sm font-medium transition-colors pb-1 relative whitespace-nowrap ${
              activeSection === section.id
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {section.label}
            {activeSection === section.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
