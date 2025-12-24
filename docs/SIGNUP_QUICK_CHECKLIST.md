# 회원가입 문제 빠른 점검 체크리스트

원래 잘 작동하던 회원가입이 갑자기 안 될 때 확인할 사항들

## 🔍 즉시 확인 (5분)

### 1. 브라우저 콘솔 확인
회원가입 시도 후 콘솔에 출력되는 로그 확인:

```
🔍 Supabase 클라이언트 확인: { supabase_url: "...", supabase_key_exists: true/false }
preferred_language 보내는 값: KR
📤 회원가입 요청 시작: { ... }
📥 Auth 응답: { has_user: true/false, has_error: true/false, ... }
✅ Auth 사용자 생성 성공: { ... }
프로필 저장 시도: { ... }
프로필 저장 결과: { ... }
```

**확인 포인트:**
- ❌ `supabase_key_exists: false` → 환경 변수 문제
- ❌ `has_error: true` → Auth 단계에서 실패
- ❌ `프로필 저장 결과`에 error 있음 → 프로필 저장 실패

### 2. 네트워크 탭 확인 (F12 → Network)
회원가입 시도 시 다음 요청 확인:

1. **`auth/v1/signup`** 요청
   - Status: 200 (성공) / 400 (에러)
   - Response: `{ user: {...}, session: {...} }` 확인

2. **`rest/v1/user_profiles`** 요청
   - Status: 200 (성공) / 400, 401, 403 (에러)
   - Response: 성공/실패 메시지 확인

### 3. Supabase Dashboard 확인

#### Authentication → Users
- 새로 가입한 사용자가 생성되었는지 확인
- 사용자가 생성되어 있으면 → Auth는 성공, 프로필 저장 단계에서 실패
- 사용자가 없으면 → Auth 단계에서 실패

#### Table Editor → user_profiles
- 프로필이 생성되었는지 확인
- `preferred_language` 값이 올바른지 확인 (KR, EN, JP, CN)

#### SQL Editor → Logs
- 최근 에러 로그 확인
- RLS 정책 위반, 제약조건 위반 등의 에러 메시지 확인

---

## 🔧 가능한 원인별 해결 방법

### 원인 1: 환경 변수 문제

**증상:**
- 콘솔에 `supabase_key_exists: false` 또는 경고 메시지
- 네트워크 요청이 `401 Unauthorized` 또는 `403 Forbidden`

**해결:**
```bash
# .env.local 파일 확인
cat .env.local

# 또는 프로젝트 루트에서
# Windows
type .env.local

# 다음 값들이 있는지 확인:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**확인 방법:**
- Supabase Dashboard → Settings → API에서 값 확인
- 개발 서버 재시작: `npm run dev` (환경 변수 변경 후 필수)

---

### 원인 2: RLS 정책 변경

**증상:**
- Auth는 성공하지만 프로필 저장 실패
- 콘솔에 `프로필 저장 결과`에 error 있음
- 에러 코드: `42501` (권한 없음) 또는 `new row violates row-level security policy`

**해결:**
```sql
-- Supabase SQL Editor에서 실행
-- user_profiles 테이블의 RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- INSERT 정책이 있는지 확인
-- 없다면 추가:
CREATE POLICY "Allow authenticated insert for user_profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 원인 3: Supabase Auth 설정 변경

**증상:**
- Auth는 성공하지만 세션이 없음 (`has_session: false`)
- 이메일 인증 대기 상태

**확인:**
- Supabase Dashboard → Authentication → Settings
- **"Enable email confirmations"** 확인
  - 켜져 있으면: 이메일 인증 필요 (세션이 즉시 생성되지 않음)
  - 꺼져 있으면: 세션이 즉시 생성됨

**해결:**
- 이메일 인증을 끄거나
- 코드의 자동 로그인 로직이 제대로 동작하는지 확인

---

### 원인 4: 데이터베이스 제약조건 위반

**증상:**
- 프로필 저장 실패
- 에러 코드: `23505` (unique violation) 또는 `23514` (check violation)

**확인:**
```sql
-- preferred_language CHECK 제약조건 확인
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%preferred_language%';

-- 결과 예시:
-- preferred_language IN ('KR', 'EN', 'JP', 'CN')
```

**해결:**
- 전송하는 `preferred_language` 값이 'KR', 'EN', 'JP', 'CN' 중 하나인지 확인
- 콘솔 로그에서 `프로필 저장 시도` 확인

---

### 원인 5: 백엔드 트리거/함수 충돌

**증상:**
- Auth 성공
- 프론트엔드 upsert는 실패하거나
- 트리거가 중복 INSERT를 시도해서 에러 발생

**확인:**
```sql
-- user_profiles 자동 생성 트리거 확인
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'user_profiles'::regclass
  AND tgisinternal = false;

-- 함수 확인
SELECT 
  proname AS function_name,
  prosrc AS function_source
FROM pg_proc
WHERE proname LIKE '%user%profile%'
   OR proname LIKE '%handle_new_user%';
```

**해결:**
- 트리거가 있으면 프론트엔드의 upsert와 충돌할 수 있음
- 트리거 로직 확인 또는 프론트엔드 upsert 제거

---

### 원인 6: Supabase 서비스 장애

**증상:**
- 모든 요청이 타임아웃 또는 500 에러
- 네트워크 탭에서 요청이 실패

**확인:**
- [Supabase Status Page](https://status.supabase.com/) 확인
- 다른 Supabase 기능도 안 되는지 확인 (예: 로그인, 데이터 조회)

**해결:**
- 잠시 기다린 후 재시도
- Supabase 대시보드에서 직접 확인

---

### 원인 7: 브라우저 캐시 문제

**증상:**
- 코드를 수정했는데 반영이 안 됨
- 오래된 에러 메시지가 계속 나타남

**해결:**
- 하드 리프레시: `Ctrl + Shift + R` (Windows) 또는 `Cmd + Shift + R` (Mac)
- 브라우저 캐시 삭제
- 시크릿 모드에서 테스트

---

## 📋 체크리스트 요약

- [ ] 브라우저 콘솔에서 에러 메시지 확인
- [ ] 네트워크 탭에서 요청 성공/실패 확인
- [ ] Supabase Dashboard에서 사용자 생성 여부 확인
- [ ] Supabase Dashboard에서 프로필 생성 여부 확인
- [ ] `.env.local` 파일에 환경 변수 올바르게 설정되어 있는지 확인
- [ ] 개발 서버 재시작 (`npm run dev`)
- [ ] Supabase Dashboard → Authentication → Settings 확인
- [ ] Supabase Dashboard → SQL Editor에서 RLS 정책 확인
- [ ] 하드 리프레시 후 재시도
- [ ] Supabase Status Page 확인

---

## 🆘 그래도 안 되면

다음 정보를 백엔드 팀에게 공유:

1. **콘솔 로그 전체** (특히 `프로필 저장 결과` 부분)
2. **네트워크 탭 스크린샷** (요청/응답)
3. **Supabase Dashboard 스크린샷**:
   - Authentication → Users
   - Table Editor → user_profiles
   - SQL Editor → Logs
4. **에러 발생 시점**: 언제부터 안 되기 시작했는지
5. **최근 변경 사항**: 코드, 환경 변수, Supabase 설정 변경 여부

