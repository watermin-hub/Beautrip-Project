# 작업 로그 - 2025년 12월

## 2025-12-21 (오늘 작업)

### 📋 작업 개요

- **다국어 지원 개선** ⭐⭐
  - 달력 모달의 월/일/년 표시 언어별 지원 추가
  - 날짜 포맷 함수의 "일" 표시 언어별 지원 추가
- **UI/UX 개선**
  - 랭킹배너 레이아웃 간격 조정
  - Kbeauty → K-Beauty 통일 (탭, 제목, 설명, 빈 상태 메시지)
- **번역 키 추가 및 하드코딩 텍스트 제거**

---

### ✅ 완료된 작업

#### 1. TravelScheduleCalendarModal 다국어 지원 개선 ⭐⭐

**수정 파일:**
- `components/TravelScheduleCalendarModal.tsx`

**주요 변경사항:**
- 월 이름을 언어별로 표시하도록 변경 (KR: "1월", EN: "Jan", JP: "1月", CN: "1月")
- 요일 이름을 언어별로 표시하도록 변경 (KR: "일", EN: "Sun", JP: "日", CN: "日")
- "년" 표시를 언어별로 변경 (KR: "년", JP/CN: "年", EN: 없음)
- 언어 변경 시 달력의 모든 텍스트가 즉시 반영되도록 개선

**문제 해결:**
- 이전: 언어를 변경해도 달력 팝업의 월/일/년이 한국어로만 표시됨
- 해결: `useLanguage`의 `language` 값을 사용하여 동적으로 언어별 텍스트 표시

#### 2. formatDateWithDay 함수의 "일" 표시 언어 지원

**수정 파일:**
- `lib/utils/dateFormat.ts`

**주요 변경사항:**
- "일" 표시를 언어별로 변경 (KR: "일", JP/CN: "日", EN: 없음)
- 이전: "월"은 언어별로 변경되지만 "일"은 항상 한국어 "일"로 표시됨
- 해결: `dayLabel` 객체를 추가하여 언어별 "일" 표시 지원

**예시:**
- 한국어: "12월 20일 (토)"
- 일본어: "12月 20日 (土)"
- 영어: "Dec 20 (Sat)"

#### 3. 랭킹배너 레이아웃 개선

**수정 파일:**
- `components/RankingBanner.tsx`

**주요 변경사항:**
- 요소 간 간격을 `gap-2`에서 `gap-2.5`로 증가
- "best" 태그에 `ml-1` 추가하여 간격 확보
- 랭킹 번호, 이름, 태그 간 시각적 간격 개선

#### 4. Kbeauty → K-Beauty 통일

**수정 파일:**
- `contexts/LanguageContext.tsx`
- `components/RankingSection.tsx`
- `components/KBeautyRankingPage.tsx`

**주요 변경사항:**
- 모든 언어의 `"explore.ranking.kbeauty"` 번역을 "K-Beauty"로 통일
- KBeautyRankingPage의 하드코딩된 텍스트를 번역 키로 변경:
  - `"kbeauty.title"`: "K-Beauty 인기 랭킹"
  - `"kbeauty.description"`: "K-Beauty 트렌드를 반영한 인기 시술 랭킹입니다."
  - `"kbeauty.empty"`: "K-Beauty 시술이 없습니다."
- RankingSection에서 하드코딩된 "Kbeauty"를 번역 키 `"explore.ranking.kbeauty"`로 변경

**번역 지원:**
- 한국어: "K-Beauty"
- 영어: "K-Beauty"
- 일본어: "K-Beauty"
- 중국어: "K-Beauty"

---

### 📊 작업 통계

- **수정된 파일 수**: 4개
- **추가된 번역 키**: 3개 (kbeauty.title, kbeauty.description, kbeauty.empty)
- **수정된 번역 키**: 4개 (모든 언어의 explore.ranking.kbeauty)
- **주요 개선사항**: 다국어 지원 완성도 향상, UI 일관성 개선

---

### 💡 기술적 세부사항

1. **언어별 데이터 구조**
   - `monthNames`, `dayNames`, `yearLabel을 Record<LanguageCode, ...>` 타입으로 정의
   - 언어 코드에 따라 동적으로 텍스트 선택

2. **번역 키 체계**
   - `kbeauty.*`: K-Beauty 관련 텍스트
   - `explore.ranking.*`: 탐색 페이지 랭킹 탭 관련 텍스트

3. **레이아웃 개선**
   - Tailwind CSS의 spacing scale 활용 (`gap-2.5`, `ml-1`)
   - 시각적 계층 구조 개선

---

### 🔮 향후 작업 제안

#### 커뮤니티 댓글 기능 구현 가능 여부 분석

**현재 상태:**
- ✅ 댓글 수 표시: `CommunityPostCard`, `PostList`에서 댓글 수는 표시됨
- ❌ 댓글 테이블: Supabase에 `comments` 테이블이 없음
- ❌ 게시글 상세 페이지: 현재는 목록만 있고 상세 페이지가 없음
- ❌ 댓글 작성/조회/삭제 API: 구현되지 않음

**구현 가능 여부: ✅ 가능**

**필요한 작업:**

