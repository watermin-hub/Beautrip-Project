# 후기 작성 필수 기능 구현 완료 요약

## ✅ 구현 완료 사항

### 1. 컴포넌트 생성
- **ReviewRequiredPopup** (`components/ReviewRequiredPopup.tsx`)
  - 후기 작성 안내 팝업
  - "글쓰기" 버튼 클릭 시 `CommunityWriteModal` 열기

### 2. 컴포넌트 수정
- **CommunityWriteModal** (`components/CommunityWriteModal.tsx`)
  - 로그인 체크 추가 (모달 열릴 때)
  - 비로그인 시 `LoginModal` 표시
  - 로그인 성공 후 `CommunityWriteModal`로 복귀
  - GA4 이벤트: `review_start` (모달 열릴 때, entry_source 파라미터 포함)

### 3. 더보기 버튼 수정
- **CategoryRankingPage** (`components/CategoryRankingPage.tsx`)
  - 소분류/중분류 더보기 버튼 클릭 시 `ReviewRequiredPopup` 표시
  - `ReviewRequiredPopup`에서 "글쓰기" 클릭 시 `CommunityWriteModal` 열기

### 4. 정보글 클릭 수정
- **InformationalContentSection** (`components/InformationalContentSection.tsx`)
  - 정보글 클릭 시 `ReviewRequiredPopup` 표시
  - `ReviewRequiredPopup`에서 "글쓰기" 클릭 시 `CommunityWriteModal` 열기

### 5. 번역 키 추가
- `common.write`: "글쓰기" / "Write" / "書く" / "写"
- `common.reviewRequired`: "후기 작성이 필요합니다" / "Review Required" / "レビューが必要です" / "需要写评论"
- `common.reviewRequiredMoreInfo`: 후기 작성 안내 메시지 (4개 언어)

---

## 🔄 플로우

```
[더보기/정보글 클릭]
    ↓
[로그인 체크]
    ↓ (비로그인)
[ReviewRequiredPopup 표시]
    ↓
[글쓰기 버튼 클릭]
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

---

## 📊 GA4 이벤트

### review_start
- **위치**: `CommunityWriteModal` 컴포넌트의 `useEffect`
- **조건**: 로그인 체크 후, 실제로 모달이 열렸을 때
- **파라미터**: 
  - `entry_source`: "home" | "explore" | "community" | "mypage" | "unknown"
  - 현재 경로(`pathname`) 기반으로 자동 결정

### review_submit
- **위치**: 각 폼 컴포넌트 (`ProcedureReviewForm`, `HospitalReviewForm`, `ConcernPostForm`)
- **조건**: Supabase 저장 성공 후에만
- **파라미터**: `review_type` ("treatment" | "hospital" | "general")
- **이중 이벤트 방지**: 로그인 전에는 완료 버튼 비활성화 (로그인 성공 후에만 활성화)

---

## 🗄️ Supabase 영향

### 현재 구조 유지
- 후기 저장: `procedure_reviews`, `hospital_reviews`, `concern_posts` 테이블
- 사용자 연결: `user_id` 필드로 연결
- **중간 저장 기능 없음**: 로그인 후 작성하도록 유도

---

## 📌 주요 변경 사항

### 1. ReviewRequiredPopup 컴포넌트
- 후기 작성 안내 메시지 표시
- "글쓰기" 버튼: `CommunityWriteModal` 열기
- "취소" 버튼: 팝업 닫기

### 2. CommunityWriteModal 수정
- 로그인 체크 추가 (모달 열릴 때)
- 비로그인 시 `LoginModal` 표시
- 로그인 성공 후 `CommunityWriteModal`로 복귀
- GA4 이벤트: `review_start` (entry_source 파라미터 포함)

### 3. 더보기 버튼 수정
- `CategoryRankingPage`: 소분류/중분류 더보기 버튼
- 비로그인 시 `ReviewRequiredPopup` 표시

### 4. 정보글 클릭 수정
- `InformationalContentSection`: 정보글 클릭 시
- 비로그인 시 `ReviewRequiredPopup` 표시

---

## ⚠️ 주의사항

1. **이중 이벤트 방지**: `review_submit`은 실제 저장 성공 시에만 한 번 발생
2. **entry_source 정확성**: 네비게이션바 탭 정보를 정확히 반영
3. **사용자 경험**: 로그인 전에도 후기 작성 UI를 볼 수 있도록 (작성 완료 시에만 로그인 요구)

---

## 🚀 다음 단계 (선택사항)

1. **ProcedureRecommendation 컴포넌트**: 더보기 버튼에도 동일한 로직 적용
2. **기타 더보기 버튼**: 다른 컴포넌트의 더보기 버튼에도 동일한 로직 적용
3. **중간 저장 기능**: 로그인 전 작성한 내용을 로컬스토리지에 저장하고, 로그인 후 Supabase에 연결 (보안 및 데이터 일관성 고려 필요)

