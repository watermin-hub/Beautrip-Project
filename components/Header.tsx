"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiGlobe, FiBell, FiChevronDown } from "react-icons/fi";
import SearchModal from "./SearchModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  hasRankingBanner?: boolean;
}

export default function Header({ hasRankingBanner = false }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // 캘린더 모달이 열려있는지 확인
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  // 필터 모달이 열려있는지 확인
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const handleCalendarModalStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsCalendarModalOpen(customEvent.detail?.isOpen || false);
    };

    const handleFilterModalStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsFilterModalOpen(customEvent.detail?.isOpen || false);
    };

    window.addEventListener(
      "calendarModalOpen",
      handleCalendarModalStateChange
    );
    window.addEventListener("filterModalOpen", handleFilterModalStateChange);
    return () => {
      window.removeEventListener(
        "calendarModalOpen",
        handleCalendarModalStateChange
      );
      window.removeEventListener(
        "filterModalOpen",
        handleFilterModalStateChange
      );
    };
  }, []);

  // 스크롤 시 헤더 스타일 동적 변경 (살짝 떠 있는 느낌 + 블러)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setIsScrolled(scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const languages = [
    { code: "KR" as const, nameKey: "header.language.korean", flag: "🇰🇷" },
    { code: "EN" as const, nameKey: "header.language.english", flag: "🇺🇸" },
    { code: "JP" as const, nameKey: "header.language.japanese", flag: "🇯🇵" },
    { code: "CN" as const, nameKey: "header.language.chinese", flag: "🇨🇳" },
  ];

  const selectedLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

  // 언어 이름을 번역 키로 가져오기
  const getLanguageName = (code: string) => {
    const lang = languages.find((l) => l.code === code);
    return lang ? t(lang.nameKey) : t("header.language.korean");
  };

  return (
    <>
      <header
        className={`fixed left-1/2 transform -translate-x-1/2 w-full max-w-md ${
          hasRankingBanner ? "top-[41px]" : "top-0"
        } ${
          isCalendarModalOpen || isFilterModalOpen
            ? "z-[30] opacity-50 pointer-events-none"
            : "z-[60]"
        } px-4 py-3 transition-all duration-200 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-md shadow-[0_6px_20px_rgba(15,23,42,0.16)]"
            : "bg-white"
        }`}
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
            {!logoError && (
              <img
                src="/beautrip-logo.png"
                alt={t("header.logoAlt")}
                className="h-6 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
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
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors relative z-[100]"
              >
                <FiGlobe className="text-gray-700 text-xl" />
              </button>
              {isLanguageOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[10000]"
                    onClick={() => setIsLanguageOpen(false)}
                  />
                  <div
                    className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[10001] min-w-[150px] max-w-[200px]"
                    style={{
                      top: "calc(100% + 8px)",
                      right: "-10px",
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
                          {t(lang.nameKey)}
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