1. **Supabase 테이블 생성**
   ```sql
   CREATE TABLE comments (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     post_id UUID NOT NULL,  -- procedure_reviews, hospital_reviews, concern_posts의 id
     post_type TEXT NOT NULL,  -- 'procedure', 'hospital', 'concern'
     user_id BIGINT NOT NULL DEFAULT 0,
     content TEXT NOT NULL,
     parent_comment_id UUID,  -- 대댓글 지원 (선택사항)
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **게시글 상세 페이지 구현**
   - `/community/posts/[id]` 페이지 생성
   - 게시글 내용, 이미지, 작성자 정보 표시
   - 댓글 목록 표시
   - 댓글 작성 폼

3. **API 함수 추가** (`lib/api/beautripApi.ts`)
   - `saveComment(postId, postType, content)`: 댓글 저장
   - `loadComments(postId, postType)`: 댓글 목록 조회
   - `deleteComment(commentId)`: 댓글 삭제 (선택사항)
   - `updateCommentCount(postId, postType)`: 댓글 수 업데이트

4. **UI 컴포넌트**
   - `CommentList.tsx`: 댓글 목록 표시
   - `CommentForm.tsx`: 댓글 작성 폼
   - `CommentItem.tsx`: 개별 댓글 아이템

5. **라우팅 연결**
   - `CommunityPostCard`의 댓글 버튼 클릭 시 상세 페이지로 이동
   - `PostList`의 게시글 클릭 시 상세 페이지로 이동

**예상 작업 시간:**
- 테이블 생성: 30분
- API 함수 구현: 2-3시간
- UI 컴포넌트: 3-4시간
- 상세 페이지: 2-3시간
- 통합 및 테스트: 1-2시간
- **총 예상 시간: 8-12시간**

**우선순위:**
- 중간 우선순위 (커뮤니티 활성화에 중요하지만 필수는 아님)
- 게시글 상세 페이지가 먼저 필요할 수 있음

---

## 2025-12-13_v3 (밤-새벽)

### 📋 작업 개요

- **후기 테이블 API 연결 및 글 입력-출력 기능 구현** ⭐⭐⭐
- 랭킹 페이지 API 연결 및 중분류 필터링 개선
- 일정 페이지 업그레이드 (회복 기간 계산, 일정 제한, 카드 색상)
- 카테고리 필터 UI 개선 (2줄 표시, 이모지 카드)
- 일정 추가 버튼 추가 (랭킹, 메인페이지)
- 맞춤 시술 추천 섹션 개선 (필터 적용, 평균 시술시간/회복기간 표시)
- 여행 일정 정보 UI 개선
- 여행 기간 배경색 표시 개선

---

### ✅ 완료된 작업

#### 1. 후기 테이블 API 연결 및 글 입력-출력 기능 구현 ⭐⭐⭐

**수정 파일:**

- `lib/api/beautripApi.ts`
- `components/ProcedureReviewForm.tsx`
- `components/HospitalReviewForm.tsx`
- `components/ReviewList.tsx`

**주요 기능:**

- **Supabase 후기 테이블 연동**

  - `procedure_reviews` 테이블: 시술 후기 저장 및 조회
  - `hospital_reviews` 테이블: 병원 후기 저장 및 조회
  - `concern_posts` 테이블: 고민글 저장 및 조회 (추정)

- **후기 저장 API 함수**

  - `saveProcedureReview()`: 시술 후기를 Supabase에 저장
  - `saveHospitalReview()`: 병원 후기를 Supabase에 저장
  - 저장 성공 시 생성된 ID 반환

- **후기 조회 API 함수**

  - `loadProcedureReviews()`: 시술 후기 목록을 최신순으로 조회
  - `loadHospitalReviews()`: 병원 후기 목록을 최신순으로 조회
  - `loadConcernPosts()`: 고민글 목록 조회

- **데이터 인터페이스 정의**

  - `ProcedureReviewData`: 시술 후기 데이터 구조
  - `HospitalReviewData`: 병원 후기 데이터 구조
  - `ConcernPostData`: 고민글 데이터 구조

- **글 입력-출력 연동**
  - 후기 작성 폼에서 작성한 내용이 Supabase에 저장
  - 저장된 후기가 목록에 실시간으로 표시
  - 로컬스토리지와 Supabase 동시 사용 (점진적 마이그레이션)

**기술적 개선:**

- Supabase `insert()` 및 `select()` 쿼리 사용
- 에러 핸들링 및 성공/실패 응답 처리
- 최신순 정렬 (`order("created_at", { ascending: false })`)

---

#### 2. 랭킹 페이지 API 연결 및 중분류 필터링 개선

**수정 파일:**

- `lib/api/beautripApi.ts`
- `components/CategoryRankingPage.tsx`

**주요 변경사항:**

- **API 필터링**: `loadTreatmentsPaginated`에 `categoryLarge`, `categoryMid` 필터 추가
- **카테고리 매핑**: `CATEGORY_MAPPING`을 사용하여 UI 카테고리를 DB 값으로 변환
- **중분류 필터링**: 대분류 선택 시 해당 대분류의 중분류만 표시되도록 API 필터링 적용
- **소분류 랭킹**: 중분류 선택 시 소분류별 랭킹 표시

**기술적 개선:**

- API 사이드 필터링으로 클라이언트 부하 감소
- 페이지 크기 동적 조정 (전체: 1000개, 대분류: 500개, 중분류: 300개)

---

#### 2. 일정 페이지 업그레이드

**수정 파일:**

- `components/MySchedulePage.tsx`
- `components/TreatmentDetailPage.tsx`

**주요 기능:**

- **회복 기간 계산 변경**: 시술 당일 제외, 시술 다음날부터 회복 기간 계산
- **일정 제한**: 날짜당 최대 3개 (시술 + 회복 기간 합산) 제한
- **제한 초과 알림**: 3개 초과 시도 시 "일정이 꽉 찼습니다! 3개 이하로 정리 후 다시 시도해 주세요." 팝업 표시
- **카드 색상 구분**:
  - 시술 카드: 빨간 톤 (`bg-red-50`, `border-red-200`)
  - 회복 카드: 초록 톤 (`bg-green-50`, `border-green-200`)
  - 여행 기간 밖 회복 카드: 노란 톤 (`bg-yellow-50`, `border-yellow-200`)
- **회복 가이드 통합**: `recoveryText` 정보를 시술 카드와 회복 카드에 모두 표시
- **여행 기간 배경색**: 여행 기간 전체를 시술/회복과 상관없이 하늘색 배경으로 표시

---

#### 3. 카테고리 필터 UI 개선

**수정 파일:**

- `components/CategoryRankingPage.tsx`
- `components/CategoryCommunityPage.tsx`
- `components/ProcedureRecommendation.tsx`

**주요 변경사항:**

- **랭킹 페이지**: 텍스트만 2줄 그리드 (5개씩), "전체" 버튼 위에 작은 글씨로 배치
- **커뮤니티 카테고리별**: 이모지 카드 형식 2줄 그리드, "ALL 전체" 버튼 위에 따로 배치
- **맞춤 시술 추천**: 이모지 + 텍스트 한 줄 배치, "ALL 전체" 버튼 위에 따로 배치

---

#### 4. 일정 추가 버튼 추가

**수정 파일:**

- `components/CategoryRankingPage.tsx`
- `components/ProcedureRecommendation.tsx`
- `components/HotConcernsSection.tsx`

**주요 기능:**

- **랭킹 페이지**: 각 시술 카드에 일정 추가 버튼 추가 (찜 버튼 위, 달력 아이콘)
- **메인페이지**: 시술 카드에 찜 버튼과 일정 추가 버튼 추가
- **버튼 배치**: 찜 버튼 위, 일정 추가 버튼 아래로 배치
- **일정 제한 확인**: 일정 추가 시 날짜당 3개 제한 확인

---

#### 5. 맞춤 시술 추천 섹션 개선

**수정 파일:**

- `lib/api/beautripApi.ts`
- `components/ProcedureRecommendation.tsx`

**주요 기능:**

- **필터 적용**: 시술시간, 회복기간, 예산 필터 실제 적용
- **대분류 선택**: 대분류 선택 시 해당 대분류의 중분류만 표시
- **평균 시술시간 표시**: "n분~m분" 형식으로 표시 (min/max 기반)
- **평균 회복기간 표시**: "n일~m일" 형식으로 표시 (min/max 기반)
- **카테고리 이름 매핑**: 랭킹 페이지와 동일한 한국어 카테고리 이름 사용
- **여행 기간 정보**: "여행 기간: n박 n일" 텍스트를 제목 바로 아래에 배치

**기술적 개선:**

- `getScheduleBasedRecommendations`를 async 함수로 변경
- `getRecoveryInfoByCategoryMid`에서 시술시간 min/max도 함께 반환
- `Promise.all`을 사용하여 병렬 처리

---

#### 6. 여행 일정 정보 UI 개선

**수정 파일:**

- `components/ProcedureRecommendation.tsx`

**주요 변경사항:**

- **제목 변경**: "여행 일정 정보" → "여행 기간: n박 n일"
- **위치 변경**: 카테고리 필터 위로 이동
- **Bold 해제**: 일반 텍스트로 표시
- **여백 조정**: 위아래 패딩 축소 (`py-2`)

---

### 🔧 기술적 개선사항

1. **API 최적화**

   - API 사이드 필터링으로 클라이언트 부하 감소
   - 비동기 처리 최적화 (`Promise.all` 사용)

2. **데이터 정확성**

   - `category_treattime_recovery` 테이블의 정확한 컬럼명 사용
   - 회복기간 min/max, 시술시간 min/max 정확히 표시

3. **사용자 경험**

   - 일정 제한으로 일정 관리 용이성 향상
   - 카드 색상 구분으로 시각적 구분 명확화
   - 필터 적용으로 원하는 시술 빠르게 찾기

4. **UI/UX 개선**
   - 카테고리 필터 2줄 표시로 스크롤 없이 모든 카테고리 확인 가능
   - 이모지 카드 형식으로 직관적인 카테고리 선택
   - 여행 기간 전체 배경색으로 여행 기간 명확히 표시

---

### 📝 참고사항

- 회복 기간은 시술 당일을 제외하고 계산 (시술 다음날부터)
- 날짜당 최대 3개 일정 제한 (시술 + 회복 기간 합산)
- 시술시간과 회복기간은 min/max 값이 있으면 "n~m" 형식으로 표시
- 랭킹 페이지와 맞춤 시술 추천에서 동일한 카테고리 이름 사용

---

## 2025-12-13_v2 (오전-오후)

### 📋 작업 개요

- 커뮤니티 페이지 UI 개선
- PostList 컴포넌트 이미지 크기 축소
- 인기글 섹션 탭 메뉴 추가
- 빌드 에러 수정

---

### ✅ 완료된 작업

#### 1. PostList 컴포넌트 이미지 크기 축소

**수정 파일:**

- `components/PostList.tsx`

**주요 변경사항:**

- **이미지 크기 축소**: 모든 섹션(인기글, 최신글, 추천글)의 이미지를 약 1/4 크기로 축소
  - 기존: `aspect-square` + `max-h-96` (큰 크기)
  - 변경: `w-20 h-20` (80px × 80px) 고정 크기 썸네일
- **레이아웃 변경**: `grid` 레이아웃에서 `flex` 레이아웃으로 변경하여 여러 이미지가 한 줄에 표시되도록 개선
- **이미지 오버레이**: 4개 이상 이미지일 때 "+N" 표시 크기도 작게 조정 (`text-lg` → `text-xs`)

**적용 섹션:**

- 인기글 - 시술 후기
- 인기글 - 병원 후기
- 최신글/추천글

---

#### 2. 인기글 섹션 탭 메뉴 추가

**수정 파일:**

- `components/PostList.tsx`

**주요 기능:**

- **상단 탭 메뉴**: "시술 후기" / "병원 후기" 탭 추가
- **스크롤 연동**: 탭 클릭 시 해당 섹션으로 부드럽게 스크롤 이동
- **선택 상태 표시**: 선택된 탭은 파란색(`bg-primary-main`)으로 강조 표시
- **Sticky 헤더**: 스크롤 시 상단에 고정되어 항상 접근 가능 (`sticky top-[48px]`)
- **useRef 활용**: 각 섹션에 `ref`를 연결하여 정확한 스크롤 위치 계산

**구현 세부사항:**

- `popularSection` state로 현재 선택된 탭 관리
- `procedureSectionRef`, `hospitalSectionRef`로 섹션 위치 참조
- `scrollIntoView` API로 부드러운 스크롤 애니메이션 구현

---

#### 3. 빌드 에러 수정

**수정 파일:**

- `components/PostList.tsx`

**문제:**

- Next.js 빌드 시 `Parsing ecmascript source code failed` 에러 발생
- 인기글 섹션의 닫는 괄호(`}`) 불일치로 인한 구문 오류

**해결:**

- 인기글 섹션의 JSX 구조 재정렬
- 시술 후기/병원 후기 섹션의 닫는 태그 정확히 매칭
- `useRef` import 추가 (`useState`, `useEffect`와 함께)

---

### 🔧 기술적 개선사항

1. **UI/UX 개선**

   - 이미지 썸네일 크기 최적화로 더 많은 콘텐츠 표시 가능
   - 탭 기반 네비게이션으로 사용자 경험 향상
   - Sticky 헤더로 항상 접근 가능한 탭 메뉴

2. **성능 최적화**

   - 작은 이미지 크기로 렌더링 성능 개선
   - `flex-wrap`으로 반응형 레이아웃 구현

3. **코드 품질**
   - 빌드 에러 수정으로 안정성 향상
   - TypeScript 타입 안정성 유지

---

### 📝 참고사항

- 이미지는 썸네일 크기로 표시되며, 클릭 시 상세 페이지에서 큰 이미지 확인 가능
- 인기글 탭은 시술 후기와 병원 후기를 분리하여 표시
- 최신글은 시술 후기, 병원 후기, 고민글을 섞어서 표시

---

## 2025-12-13_v1(새벽)

### 📋 작업 개요

- 회복 기간 정보 매칭 로직 수정 및 디버깅
- 여행 기간 연동 기능 구현
- 캐시 데이터 삭제 기능 추가
- 무한 루프 에러 수정

---

### ✅ 완료된 작업

#### 1. 회복 기간 정보 매칭 로직 수정

**수정 파일:**

- `lib/api/beautripApi.ts`

**주요 변경사항:**

- **매칭 기준 변경**: `소분류_리스트` → `중분류` 컬럼과 `category_mid` 매칭
- **컬럼명 수정**: `회복기간_min`, `회복기간_max` → `회복기간_min(일)`, `회복기간_max(일)`
- **인터페이스 업데이트**: `CategoryTreatTimeRecovery` 인터페이스에 정확한 컬럼명 반영
- **디버깅 로그 추가**: 매칭 과정 및 값 확인을 위한 상세 로그 추가

**함수:**

- `getRecoveryInfoByCategoryMid()`: `category_treattime_recovery` 테이블의 `중분류` 컬럼과 `treatment_master` 테이블의 `category_mid`를 매칭하여 회복 기간 정보 반환

---

#### 2. 여행 기간 연동 기능 구현

**수정 파일:**

- `components/TravelScheduleBar.tsx`
- `components/MySchedulePage.tsx`

**주요 기능:**

- **TravelScheduleBar → MySchedulePage 연동**

  - 메인 페이지에서 선택한 여행 기간이 `[내 일정]` 페이지로 자동 연동
  - `localStorage`의 `travelPeriod` 키로 데이터 공유
  - `travelPeriodUpdated` 이벤트로 실시간 업데이트

- **TravelScheduleBar 개선**
  - 초기 로드 시 `localStorage`에서 기존 여행 기간 자동 로드
  - 일정 선택 시 `localStorage`에 자동 저장
  - 부모 컴포넌트에 선택한 일정 전달

---

#### 3. 캐시 데이터 삭제 기능 추가

**수정 파일:**

- `components/MySchedulePage.tsx`

**주요 기능:**

- **초기화 버튼 추가**

  - "초기화" 버튼으로 모든 일정 및 여행 기간 데이터 삭제
  - 예시 데이터(`EXAMPLE_TRAVEL_PERIOD`, `EXAMPLE_PROCEDURES`)도 완전 제거
  - 확인 다이얼로그로 실수 방지

- **데이터 로드 로직 개선**
  - 예시 데이터 자동 로드 제거
  - 로컬스토리지 데이터만 사용
  - 저장된 데이터가 없으면 빈 상태로 표시

---

#### 4. 무한 루프 에러 수정

**수정 파일:**

- `components/TravelScheduleBar.tsx`
- `components/TravelScheduleCalendarModal.tsx`

**문제:**

- `useEffect` 의존성 배열에 함수 참조가 포함되어 매 렌더링마다 재실행되는 무한 루프 발생

**해결:**

- `TravelScheduleBar`: `useEffect` 의존성 배열을 빈 배열 `[]`로 변경 (마운트 시 한 번만 실행)
- `TravelScheduleCalendarModal`: `onModalStateChange`를 의존성에서 제외하고 `isOpen`만 의존성으로 유지

---

### 🔧 기술적 개선사항

1. **데이터 매칭 로직 개선**

   - 정확한 컬럼명 사용으로 데이터 불일치 문제 해결
   - 디버깅 로그로 문제 추적 용이성 향상

2. **상태 관리 개선**

   - `localStorage` 기반 데이터 공유
   - 이벤트 기반 업데이트로 컴포넌트 간 동기화

3. **에러 처리**
   - 무한 루프 방지를 위한 의존성 배열 최적화
   - React Hooks 규칙 준수

---

### 📝 참고사항

- 회복 기간 정보는 `category_treattime_recovery` 테이블의 `중분류` 컬럼과 `treatment_master` 테이블의 `category_mid`를 매칭
- 컬럼명에 `(일)`이 포함되어 있어 정확한 컬럼명 사용 필수
- 여행 기간은 `localStorage`의 `travelPeriod` 키로 저장되며, 모든 페이지에서 공유됨
- 초기화 시 예시 데이터도 완전히 제거되어 빈 상태로 표시됨

---

### 🐛 해결된 이슈

1. **회복 기간이 0일로 표시되는 문제**

   - 원인: 잘못된 컬럼명 사용 (`회복기간_max` → `회복기간_max(일)`)
   - 해결: 정확한 컬럼명으로 수정

2. **무한 루프 에러 (Maximum update depth exceeded)**
   - 원인: `useEffect` 의존성 배열에 함수 참조 포함
   - 해결: 의존성 배열 최적화

---

# 작업 로그 - 2025년 12월 12일

## 📋 작업 개요

- Supabase API 연동 및 데이터 소스 마이그레이션
- 커뮤니티 후기 작성 양식 개선
- 병원 데이터 연동 및 UI 개선

---

## 🔄 주요 변경 사항

### 1. Supabase API 연동 (GitHub JSON → Supabase)

#### 변경 전

- GitHub raw URL에서 JSON 파일 직접 로드
- `https://raw.githubusercontent.com/watermin-hub/1205_api_practice/main/beautrip_treatments_sample_2000.json`

