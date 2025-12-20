"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IoChevronUp } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

interface RankingItem {
  rank: number;
  name: string;
  status: "best" | "up" | "down";
}

const rankings: RankingItem[] = [
  { rank: 1, name: "리쥬란힐러", status: "best" },
  { rank: 2, name: "써마지", status: "best" },
  { rank: 3, name: "쥬베룩", status: "best" },
  { rank: 4, name: "울쎄라", status: "up" },
  { rank: 5, name: "LDM", status: "up" },
  { rank: 6, name: "스킨부스터", status: "up" },
  { rank: 7, name: "올리지오", status: "down" },
  { rank: 8, name: "튠페이스", status: "up" },
  { rank: 9, name: "쎄라필", status: "up" },
  { rank: 10, name: "리프테라", status: "down" },
];

export default function RankingBanner() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rankings.length);
    }, 3000); // 3초마다 자동 넘어감

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentRanking = rankings[currentIndex];

  return (
    <div className="relative">
      <div
        className="bg-white border-b border-gray-100 px-4 py-2.5 fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-[65] cursor-pointer"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center justify-between">
          {/* Left: Ranking indicator */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-0.5">
              <span className="text-primary-main font-bold text-base">
                {currentRanking.rank}
              </span>
              <IoChevronUp className="text-primary-main text-sm" />
            </div>
            <span className="text-gray-800 text-sm font-medium truncate">
              {currentRanking.name}
            </span>
            {currentRanking.status === "best" && (
              <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ml-1">
                {t("banner.ranking.best")}
              </span>
            )}
          </div>

          {/* Right: Indicator dots */}
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {rankings.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary-main w-2"
                    : "bg-gray-300 w-1.5 hover:bg-gray-400"
                }`}
                aria-label={`${index + 1}순위: ${rankings[index].name}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="fixed top-[41px] left-1/2 transform -translate-x-1/2 z-[66] bg-white max-w-md w-full shadow-lg flex flex-col"
          style={{ height: "420px" }}
        >
          <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {t("banner.ranking.title")}
            </h2>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiX className="text-gray-700 text-lg" />
            </button>
          </div>
          <div className="px-3 py-2 space-y-1 overflow-y-auto flex-1">
            {rankings.slice(0, 10).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  // 탐색 페이지로 이동
                  router.push(
                    `/explore?section=procedure&search=${encodeURIComponent(
                      item.name
                    )}`
                  );
                  setIsDropdownOpen(false);
                }}
              >
                <div className="flex items-center gap-1 min-w-[45px]">
                  <span
                    className={`font-bold text-sm ${
                      item.rank <= 3 ? "text-primary-main" : "text-gray-600"
                    }`}
                  >
                    {item.rank}
                  </span>
                  <IoChevronUp className="text-primary-main text-xs" />
                </div>
                <span className="text-gray-800 text-xs font-medium flex-1">
                  {item.name}
                </span>
                {item.status === "best" && (
                  <span className="bg-primary-light/20 text-primary-main px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    BEST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
