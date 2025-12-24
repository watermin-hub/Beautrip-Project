# 현재 구현 상태 및 GTM 이벤트 영향

## ✅ 완료된 구현

### 1. ReviewRequiredPopup 컴포넌트
- 후기 작성 안내 팝업
- "후기 남기러 가기✏" 버튼 클릭 시 `CommunityWriteModal` 열기
- 번역 완료 (한국어, 영어, 일본어, 중국어)

### 2. CommunityWriteModal 수정
- 로그인 체크 추가 (모달 열릴 때)
- 비로그인 시 `LoginModal` 표시
- 로그인 성공 후 `CommunityWriteModal`로 복귀
- GA4 이벤트: `review_start` (로그인 체크 후, entry_source 파라미터 포함)

### 3. 더보기 버튼 수정
- `CategoryRankingPage`: 소분류/중분류 더보기 버튼 클릭 시 `ReviewRequiredPopup` 표시
- 스크롤 버튼 2번 이상 클릭 시 `ReviewRequiredPopup` 표시

### 4. 정보글 접근 제어
- **회복가이드**: 로그인 필요 → `ReviewRequiredPopup` 표시
- **TOP 20**: 로그인 없이 자유 접근 가능
- **여행지 추천**: 로그인 없이 자유 접근 가능

### 5. 번역 키 추가/수정
- `common.write`: "후기 남기러 가기✏" (4개 언어)
- `common.reviewRequired`: "후기 작성이 필요합니다" (4개 언어)
- `common.reviewRequiredMoreInfo`: "후기를 남겨 주시면 Beautrip의 모든 정보를 볼 수 있습니다!🍀" (4개 언어)

---

## ⚠️ 미구현

### 리뷰 중간 저장 기능
- **현재**: 로그인 전 작성한 내용은 저장되지 않음
- **구현 가능**: 로컬스토리지 기반으로 구현 가능 (자세한 내용은 `REVIEW_DRAFT_SAVE_IMPLEMENTATION.md` 참고)

---

## 📊 GTM 이벤트 영향

### 현재 이벤트 구조

#### 1. review_start
- **위치**: `CommunityWriteModal` 컴포넌트의 `useEffect`
- **조건**: 로그인 체크 후, 실제로 모달이 열렸을 때
- **파라미터**: 
  - `entry_source`: "home" | "explore" | "community" | "mypage" | "unknown"
  - 현재 경로(`pathname`) 기반으로 자동 결정
- **변경 사항**: 없음 ✅

#### 2. review_submit
- **위치**: 각 폼 컴포넌트 (`ProcedureReviewForm`, `HospitalReviewForm`, `ConcernPostForm`)
- **조건**: Supabase 저장 성공 후에만
- **파라미터**: `review_type` ("treatment" | "hospital" | "general")
- **변경 사항**: 없음 ✅

#### 3. content_pdp_view
- **위치**: 각 콘텐츠 상세 페이지 (`Top20InfoPage`, `TravelRecommendationPage`, `RecoveryGuidePostDetailPage`)
- **조건**: 페이지 렌더링 시
- **파라미터**: `content_type`, `entry_source`, `content_id`
- **변경 사항**: 없음 ✅ (정보글 접근 제어 변경은 이벤트에 영향 없음)

### 정보글 접근 제어 변경의 영향

**변경 전**:
- 모든 정보글 클릭 시 로그인 체크 → 비로그인 시 팝업 표시

**변경 후**:
- 회복가이드만 로그인 체크 → 비로그인 시 `ReviewRequiredPopup` 표시
- TOP 20, 여행지 추천: 로그인 없이 바로 접근 가능

**GTM 이벤트 영향**:
- ✅ **영향 없음**: `content_pdp_view` 이벤트는 상세 페이지에서 발생하므로 접근 제어 변경과 무관
- ✅ **review_start**: 변경 없음 (여전히 `CommunityWriteModal`이 열릴 때 발생)
- ✅ **review_submit**: 변경 없음 (여전히 저장 성공 시 발생)

---

## 🔄 플로우 다이어그램

### 더보기 버튼 클릭
```
[더보기 버튼 클릭]
    ↓ (비로그인)
[ReviewRequiredPopup 표시]
    ↓
[후기 남기러 가기✏ 클릭]
    ↓
[CommunityWriteModal 열기]
    ↓
[로그인 체크]
    ↓ (비로그인)
[LoginModal 표시]
    ↓
[로그인 성공]
    ↓
[CommunityWriteModal로 복귀]
    ↓
[GA4: review_start 이벤트 발생]
    ↓
[후기 작성 완료]
    ↓
[GA4: review_submit 이벤트 발생]
```

### 정보글 클릭
```
[정보글 클릭]
    ↓
[회복가이드인가?]
    ├─ Yes → [로그인 체크]
    │         ├─ 비로그인 → [ReviewRequiredPopup 표시]
    │         └─ 로그인 → [상세 페이지 이동]
    │
    └─ No (TOP 20 / 여행지 추천)
        → [상세 페이지 이동] (로그인 없이)
```

---

## 📝 주요 변경 사항 요약

1. **번역 키 수정**: 더 친근한 메시지로 변경
2. **정보글 접근 제어**: 회복가이드만 제한, TOP 20/여행지 추천은 자유 접근
3. **GTM 이벤트**: 변경 없음 (모든 이벤트 정상 작동)

---

## 🚀 다음 단계 (선택사항)

1. **리뷰 중간 저장 기능**: 로컬스토리지 기반으로 구현 (자세한 내용은 `REVIEW_DRAFT_SAVE_IMPLEMENTATION.md` 참고)
2. **ProcedureRecommendation 컴포넌트**: 더보기 버튼에도 동일한 로직 적용
3. **기타 더보기 버튼**: 다른 컴포넌트의 더보기 버튼에도 동일한 로직 적용

---

## ✅ 결론

- **구현 완료**: ReviewRequiredPopup, 정보글 접근 제어, 번역 키 수정
- **GTM 이벤트**: 영향 없음, 모든 이벤트 정상 작동
- **리뷰 중간 저장**: 구현 가능 (로컬스토리지 기반 권장)

