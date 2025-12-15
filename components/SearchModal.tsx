"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX, FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { getTreatmentAutocomplete } from "@/lib/api/beautripApi";
import AutocompleteInput from "./AutocompleteInput";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RECENT_SEARCHES = 10; // 최대 최근 검색어 개수

const recommendedSearches = [
  { id: 1, name: "리쥬란힐러", badge: "BEST" },
  { id: 2, name: "써마지", badge: "BEST" },
  { id: 3, name: "쥬베룩", badge: "BEST" },
  { id: 4, name: "울쎄라", badge: "up" },
  { id: 5, name: "LDM", badge: "up" },
  { id: 6, name: "스킨부" },
  { id: 7, name: "올리지" },
  { id: 8, name: "튠페" },
  { id: 9, name: "쎄라플" },
  { id: 10, name: "리프터" },
];

const quickIcons = [
  { id: 1, label: "블프 세일 대축제", icon: "🛍️" },
  { id: 2, label: "요즘인기시술", icon: "⭐" },
  { id: 3, label: "혜택 플러스", icon: "💎" },
  { id: 4, label: "포인트 적립백서", icon: "📝" },
  { id: 5, label: "부작용 안심케어", icon: "🛡️" },
];

const recentEvents = [
  {
    id: 1,
    title: "Shurink Universe",
    clinic: "본연_슈링크 유니버스",
    location: "서울 강남역·본연성...",
    price: "120,000원",
    image: "",
  },
  {
    id: 2,
    title: "Eight longtime #인모드 #슈링크",
    clinic: "지방소멸 롱타임 인모드리프팅 슈링...",
    location: "서울 압구정역·에이...",
    price: "₩108,900",
    image: "",
  },
  {
    id: 3,
    title: "시술 시간 걱정 없이 인모드는 롱~모드로!",
    clinic: "롱모드 인모드 풀페이스 10분 FX...",
    location: "서울 홍대입구역·리...",
    price: "99,000원",
    image: "",
  },
  {
    id: 4,
    title: "후기 6,000+ 디에이 자려한 코성형",
    clinic: "예쁘면DA야_자려한 코성형_비순각코수...",
    location: "서울 역삼역·디에이...",
    price: "1,088,000원",
    image: "",
  },
];

const interestProcedures = [
  "인모드리프팅",
  "슈링크리프팅",
  "슈링크유니버스",
  "코재수술",
  "아이슈링크",
];

