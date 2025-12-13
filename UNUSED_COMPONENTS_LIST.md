# 사용되지 않는 컴포넌트 목록

## 확인된 사용되지 않는 컴포넌트

다음 컴포넌트들은 프로젝트 전체에서 import되지 않았습니다:

1. **DDayBanner.tsx** - HomePage에서 주석 처리됨
2. **CalendarSidebar.tsx** - 어디서도 import되지 않음
3. **CategoriesSection.tsx** - 어디서도 import되지 않음
4. **DatePickerSection.tsx** - ❌ **미완성 컴포넌트 (prompt 사용)** - 실제로는 **TravelScheduleCalendarModal** 사용 중
5. **EventsSection.tsx** - 어디서도 import되지 않음
6. **InterestProceduresSection.tsx** - 어디서도 import되지 않음
7. **QuoteRequestModal.tsx** - 어디서도 import되지 않음
8. **QuoteRequestPage.tsx** - 어디서도 import되지 않음
9. **RankingPage.tsx** - 어디서도 import되지 않음 (RankingSection은 사용됨)
10. **ReviewTabPage.tsx** - 어디서도 import되지 않음
11. **ThemeSection.tsx** - 어디서도 import되지 않음
12. **TrendingSearchTerms.tsx** - 어디서도 import되지 않음

## 실제 달력 날짜 선택 컴포넌트

**DatePickerSection은 사용되지 않습니다.** 대신 다음 컴포넌트들이 실제로 사용됩니다:

1. **TravelScheduleCalendarModal** - 여행 일정 선택 (시작일/종료일 범위 선택)

   - 사용처: `TravelScheduleBar`, `MySchedulePage`, `ScheduleBasedRankingPage`
   - 기능: 시작일과 종료일을 선택하는 모달

2. **AddToScheduleModal** - 시술 일정 추가 (단일 날짜 선택)

   - 사용처: `ProcedureListPage`, `ProcedureRecommendation`, `TreatmentDetailPage`, `HotConcernsSection`
   - 기능: 시술을 일정에 추가할 때 날짜 선택

3. **TravelScheduleCalendar** - 일정 캘린더 보기

   - 사용처: `SchedulePage`
   - 기능: 저장된 일정을 캘린더 형식으로 표시

4. **MySchedulePage** - 내 일정 페이지 (자체 달력 구현)
   - 사용처: `app/schedule/page.tsx`
   - 기능: 내 일정을 관리하는 페이지에서 직접 달력 구현

## 주의: 확인이 필요한 컴포넌트

다음 컴포넌트들은 import되지만 실제로 사용되지 않을 수 있습니다:

- **SchedulePage.tsx** - app/schedule/page.tsx에서 MySchedulePage를 사용하므로 사용 안 될 수 있음
- **RecentEventsSection.tsx** - HomePage에서 import되지만 실제로 렌더링되는지 확인 필요
- **MissionSection.tsx** - HomePage에서 import되지만 실제로 렌더링되는지 확인 필요
- **KBeautyByCountry.tsx** - HomePage에서 import되지만 실제로 렌더링되는지 확인 필요
- **SearchSection.tsx** - HomePage에서 import되지만 실제로 렌더링되는지 확인 필요

## 삭제 권장 순서

1. 확실히 사용되지 않는 컴포넌트 (위 12개)
2. 확인 후 삭제 가능한 컴포넌트 (SchedulePage 등)
