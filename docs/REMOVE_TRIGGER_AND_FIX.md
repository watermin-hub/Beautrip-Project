# 트리거 제거 및 프론트엔드 처리로 복귀

## 🔍 현재 문제

- `supabase.auth.signUp()` 호출 시 "Database error saving new user" 에러 발생
- `auth.users` INSERT 단계에서 실패 (프론트엔드 코드까지 도달하지 못함)
- **원인**: `auth.users`에 연결된 트리거가 실패하여 INSERT가 롤백되고 있을 가능성

---

## ✅ 해결 방법: 트리거 제거

프론트엔드에서 이미 `user_profiles`에 upsert를 처리하고 있으므로, 트리거가 필요 없습니다.

### Step 1: 트리거 확인

Supabase SQL Editor에서 실행:

```sql
-- 트리거가 있는지 확인
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false;
```

**결과:**
- 트리거가 있다면 → Step 2로 진행 (트리거 제거)
- 트리거가 없다면 → 다른 원인 (Supabase 인프라 문제 등)

### Step 2: 트리거 제거

트리거가 있다면 제거:

```sql
-- 트리거 제거
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 확인 (다시 실행하면 결과가 없어야 함)
SELECT tgname 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
  AND tgisinternal = false;
```

### Step 3: 트리거 함수 제거 (선택사항)

트리거 함수도 제거하고 싶다면:

```sql
-- 트리거 함수 제거
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
```

---

## ✅ 프론트엔드 처리 확인

트리거를 제거한 후, 프론트엔드 코드가 제대로 동작하는지 확인:

`components/SignupModal.tsx`에서 이미 처리하고 있음:

```typescript
// 1. Supabase Auth로 회원가입
const { data: authData, error: authError } = await supabase.auth.signUp({...});

// 2. user_profiles 테이블에 프로필 정보 저장 (프론트엔드에서 처리)
const { data: profileResult, error: profileError } = await supabase
  .from("user_profiles")
  .upsert(profileData, {
    onConflict: "user_id",
  });
```

---

## 📋 체크리스트

- [ ] Supabase SQL Editor에서 트리거 존재 여부 확인
- [ ] 트리거가 있다면 제거 (`DROP TRIGGER`)
- [ ] 트리거 함수도 제거하고 싶다면 제거 (`DROP FUNCTION`)
- [ ] 회원가입 테스트
- [ ] 콘솔 로그 확인 (에러 없이 정상 동작하는지)

---

## 🔍 트리거 제거 후에도 에러가 발생한다면

1. **Supabase Dashboard → SQL Editor → Logs 확인**
   - 상세 에러 메시지 확인

2. **네트워크 탭 확인**
   - `auth/v1/signup` 요청의 응답 확인

3. **Supabase Status Page 확인**
   - https://status.supabase.com/
   - 서비스 장애 여부 확인

4. **환경 변수 확인**
   - `.env.local` 파일 확인
   - 개발 서버 재시작

