# 후기 작성 필수 기능 구현 방안

## 📋 개요

콘텐츠(정보글) 조회 및 시술 더보기 클릭 시 로그인과 후기 작성을 필수로 만드는 기능 구현 방안입니다.

---

## 🎯 요구사항

1. **더보기 클릭 시**: 후기 작성 팝업 먼저 표시 → 글쓰기 클릭 시 로그인 팝업 표시
2. **정보글 클릭 시**: 동일한 플로우 적용
3. **GA4 이벤트**: 네비게이션바 탭(홈/탐색/커뮤니티/마이페이지) 파라미터 반영
4. **이중 이벤트 방지**: review_submit 이벤트가 중복 발생하지 않도록 처리

---

## 🏗️ 구현 방안

### 1. 컴포넌트 구조

```
ReviewRequiredPopup (신규 생성)
  ├─ 후기 작성 안내 팝업
  ├─ "글쓰기" 버튼 → CommunityWriteModal 열기
  └─ "취소" 버튼

CommunityWriteModal (기존 수정)
  ├─ 로그인 체크 추가
  ├─ 비로그인 시 LoginModal 표시
  └─ GA4 이벤트: review_start (모달 열릴 때)

LoginModal (기존 유지)
  └─ 로그인 성공 후 후기 작성 계속 진행
```

### 2. 플로우 다이어그램

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
[후기 작성 완료]
    ↓
[GA4: review_submit 이벤트]
```

---

## 📝 구현 상세

### 1. ReviewRequiredPopup 컴포넌트 생성

**파일**: `components/ReviewRequiredPopup.tsx`

**기능**:

- 후기 작성 안내 메시지 표시
- "글쓰기" 버튼: CommunityWriteModal 열기
- "취소" 버튼: 팝업 닫기

**Props**:

```typescript
interface ReviewRequiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onWriteClick?: () => void; // 글쓰기 버튼 클릭 시 콜백
  entrySource?: EntrySource; // GA4 이벤트용 진입 경로
}
```

### 2. CommunityWriteModal 수정

**수정 사항**:

1. **로그인 체크 추가**: 모달이 열릴 때 로그인 상태 확인
2. **비로그인 시 LoginModal 표시**: 로그인 후 CommunityWriteModal로 복귀
3. **GA4 이벤트 추가**:
   - `review_start`: 모달이 실제로 열릴 때 (로그인 체크 후)
   - `review_submit`: 실제 저장 성공 시에만 (기존과 동일)

**중간 저장 기능** (선택사항):

- 로컬스토리지에 임시 저장
- 로그인 성공 후 Supabase에 연결
- **주의**: Supabase 연결 시 쿠키/세션 기반 매칭 필요

### 3. 더보기 버튼 수정

**수정 파일들**:

- `components/CategoryRankingPage.tsx`
- `components/ProcedureRecommendation.tsx`
- `components/InformationalContentSection.tsx`
- 기타 더보기 버튼이 있는 컴포넌트

**수정 내용**:

```typescript
// 기존
if (!isLoggedIn) {
  setIsInfoModalOpen(true); // 또는 setShowLoginRequiredPopup(true)
}