#### 변경 후

- Supabase 데이터베이스에서 직접 데이터 로드
- 4개 테이블 지원:
  - `treatment_master` - 시술 마스터 데이터
  - `category_treattime_recovery` - 카테고리별 시술 시간/회복 기간
  - `hospital_master` - 병원 마스터 데이터
  - `keyword_monthly_trends` - 키워드 월별 트렌드

#### 수정된 파일

- `lib/supabase.ts` - Supabase 클라이언트 생성
- `lib/api/beautripApi.ts` - API 함수들을 Supabase 쿼리로 변경

#### 주요 함수

```typescript
- loadTreatments() - treatment_master 테이블에서 시술 데이터 로드
- loadCategoryTreatTimeRecovery() - category_treattime_recovery 테이블
- loadHospitalMaster() - hospital_master 테이블
- loadKeywordMonthlyTrends() - keyword_monthly_trends 테이블
- loadAllData() - 모든 테이블을 한 번에 로드 (병렬 처리)
```

#### 환경 변수 설정

```env
NEXT_PUBLIC_SUPABASE_URL=https://jkvwtdjkylzxjzvgbwud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. 전체 데이터 로드 문제 해결

#### 문제

- Supabase 기본 limit(1,000개)로 인해 16,000개 중 1,000개만 로드됨

#### 해결

- 페이지네이션 구현으로 모든 데이터 로드
- 1,000개씩 배치로 가져와서 전체 데이터 수집
- 진행 상황을 콘솔에 로그로 출력

#### 수정된 파일

- `lib/api/beautripApi.ts` - `loadTreatments()` 함수에 페이지네이션 추가

---

### 3. 병원 데이터 연동 (hospital_master 테이블)

#### 변경 사항

- `components/HospitalInfoPage.tsx`가 `hospital_master` 테이블에서 직접 데이터 로드
- 기존: `loadTreatments()` → `extractHospitalInfo()` (시술 데이터에서 병원 정보 추출)
- 현재: `loadHospitalMaster()` (병원 마스터 테이블에서 직접 로드)

#### 실제 테이블 구조

```
hospital_id
hospital_name
hospital_url
platform
hospital_rating
review_count
hospital_address
hospital_intro
hospital_info_raw
hospital_departments
hospital_doctors
opening_hours
hospital_img (곧 추가될 예정)
```

#### 수정된 파일

- `lib/api/beautripApi.ts` - `HospitalMaster` 인터페이스 정의
- `components/HospitalInfoPage.tsx` - hospital_master 테이블 사용하도록 수정

---

### 4. 랭킹 알고리즘 위치 정리

#### 위치

모든 랭킹 알고리즘은 `lib/api/beautripApi.ts`에 위치:

1. **`calculateRecommendationScore()`** (라인 310-329)

   - 추천 점수 계산 함수
   - 평점 40% + 리뷰 수 30% + 가격 20% + 할인율 10%

2. **`getCategoryRankings()`** (라인 332-351)

   - 카테고리별 랭킹 생성

3. **`getTreatmentRankings()`** (라인 364-429)

   - 시술별 랭킹 (시술명으로 그룹화)

4. **`getKBeautyRankings()`** (라인 450-468)

   - K-beauty 관련 시술 필터링 및 랭킹

5. **`extractHospitalInfo()`** (라인 200-265)
   - 시술 데이터에서 병원 정보 추출

---

### 5. 커뮤니티 후기 작성 양식 개선

#### 5.1 시술 후기 작성 양식 (`ProcedureReviewForm.tsx`)

##### 변경 사항

- ✅ 시술 날짜를 회복 기간 아래로 이동, 비필수로 변경
- ✅ 카테고리: 대분류 10개로 고정
  - 눈성형, 리프팅, 보톡스, 안면윤곽/양악, 제모, 지방성형, 코성형, 피부, 필러, 가슴성형
- ✅ 시술명: 드롭다운 → 소분류(`category_small`) 자동완성 기능
- ✅ 시술시간/회복기간 제거 → 시술 별점, 병원 별점으로 변경
- ✅ 글 작성 최소 글자 수: 30자 → 10자
- ✅ 태그 섹션 제거
- ✅ 작성 양식 순서 변경:
  1. 시술 카테고리 (필수)
  2. 시술명(수술명) (필수, 소분류 자동완성)
  3. 비용 (만원) (필수)
  4. 전체적인 시술 만족도 (1~5)
  5. 병원 만족도 (1~5)
  6. 병원명(선택사항)
  7. 시술 날짜(선택사항)

##### 네이밍

- "카테고리" → "시술 카테고리"
- "시술, 수술 명" → "시술명(수술명)"
- "시술 별점" → "전체적인 시술 만족도 (1~5)"
- "병원 별점" → "병원 만족도 (1~5)"
- "병원명" → "병원명(선택사항)"
- "시술 날짜" → "시술 날짜(선택사항)"

#### 5.2 병원 후기 작성 양식 (`HospitalReviewForm.tsx`)

##### 변경 사항

- ✅ 병원명을 맨 위로 이동, 필수 항목
- ✅ 병원 방문일을 통역 여부 아래로 이동, 비필수로 변경
- ✅ 시술 카테고리: 대분류 10개로 고정 (시술 후기와 동일)
- ✅ 시술명: 소분류(`category_small`) 자동완성 기능 추가 (선택사항)
- ✅ 앱사용만족도(별점) 제거
- ✅ 글 작성 최소 글자 수: 30자 → 10자
- ✅ 태그 섹션 제거

##### 네이밍

- "시술명" → "시술명(수술명)"
- "전체적인 수술 만족도" → "전체적인 시술 만족도 (1~5)"
- "병원 친절도" → "병원 만족도 (1~5)"

##### 작성 양식 순서

1. 병원명 (필수)
2. 시술 카테고리 (필수)
3. 시술명(수술명) (선택사항, 소분류 자동완성)
4. 전체적인 시술 만족도 (1~5)
5. 병원 만족도 (1~5)
6. 통역 여부
7. 통역 만족도 (1~5) (통역 있음 선택 시)
8. 병원 방문일 (비필수)
9. 글 작성
10. 사진첨부

#### 5.3 고민글 작성 양식 (`ConcernPostForm.tsx`)

##### 변경 사항

- ✅ 부제 섹션 제거
- ✅ 카테고리: 커뮤니티 - 고민상담소 UI에 맞게 유지
- ✅ 글 작성 최소 글자 수: 30자 → 10자
- ✅ 태그 섹션 제거

---

### 6. 자동완성 기능 구현

#### 기능

- 소분류(`category_small`) 필드를 사용한 자동완성
- 선택한 대분류 카테고리에 맞는 소분류만 표시
- 실시간 검색 및 필터링
- 최대 10개 제안 표시

#### 구현 위치

- `components/ProcedureReviewForm.tsx`
- `components/HospitalReviewForm.tsx`

#### 기술적 개선

- 실제 테이블 컬럼명을 동적으로 찾아서 사용
- 다양한 필드명 변형에 대응 (`category_small`, `categorySmall`, `category_small_name` 등)
- 페이지네이션으로 전체 16,000개 데이터 로드

---

### 7. 데이터 구조 개선

#### Treatment 인터페이스 업데이트

```typescript
export interface Treatment {
  treatment_id?: number;
  treatment_name?: string;
  hospital_name?: string;
  category_large?: string;
  category_mid?: string; // 중분류
  category_small?: string; // 소분류 (추가)
  // ... 기타 필드
  [key: string]: any; // 추가 필드 허용
}
```

#### HospitalMaster 인터페이스 정의

```typescript
export interface HospitalMaster {
  hospital_id?: number;
  hospital_name?: string;
  hospital_url?: string;
  platform?: string;
  hospital_rating?: number;
  review_count?: number;
  hospital_address?: string;
  hospital_intro?: string;
  hospital_info_raw?: string;
  hospital_departments?: string;
  hospital_doctors?: string;
  opening_hours?: string;
  hospital_img?: string;
  [key: string]: any;
}
```

---

## 📁 수정된 파일 목록

### 새로 생성된 파일

- `lib/supabase.ts` - Supabase 클라이언트 설정

### 수정된 파일

1. `lib/api/beautripApi.ts`

   - Supabase 쿼리로 변경
   - 4개 테이블 로드 함수 추가
   - 페이지네이션 구현
   - 인터페이스 업데이트

2. `components/HospitalInfoPage.tsx`

   - hospital_master 테이블 사용
   - 실제 테이블 필드명에 맞게 수정

3. `components/ProcedureReviewForm.tsx`

   - 양식 순서 및 필드 변경
   - 소분류 자동완성 기능 추가
   - 네이밍 통일
   - 디버깅 코드 추가

4. `components/HospitalReviewForm.tsx`

   - 양식 순서 및 필드 변경
   - 소분류 자동완성 기능 추가
   - 네이밍 통일

5. `components/ConcernPostForm.tsx`
   - 부제 섹션 제거
   - 태그 섹션 제거
   - 글자 수 제한 변경

### 패키지 추가

- `@supabase/supabase-js` - Supabase 클라이언트 라이브러리

---

## 🔍 디버깅 기능

### 추가된 디버깅 로그

- 전체 데이터 개수 확인
- 실제 테이블 컬럼명 목록
- category_small 필드명 확인
- "눈" 관련 데이터 개수 및 샘플
- 검색 시 상세 로그

### 확인 방법

브라우저 개발자 도구 콘솔(F12)에서 확인 가능

---

## ✅ 완료된 작업 체크리스트

- [x] Supabase 클라이언트 설정
- [x] 4개 테이블 로드 함수 구현
- [x] 페이지네이션으로 전체 데이터 로드 (16,000개)
- [x] hospital_master 테이블 연동
- [x] 시술 후기 작성 양식 개선
- [x] 병원 후기 작성 양식 개선
- [x] 고민글 작성 양식 개선
- [x] 소분류 자동완성 기능 구현
- [x] 네이밍 통일
- [x] 랭킹 알고리즘 위치 정리
- [x] 디버깅 코드 추가

---

## 📝 참고 사항

### Supabase 설정

- URL: `https://jkvwtdjkylzxjzvgbwud.supabase.co`
- 테이블: `treatment_master`, `category_treattime_recovery`, `hospital_master`, `keyword_monthly_trends`

