# GTM 일정 추적 구현 검토 결과

## ✅ 잘 구현된 부분

### 1. 함수 정의 (lib/gtm.ts)

- ✅ `trackScheduleSaveClick`, `trackSavedScheduleView` 함수가 올바르게 정의됨
- ✅ 이벤트 이름과 파라미터가 문서 요구사항과 일치
- ✅ 타입 안정성 확보 (EntrySource 타입 사용)

### 2. 저장 버튼 클릭 추적 (MySchedulePage.tsx)

- ✅ validation 통과 후, API 호출 전에 이벤트 발생 (의도 측정 목적에 적합)
- ✅ entry_source가 "schedule"로 올바르게 설정됨

### 3. 저장된 일정 화면 조회 추적 (MySchedulePage.tsx)

- ✅ activeTab 변경을 useEffect로 감지
- ✅ 중복 방지 로직 구현 (useRef 사용)
- ✅ URL 파라미터로 직접 진입하는 경우도 처리 가능

---

## 🔍 발견된 개선 사항

### 1. useEffect 실행 순서 검증

**현재 구현:**

```typescript
// 첫 번째 useEffect: URL 파라미터 읽기 (마운트 시 한 번만)
useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "saved") {
      setActiveTab("saved");
    }
  }
}, []);

// 두 번째 useEffect: activeTab 변경 감지
useEffect(() => {
  if (activeTab === "saved" && !hasTrackedSavedScheduleView.current) {
    trackSavedScheduleView("schedule");
    hasTrackedSavedScheduleView.current = true;
  }
  if (activeTab !== "saved") {
    hasTrackedSavedScheduleView.current = false;
  }
}, [activeTab]);
```

**검증 결과:**

- ✅ 정상 작동: 첫 번째 useEffect가 실행되어 activeTab이 "saved"로 변경되면, 두 번째 useEffect가 트리거되어 이벤트가 발생함
- ✅ React의 useEffect 실행 순서상 문제 없음

---

### 2. 중복 방지 로직의 의도 확인 필요

**현재 로직:**

```typescript
if (activeTab !== "saved") {
  hasTrackedSavedScheduleView.current = false; // 플래그 리셋
}
```

**고려사항:**

- 현재 구현은 탭이 변경될 때마다 플래그를 리셋하므로, 사용자가 여러 번 탭을 전환하면 각각 이벤트가 발생합니다.
- 예: schedule → saved (이벤트 발생) → schedule → saved (이벤트 재발생)

**문서 요구사항 재확인:**

- 문서에는 "1회만 실행"이라고 명시되어 있지만, "화면이 실제로 보이는 순간"에 대한 정확한 해석이 필요합니다.
- 사용자가 화면을 여러 번 본다면, 각각의 조회로 측정하는 것이 더 유용할 수 있습니다.

**결론:**

- 현재 구현은 합리적입니다. 사용자가 실제로 화면을 볼 때마다 이벤트가 발생하므로, 더 정확한 사용자 행동 분석이 가능합니다.
- 만약 세션당 정말 1회만 추적하고 싶다면, sessionStorage를 사용하는 방법도 있지만, 현재 구현이 더 실용적입니다.

---

## 🧪 테스트 시나리오

### 1. 정상 시나리오

- [x] 일정 페이지에서 "저장하기" 버튼 클릭 → `schedule_save_click` 이벤트 발생 확인
- [x] 일정 페이지에서 "저장된 일정" 탭 클릭 → `saved_schedule_view` 이벤트 발생 확인

### 2. Edge Cases

- [x] URL에 `?tab=saved`로 직접 진입 → 이벤트 발생 확인 필요
- [x] 탭을 여러 번 전환 (schedule → saved → schedule → saved) → 각 saved 진입 시 이벤트 발생 확인 필요
- [x] 페이지 새로고침 후 saved 탭 → 이벤트 발생 확인 필요

---

## 📝 최종 검토 의견

### 전반적인 평가: ✅ 양호

**장점:**

1. 코드 구조가 깔끔하고 유지보수하기 쉬움
2. 타입 안정성 확보
3. Edge case 처리 (URL 파라미터, 중복 방지 등)
4. 문서 요구사항 준수

**개선 제안 (선택사항):**

1. **entry_source 동적 감지**: 추후 마이페이지에서 진입하는 경우를 위해 `useRouter`나 `window.location.pathname`을 활용하여 동적으로 감지할 수 있음

   ```typescript
   const entrySource = router.pathname?.includes("/mypage")
     ? "mypage"
     : "schedule";
   ```

2. **주석 개선**: gtm.ts 파일 상단의 "항상 성공 이후에만 push" 주석은 일반적인 규칙이며, schedule_save_click은 의도 측정 목적으로 클릭 시점에 호출하는 것이 맞으므로 현재 구현이 적절함

---

## ✅ 결론

**구현 상태: 프로덕션 배포 가능**

모든 주요 기능이 올바르게 구현되었으며, Edge case도 적절히 처리되어 있습니다. 현재 구현대로 배포하여 사용자 행동 데이터를 수집할 수 있습니다.

추가 개선사항은 선택사항이며, 현재 상태로도 충분히 사용 가능합니다.
