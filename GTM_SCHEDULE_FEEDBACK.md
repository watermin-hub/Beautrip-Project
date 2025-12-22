# GTM 일정 추적 이벤트 피드백

## 📋 요청사항 검토 요약

GTM 담당자 요청사항을 검토한 결과, **요청하신 두 가지 이벤트 추가는 합리적이고 필요합니다**. SPA 구조에서 URL이 바뀌지 않는 화면 전환은 자동 추적이 불가능하므로 프론트에서 명시적으로 이벤트를 보내야 합니다.

---

## ✅ 구현 가능성 및 위치 파악

### 1. `schedule_save_click` 이벤트

**위치**: `components/MySchedulePage.tsx` (라인 3284-3409)

**현재 구조**:
```typescript
<button
  onClick={async () => {
    // ... validation 로직 ...
    try {
      const result = await saveSchedule(...);
      if (result.success) {
        // 성공 처리
      }
    } catch (error) {
      // 에러 처리
    }
  }}
>
  {t("schedule.saveCurrentSchedule")}
</button>
```

**추가 위치**: 버튼 클릭 핸들러 시작 부분 (validation 통과 후)
- 문서 요청대로 "저장할 의도(intent)"를 측정하려면 클릭 시점이 적절합니다.
- 다만 기존 `lib/gtm.ts` 주석에는 "항상 성공 이후에만 push"라고 되어 있어, 두 가지 옵션이 있습니다:

**옵션 1**: 클릭 시점 (문서 요청사항 준수)
```typescript
onClick={async () => {
  // GTM 이벤트 - 의도 측정
  pushToDataLayer({
    event: "schedule_save_click",
    entry_source: "schedule"
  });
  
  // ... 기존 로직 ...
}}
```

**옵션 2**: 성공 후 (기존 패턴과 일관성)
```typescript
if (result.success) {
  pushToDataLayer({
    event: "schedule_save_click",
    entry_source: "schedule"
  });
  // ... 기존 성공 처리 ...
}
```

**💡 추천**: 문서의 목적(의도 측정)을 고려하면 **옵션 1(클릭 시점)**이 더 적합합니다.

---

### 2. `saved_schedule_view` 이벤트

**위치**: `components/MySchedulePage.tsx` (라인 3959)

**현재 구조**:
```typescript
{activeTab === "saved" && (
  <SavedSchedulesTab ... />
)}
```

**추가 위치**: `useEffect`를 사용하여 `activeTab`이 "saved"로 변경될 때

```typescript
useEffect(() => {
  if (activeTab === "saved") {
    pushToDataLayer({
      event: "saved_schedule_view",
      entry_source: "schedule" // 또는 "mypage" - 진입 경로에 따라
    });
  }
}, [activeTab]);
```

**⚠️ 주의사항**:
- URL 쿼리 파라미터(`?tab=saved`)로 직접 진입하는 경우도 처리해야 합니다.
- 현재 코드를 보면 `useEffect`에서 URL 파라미터를 읽어 `activeTab`을 설정하고 있으므로 (라인 2379-2389), 위의 `useEffect`가 이를 감지할 것입니다.
- 단, 페이지 로드 시 `activeTab`이 "saved"로 초기화되는 경우도 있으므로, 중복 방지를 위해 한 번만 실행되도록 해야 합니다.

---

## 🔍 추가 고려사항

### 1. `entry_source` 값의 정확성

문서에서 `entry_source: "schedule"` 또는 `"mypage"`를 언급했습니다.

**현재 코드 확인 결과**:
- 일정 저장 버튼: `/schedule` 페이지의 "여행 일정" 탭에 위치 → `"schedule"` ✅
- 저장된 일정 화면: `/schedule` 페이지의 "저장된 일정" 탭 → `"schedule"` ✅
- 마이페이지에서 진입하는 경로가 있다면 `"mypage"`도 가능

**확인이 필요한 부분**:
- 마이페이지(`/mypage`)에서 저장된 일정 화면으로 직접 이동하는 경로가 있는지 확인 필요
- 있다면 진입 경로를 동적으로 감지해야 합니다.

### 2. 기존 GTM 패턴과의 일관성

`lib/gtm.ts`를 확인한 결과, 이미 유사한 패턴이 있습니다:
- `trackAddToSchedule(entrySource: EntrySource)`
- `trackTripDateSet(...)`
- `trackReviewStart(entrySource: EntrySource)`