### 데이터 구조

- 대분류: `category_large`
- 중분류: `category_mid`
- 소분류: `category_small`

### 네이밍 규칙

- 시술 후기와 병원 후기에서 동일한 용어 사용
- "시술 카테고리", "시술명(수술명)", "전체적인 시술 만족도", "병원 만족도" 등

---

## 🚀 다음 단계 (선택사항)

1. `hospital_img` 필드 추가 시 자동으로 썸네일로 사용
2. 자동완성 성능 최적화 (대량 데이터 처리)
3. 에러 핸들링 개선
4. 로딩 상태 UI 개선

---

**작업 일시**: 2025년 12월 7일  
**작업자**: AI Assistant  
**버전**: 1.0.0

---

# 작업 로그 - 2025년 12월 10일

### 📋 작업 개요

- 시술 상세페이지 (PDP) 구현
- 커뮤니티 페이지 완전 재구성
- 마이페이지 IA 최종본 적용
- 일정 관리 기능 추가

---

### ✅ 완료된 작업

#### 1. 시술 상세페이지 (TreatmentDetailPage) 구현

**파일:**

- `components/TreatmentDetailPage.tsx` (신규 생성)
- `app/treatment/[id]/page.tsx` (신규 생성)

**주요 기능:**

- 시술 상세 정보 표시 (이미지, 시술명, 평점, 리뷰 수)
- 옵션 정보 표시 (같은 시술명의 다른 옵션들)
- 옵션별 시술 소요 시간, 회복 시간 표시
- 가격 정보 (VAT 포함 명시)
- 이벤트 배너
- 병원 정보 및 병원정보 보러가기 버튼
- 시술 키워드 (해시태그)
- 옵션 목록 (전체보기)
- 찜하기 기능 (로컬스토리지 저장)
- 문의하기 기능 (AI 채팅, 전화, 메일)
- 공유하기 기능
- 일정에 추가 기능