const categories = [
  { icon: "👁️", label: "눈성형" },
  { icon: "👃", label: "코성형" },
  { icon: "😊", label: "안면윤곽/양악" },
  { icon: "💪", label: "가슴성형" },
  { icon: "🏃", label: "지방성형" },
  { icon: "💉", label: "필러" },
  { icon: "💉", label: "보톡스" },
  { icon: "✨", label: "리프팅" },
  { icon: "🌟", label: "피부" },
  { icon: "✂️", label: "제모" },
  { icon: "💇", label: "모발이식" },
  { icon: "🦷", label: "치아" },
  { icon: "🍵", label: "한방" },
  { icon: "📦", label: "기타" },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("지역");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);

  // localStorage에서 최근 검색어 불러오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse recent searches", e);
        }
      }
    }
  }, []);

  // 자동완성 데이터 로드
  useEffect(() => {
    const loadAutocomplete = async () => {
      if (searchQuery.length < 1) {
        setAutocompleteSuggestions([]);
        return;
      }

      const result = await getTreatmentAutocomplete(searchQuery, 10);
      const allSuggestions = [
        ...result.treatmentNames,
        ...result.hospitalNames,
      ];
      setAutocompleteSuggestions(allSuggestions);
    };

    const debounceTimer = setTimeout(() => {
      loadAutocomplete();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // 최근 검색어에 추가하는 함수
  const addToRecentSearches = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches((prev) => {
      // 중복 제거 (기존 항목 제거 후 맨 앞에 추가)
      const filtered = prev.filter((item) => item !== trimmedQuery);
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // localStorage에 저장
      if (typeof window !== "undefined") {
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      }

      return updated;
    });
  };

  // 개별 검색어 삭제
  const removeRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 이벤트 전파 방지
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== query);

      // localStorage에 저장
      if (typeof window !== "undefined") {
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      }

      return updated;
    });
  };

  // 전체 검색어 삭제
  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("recentSearches");
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 최근 검색어에 추가
      addToRecentSearches(searchQuery.trim());

      // 탐색 페이지로 이동하면서 검색어와 섹션 정보 전달
      router.push(
        `/explore?search=${encodeURIComponent(
          searchQuery.trim()
        )}&section=procedure`
      );
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto max-w-md mx-auto left-1/2 transform -translate-x-1/2 pb-20 w-full">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <div className="flex-1 relative">
            <AutocompleteInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="시술명/수술명을 입력해 주세요."
              suggestions={autocompleteSuggestions}
              onSuggestionSelect={(suggestion) => {
                setSearchQuery(suggestion);
                // 자동완성 선택 시 바로 검색 실행
                setTimeout(() => {
                  handleSearch();
                }, 100);
              }}
              onEnter={handleSearch}
              className="bg-gray-50 border border-gray-200"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-2 text-primary-main text-sm font-medium hover:bg-primary-main/10 rounded-lg transition-colors"
          >
            검색
          </button>
        </div>

        {/* Region Selector */}
        <div className="mt-3">
          <button className="flex items-center gap-1 text-gray-700 text-sm hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
            <span>{selectedRegion}</span>
            <FiChevronDown className="text-gray-500 text-sm" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* BLACK PINK FRIDAY Banner */}
        <div className="relative bg-black rounded-2xl overflow-hidden p-6 min-h-[160px] flex items-center">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
              }}
            ></div>
          </div>
          <div className="relative w-full">
            <div className="flex items-start justify-between mb-3">
              <p className="text-white text-xs">
                K-피부시술 세일 페스타, 모든 시술이 한자리에!
              </p>
              <div className="bg-primary-main text-white px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2">
                ~49% off
              </div>
            </div>
            <h2 className="text-4xl font-black mb-3 leading-tight">
              <span className="text-white">BLACK</span>{" "}
              <span className="text-primary-light relative">
                BEAUTY
                <span className="absolute -top-1 -right-3 text-primary-main text-xs">
                  ★
                </span>
              </span>{" "}
              <span className="text-white">FRIDAY</span>
            </h2>
            <p className="text-white text-sm">11.11 — 12.10</p>
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">최근 검색어</h3>
              <button
                onClick={clearAllRecentSearches}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                전체삭제
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    addToRecentSearches(search); // 클릭 시에도 최근 검색어에 추가 (순서 업데이트)
                    router.push(
                      `/explore?search=${encodeURIComponent(
                        search
                      )}&section=procedure`
                    );
                    onClose();
                  }}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                >
                  <span>{search}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(search, e);
                    }}
                    className="hover:bg-gray-300 rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <IoClose className="text-gray-500 text-sm" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Icons */}
        <div className="grid grid-cols-5 gap-4">
          {quickIcons.map((item) => (
            <button
              key={item.id}
              className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-light/20 to-primary-main/30 rounded-full flex items-center justify-center text-xl">
                {item.icon}
              </div>
              <span className="text-xs text-gray-700 text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Recommended Searches */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4">
            추천 검색어
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {recommendedSearches.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSearchQuery(item.name);
                  addToRecentSearches(item.name); // 추천 검색어 클릭 시에도 최근 검색어에 추가
                  router.push(
                    `/explore?search=${encodeURIComponent(
                      item.name
                    )}&section=procedure`
                  );
                  onClose();
                }}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary-main font-bold text-sm min-w-[20px]">
                    {item.id}
                  </span>
                  <span className="text-gray-900 text-sm">{item.name}</span>
                </div>
                {item.badge === "BEST" && (
                  <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-semibold">
                    BEST
                  </span>
                )}
                {item.badge === "up" && (
                  <svg
                    className="w-3 h-3 text-primary-main"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