// 변경 후
if (!isLoggedIn) {
  setShowReviewRequiredPopup(true); // ReviewRequiredPopup 표시
}
```

### 4. 정보글 클릭 수정

**수정 파일**: `components/InformationalContentSection.tsx`

**수정 내용**:

```typescript
onClick={() => {
  if (!isLoggedIn) {
    setShowReviewRequiredPopup(true); // ReviewRequiredPopup 표시
    return;
  }
  // 기존 로직...
}}
```

---

## 🔄 GA4 이벤트 트래킹

### 이벤트 발생 시점

1. **review_start**

   - **위치**: `CommunityWriteModal` 컴포넌트의 `useEffect` (모달 열릴 때)
   - **조건**: 로그인 체크 후, 실제로 모달이 열렸을 때
   - **파라미터**: `entry_source` (홈/탐색/커뮤니티/마이페이지)

2. **review_submit**
   - **위치**: 각 폼 컴포넌트 (`ProcedureReviewForm`, `HospitalReviewForm`, `ConcernPostForm`)
   - **조건**: Supabase 저장 성공 후에만
   - **파라미터**: `review_type` (treatment/hospital/general)

### entry_source 파라미터 설정

```typescript
// 현재 경로 기반으로 entry_source 결정
const getEntrySource = (): EntrySource => {
  const pathname = window.location.pathname;

  if (pathname === "/" || pathname === "/home") return "home";
  if (pathname.includes("/explore")) return "explore";
  if (pathname.includes("/community")) return "community";
  if (pathname.includes("/mypage")) return "mypage";

  return "unknown";
};
```

### 이중 이벤트 방지

**문제**: 글 작성 완료 버튼을 누른 후 로그인하면, 로그인 후 다시 완료 버튼을 누를 때 이벤트가 중복 발생

**해결 방안**:

1. **방안 1 (권장)**: 로그인 전에는 완료 버튼 비활성화

   - 로그인 체크 후 비로그인이면 LoginModal 표시
   - 로그인 성공 후에만 완료 버튼 활성화
   - 이렇게 하면 `review_submit`은 로그인 후 한 번만 발생

2. **방안 2**: 플래그로 중복 방지
   - `review_submit` 이벤트 발생 시 플래그 설정
   - 같은 세션에서 중복 발생 방지

---

## 🗄️ Supabase 영향

### 현재 구조

- **후기 저장**: `procedure_reviews`, `hospital_reviews`, `concern_posts` 테이블
- **사용자 연결**: `user_id` 필드로 연결

### 중간 저장 기능 구현 시 (선택사항)

**필요한 작업**:

1. **임시 저장 테이블 생성** (또는 로컬스토리지 사용)
2. **쿠키/세션 기반 매칭**: 로그인 전 작성한 내용을 로그인 후 사용자와 연결
3. **마이그레이션 로직**: 로그인 성공 시 임시 저장된 내용을 실제 테이블로 이동

**주의사항**:

- 쿠키/세션 기반 매칭은 보안상 위험할 수 있음
- 로컬스토리지 사용 시 브라우저별 제한 고려
- **권장**: 중간 저장 기능 없이 로그인 후 작성하도록 유도

---

## 📊 GTM 이벤트 영향

### 기존 이벤트 유지

- `review_start`: 모달 열릴 때 (로그인 체크 후)
- `review_submit`: 저장 성공 시

### 추가 고려사항

- **entry_source 파라미터**: 네비게이션바 탭 정보 반영
- **이벤트 중복 방지**: 같은 세션에서 중복 발생하지 않도록 처리

---

## 🚀 구현 단계

### Phase 1: 기본 구조

1. `ReviewRequiredPopup` 컴포넌트 생성
2. `CommunityWriteModal`에 로그인 체크 추가
3. 더보기 버튼에 `ReviewRequiredPopup` 연결

### Phase 2: GA4 이벤트

1. `review_start` 이벤트 추가 (entry_source 파라미터 포함)
2. `review_submit` 이벤트 중복 방지 로직 추가

### Phase 3: 테스트

1. 각 진입 경로별 테스트 (홈/탐색/커뮤니티/마이페이지)
2. GA4 이벤트 확인
3. 이중 이벤트 방지 확인

---

## ⚠️ 주의사항

1. **이중 이벤트 방지**: `review_submit`은 실제 저장 성공 시에만 한 번 발생
2. **entry_source 정확성**: 네비게이션바 탭 정보를 정확히 반영
3. **사용자 경험**: 로그인 전에도 후기 작성 UI를 볼 수 있도록 (작성 완료 시에만 로그인 요구)
4. **중간 저장 기능**: 구현 시 보안 및 데이터 일관성 고려

---

## 📌 권장 구현 방식

**최종 권장 방식**:

1. 더보기/정보글 클릭 → `ReviewRequiredPopup` 표시
2. "글쓰기" 클릭 → `CommunityWriteModal` 열기
3. `CommunityWriteModal`에서 로그인 체크
4. 비로그인 시 `LoginModal` 표시
5. 로그인 성공 후 `CommunityWriteModal`로 복귀
6. 후기 작성 완료 시 `review_submit` 이벤트 발생

**이점**:

- 사용자가 후기 작성 UI를 먼저 보고 작성 의욕을 높임
- 로그인 전에도 작성 가능 (완료 시에만 로그인 요구)
- GA4 이벤트가 명확하게 분리됨
- 이중 이벤트 문제 해결