**라우팅 연결:**

- `CategoryRankingPage` → 상세페이지 연결
- `ProcedureListPage` → 상세페이지 연결
- `KBeautyRankingPage` → 상세페이지 연결
- `HotConcernsSection` → 상세페이지 연결
- `CountryPainPointSection` → 상세페이지 연결

---

#### 2. 하단 네비게이션바 및 문의하기 UI 개선

**수정 파일:**

- `components/TreatmentDetailPage.tsx`

**변경 사항:**

- 하단 네비게이션바와 문의하기 섹션 사이 공간 제거 (`bottom-[56px]`)
- 문의하기 드롭다운을 번역 버튼 스타일로 변경 (작은 팝업 형태)
- 드롭다운 위치: 문의하기 버튼 위에 표시 (`absolute bottom-full mb-2`)
- 외부 클릭 시 드롭다운 닫기 기능

---

#### 3. 일정에 추가 기능 구현

**파일:**

- `components/AddToScheduleModal.tsx` (신규 생성)
- `components/TreatmentDetailPage.tsx` (수정)
- `components/MySchedulePage.tsx` (수정)

**주요 기능:**

- 날짜 선택 모달 (단일 날짜 선택)
- 과거 날짜 선택 불가
- 선택한 날짜와 시술 정보를 로컬스토리지에 저장
- 저장 데이터: 시술 ID, 시술명, 병원명, 선택 날짜, 카테고리, 회복 기간, 시술 시간, 가격, 평점, 리뷰 수
- MySchedulePage에서 저장된 일정 자동 표시
- 회복 기간 자동 계산 및 달력에 표시