**제안**: 새 이벤트도 동일한 패턴으로 함수화하는 것을 권장합니다.

```typescript
// lib/gtm.ts에 추가
export function trackScheduleSaveClick(entrySource: EntrySource) {
  pushToDataLayer({
    event: "schedule_save_click",
    entry_source: entrySource,
  });
}

export function trackSavedScheduleView(entrySource: EntrySource) {
  pushToDataLayer({
    event: "saved_schedule_view",
    entry_source: entrySource,
  });
}
```

---

## 🎯 구현 체크리스트

- [ ] `lib/gtm.ts`에 새로운 트래킹 함수 추가
- [ ] `MySchedulePage.tsx`의 저장 버튼 클릭 핸들러에 `trackScheduleSaveClick()` 호출 추가
- [ ] `MySchedulePage.tsx`에 `activeTab === "saved"` 감지하는 `useEffect` 추가
- [ ] `trackSavedScheduleView()` 호출 추가 (중복 방지 로직 포함)
- [ ] 마이페이지 진입 경로 확인 및 `entry_source` 값 동적 설정
- [ ] 테스트: 직접 진입, 탭 전환, URL 파라미터 진입 등 모든 케이스 확인

---

## 📝 구현 예시 코드

### `lib/gtm.ts`에 추가할 코드

```typescript
/**
 * schedule_save_click 이벤트 트래킹
 * 
 * 호출 위치: 일정 저장 버튼 클릭 핸들러 내부 (validation 통과 후)
 * 
 * @param entrySource 일정 저장 진입 경로 ("schedule" | "mypage")
 */
export function trackScheduleSaveClick(entrySource: EntrySource) {
  pushToDataLayer({
    event: "schedule_save_click",
    entry_source: entrySource,
  });
}

/**
 * saved_schedule_view 이벤트 트래킹
 * 
 * 호출 위치: 저장된 일정 화면이 실제로 렌더링될 때 (activeTab === "saved")
 * 
 * @param entrySource 저장된 일정 화면 진입 경로 ("schedule" | "mypage")
 */
export function trackSavedScheduleView(entrySource: EntrySource) {
  pushToDataLayer({
    event: "saved_schedule_view",
    entry_source: entrySource,
  });
}
```

### `components/MySchedulePage.tsx` 수정 예시

```typescript
// 1. import 추가
import { trackScheduleSaveClick, trackSavedScheduleView } from "@/lib/gtm";

// 2. 저장 버튼 클릭 핸들러 수정 (라인 3285 근처)
onClick={async () => {
  if (!travelPeriod) {
    alert(t("alert.setTravelPeriodFirst"));
    return;
  }

  if (savedSchedules.length === 0) {
    alert(t("alert.noScheduleToSave"));
    return;
  }

  // GTM 이벤트: 저장 의도 측정
  trackScheduleSaveClick("schedule");

  // ... 기존 로직 ...
}}

// 3. 저장된 일정 화면 조회 추적 (라인 2389 이후에 추가)
const hasTrackedSavedScheduleView = useRef(false);

useEffect(() => {
  if (activeTab === "saved" && !hasTrackedSavedScheduleView.current) {
    // 진입 경로 확인 (현재는 "schedule"로 고정, 필요시 동적으로 변경)
    trackSavedScheduleView("schedule");
    hasTrackedSavedScheduleView.current = true;
  }
  
  // 탭이 변경되면 플래그 리셋 (필요시)
  if (activeTab !== "saved") {
    hasTrackedSavedScheduleView.current = false;
  }
}, [activeTab]);
```

---

## ⚠️ 주의사항 및 질문

1. **중복 방지**: `saved_schedule_view` 이벤트가 여러 번 발생하지 않도록 플래그 관리 필요
2. **진입 경로 감지**: 마이페이지에서 진입하는 경우 `entry_source: "mypage"`를 어떻게 감지할지 명확히 해야 함
3. **기존 패턴과의 차이**: 문서에서는 "버튼 클릭 시점"에 이벤트를 보내라고 했지만, 기존 `lib/gtm.ts` 주석에는 "성공 이후에만 push"라고 되어 있습니다. 어떤 방식을 따를지 확인이 필요합니다.

---

## ✅ 결론

요청사항은 **구현 가능하며, 기존 코드 구조와도 잘 맞습니다**. 
위의 체크리스트와 예시 코드를 참고하여 구현하시면 됩니다.

추가 질문이나 확인이 필요한 부분이 있으면 알려주세요!

