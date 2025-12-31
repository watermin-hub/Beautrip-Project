"ㅠ# CRM 통합 (Supabase → Google Sheets) 피드백 및 구현 가이드

## 📋 제안된 접근 방식 피드백

### ✅ **좋은 점**

1. **공통 헬퍼 함수 패턴**

   - `lib/crmLogger.ts`로 재사용성 확보
   - 일관된 인터페이스로 유지보수 용이

2. **데이터 일관성 보장**

   - Supabase insert 성공 **직후**에만 전송
   - 데이터 불일치 최소화

3. **유연한 구조**

   - 클라이언트/서버 모두에서 사용 가능
   - 타입 안전성 (TypeScript)

4. **에러 처리**
   - Webhook 실패 시에도 사용자 경험에 영향 없음 (console.warn)
   - 비동기 처리로 성능 영향 최소화

### ⚠️ **개선/주의사항**

#### 1. **보안 고려사항**

- **현재 상태**: `NEXT_PUBLIC_GAS_WEBHOOK_URL` 사용 (클라이언트 노출)
  - ✅ **괜찮음**: Apps Script Web App URL은 공개되어도 문제 없음 (누구나 호출 가능한 것이 의도된 동작)
  - ⚠️ **권장**: Apps Script에서 IP/도메인 제한 또는 토큰 검증 추가 고려

#### 2. **사용자 정보 가져오기**

현재 코드베이스 분석 결과:

- 회원가입: `SignupModal.tsx`에서 직접 처리 (email, nickname 정보 있음)
- 후기 작성: `saveProcedureReview`, `saveHospitalReview` 함수 사용
  - user_id만 저장됨
  - email, nickname은 `user_profiles` 테이블에서 조회 필요

**해결 방안**:

- 후기 저장 성공 후 `user_profiles` 테이블에서 email, nickname 조회
- 또는 `saveProcedureReview`, `saveHospitalReview` 함수가 user 정보를 반환하도록 수정

#### 3. **에러 처리 개선 (선택사항)**

- Webhook 실패 시 재시도 로직 (로컬 스토리지 큐 활용)
- 또는 Supabase Edge Functions로 백그라운드 처리

#### 4. **타입 안전성**

- `CrmEventPayload` 인터페이스에 `content`가 optional로 되어 있어 타입 안전성 확보

---

## 🔧 구현 가이드

### Step 1: 공통 헬퍼 함수 생성

`lib/crmLogger.ts` 파일 생성 (제안된 코드 그대로 사용 가능)

### Step 2: 회원가입에 통합

**위치**: `components/SignupModal.tsx`의 `handleSignup` 함수

**통합 지점**:

- `user_profiles` 테이블 저장 성공 후 (라인 203 이후)
- 또는 Auth 성공 + 프로필 저장 모두 완료 후

**필요한 정보**:

- ✅ email: 이미 있음 (`email.trim()`)
- ✅ nickname: 이미 있음 (`email.trim().split("@")[0]`)

### Step 3: 후기 작성에 통합

**위치**: `lib/api/beautripApi.ts`의 `saveProcedureReview`, `saveHospitalReview` 함수

**통합 지점**:

- Supabase insert 성공 후 (`.insert().select()` 성공 시)

**필요한 정보**:

- ⚠️ email: `user_profiles` 테이블에서 조회 필요 (`login_id` 또는 별도 email 컬럼)
- ⚠️ nickname: `user_profiles` 테이블에서 조회 필요
- ✅ content: 이미 있음 (`data.content`)

**구현 방식**:

```typescript
// saveProcedureReview/saveHospitalReview 내부
const { data: insertedData, error } = await supabase
  .from("procedure_reviews") // 또는 "hospital_reviews"
  .insert([reviewData])
  .select("id")
  .single();

if (error) {
  return { success: false, error: error.message };
}

// ✅ CRM 로그 전송 (insert 성공 후)
try {
  // user_profiles에서 email, nickname 조회
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("login_id, nickname")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) {
    await logCrmEventToSheet({
      event_type: "review",
      email: profile.login_id || user.email || "", // login_id가 email인 경우
      nickname: profile.nickname || "사용자",
      content: data.content,
    });
  }
} catch (crmError) {
  // CRM 전송 실패해도 후기 저장은 성공한 것으로 처리
  console.error("CRM 로그 전송 실패:", crmError);
}

return { success: true, id: insertedData?.id };
```

### Step 4: 환경 변수 설정

`.env.local` 파일에 추가:

```
NEXT_PUBLIC_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

---

## 📝 최종 체크리스트

- [ ] `lib/crmLogger.ts` 생성
- [ ] `.env.local`에 `NEXT_PUBLIC_GAS_WEBHOOK_URL` 추가
- [ ] `SignupModal.tsx`에 CRM 로그 통합
- [ ] `saveProcedureReview` 함수에 CRM 로그 통합
- [ ] `saveHospitalReview` 함수에 CRM 로그 통합
- [ ] (선택) `saveConcernPost` 함수에도 통합 (고민글 작성)

---

## 🎯 결론

**제안된 접근 방식은 전반적으로 매우 합리적입니다!**

- 구조가 깔끔하고 유지보수하기 좋음
- 데이터 일관성 보장
- 에러 처리 적절

**다만, 후기 작성 시 user_profiles 조회가 추가로 필요**하므로, 이를 고려한 구현이 필요합니다.


