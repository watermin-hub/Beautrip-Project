# 컴포넌트 구조 및 사용 현황

> **최종 업데이트**: 2024-12-07
> **삭제된 컴포넌트**: 16개 (DELETED_COMPONENTS.md 참고)

## 📱 홈페이지 (HomePage.tsx)

### 사용 중인 컴포넌트:

1. **RankingBanner** - 상단 고정 랭킹 배너
2. **Header** - 헤더 (배너 아래 고정)
3. **TravelScheduleBar** - 여행 일정 입력 바
   - **TravelScheduleCalendarModal** - 여행 일정 선택 모달 (시작일/종료일)
4. **HotConcernsSection** - 인기 시술 (일정 미선택 시)
   - **AddToScheduleModal** - 시술 일정 추가 모달
5. **ProcedureRecommendation** - 맞춤 시술 추천 (일정 선택 시)
   - **ProcedureFilterModal** - 시술 필터 모달
   - **AddToScheduleModal** - 시술 일정 추가 모달
6. **PromotionBanner** - 배너 슬라이더 (AI/이벤트/블프...)
   - **AISkinAnalysisConsentModal** - AI 피부 분석 동의 모달
   - **AISkinAnalysisCameraModal** - AI 피부 분석 카메라 모달
7. **CountryPainPointSection** - 국가별 페인포인트 인기 검색어 목록
8. **AIAnalysisBanner** - AI 분석 배너
   - **AISkinAnalysisConsentModal** - AI 피부 분석 동의 모달
   - **AISkinAnalysisCameraModal** - AI 피부 분석 카메라 모달
9. **PopularReviewsSection** - 인기 급상승 리뷰
10. **InformationalContentSection** - 정보성 컨텐츠 섹션
11. **AISkinAnalysisButton** - 플로팅 AI 피부 분석 버튼
    - **AISkinAnalysisConsentModal** - AI 피부 분석 동의 모달
    - **AISkinAnalysisCameraModal** - AI 피부 분석 카메라 모달
12. **OverlayBar** - 오버레이 바
13. **CommunityWriteModal** - 커뮤니티 글쓰기 모달
    - **ProcedureReviewForm** - 시술 후기 작성 폼
    - **HospitalReviewForm** - 병원 후기 작성 폼
    - **ConcernPostForm** - 고민글 작성 폼
14. **BottomNavigation** - 하단 네비게이션

---

## 🔍 탐색 탭 (ExploreScrollPage.tsx)

### 사용 중인 컴포넌트:

1. **Header** - 헤더
   - **SearchModal** - 검색 모달
     - **AutocompleteInput** - 자동완성 입력
2. **ExploreHeader** - 탐색 탭 상단 네비게이션 (랭킹, 시술 목록, 병원 목록)
3. **RankingSection** - 랭킹 섹션
   - **CategoryRankingPage** - 카테고리별 인기 랭킹
   - **KBeautyRankingPage** - K-Beauty 인기 랭킹
   - **HospitalRankingPage** - 병원 랭킹
   - **ScheduleBasedRankingPage** - 일정 기반 랭킹
     - **TravelScheduleBar** - 여행 일정 입력 바
     - **TravelScheduleCalendarModal** - 여행 일정 선택 모달
     - **ProcedureRecommendation** - 맞춤 시술 추천
4. **ProcedureListPage** - 시술 목록
   - **CommunityWriteModal** - 커뮤니티 글쓰기 모달
   - **AutocompleteInput** - 자동완성 입력
   - **AddToScheduleModal** - 시술 일정 추가 모달
5. **HospitalInfoPage** - 병원 목록
   - **CommunityWriteModal** - 커뮤니티 글쓰기 모달
   - **AutocompleteInput** - 자동완성 입력
6. **BottomNavigation** - 하단 네비게이션

### IA와 다른 부분:

- ✅ **랭킹 섹션에 Kbeauty 인기 랭킹, 병원 랭킹 포함됨**
  - 현재: RankingSection 안에 CategoryRankingPage, KBeautyRankingPage, HospitalRankingPage 모두 포함
- ❌ **글 작성 유도 버튼이 없음**
  - IA: 병원 목록과 시술 목록 위에 "글 작성 유도 button" 표시
- ❌ **병원 정보/시술 정보 상세 페이지 기능 부족**
  - 현재: 기본 정보만 표시
  - IA: 문의하기 (AI 채팅, 전화, 메일), 찜하기 기능 필요
- ❌ **시술 찜하기 후 일정 저장 기능 없음**
  - IA: 찜하기 → 내 일정의 찜한 시술 저장 → 여행 일정 목록 선택 → 시술 일자 선택 → 내 일정 저장

---

## 💬 커뮤니티 탭 (CommunityPage.tsx)

### 사용 중인 컴포넌트:

