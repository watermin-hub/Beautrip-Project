// 화폐 변환 유틸리티
import type { LanguageCode } from "@/contexts/LanguageContext";

// 언어별 화폐 매핑
export const CURRENCY_MAP: Record<LanguageCode, string> = {
  KR: "KRW",
  EN: "USD",
  JP: "JPY",
  CN: "CNY",
};

// 화폐 심볼
export const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: "₩",
  USD: "$",
  JPY: "¥",
  CNY: "¥",
};

// 기본 환율 (1 USD = 1,300 KRW 기준, 실제로는 API에서 가져와야 함)
// TODO: 나중에 환율 API 연동
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1300, // 1 USD = 1,300 KRW
  JPY: 9, // 1 JPY = 9 KRW (대략)
  CNY: 180, // 1 CNY = 180 KRW (대략)
  KRW: 1, // 1 KRW = 1 KRW
};

/**
 * 사용자 입력값(사용자 화폐)을 원화 만원 단위로 변환
 * @param inputValue 사용자가 입력한 값
 * @param fromCurrency 입력 화폐 코드 (KRW, USD, JPY, CNY)
 * @returns 원화 만원 단위 (예: 100만원 → 100)
 */
export function convertToKRWManwon(
  inputValue: string,
  fromCurrency: string
): number | null {
  if (!inputValue || inputValue.trim() === "") {
    return null;
  }

  const numValue = parseFloat(inputValue.replace(/,/g, ""));
  if (isNaN(numValue) || numValue <= 0) {
    return null;
  }

  // KRW인 경우: 만원 단위로 변환 (예: 100만원 → 100)
  if (fromCurrency === "KRW") {
    return Math.round(numValue / 10000);
  }

  // 다른 화폐인 경우: 환율로 변환 후 만원 단위로
  const exchangeRate = DEFAULT_EXCHANGE_RATES[fromCurrency] || 1;
  const krwValue = numValue * exchangeRate; // 원화로 변환
  return Math.round(krwValue / 10000); // 만원 단위로 변환
}

/**
 * 원화 만원 단위를 사용자 화폐로 변환하여 표시
 * @param krwManwon 원화 만원 단위 (예: 100 = 100만원)
 * @param toCurrency 표시할 화폐 코드
 * @returns 변환된 값 (소수점 2자리까지)
 */
export function convertFromKRWManwon(
  krwManwon: number | null | undefined,
  toCurrency: string
): string {
  if (!krwManwon || krwManwon <= 0) {
    return "";
  }

  const krwValue = krwManwon * 10000; // 만원 → 원화

  // KRW인 경우: 만원 단위로 표시
  if (toCurrency === "KRW") {
    return krwManwon.toString();
  }

  // 다른 화폐인 경우: 환율로 변환
  const exchangeRate = DEFAULT_EXCHANGE_RATES[toCurrency] || 1;
  const convertedValue = krwValue / exchangeRate;
  
  // 소수점 2자리까지 표시
  return convertedValue.toFixed(2);
}

/**
 * 언어 코드로 화폐 코드 가져오기
 */
export function getCurrencyFromLanguage(language: LanguageCode): string {
  return CURRENCY_MAP[language] || "KRW";
}

/**
 * 화폐 코드로 심볼 가져오기
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency] || currency;
}

/**
 * 화폐 단위 표시 텍스트 (예: "만원", "USD", "JPY")
 */
export function getCurrencyUnitText(
  currency: string,
  language: LanguageCode
): string {
  if (currency === "KRW") {
    return language === "KR" ? "만원" : "10,000 KRW";
  }
  return currency;
}

