# 회원가입 "Database error saving new user" 해결 가이드

## 🔴 에러 현상

```
AuthApiError: Database error saving new user
Status: 500
Code: unexpected_failure
```

- `supabase.auth.signUp()` 호출 시 발생
- 사용자가 `auth.users` 테이블에 생성되지 않음
- 프론트엔드 코드는 정상 (데이터 전송 OK)

---

## 🔍 원인 분석

이 에러는 **Supabase Auth의 내부 데이터베이스**에서 발생합니다. 
`auth.users` 테이블에 INSERT할 때 트리거/함수/제약조건에서 실패한 것으로 보입니다.

### 가능한 원인들:

1. **`auth.users` INSERT 트리거 실패**
   - `auth.users`에 INSERT 시 자동 실행되는 트리거
   - 트리거가 `user_profiles` 생성 시도 중 실패

2. **`raw_user_meta_data` 처리 실패**
   - `preferred_language` 값을 읽어서 처리하는 로직에서 실패
   - 데이터 타입/형식 불일치

3. **데이터베이스 제약조건 위반**
   - `auth.users` 테이블의 제약조건 위반

4. **Supabase 인프라 문제**
   - 임시 서비스 장애

---

## ✅ 해결 방법

### 1. Supabase Dashboard에서 확인

#### Step 1: Authentication → Users 확인
- 에러 발생 시도한 사용자 이메일로 검색
- 사용자가 생성되었는지 확인
- 생성되지 않았다면 → Auth 단계에서 실패 (현재 상황)

#### Step 2: SQL Editor → Logs 확인
```
Supabase Dashboard → SQL Editor → Logs 탭
```
- 최근 에러 로그 확인
- "Database error saving new user" 관련 상세 에러 메시지 확인
- PostgreSQL 에러 코드 및 메시지 확인

#### Step 3: 트리거 확인
```sql
-- auth.users 테이블에 걸린 트리거 확인
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgtype,
  tgenabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false
ORDER BY tgname;

-- 함수 확인 (handle_new_user 등)
SELECT 
  proname AS function_name,
  prosrc AS function_source,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname LIKE '%user%'
   OR proname LIKE '%auth%'
ORDER BY proname;
```

#### Step 4: raw_user_meta_data 처리 확인
```sql
-- auth.users 테이블 스키마 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name LIKE '%meta%';

-- 실제 저장 시도하는 값 확인 (백엔드 로그에서)
```

---

### 2. 백엔드 팀에게 확인 요청

다음 정보를 백엔드 팀에게 공유하고 확인 요청:

#### A. 트리거/함수 확인
```
1. auth.users 테이블에 INSERT 시 실행되는 트리거가 있나요?
   - 트리거 이름과 함수 이름
   - 트리거가 user_profiles를 자동 생성하나요?
   
2. 트리거/함수에서 raw_user_meta_data.preferred_language를 사용하나요?
   - 사용한다면 어떻게 처리하나요?
   - preferred_language 값이 없을 때 기본값은 무엇인가요?
```

#### B. 에러 로그 확인
```
Supabase Dashboard → SQL Editor → Logs에서
"Database error saving new user" 관련 상세 에러 메시지 확인 부탁드립니다.
- PostgreSQL 에러 코드
- 에러 메시지 전체
- 발생 시점
```

#### C. 최근 변경 사항 확인
```
1. 최근 auth.users 관련 트리거/함수를 수정했나요?
2. user_profiles 테이블 스키마를 변경했나요?
3. preferred_language 관련 로직을 변경했나요?
```

---

### 3. 임시 우회 방법 (긴급 시)

프로덕션에서 긴급히 회원가입이 필요하다면:

#### Option 1: 트리거 일시 비활성화
```sql
-- 트리거 비활성화 (주의: 백엔드 팀과 협의 필수)
ALTER TABLE auth.users DISABLE TRIGGER trigger_name;

-- 회원가입 시도

-- 트리거 재활성화
ALTER TABLE auth.users ENABLE TRIGGER trigger_name;
```

#### Option 2: preferred_language 제거 (테스트용)
일시적으로 `preferred_language`를 metadata에서 제거하고 테스트:
```typescript
// SignupModal.tsx 임시 수정 (테스트용)
data: {
  login_id: email.trim(),
  // preferred_language: selectedLanguage, // 임시 주석
},
```

---

### 4. 데이터베이스 상태 확인

```sql
-- auth.users 테이블 상태 확인
SELECT COUNT(*) FROM auth.users;

-- 최근 생성된 사용자 확인
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- raw_user_meta_data 구조 확인
SELECT 
  email,
  raw_user_meta_data->>'preferred_language' AS preferred_language,
  raw_user_meta_data->>'login_id' AS login_id
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL
LIMIT 5;
```

---

## 📋 체크리스트

- [ ] Supabase Dashboard → Authentication → Users에서 사용자 생성 여부 확인
- [ ] Supabase Dashboard → SQL Editor → Logs에서 상세 에러 메시지 확인
- [ ] `auth.users` 테이블 트리거 확인 (SQL 쿼리 실행)
- [ ] 백엔드 팀에 트리거/함수 로직 확인 요청
- [ ] 백엔드 팀에 에러 로그 확인 요청
- [ ] 백엔드 팀에 최근 변경 사항 확인 요청
- [ ] Supabase Status Page 확인 (인프라 장애 여부)

---

## 🎯 예상 원인 (가능성 순)

1. **트리거에서 user_profiles 생성 실패** (80%)
   - `auth.users` INSERT 트리거가 `user_profiles` 생성 시도
   - `preferred_language` 값 처리 중 에러 발생
   - RLS 정책 또는 제약조건 위반

2. **raw_user_meta_data 처리 실패** (15%)
   - 트리거/함수에서 `raw_user_meta_data.preferred_language` 읽기 실패
   - NULL 처리 또는 타입 변환 실패

3. **Supabase 인프라 문제** (5%)
   - 임시 서비스 장애
   - 데이터베이스 연결 문제

---

## 💡 백엔드 팀에게 보낼 메시지 예시

```
안녕하세요,

회원가입 시 "Database error saving new user" 에러가 발생하고 있습니다.

현상:
- supabase.auth.signUp() 호출 시 Status 500 에러 발생
- auth.users 테이블에 사용자가 생성되지 않음
- preferred_language는 정상적으로 전송됨 (KR)

확인 부탁드리실 사항:
1. auth.users 테이블에 INSERT 시 실행되는 트리거/함수가 있나요?
2. 해당 트리거/함수에서 raw_user_meta_data.preferred_language를 처리하나요?
3. Supabase Dashboard → SQL Editor → Logs에서 상세 에러 메시지 확인 가능하신가요?
4. 최근 auth.users 관련 로직을 수정하셨나요?

에러 상세:
- 에러 타입: AuthApiError
- Status: 500
- Code: unexpected_failure
- 메시지: Database error saving new user

감사합니다.
```

