# 리뷰 중간 저장 기능 - 서버 구현 방안

## 📋 질문: 서버에서도 구현 가능한가?

**답변: 네, 가능합니다!** 하지만 로컬스토리지 기반이 더 간단하고 해외 사용자에게도 편리합니다.

---

## 🔄 구현 방식 비교

### 방안 1: 로컬스토리지 기반 (권장) ⭐

**장점**:
- ✅ 구현이 가장 간단함
- ✅ Supabase 변경 불필요
- ✅ 해외 사용자에게도 빠름 (서버 요청 없음)
- ✅ 오프라인에서도 작동
- ✅ 보안 이슈 없음 (로컬 데이터만 사용)

**단점**:
- ❌ 다른 기기에서 접근 불가
- ❌ 브라우저 데이터 삭제 시 손실

**해외 사용자 관점**:
- ✅ **네트워크 지연 없음**: 서버 요청이 없으므로 빠름
- ✅ **오프라인 지원**: 인터넷 연결이 불안정해도 작동
- ✅ **데이터 사용량 없음**: 서버 요청이 없으므로 모바일 데이터 절약

---

### 방안 2: Supabase 임시 테이블 기반

**장점**:
- ✅ 모든 기기에서 접근 가능
- ✅ 서버에서 관리하므로 안정적
- ✅ 사용자별로 관리 가능

**단점**:
- ❌ Supabase 테이블 추가 필요
- ❌ 쿠키/세션 기반 매칭 필요 (보안 고려)
- ❌ 구현 복잡도 높음
- ❌ **해외 사용자에게 느림**: 서버 요청 필요
- ❌ **네트워크 지연**: 인터넷 연결이 불안정하면 실패 가능

**해외 사용자 관점**:
- ❌ **네트워크 지연**: 서버 요청이 필요하므로 느림
- ❌ **오프라인 미지원**: 인터넷 연결이 없으면 작동 안 함
- ❌ **데이터 사용량**: 서버 요청이 필요하므로 모바일 데이터 사용

---

## 🚀 권장 구현 방식

### 로컬스토리지 기반 (방안 1) 권장 ⭐

**이유**:
1. **해외 사용자에게 더 빠름**: 서버 요청이 없으므로 네트워크 지연 없음
2. **오프라인 지원**: 인터넷 연결이 불안정해도 작동
3. **구현이 간단**: Supabase 변경 불필요
4. **대부분의 사용자는 같은 기기에서 로그인**: 다른 기기에서 접근할 필요가 적음

---

## 📝 구현 예시 코드

### 로컬스토리지 기반 구현

```typescript
// 임시 저장 함수
const saveDraft = (formData: any, type: string) => {
  const draftKey = `review_draft_${Date.now()}`;
  const draft = {
    type,
    formData,
    timestamp: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일 후 만료
  };
  
  localStorage.setItem(draftKey, JSON.stringify(draft));
  
  // 오래된 임시 저장 내용 정리 (7일 이상 된 것 삭제)
  cleanupOldDrafts();
};

// 임시 저장 내용 불러오기
const getDraftsFromLocalStorage = () => {
  const drafts: any[] = [];
  const now = Date.now();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('review_draft_')) {
      try {
        const draft = JSON.parse(localStorage.getItem(key)!);
        
        // 만료된 임시 저장 내용은 삭제
        if (draft.expiresAt && draft.expiresAt < now) {
          localStorage.removeItem(key);
          continue;
        }
        
        drafts.push({ ...draft, key });
      } catch (e) {
        console.error('Failed to parse draft:', e);
        localStorage.removeItem(key); // 파싱 실패 시 삭제
      }
    }
  }
  
  // 최신순으로 정렬
  return drafts.sort((a, b) => b.timestamp - a.timestamp);
};

// 오래된 임시 저장 내용 정리
const cleanupOldDrafts = () => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('review_draft_')) {
      try {
        const draft = JSON.parse(localStorage.getItem(key)!);
        if (draft.expiresAt && draft.expiresAt < now) {
          keysToDelete.push(key);
        }
      } catch (e) {
        keysToDelete.push(key); // 파싱 실패 시 삭제
      }
    }
  }
  
  keysToDelete.forEach(key => localStorage.removeItem(key));
};

// 로그인 성공 후 임시 저장 내용 불러오기
useEffect(() => {
  if (isOpen && isLoggedIn) {
    const drafts = getDraftsFromLocalStorage();
    if (drafts.length > 0) {
      // 가장 최근 임시 저장 내용 불러오기
      const latestDraft = drafts[0];
      const hasDraft = confirm('이전에 작성하던 후기가 있습니다. 불러오시겠습니까?');
      if (hasDraft) {
        loadDraft(latestDraft);
      }
    }
  }
}, [isOpen, isLoggedIn]);
```

---

## 🌍 해외 사용자 관점

### 로컬스토리지 기반 (권장)
- ✅ **빠름**: 서버 요청이 없으므로 네트워크 지연 없음
- ✅ **오프라인 지원**: 인터넷 연결이 불안정해도 작동
- ✅ **데이터 절약**: 서버 요청이 없으므로 모바일 데이터 절약

### Supabase 기반
- ❌ **느림**: 서버 요청이 필요하므로 네트워크 지연 발생
- ❌ **오프라인 미지원**: 인터넷 연결이 없으면 작동 안 함
- ❌ **데이터 사용**: 서버 요청이 필요하므로 모바일 데이터 사용

---

## ✅ 결론

**로컬스토리지 기반 구현을 권장합니다.**

**이유**:
1. 해외 사용자에게 더 빠르고 편리함
2. 오프라인 지원
3. 구현이 간단함
4. Supabase 변경 불필요

**서버 구현도 가능하지만**, 해외 사용자 관점에서는 로컬스토리지가 더 나은 선택입니다.

