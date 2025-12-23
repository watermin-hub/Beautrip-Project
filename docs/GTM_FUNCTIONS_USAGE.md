# GTM 함수 사용 현황 정리

이 문서는 프로젝트 내에서 사용되는 모든 GTM 함수들의 사용 위치를 정리한 문서입니다.

---

## 📌 trackAddToSchedule (우선 확인)

**함수 정의:** `lib/gtm.ts:62`

**사용 위치:**

| 파일 | 라인 | entrySource | 설명 |
|------|------|-------------|------|
| `components/HotConcernsSection.tsx` | 297-298 | `"home"` | 홈 페이지 핫 이슈 섹션에서 일정 추가 |
| `components/TreatmentDetailPage.tsx` | 410-411 | `"pdp"` | 시술 상세 페이지(PDP)에서 일정 추가 |
| `components/KBeautyRankingPage.tsx` | 178-179 | `"ranking"` | K-Beauty 랭킹 페이지에서 일정 추가 |
| `components/ProcedureRecommendation.tsx` | 813-814 | `"schedule"` | 일정 기반 추천 페이지에서 일정 추가 |

**Import 현황:**
- ✅ `components/HotConcernsSection.tsx` - import 추가됨
- ✅ `components/TreatmentDetailPage.tsx` - import 추가됨
- ✅ `components/KBeautyRankingPage.tsx` - import 추가됨
- ✅ `components/ProcedureRecommendation.tsx` - import 추가됨

**참고:** 모든 사용처에서 동적 import(`import("@/lib/gtm")`)를 사용하고 있습니다.

---

## 📋 모든 GTM 함수 사용 현황

### 1. trackHomeBannerClick

**함수 정의:** `lib/gtm.ts:221`

**사용 위치:**

| 파일 | 라인 | bannerId | bannerType | 설명 |
|------|------|----------|-------------|------|
| `components/PromotionBanner.tsx` | 48 | `"banner_01"` | `"review"` | 홈 배너 1번 클릭 (후기 작성) |
| `components/PromotionBanner.tsx` | 60 | `"banner_02"` | `"ai"` | 홈 배너 2번 클릭 (AI 피부 분석) |
| `components/PromotionBanner.tsx` | 70 | `"banner_03"` | `"kbeauty"` | 홈 배너 3번 클릭 (K-Beauty) |
| `components/PromotionBanner.tsx` | 80 | `"banner_04"` | `"travel"` | 홈 배너 4번 클릭 (여행지 추천) |
| `components/PromotionBanner.tsx` | 90 | `"banner_05"` | `"schedule"` | 홈 배너 5번 클릭 (일정 설정) |
| `components/PromotionBanner.tsx` | 107 | `"banner_07"` | `"top20"` | 홈 배너 7번 클릭 (TOP20) |

**Import 현황:**
- ✅ `components/PromotionBanner.tsx` - import 추가됨

---

### 2. trackPdpClick

**함수 정의:** `lib/gtm.ts:258`

**사용 위치:**

| 파일 | 라인 | pdpType | pdpId | 설명 |
|------|------|---------|-------|------|
| `components/ProcedureListPage.tsx` | 553-554 | `"treatment"` | `treatmentId` | 시술 목록에서 시술 클릭 |
| `components/CategoryRankingPage.tsx` | 1104-1105 | `"treatment"` | `treatmentId` | 카테고리 랭킹에서 시술 클릭 |
| `components/InformationalContentSection.tsx` | 212 | `"content"` | `content.id` | 정보성 콘텐츠 클릭 |

**Import 현황:**
- ✅ `components/ProcedureListPage.tsx` - import 추가됨
- ✅ `components/CategoryRankingPage.tsx` - import 추가됨 (이미 있음)
- ✅ `components/InformationalContentSection.tsx` - import 추가됨 (이미 있음)

**참고:** `ProcedureListPage.tsx`와 `CategoryRankingPage.tsx`에서는 `require()`를 사용하고 있습니다.

---

### 3. trackReviewStart / trackReviewSubmit

**함수 정의:** `lib/gtm.ts:79, 94`

**사용 위치:**

| 파일 | 함수 | 라인 | 파라미터 | 설명 |
|------|------|------|----------|------|
| `components/ProcedureReviewForm.tsx` | `trackReviewStart` | 101 | `entrySource` | 시술 후기 작성 시작 |
| `components/ProcedureReviewForm.tsx` | `trackReviewSubmit` | 405 | `"treatment"` | 시술 후기 제출 성공 |
| `components/HospitalReviewForm.tsx` | `trackReviewStart` | 88 | `entrySource` | 병원 후기 작성 시작 |
| `components/HospitalReviewForm.tsx` | `trackReviewSubmit` | 385 | `"hospital"` | 병원 후기 제출 성공 |

**Import 현황:**
- ✅ `components/ProcedureReviewForm.tsx` - import 추가됨 (이미 있음)
- ✅ `components/HospitalReviewForm.tsx` - import 추가됨 (이미 있음)

---

### 4. trackTripDateSet

**함수 정의:** `lib/gtm.ts:46`

**사용 위치:**

| 파일 | 라인 | 설명 |
|------|------|------|
| `components/TravelScheduleBar.tsx` | 139 | 여행 날짜 확정 버튼 클릭 성공 후 |

**Import 현황:**
- ✅ `components/TravelScheduleBar.tsx` - import 추가됨 (이미 있음)

---

### 5. trackScheduleSaveClick / trackSavedScheduleView

**함수 정의:** `lib/gtm.ts:109, 124`

