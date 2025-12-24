# 리뷰 중간 저장 기능 구현 방안

## 📋 현재 구현 상태

### ✅ 구현 완료
1. **ReviewRequiredPopup**: 후기 작성 안내 팝업
2. **CommunityWriteModal**: 로그인 체크 및 LoginModal 연동
3. **더보기 버튼**: ReviewRequiredPopup 표시
4. **정보글 접근 제어**: 회복가이드만 팝업 표시, top20/travel-recommendation은 자유 접근

### ⚠️ 미구현
- **리뷰 중간 저장 기능**: 로그인 전 작성한 내용을 임시 저장하고, 로그인 후 Supabase에 연결

---

## 🔄 리뷰 중간 저장 기능 구현 방안

### 방안 1: 로컬스토리지 기반 (권장)

**장점**:
- 구현이 간단함
- 프론트엔드에서만 처리 가능
- Supabase 변경 불필요

**단점**:
- 브라우저별 제한 (용량, 보안)
- 다른 기기에서 접근 불가
- 브라우저 데이터 삭제 시 손실

**구현 방법**:
1. 로그인 전 작성한 내용을 `localStorage`에 저장
   ```typescript
   const draftKey = `review_draft_${Date.now()}`;
   localStorage.setItem(draftKey, JSON.stringify({
     type: 'procedure' | 'hospital' | 'concern',
     formData: { ... },
     timestamp: Date.now()
   }));
   ```

2. 로그인 성공 후 임시 저장된 내용 불러오기
   ```typescript
   const drafts = Object.keys(localStorage)
     .filter(key => key.startsWith('review_draft_'))
     .map(key => JSON.parse(localStorage.getItem(key)!));
   ```

3. Supabase 저장 시 임시 데이터 삭제
   ```typescript
   localStorage.removeItem(draftKey);
   ```

### 방안 2: Supabase 임시 테이블 기반

**장점**:
- 모든 기기에서 접근 가능
- 서버에서 관리하므로 안정적
- 사용자별로 관리 가능

**단점**:
- Supabase 테이블 추가 필요
- 쿠키/세션 기반 매칭 필요 (보안 고려)
- 구현 복잡도 높음

**구현 방법**:
1. 임시 저장 테이블 생성
   ```sql
   CREATE TABLE review_drafts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     session_id TEXT, -- 쿠키/세션 ID
     user_id UUID REFERENCES auth.users(id), -- 로그인 후 연결
     type TEXT, -- 'procedure' | 'hospital' | 'concern'
     form_data JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
   );
   ```

2. 로그인 전 작성 시 임시 저장
   ```typescript
   const sessionId = getSessionId(); // 쿠키 또는 localStorage에서 가져오기
   await supabase.from('review_drafts').insert({
     session_id: sessionId,
     type: 'procedure',
     form_data: formData
   });
   ```

3. 로그인 성공 후 임시 데이터를 실제 테이블로 이동
   ```typescript
   const { data: drafts } = await supabase
     .from('review_drafts')
     .select('*')
     .eq('session_id', sessionId);
   
   // 실제 테이블에 저장
   for (const draft of drafts) {
     await saveReview(draft.type, draft.form_data);
     await supabase.from('review_drafts').delete().eq('id', draft.id);
   }
   ```

### 방안 3: 하이브리드 (로컬스토리지 + Supabase)

**구현 방법**:
1. 로그인 전: 로컬스토리지에 저장
2. 로그인 성공 후: 로컬스토리지 데이터를 Supabase에 저장
3. 저장 성공 후: 로컬스토리지 데이터 삭제

**장점**:
- 구현이 비교적 간단
- 로그인 전에는 Supabase 접근 불필요
- 로그인 후에는 Supabase로 안전하게 저장

---

## 🚀 권장 구현 방식

**방안 1 (로컬스토리지 기반)**을 권장합니다.

**이유**:
1. 구현이 가장 간단함
2. Supabase 변경 불필요
3. 대부분의 사용자는 같은 기기에서 로그인하므로 충분함
4. 보안 이슈 없음 (로컬 데이터만 사용)

**구현 위치**:
- `components/CommunityWriteModal.tsx`: 로그인 전 작성 내용 저장
- 각 폼 컴포넌트 (`ProcedureReviewForm`, `HospitalReviewForm`, `ConcernPostForm`): 로컬스토리지 저장/불러오기

---

## 📊 GTM 이벤트 영향

### 현재 이벤트
- **review_start**: `CommunityWriteModal`이 열릴 때 발생 (로그인 체크 후)
- **review_submit**: 실제 저장 성공 시 발생

### 중간 저장 기능 추가 시
- **review_start**: 변경 없음 (모달 열릴 때 발생)
- **review_submit**: 변경 없음 (실제 저장 성공 시에만 발생)
- **새 이벤트 추가 가능**: `review_draft_save` (임시 저장 시)

**결론**: GTM 이벤트에 영향 없음. 필요 시 `review_draft_save` 이벤트 추가 가능.

---

## ⚠️ 주의사항

1. **데이터 만료**: 로컬스토리지 데이터는 7일 후 자동 삭제
2. **용량 제한**: 로컬스토리지는 약 5-10MB 제한
3. **브라우저 호환성**: 모든 브라우저에서 로컬스토리지 지원
4. **보안**: 민감한 정보는 저장하지 않기 (이미지 제외)

---

## 📝 구현 예시 코드

### CommunityWriteModal에 추가

```typescript
// 로컬스토리지에서 임시 저장된 내용 불러오기
useEffect(() => {
  if (isOpen && isLoggedIn) {
    const drafts = getDraftsFromLocalStorage();
    if (drafts.length > 0) {
      // 임시 저장된 내용이 있으면 사용자에게 알림
      const hasDraft = confirm('이전에 작성하던 후기가 있습니다. 불러오시겠습니까?');
      if (hasDraft) {
        // 가장 최근 임시 저장 내용 불러오기
        const latestDraft = drafts[0];
        loadDraft(latestDraft);
      }
    }
  }
}, [isOpen, isLoggedIn]);

// 임시 저장 함수
const saveDraft = (formData: any, type: string) => {
  const draftKey = `review_draft_${Date.now()}`;
  localStorage.setItem(draftKey, JSON.stringify({
    type,
    formData,
    timestamp: Date.now()
  }));
};

// 임시 저장 내용 불러오기
const getDraftsFromLocalStorage = () => {
  const drafts: any[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('review_draft_')) {
      try {
        const draft = JSON.parse(localStorage.getItem(key)!);
        drafts.push({ ...draft, key });
      } catch (e) {
        console.error('Failed to parse draft:', e);
      }
    }
  }
  // 최신순으로 정렬
  return drafts.sort((a, b) => b.timestamp - a.timestamp);
};
```

---

## 🎯 결론

리뷰 중간 저장 기능은 **구현 가능**하며, **로컬스토리지 기반**으로 구현하는 것을 권장합니다. GTM 이벤트에는 영향이 없으며, 필요 시 `review_draft_save` 이벤트를 추가할 수 있습니다.