1. **Header** - 헤더
   - **SearchModal** - 검색 모달
2. **CommunityHeader** - 커뮤니티 탭 헤더 (정보, 추천, 최신, 카테고리, 고민상담)
   - **ReviewFilterModal** - 리뷰 필터 모달
     - **ReviewWriteModal** - 리뷰 작성 모달
3. **InformationalContentSection** - 정보성 컨텐츠 섹션 (정보 탭)
4. **PostList** - 게시글 목록 (추천, 최신 탭)
5. **CategoryCommunityPage** - 카테고리 페이지
   - **CommunityRecommendations** - 커뮤니티 추천
     - **CommunityPostCard** - 커뮤니티 게시글 카드
6. **ConsultationPage** - 고민상담 페이지
7. **CommunityFloatingButton** - 커뮤니티 플로팅 버튼 (글 쓰기)
   - **CommunityWriteModal** - 커뮤니티 글쓰기 모달
8. **BottomNavigation** - 하단 네비게이션

---

## 👤 마이페이지 (MyPage.tsx)

### 사용 중인 컴포넌트:

1. **Header** - 헤더
2. **LoginModal** - 로그인 모달 (비로그인 시)
3. **BottomNavigation** - 하단 네비게이션

---

## 📋 기타 페이지 컴포넌트

### 사용 중:

- **FavoritesPage** - 찜한 목록 페이지
- **MySchedulePage** - 내 일정 페이지
  - **TravelScheduleCalendarModal** - 여행 일정 선택 모달
- **NearbyPage** - 주변 병원 페이지
- **TreatmentDetailPage** - 시술 상세 페이지
  - **AddToScheduleModal** - 시술 일정 추가 모달
- **CategoryPhotoReviewPage** - 카테고리별 사진 리뷰 페이지
  - **SearchModal** - 검색 모달

### 모달 컴포넌트:

- **ReviewWriteModal** - 리뷰 작성 모달
- **ReviewFilterModal** - 리뷰 필터 모달
- **SearchModal** - 검색 모달
  - **AutocompleteInput** - 자동완성 입력
- **AISkinAnalysisConsentModal** - AI 피부 분석 동의 모달
- **AISkinAnalysisCameraModal** - AI 피부 분석 카메라 모달
- **ProcedureFilterModal** - 시술 필터 모달
- **TravelScheduleCalendarModal** - 여행 일정 캘린더 모달
- **AddToScheduleModal** - 시술 일정 추가 모달

### 폼 컴포넌트:

- **TravelScheduleForm** - 여행 일정 폼
- **TravelScheduleBar** - 여행 일정 바
- **TravelScheduleCalendar** - 여행 일정 캘린더 (SchedulePage에서 사용 예정이었으나 삭제됨)

### 기타 컴포넌트:

- **FilterTags** - 필터 태그 (사용처 확인 필요)
- **CommunityPostCard** - 커뮤니티 게시글 카드
- **CommunityRecommendations** - 커뮤니티 추천

---

## 📊 컴포넌트 계층 구조

```
HomePage
├── RankingBanner
├── Header
│   └── SearchModal
│       └── AutocompleteInput
├── TravelScheduleBar
│   └── TravelScheduleCalendarModal
├── HotConcernsSection (일정 미선택 시)
│   └── AddToScheduleModal
├── ProcedureRecommendation (일정 선택 시)
│   ├── ProcedureFilterModal
│   └── AddToScheduleModal
├── PromotionBanner
│   ├── AISkinAnalysisConsentModal
│   └── AISkinAnalysisCameraModal
├── CountryPainPointSection
├── AIAnalysisBanner
│   ├── AISkinAnalysisConsentModal
│   └── AISkinAnalysisCameraModal
├── PopularReviewsSection
├── InformationalContentSection
├── AISkinAnalysisButton
│   ├── AISkinAnalysisConsentModal
│   └── AISkinAnalysisCameraModal
├── OverlayBar
├── CommunityWriteModal
│   ├── ProcedureReviewForm
│   ├── HospitalReviewForm
│   └── ConcernPostForm
└── BottomNavigation

ExploreScrollPage
├── Header
│   └── SearchModal
│       └── AutocompleteInput
├── ExploreHeader
├── RankingSection
│   ├── CategoryRankingPage
│   ├── KBeautyRankingPage
│   ├── HospitalRankingPage
│   └── ScheduleBasedRankingPage
│       ├── TravelScheduleBar
│       │   └── TravelScheduleCalendarModal
│       └── ProcedureRecommendation
│           ├── ProcedureFilterModal
│           └── AddToScheduleModal
├── ProcedureListPage
│   ├── CommunityWriteModal
│   ├── AutocompleteInput
│   └── AddToScheduleModal
├── HospitalInfoPage
│   ├── CommunityWriteModal
│   └── AutocompleteInput
└── BottomNavigation

CommunityPage
├── Header
│   └── SearchModal
├── CommunityHeader
│   └── ReviewFilterModal
│       └── ReviewWriteModal
├── InformationalContentSection (정보 탭)
├── PostList (추천/최신 탭)
├── CategoryCommunityPage (카테고리 탭)
│   └── CommunityRecommendations
│       └── CommunityPostCard
├── ConsultationPage (고민상담 탭)
├── CommunityFloatingButton
│   └── CommunityWriteModal
│       ├── ProcedureReviewForm
│       ├── HospitalReviewForm
│       └── ConcernPostForm
└── BottomNavigation

MyPage
├── Header
├── LoginModal
└── BottomNavigation
```

