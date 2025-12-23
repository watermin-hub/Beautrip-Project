/**
 * GTM (Google Tag Manager) DataLayer 헬퍼 및 이벤트 트래킹 함수
 *
 * 사용 규칙:
 * 1. event 이름은 GTM 사용자 정의 이벤트 이름과 완전 동일해야 함
 * 2. 파라미터 키는 DLV와 동일해야 함 (trip_start, trip_end, entry_source, review_type)
 * 3. 항상 성공 이후에만 push (버튼 클릭 순간 금지)
 */

/**
 * DataLayer에 이벤트를 푸시하는 헬퍼 함수
 */
export function pushToDataLayer(payload: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/**
 * 일정 추가 이벤트의 진입 경로 타입
 */
export type EntrySource =
  | "home"
  | "explore"
  | "treatment"
  | "community"
  | "banner"
  | "mypage"
  | "schedule"
  | "unknown";

/**
 * 후기 타입
 */
export type ReviewType = "treatment" | "hospital" | "general";

/**
 * trip_date_set 이벤트 트래킹
 *
 * 호출 위치: "여행 날짜 확정" 버튼 클릭 성공 이후, 서버 저장이 있으면 API 성공 응답 이후
 * 주의: date picker 변경 순간에는 호출하지 말 것
 *
 * @param tripStart 여행 시작일 (YYYY-MM-DD 형식)
 * @param tripEnd 여행 종료일 (YYYY-MM-DD 형식)
 */
export function trackTripDateSet(tripStart: string, tripEnd: string) {
  pushToDataLayer({
    event: "trip_date_set",
    trip_start: tripStart, // 예: "2025-01-10"
    trip_end: tripEnd, // 예: "2025-01-15"
  });
}

/**
 * add_to_schedule 이벤트 트래킹
 *
 * 호출 위치: "일정 추가" API 성공 응답 이후
 * 주의: 버튼 클릭 순간이나 실패/예외 케이스에서 호출하지 말 것
 *
 * @param entrySource 일정 추가 진입 경로
 */
export function trackAddToSchedule(entrySource: EntrySource) {
  pushToDataLayer({
    event: "add_to_schedule",
    entry_source: entrySource,
  });
}

/**
 * review_start 이벤트 트래킹
 *
 * 호출 위치: 후기 작성 페이지/모달이 실제로 렌더링 완료된 후
 * - 페이지라면: 컴포넌트 useEffect(() => {...}, [])
 * - 모달이라면: isOpen === true 되고 내용 mount 된 시점
 * 주의: "작성하기" 버튼 클릭 순간에는 호출하지 말 것
 *
 * @param entrySource 후기 작성 진입 경로
 */
export function trackReviewStart(entrySource: EntrySource) {
  pushToDataLayer({
    event: "review_start",
    entry_source: entrySource,
  });
}

/**
 * review_submit 이벤트 트래킹
 *
 * 호출 위치: 후기 저장 API 성공 응답 이후에만
 * 주의: 제출 버튼 클릭 순간이나 validation 실패/서버 에러에서 호출하지 말 것
 *
 * @param reviewType 후기 타입
 */
export function trackReviewSubmit(reviewType: ReviewType) {
  pushToDataLayer({
    event: "review_submit",
    review_type: reviewType,
  });
}

/**
 * schedule_save_click 이벤트 트래킹
 *
 * 호출 위치: 일정 저장 버튼 클릭 핸들러 내부 (validation 통과 후)
 * 목적: 사용자가 일정을 저장할 의도(intent)를 측정하기 위함
 *
 * @param entrySource 일정 저장 진입 경로 ("schedule" | "mypage")
 */
export function trackScheduleSaveClick(entrySource: EntrySource) {
  pushToDataLayer({
    event: "schedule_save_click",
    entry_source: entrySource,
  });
}

/**
 * saved_schedule_view 이벤트 트래킹
 *
 * 호출 위치: 저장된 일정 화면이 실제로 렌더링될 때 (activeTab === "saved")
 * 목적: 저장된 일정 화면의 실제 조회 여부를 측정하기 위함
 *
 * @param entrySource 저장된 일정 화면 진입 경로 ("schedule" | "mypage")
 */
export function trackSavedScheduleView(entrySource: EntrySource) {
  pushToDataLayer({
    event: "saved_schedule_view",
    entry_source: entrySource,
  });
}

/**
 * login_start 이벤트 트래킹
 *
 * 호출 위치: 로그인 버튼 클릭 시점
 * 목적: 사용자가 로그인을 시작했음을 측정
 *
 * @param loginMethod 로그인 방법 ("google" | "local")
 */
export function trackLoginStart(loginMethod: "google" | "local") {
  pushToDataLayer({
    event: "login_start",
    login_method: loginMethod,
  });
}

/**
 * login_success 이벤트 트래킹
 *
 * 호출 위치: 로그인 성공 시점 (세션 생성 후)
 * 목적: 로그인 성공 여부를 측정
 *
 * @param loginMethod 로그인 방법 ("google" | "local")
 * @param userId 사용자 ID
 */
export function trackLoginSuccess(
  loginMethod: "google" | "local",
  userId: string
) {
  pushToDataLayer({
    event: "login_success",
    login_method: loginMethod,
    user_id: userId,
  });
}

/**
 * explore_filter_click 이벤트 트래킹
 *
 * 호출 위치: 탐색 페이지에서 필터 클릭 시
 * 목적: 사용자가 어떤 필터를 선택했는지 측정
 *
 * @param filterType 필터 타입 ("ranking" | "procedure" | "hospital" 등)
 */
export function trackExploreFilterClick(filterType: string) {
  pushToDataLayer({
    event: "explore_filter_click",
    filter_type: filterType,
  });
}

/**
 * explore_category_click 이벤트 트래킹
 *
 * 호출 위치: 탐색 페이지에서 카테고리 클릭 시
 * 목적: 사용자가 어떤 카테고리를 선택했는지 측정
 *
 * @param categoryLarge 대분류명 (현재 언어로 번역된 이름, 예: "눈성형", "리프팅" 등)
 */
export function trackExploreCategoryClick(categoryLarge: string | null) {
  pushToDataLayer({
    event: "explore_category_click",
    category_large: categoryLarge || "all",
  });
}

/**
 * language_change 이벤트 트래킹
 *
 * 호출 위치: 언어/국가 변경 시
 * 목적: 사용자가 언어를 변경했는지 측정
 *
 * @param country 변경된 국가 코드 ("KR" | "EN" | "JP" | "CN")
 */
export function trackLanguageChange(country: string) {
  pushToDataLayer({
    event: "language_change",
    country: country,
  });
}

/**
 * ai_analysis_start 이벤트 트래킹
 *
 * 호출 위치: AI 분석 화면이 노출될 때 (카메라 모달 열릴 때)
 * 목적: AI 분석 시작 여부를 측정
 */
export function trackAIAnalysisStart() {
  pushToDataLayer({
    event: "ai_analysis_start",
  });
}

/**
 * home_banner_click 이벤트 트래킹
 *
 * 호출 위치: 홈 페이지 배너 클릭 시
 * 목적: 어떤 배너가 클릭되었는지 측정
 *
 * @param bannerId 배너 ID (예: "banner_01", "banner_02")
 * @param bannerType 배너 타입 (예: "ai", "review", "kbeauty")
 */
export function trackHomeBannerClick(bannerId: string, bannerType?: string) {
  pushToDataLayer({
    event: "home_banner_click",
    banner_id: bannerId,
    banner_type: bannerType || "unknown",
  });
}

/**
 * content_pdp_view 이벤트 트래킹
 *
 * 호출 위치: 콘텐츠 PDP 페이지가 렌더링될 때 (회복 가이드, 정보성 콘텐츠 등)
 * 목적: 콘텐츠 PDP 조회 여부와 진입 경로를 측정
 *
 * @param contentType 콘텐츠 타입 ("guide" | "recovery_guide")
 * @param entrySource 진입 경로 ("home" | "community" | "banner" 등)
 * @param contentId 콘텐츠 ID (예: "top20", recovery guide의 ID 등)
 */
export function trackContentPdpView(
  contentType: "guide" | "recovery_guide",
  entrySource: EntrySource,
  contentId: string | number
) {
  pushToDataLayer({
    event: "content_pdp_view",
    content_type: contentType,
    entry_source: entrySource,
    content_id: String(contentId),
  });
}

/**
 * pdp_click 이벤트 트래킹
 *
 * 호출 위치: PDP 카드 클릭 시 (페이지 이동 직전)
 * 목적: 어떤 PDP가 클릭되었는지 측정
 *
 * @param entrySource 진입 경로 ("home" | "explore" | "schedule" | "mypage")
 */
export function trackPdpClick(entrySource: EntrySource) {
  pushToDataLayer({
    event: "pdp_click",
    entry_source: entrySource,
  });
}
