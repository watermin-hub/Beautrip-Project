/**
 * 브라우저 감지 및 인앱 브라우저 체크 유틸리티
 */

/**
 * 인앱 브라우저(WebView)인지 확인
 * Google OAuth는 인앱 브라우저에서 차단되므로 사전에 감지 필요
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  // 주요 인앱 브라우저 감지
  const inAppBrowsers = [
    "kakaotalk", // 카카오톡
    "naver", // 네이버 앱
    "line", // 라인
    "instagram", // 인스타그램
    "fban", // Facebook (Android)
    "fbav", // Facebook (iOS)
    "fbaa", // Facebook (Android)
    "fbas", // Facebook (iOS)
    "fbios", // Facebook (iOS)
    "fb4a", // Facebook (Android)
    "snapchat", // 스냅챗
    "wv", // Android WebView (단, Chrome은 제외)
  ];

  // 인앱 브라우저 체크
  const isInApp = inAppBrowsers.some((browser) => ua.includes(browser));

  // Android WebView 체크 (Chrome은 제외)
  if (ua.includes("wv") && !ua.includes("chrome")) {
    return true;
  }

  return isInApp;
}

/**
 * 특정 인앱 브라우저 타입 반환
 */
export function getInAppBrowserType(): string | null {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("kakaotalk")) return "kakaotalk";
  if (ua.includes("naver")) return "naver";
  if (ua.includes("line")) return "line";
  if (ua.includes("instagram")) return "instagram";
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fbaa")) return "facebook";
  if (ua.includes("snapchat")) return "snapchat";
  if (ua.includes("wv") && !ua.includes("chrome")) return "webview";

  return null;
}

/**
 * 모바일 브라우저인지 확인
 */
export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
}

/**
 * 삼성 인터넷 브라우저인지 확인
 */
export function isSamsungBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /SamsungBrowser/i.test(navigator.userAgent);
}

/**
 * 외부 브라우저로 열기 (모바일)
 * Android: intent:// 스킴 사용
 * iOS: window.open() 사용
 */
export function openInExternalBrowser(url: string): void {
  if (typeof window === "undefined") return;

  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = ua.includes("android");
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  if (isAndroid) {
    // Android: intent:// 스킴 사용
    const intentUrl = `intent://${url.replace(/https?:\/\//, "")}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
    window.location.href = intentUrl;
  } else if (isIOS) {
    // iOS: window.open() 사용
    window.open(url, "_blank");
  } else {
    // 데스크톱: 일반적으로 문제 없음
    window.open(url, "_blank");
  }
}

/**
 * 인앱 브라우저에서 외부 브라우저로 열기 안내 메시지
 */
export function getInAppBrowserMessage(browserType: string | null): string {
  const messages: Record<string, string> = {
    kakaotalk: "카카오톡 인앱 브라우저에서는 구글 로그인이 불가능합니다.\nChrome 또는 Safari에서 열어주세요.",
    naver: "네이버 앱 인앱 브라우저에서는 구글 로그인이 불가능합니다.\nChrome 또는 Safari에서 열어주세요.",
    line: "라인 인앱 브라우저에서는 구글 로그인이 불가능합니다.\nChrome 또는 Safari에서 열어주세요.",
    instagram: "인스타그램 인앱 브라우저에서는 구글 로그인이 불가능합니다.\nChrome 또는 Safari에서 열어주세요.",
    facebook: "페이스북 인앱 브라우저에서는 구글 로그인이 불가능합니다.\nChrome 또는 Safari에서 열어주세요.",
    webview: "인앱 브라우저에서는 구글 로그인이 불가능합니다.\nChrome 또는 Safari에서 열어주세요.",
  };

  return messages[browserType || "webview"] || messages.webview;
}

