# 삭제된 컴포넌트 목록

## 완전히 삭제된 컴포넌트 (2024-12-07)

다음 컴포넌트들은 어디서도 import되지 않아 삭제되었습니다:

### 1. 사용되지 않는 컴포넌트 (12개)
- ✅ **DatePickerSection.tsx** - 미완성 컴포넌트 (prompt 사용), TravelScheduleCalendarModal로 대체됨
- ✅ **DDayBanner.tsx** - HomePage에서 주석 처리됨
- ✅ **EventsSection.tsx** - 어디서도 import되지 않음
- ✅ **InterestProceduresSection.tsx** - 어디서도 import되지 않음
- ✅ **QuoteRequestModal.tsx** - 어디서도 import되지 않음
- ✅ **QuoteRequestPage.tsx** - 어디서도 import되지 않음
- ✅ **RankingPage.tsx** - 어디서도 import되지 않음 (RankingSection 사용 중)
- ✅ **ReviewTabPage.tsx** - 어디서도 import되지 않음
- ✅ **ThemeSection.tsx** - 어디서도 import되지 않음
- ✅ **TrendingSearchTerms.tsx** - 어디서도 import되지 않음
- ✅ **SchedulePage.tsx** - app/schedule/page.tsx에서 MySchedulePage 사용 중

### 2. HomePage에서 주석 처리되어 삭제된 컴포넌트 (4개)
- ✅ **SearchSection.tsx** - HomePage에서 주석 처리됨
- ✅ **KBeautyByCountry.tsx** - HomePage에서 주석 처리됨
- ✅ **RecentEventsSection.tsx** - HomePage에서 주석 처리됨
- ✅ **MissionSection.tsx** - HomePage에서 주석 처리됨

## 총 삭제된 파일: 16개

## 변경 사항

### components/HomePage.tsx
- 사용되지 않는 import 문 제거:
  - `SearchSection`
  - `KBeautyByCountry`
  - `RecentEventsSection`
  - `MissionSection`
  - `DDayBanner` (이미 주석 처리되어 있었음)

## 참고

실제 달력 날짜 선택은 다음 컴포넌트에서 처리됩니다:
- **TravelScheduleCalendarModal** - 여행 일정 선택 (시작일/종료일)
- **AddToScheduleModal** - 시술 일정 추가 (단일 날짜)
- **TravelScheduleCalendar** - 일정 캘린더 보기
- **MySchedulePage** - 내 일정 페이지 (자체 달력 구현)

