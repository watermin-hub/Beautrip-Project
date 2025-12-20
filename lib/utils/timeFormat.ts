/**
 * 시간 포맷팅 유틸리티 함수
 * - 상대시간: formatTimeAgo (피드/리스트용)
 * - 절대시간: formatAbsoluteTime (상세 페이지용)
 */

/**
 * 상대시간 포맷팅 (피드/리스트용)
 * 예: "3시간 전", "어제", "2일 전"
 */
export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "방금 전";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

/**
 * 절대시간 포맷팅 (상세 페이지용)
 * 예: "2025-12-14 13:09 (JST)" 또는 "2025-12-14 13:09 (Asia/Tokyo)"
 *
 * @param dateString UTC 타임스탬프 (서버에서 내려온 created_at)
 * @param timezone 사용자 타임존 (예: "Asia/Tokyo", "Asia/Seoul")
 * @param locale 사용자 locale (예: "ja-JP", "ko-KR", "en-US")
 * @returns 포맷팅된 절대시간 문자열
 */
export function formatAbsoluteTime(
  dateString?: string,
  timezone?: string | null,
  locale?: string | null
): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // locale 우선순위: user_profiles.locale > navigator.language > "ko-KR"
    const finalLocale = locale || navigator.language || "ko-KR";

    // timezone 우선순위: user_profiles.timezone > 브라우저 기본 timezone
    const finalTimezone =
      timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 절대시간 포맷팅
    const formattedDate = new Intl.DateTimeFormat(finalLocale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: finalTimezone,
      hour12: false,
    }).format(date);

    // 타임존 표시 (짧은 형식 또는 전체 형식)
    // 예: "Asia/Tokyo" -> "JST" 또는 "Asia/Tokyo"
    const timezoneAbbr = getTimezoneAbbreviation(finalTimezone, date);

    return `${formattedDate} (${timezoneAbbr})`;
  } catch (error) {
    console.error("[formatAbsoluteTime] 시간 포맷팅 오류:", error);
    // 에러 발생 시 기본 포맷으로 반환
    return new Date(dateString).toLocaleString("ko-KR");
  }
}

/**
 * 타임존 약어 가져오기
 * 예: "Asia/Tokyo" -> "JST", "Asia/Seoul" -> "KST"
 */
function getTimezoneAbbreviation(timezone: string, date: Date): string {
  try {
    // Intl.DateTimeFormat을 사용하여 타임존 약어 가져오기
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(date);
    const timeZoneName = parts.find((part) => part.type === "timeZoneName");

    if (timeZoneName) {
      return timeZoneName.value;
    }

    // 약어를 가져올 수 없으면 전체 타임존 이름 반환
    return timezone;
  } catch (error) {
    // 에러 발생 시 전체 타임존 이름 반환
    return timezone;
  }
}

/**
 * Locale 가져오기 (우선순위 적용)
 * 1. user_profiles.locale (있으면)
 * 2. navigator.language (fallback)
 * 3. "ko-KR" 또는 "en-US" (최후 fallback)
 */
export function getLocale(userLocale?: string | null): string {
  return userLocale || navigator.language || "ko-KR";
}