---

## 🔍 탐색 탭 IA 비교 분석

### IA 구조:

1. **상단 네비게이션바**
   - 랭킹 ✅
     - 카테고리별 인기 랭킹 ✅
     - Kbeauty 인기 랭킹 ✅
     - 병원 랭킹 ✅
   - 추천 ✅ (RecommendationPage는 별도로 존재하지만 현재 ExploreScrollPage에서는 사용 안 함)
     - 카테고리 맞춤 추천 ✅
     - 유행 시술 맞춤 추천 ✅
     - 일정 맞춤 추천 ✅
2. **글 작성 유도 button** ❌ (없음)
3. **병원 목록** ✅
   - 병원 정보 ✅
     - 문의하기 (AI 채팅, 전화, 메일) ⚠️ (부분 구현)
     - 찜하기 ✅
4. **글 작성 유도 button** ❌ (없음)
5. **시술 목록** ✅
   - 시술정보 ✅
     - 문의하기 (AI 채팅, 전화, 메일) ⚠️ (부분 구현)
     - 찜하기 ✅
     - 내 일정의 찜한 시술 저장 ❌ (없음)

### 주요 차이점:

1. **랭킹 섹션 구조가 다름**
   - IA: 랭킹 탭 안에 3개 하위 섹션 (카테고리별, Kbeauty, 병원)
   - 현재: ✅ 랭킹 섹션에 CategoryRankingPage, KBeautyRankingPage, HospitalRankingPage 모두 포함됨
2. **글 작성 유도 버튼이 없음**
   - IA: 병원 목록과 시술 목록 위에 표시
3. **시술 찜하기 후 일정 저장 기능 없음**
   - IA: 찜하기 → 일정 저장 플로우가 있음
   - 현재: 찜하기만 가능

---

## 🗑️ 삭제된 컴포넌트 (2024-12-07)

다음 컴포넌트들은 사용되지 않아 삭제되었습니다:

1. **DatePickerSection.tsx** - 미완성 (TravelScheduleCalendarModal로 대체)
2. **DDayBanner.tsx** - HomePage에서 주석 처리됨
3. **EventsSection.tsx** - 어디서도 import되지 않음
4. **InterestProceduresSection.tsx** - 어디서도 import되지 않음
5. **QuoteRequestModal.tsx** - 어디서도 import되지 않음
6. **QuoteRequestPage.tsx** - 어디서도 import되지 않음
7. **RankingPage.tsx** - 어디서도 import되지 않음 (RankingSection 사용 중)
8. **ReviewTabPage.tsx** - 어디서도 import되지 않음
9. **ThemeSection.tsx** - 어디서도 import되지 않음
10. **TrendingSearchTerms.tsx** - 어디서도 import되지 않음
11. **SchedulePage.tsx** - app/schedule/page.tsx에서 MySchedulePage 사용 중
12. **SearchSection.tsx** - HomePage에서 주석 처리됨
13. **KBeautyByCountry.tsx** - HomePage에서 주석 처리됨
14. **RecentEventsSection.tsx** - HomePage에서 주석 처리됨
15. **MissionSection.tsx** - HomePage에서 주석 처리됨

자세한 내용은 `DELETED_COMPONENTS.md` 참고

---

## 📝 참고사항

### 달력 날짜 선택 컴포넌트

실제 달력 날짜 선택은 다음 컴포넌트에서 처리됩니다:

- **TravelScheduleCalendarModal** - 여행 일정 선택 (시작일/종료일 범위 선택)
- **AddToScheduleModal** - 시술 일정 추가 (단일 날짜 선택)
- **MySchedulePage** - 내 일정 페이지 (자체 달력 구현)

### 후기 작성 폼

- **ProcedureReviewForm** - 시술 후기 작성 (Supabase 저장 기능 구현됨)
- **HospitalReviewForm** - 병원 후기 작성 (Supabase 저장 기능 구현됨)
- **ConcernPostForm** - 고민글 작성 (Supabase 저장 기능 구현됨)

모든 폼은 `CommunityWriteModal`에서 사용되며, Supabase에 데이터를 저장합니다.