---

#### 4. 여행 일정 저장 기능 구현

**수정 파일:**

- `components/MySchedulePage.tsx`

**주요 기능:**

- 여행 기간 선택 모달 (`TravelScheduleCalendarModal` 재사용)
- 로컬스토리지에 여행 기간 저장
- 달력에 여행 기간 표시 (하늘색 배경)
- 여행 기간이 없을 때 "설정" 버튼 표시
- 저장된 여행 기간이 있을 때 "수정" 버튼 표시

---

#### 5. 커뮤니티 페이지 완전 재구성

**수정 파일:**

- `components/CommunityHeader.tsx`
- `components/CommunityPage.tsx`
- `components/ConsultationPage.tsx` (신규 생성)
- `components/CategoryCommunityPage.tsx` (신규 생성)

**새로운 구조 (5개 카테고리):**

1. **정보컨텐츠** - `InformationalContentSection` 컴포넌트 사용
2. **인기글** - `PostList` (popular 탭)
3. **최신글** - `PostList` (latest 탭)
4. **카테고리별** - 대분류 카테고리 10개 (홈과 동일)
5. **고민상담소** - 4가지 섹션 포함:
   - 수술 회복 수다 (수술했어요, 수술 회복 수다)
   - 수술 질문하기
   - 피부 질환별 고민글
   - 여행일정 공유 (시술별 인기 여행일정, 여행일정 질문하기)

