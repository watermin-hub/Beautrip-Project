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
  | "ranking"
  | "pdp"
  | "schedule"
  | "community"
  | "banner"
  | "mypage"
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
    trip_end: tripEnd,     // 예: "2025-01-15"
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