**사용 위치:**

| 파일 | 함수 | 라인 | entrySource | 설명 |
|------|------|------|-------------|------|
| `components/MySchedulePage.tsx` | `trackSavedScheduleView` | 2577 | `"schedule"` | 저장된 일정 화면 조회 |
| `components/MySchedulePage.tsx` | `trackScheduleSaveClick` | 3492 | `"schedule"` | 일정 저장 버튼 클릭 |

**Import 현황:**
- ✅ `components/MySchedulePage.tsx` - import 추가됨 (이미 있음)

---

### 6. trackLoginStart / trackLoginSuccess

**함수 정의:** `lib/gtm.ts:137, 149`

**사용 위치:**

| 파일 | 함수 | 라인 | 설명 |
|------|------|------|------|
| `components/LoginModal.tsx` | `trackLoginStart` | 389, 454 | 로그인 버튼 클릭 (일반 로그인, 소셜 로그인) |
| `components/LoginModal.tsx` | `trackLoginSuccess` | 509, 585 | 로그인 성공 (일반 로그인, 소셜 로그인) |
| `app/auth/callback/page.tsx` | `trackLoginSuccess` | 218 | OAuth 콜백에서 로그인 성공 |

**Import 현황:**
- ✅ `components/LoginModal.tsx` - import 추가됨 (이미 있음)
- ✅ `app/auth/callback/page.tsx` - import 추가됨 (이미 있음)

---

### 7. trackExploreFilterClick / trackExploreCategoryClick

**함수 정의:** `lib/gtm.ts:163, 178`

**사용 위치:**

| 파일 | 함수 | 라인 | 파라미터 | 설명 |
|------|------|------|----------|------|
| `components/CategoryRankingPage.tsx` | `trackExploreCategoryClick` | 357 | `selectedCategory` | 탐색 페이지 카테고리 클릭 |
| `components/CategoryRankingPage.tsx` | `trackExploreFilterClick` | 364 | `"category"` | 탐색 페이지 필터 클릭 |

**Import 현황:**
- ✅ `components/CategoryRankingPage.tsx` - import 추가됨 (이미 있음)

---

### 8. trackLanguageChange

**함수 정의:** `lib/gtm.ts:193`

**사용 위치:**

| 파일 | 라인 | 설명 |
|------|------|------|
| `contexts/LanguageContext.tsx` | 2865-2866 | 언어 변경 시 (동적 import 사용) |

**Import 현황:**
- ⚠️ `contexts/LanguageContext.tsx` - 동적 import 사용 중 (정적 import 없음)

---

### 9. trackAIAnalysisStart

**함수 정의:** `lib/gtm.ts:206`

**사용 위치:**

| 파일 | 라인 | 설명 |
|------|------|------|
| `components/AISkinAnalysisButton.tsx` | 60 | AI 피부 분석 버튼 클릭 시 |
| `components/AIAnalysisBanner.tsx` | 73 | AI 분석 배너 클릭 시 |

**Import 현황:**
- ✅ `components/AISkinAnalysisButton.tsx` - import 추가됨 (이미 있음)
- ✅ `components/AIAnalysisBanner.tsx` - import 추가됨 (이미 있음)

---

### 10. trackContentPdpView

**함수 정의:** `lib/gtm.ts:238`

**사용 위치:**

| 파일 | 라인 | contentType | entrySource | 설명 |
|------|------|-------------|-------------|------|
| `components/RecoveryGuidePage.tsx` | 38 | `"recovery_guide"` | `entrySource` | 회복 가이드 페이지 조회 |
| `components/Top20InfoPage.tsx` | 36 | `"top20"` | `entrySource` | TOP20 정보 페이지 조회 |

**Import 현황:**
- ✅ `components/RecoveryGuidePage.tsx` - import 추가됨 (이미 있음)
- ✅ `components/Top20InfoPage.tsx` - import 추가됨 (이미 있음)

---

## 📊 요약

### Import 방식별 분류

**정적 import (권장):**
- `trackHomeBannerClick` - PromotionBanner.tsx
- `trackPdpClick` - ProcedureListPage.tsx, CategoryRankingPage.tsx, InformationalContentSection.tsx
- `trackReviewStart/Submit` - ProcedureReviewForm.tsx, HospitalReviewForm.tsx
- `trackTripDateSet` - TravelScheduleBar.tsx
- `trackScheduleSaveClick/View` - MySchedulePage.tsx
- `trackLoginStart/Success` - LoginModal.tsx, auth/callback/page.tsx
- `trackExploreFilterClick/CategoryClick` - CategoryRankingPage.tsx
- `trackAIAnalysisStart` - AISkinAnalysisButton.tsx, AIAnalysisBanner.tsx
- `trackContentPdpView` - RecoveryGuidePage.tsx, Top20InfoPage.tsx

**동적 import (현재 사용 중):**
- `trackAddToSchedule` - 모든 사용처에서 동적 import 사용
- `trackLanguageChange` - LanguageContext.tsx에서 동적 import 사용
- `trackPdpClick` - ProcedureListPage.tsx, CategoryRankingPage.tsx에서 require() 사용

### 개선 권장사항

1. **동적 import를 정적 import로 변경 고려:**
   - `trackAddToSchedule` - 4개 파일에서 사용 중
   - `trackLanguageChange` - 1개 파일에서 사용 중

2. **require()를 import로 변경:**
   - `trackPdpClick` - ProcedureListPage.tsx, CategoryRankingPage.tsx

---

**최종 업데이트:** 2025-01-XX
**작성자:** AI Assistant