---

#### 6. 마이페이지 IA 최종본 적용

**수정 파일:**

- `components/MyPage.tsx` (완전 재작성)

**새로운 구조:**

- **3개 메인 탭:**
  1. 개인 프로필
  2. 내 리뷰
  3. 설정

**개인 프로필 탭:**

- AI 리포트 & AI 피부분석 (박스)
- 찜목록 (시술, 병원, 글 스크랩 포함)
- 내가 쓴 후기 (목록 형식, 글 작성 포함)

**내 리뷰 탭:**

- 내가 쓴 후기 (목록 형식, 글 작성 포함)

**설정 탭:**

- 언어 / 통화 설정 (박스)
  - 언어 (한국어/English/日本語/中文 순환 변경)
  - 통화 (KRW/USD/JPY/CNY 순환 변경)
- 알림 (박스)
  - 푸시 알림 (토글 스위치)
  - 이메일 알림 (토글 스위치)
  - SMS 알림 (토글 스위치)

**최상단 프로필 박스:**

- 사용자 정보
- 내 포인트

---

### 🔧 기술적 개선사항

1. **로컬스토리지 활용**

   - 찜하기, 문의하기, 일정 저장, 여행 기간 저장
   - 이벤트 기반 업데이트 (`scheduleAdded`, `travelPeriodUpdated`)

2. **동적 라우팅**

   - `/treatment/[id]` 경로로 시술 상세페이지 접근

3. **컴포넌트 재사용**

   - `TravelScheduleCalendarModal` 재사용
   - `InformationalContentSection` 재사용

4. **UI/UX 개선**
   - 드롭다운 애니메이션
   - 배지로 개수 표시
   - 토글 스위치로 알림 설정
   - 섹션별 그룹화

---

### 📝 참고사항

- 모든 기능은 로컬스토리지를 기반으로 동작
- 실제 API 연동은 추후 구현 예정
- 일부 기능은 "준비 중" 알림으로 처리

---

### 🎯 다음 작업 예정

- 실제 API 연동
- 글 작성 모달 구현
- 내가 쓴 후기 목록 페이지 구현
- 스크랩한 글 목록 페이지 구현
- AI 리포트 페이지 구현
- AI 피부분석 페이지 구현

---

# 작업 일지 - 2025년 12월 7일

## 📋 작업 개요

BeauTrip 프로젝트의 로그인 시스템 및 커뮤니티 글쓰기 기능 구현

---

## ✅ 완료된 작업

### 1. 프로젝트 환경 설정

- **npm ci vs npm install 차이점 설명**
  - `npm ci`: CI/CD 환경용, package-lock.json 엄격히 따름, 기존 node_modules 삭제 후 재설치
  - `npm install`: 개발용, package-lock.json 업데이트 가능, 증분 설치
  - 현재 상태: `npm ci`로 설치 완료, 추가 작업 불필요

### 2. 배포 가능 여부 확인

- **프로젝트 상태 점검**
  - TypeScript 설정 정상
  - Next.js 14.0.4 구성 확인
  - 린터 에러 없음
  - 주요 컴포넌트 구조 확인
  - **결론**: 기본 틀 완성, GA4 이벤트 설계 정의서 작성 가능한 단계

### 3. 로그인 시스템 구현

#### 3.1 로그인 UI 구현 (IA 기반)

- **LoginModal.tsx 개선**
  - 로고 표시 (크기: 180x60)
  - 연동 계정 버튼 리스트 구현
  - ID 로그인 폼 구현
  - 계정 찾기/문의하기 링크 추가

#### 3.2 로그인 UI 레퍼런스 반영

- **기본 화면 구성**

  - 라인으로 시작하기
  - 위챗으로 시작하기
  - 구글로 시작하기
  - "아이디 또는 다른 방법으로 로그인" 버튼

- **"다른 방법으로 시작하기" 바텀시트**
  - 클릭 시 나머지 5가지 소셜 로그인 표시 (카카오, 틱톡, X, 애플, 페이스북)
  - 원형 아이콘 버튼으로 표시
  - 하단에 "아이디로 로그인" 버튼

#### 3.3 소셜 로그인 아이콘 실제 이미지 적용

- **아이콘 URL 추가**

  - 라인: Namu Wiki SVG
  - 위챗: Google Play 이미지
  - 구글: Wikimedia Commons 이미지
  - 카카오: Namu Wiki SVG
  - 틱톡: Namu Wiki SVG
  - X: Namu Wiki SVG
  - 페이스북: Namu Wiki SVG
  - 애플: Namu Wiki SVG

- **Next.js 이미지 설정**
  - `next.config.js`에 외부 이미지 도메인 허용 추가
  - `i.namu.wiki`, `play-lh.googleusercontent.com`, `upload.wikimedia.org`

#### 3.4 로그인 화면 UX 개선

- **세로 중앙 정렬**

  - flexbox를 사용한 콘텐츠 중앙 정렬
  - 헤더는 상단 고정, 콘텐츠는 중앙 배치

