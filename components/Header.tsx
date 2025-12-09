"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiGlobe, FiBell, FiChevronDown } from "react-icons/fi";
import { BsCloud } from "react-icons/bs";
import SearchModal from "./SearchModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  hasRankingBanner?: boolean;
}

export default function Header({ hasRankingBanner = false }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const router = useRouter();
  const globeButtonRef = useRef<HTMLButtonElement>(null);
  const { language, setLanguage } = useLanguage();
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });

  const languages = [
    { code: "KR" as const, name: "한국어", flag: "🇰🇷" },
    { code: "EN" as const, name: "English", flag: "🇺🇸" },
    { code: "JP" as const, name: "日本語", flag: "🇯🇵" },
    { code: "CN" as const, name: "中文", flag: "🇨🇳" },
  ];

  const selectedLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    if (isLanguageOpen && globeButtonRef.current) {
      const rect = globeButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isLanguageOpen]);

  return (
    <>
      <header
        className={`sticky ${
          hasRankingBanner ? "top-[41px]" : "top-0"
        } z-40 bg-white border-b border-gray-100 px-4 py-3`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            {/* 로고 이미지: public 폴더에 이미지를 넣고 파일명을 맞춰주세요
                예: public/beautrip-logo.png 또는 public/logo.png
                이미지가 없으면 기존 아이콘이 표시됩니다 */}
            {!logoError ? (
              <img
                src="/beautrip-logo.png"
                alt="BeauTrip"
                className="h-6 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <BsCloud className="text-primary-main text-xl" />
            )}
            {/* <h1 className="text-primary-main text-xl font-bold">BeauTrip</h1> */}
          </button>

          {/* Right side icons */}
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <FiSearch className="text-gray-700 text-xl" />
            </button>
            <div className="relative">
              <button
                ref={globeButtonRef}
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors relative z-[100]"
              >
                <FiGlobe className="text-gray-700 text-xl" />
              </button>
              {isLanguageOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[99]"
                    onClick={() => setIsLanguageOpen(false)}
                  />
                  <div
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[150px]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                    }}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLanguageOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          selectedLanguage.code === lang.code
                            ? "bg-primary-main/10"
                            : ""
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-sm text-gray-700">
                          {lang.name}
                        </span>
                        {selectedLanguage.code === lang.code && (
                          <span className="ml-auto text-primary-main">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors relative">
              <FiBell className="text-gray-700 text-xl" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </div>
      </header>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
