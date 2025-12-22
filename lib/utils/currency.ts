/**
 * 환율 변환 유틸리티
 * KRW를 기준으로 다른 통화로 변환
 * 
 * 환율은 고정값으로 관리됩니다.
 * 필요시 이 파일의 EXCHANGE_RATES 값을 수정하세요.
 */

export type CurrencyCode = "KRW" | "USD" | "JPY" | "CNY";

// 고정 환율 정보 (KRW 기준, 1 외화 = ? KRW)
// 필요시 이 값을 수정하세요
// 참고: JPY는 100엔 기준이므로 1 JPY = 9.4142 KRW
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  KRW: 1, // 기준 통화
  USD: 1481.00, // 1 USD = 1,481.00 KRW
  JPY: 9.4142, // 1 JPY = 9.4142 KRW (100엔 = 941.42 KRW)
  CNY: 210.53, // 1 CNY = 210.53 KRW
};

/**
 * KRW 금액을 다른 통화로 변환
 * @param krwAmount KRW 금액
 * @param targetCurrency 목표 통화 코드
 * @returns 변환된 금액
 */
export function convertCurrency(
  krwAmount: number,
  targetCurrency: CurrencyCode
): number {
  if (targetCurrency === "KRW") {
    return krwAmount;
  }

  const rate = EXCHANGE_RATES[targetCurrency];
  return krwAmount / rate;
}

/**
 * 통화 코드에 따라 가격을 포맷팅
 * @param price KRW 가격
 * @param currency 통화 코드
 * @param t 번역 함수
 * @returns 포맷된 가격 문자열
 */
export function formatPrice(
  price: number | null | undefined,
  currency: CurrencyCode,
  t: (key: string) => string
): string {
  if (!price) {
    return t("common.priceInquiry");
  }

  const convertedPrice = convertCurrency(price, currency);

  switch (currency) {
    case "KRW":
      // 만원 단위로 표시
      const manWon = Math.round(price / 10000);
      return `${manWon}${t("label.tenThousandWon")}`;

    case "USD":
      // USD는 소수점 1자리까지 표시
      return `$${convertedPrice.toFixed(1)}`;

    case "JPY":
      // JPY는 소수점 없이 표시
      return `¥${Math.round(convertedPrice).toLocaleString()}`;

    case "CNY":
      // CNY는 소수점 1자리까지 표시
      return `¥${convertedPrice.toFixed(1)}`;

    default:
      return `${convertedPrice.toLocaleString()} ${currency}`;
  }
}

/**
 * localStorage에서 통화 설정 가져오기
 * @returns 저장된 통화 코드 또는 기본값 (KRW)
 */
export function getCurrencyFromStorage(): CurrencyCode {
  if (typeof window === "undefined") return "KRW";
  const saved = localStorage.getItem("currency");
  return (saved as CurrencyCode) || "KRW";
}

/**
 * 언어 코드를 통화 코드로 변환
 * @param languageCode 언어 코드
 * @returns 해당하는 통화 코드
 */
export function getCurrencyFromLanguage(
  languageCode: "KR" | "EN" | "JP" | "CN"
): CurrencyCode {
  const currencyMap: Record<"KR" | "EN" | "JP" | "CN", CurrencyCode> = {
    KR: "KRW",
    EN: "USD",
    JP: "JPY",
    CN: "CNY",
  };
  return currencyMap[languageCode] || "KRW";
}

