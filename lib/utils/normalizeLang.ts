export type LangCode = "KR" | "JP" | "CN" | "EN";

/**
 * 언어 코드를 정규화하여 CRM에서 사용하는 표준 형식으로 변환
 * @param input - 언어 코드 (다양한 형식 허용)
 * @returns 정규화된 언어 코드 (KR, JP, CN, EN 중 하나)
 */
export function normalizeLang(input?: string | null): LangCode {
  const v = (input || "").toUpperCase();

  // US → EN 변환
  if (v === "US") return "EN";
  
  // 다른 형식들 정규화
  if (v === "KO" || v === "KOR") return "KR";
  if (v === "JA" || v === "JPN") return "JP";
  if (v === "ZH" || v === "CHN") return "CN";
  
  // 이미 표준 형식인 경우
  if (v === "EN" || v === "KR" || v === "JP" || v === "CN") {
    return v as LangCode;
  }

  // 기본값 (팀 정책에 맞춰 KR 선택)
  return "KR";
}

