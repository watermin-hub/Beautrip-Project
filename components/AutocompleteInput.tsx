"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  onEnter?: () => void;
  className?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  placeholder = "검색...",
  suggestions,
  onSuggestionSelect,
  onEnter,
  className = "",
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false); // 한글 입력 조합 중인지 추적
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 자동완성 선택으로 인한 value 변경인지 추적
  const isSuggestionSelectedRef = useRef(false);

  // 검색어가 변경되면 자동완성 표시
  useEffect(() => {
    // 자동완성 선택으로 인한 value 변경이면 자동완성을 다시 열지 않음
    if (isSuggestionSelectedRef.current) {
      isSuggestionSelectedRef.current = false;
      return;
    }
    setShowSuggestions(value.length > 0 && suggestions.length > 0);
    setFocusedIndex(-1);
  }, [value, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 항상 onChange 호출 (입력 필드가 업데이트되도록)
    onChange(e.target.value);
  };

  // 한글 입력 조합 시작
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  // 한글 입력 조합 종료
  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setIsComposing(false);
    // 조합이 완료되면 최종 값을 onChange로 전달 (이미 handleInputChange에서 호출되지만 확실히 하기 위해)
    onChange(e.currentTarget.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // 자동완성 선택 플래그 설정 (value 변경으로 인해 자동완성이 다시 열리지 않도록)
    isSuggestionSelectedRef.current = true;
    // 먼저 자동완성을 닫고, 그 다음에 onChange 호출
    setShowSuggestions(false);
    onChange(suggestion);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (showSuggestions && suggestions.length > 0 && focusedIndex >= 0) {
        // 자동완성 항목이 선택된 경우
        e.preventDefault();
        handleSuggestionClick(suggestions[focusedIndex]);
      } else if (onEnter && value.trim().length >= 2) {
        // 자동완성 항목이 선택되지 않은 경우 Enter 키 처리 (2글자 이상일 때만)
        e.preventDefault();
        onEnter();
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <FiSearch className="text-gray-400 text-sm" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length > 0 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main touch-manipulation ${className}`}
        />
      </div>

      {/* 자동완성 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full text-left px-4 py-3 text-base hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px] flex items-center ${
                index === focusedIndex ? "bg-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <FiSearch className="text-gray-400 text-sm flex-shrink-0" />
                <span className="text-base">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