- **언어 선택 드롭다운 위치 수정**
  - 하단에 위치한 언어 선택 버튼의 드롭다운이 위쪽으로 열리도록 변경

### 4. 마이페이지 접근 제어

- **로그인 상태 관리**
  - 로그인하지 않은 경우 마이페이지 내용 숨김
  - 로그인 모달만 표시
  - 로그인 모달 닫기 시 홈으로 이동
  - 로그인한 사용자 정보만 표시
  - 로그아웃 기능 추가

### 5. 커뮤니티 글쓰기 기능 구현

#### 5.1 CommunityWriteModal 개선

- **3가지 글쓰기 옵션**
  - 시술 후기
  - 병원 후기
  - 고민글
  - 내 글 관리 (마지막에 추가)

#### 5.2 시술 후기 작성 폼 (`ProcedureReviewForm.tsx`)

- **구현된 필드**
  - 시술 날짜 (필수)
  - 카테고리 (필수)
  - 병원명 검색 (필수, 2글자 이상)
  - 시술/수술 명 토글 목록 (필수)
  - 시술/수술 비용 (만원 단위)
  - 시술/수술 시간 (분 단위)
  - 회복기간 (일 단위)
  - 성별 선택 (여/남, 필수)
  - 연령대 선택 (20대/30대/40대/50대, 필수)
  - 글 작성 (30자 이상, 필수)
  - 태그 추가
  - 사진첨부 (최대 4장)
  - 저장하기/작성완료 버튼

#### 5.3 병원 후기 작성 폼 (`HospitalReviewForm.tsx`)

- **구현된 필드**
  - 병원 방문일 (필수)
  - 시술 카테고리 (대/중/소분류, 필수)
  - 전체적인 수술 만족도 (1~5 별점)
  - 병원 친절도 (1~5 별점)
  - 통역 여부 (T/F)
  - 통역 만족도 (1~5 별점, 통역 있음일 때만)
  - 앱사용만족도 (1~5 별점)
  - 글 작성 (30자 이상, 필수)
  - 태그 추가
  - 사진첨부 (최대 4장)
  - 저장하기/작성완료 버튼

#### 5.4 고민글 작성 폼 (`ConcernPostForm.tsx`)

- **구현된 필드**
  - 제목 (필수)
  - 부제 (선택)
  - 고민 카테고리 (필수)
  - 고민 글 (30자 이상, 필수)
  - 태그 추가
  - 저장하기/작성완료 버튼

### 6. 플로팅 버튼 개선

- **CommunityFloatingButton 간소화**
  - 플로팅 버튼 클릭 시 바로 CommunityWriteModal 열림
  - 중간 메뉴 제거
  - "리뷰 작성" 메뉴 제거

### 7. 홈페이지 개선

#### 7.1 UI 정리

- **캘린더 사이드바 제거**
  - 플로팅 상태로 떠다니던 CalendarSidebar 제거
  - 홈페이지 레이아웃 정리

#### 7.2 리뷰 버튼 연결

- **"리뷰 쓰고 더 많은 정보 얻기" 버튼**
  - 클릭 시 CommunityWriteModal 열림
  - 커뮤니티 페이지의 연필 버튼과 동일한 동작

#### 7.3 대분류 카테고리 표시 로직 개선

- **조건부 렌더링**
  - 일정 선택 전: 대분류 카테고리 버튼 숨김 (여행 일정 선택칸만 표시)
  - 일정 선택 후: 대분류 카테고리 버튼 표시
  - 카테고리 선택 후 맞춤 시술 추천 표시 시에도 카테고리 계속 표시
  - 비활성화 상태의 카테고리 버튼 제거

#### 7.4 z-index 수정

- **CommunityWriteModal z-index 증가**
  - 오버레이와 모달의 z-index를 `z-50`에서 `z-[100]`으로 변경
  - 하단 네비게이션(`z-50`)보다 위에 표시되도록 수정

---

## 📁 생성/수정된 파일

### 새로 생성된 파일

1. `components/ProcedureReviewForm.tsx` - 시술 후기 작성 폼
2. `components/HospitalReviewForm.tsx` - 병원 후기 작성 폼
3. `components/ConcernPostForm.tsx` - 고민글 작성 폼

### 수정된 파일

1. `components/LoginModal.tsx` - 로그인 UI 전면 개편
2. `components/MyPage.tsx` - 로그인 접근 제어 추가
3. `components/CommunityWriteModal.tsx` - 3가지 글쓰기 옵션으로 개편
4. `components/CommunityFloatingButton.tsx` - 간소화 및 바로 모달 열기
5. `components/HomePage.tsx` - 캘린더 사이드바 제거, 리뷰 버튼 연결, 카테고리 표시 로직 개선
6. `next.config.js` - 외부 이미지 도메인 허용 추가

---

## 🎯 주요 성과

1. **로그인 시스템 완성**

   - IA 기반 로그인 UI 구현
   - 레퍼런스 이미지 반영
   - 실제 소셜 로그인 아이콘 적용
   - 로그인 상태 관리 및 접근 제어

2. **커뮤니티 글쓰기 기능 구현**

   - 3가지 글쓰기 양식 완성
   - 레퍼런스 이미지 기반 UI 구현
   - 필수/선택 필드 구분
   - 이미지 업로드 기능

3. **UX 개선**
   - 홈페이지 레이아웃 정리
   - 플로팅 버튼 간소화
   - 조건부 UI 표시로 사용자 경험 향상

---

## 🔄 다음 단계 (TODO)

1. **API 연동**

   - 실제 소셜 로그인 API 연동
   - 글쓰기 폼 제출 API 연동
   - 사용자 인증 시스템 구축

2. **내 글 관리 기능**

   - 내 글 관리 페이지 구현
   - 작성한 글 목록 표시
   - 글 수정/삭제 기능

3. **GA4 이벤트 설계 정의서 작성**
   - 이벤트 트래킹 설계
   - 주요 사용자 행동 추적

---

## 📝 기술 스택

- Next.js 14.0.4
- React 18.2.0
- TypeScript 5
- Tailwind CSS 3.3.0
- React Icons 4.12.0

---

## 💡 참고사항

- 모든 소셜 로그인 아이콘은 외부 URL 사용 (Namu Wiki, Google Play, Wikimedia Commons)
- 이미지 업로드는 현재 클라이언트 측에서만 처리 (실제 서버 업로드는 추후 구현)
- 로그인 및 글쓰기 기능은 현재 모의(mock) 데이터로 동작
