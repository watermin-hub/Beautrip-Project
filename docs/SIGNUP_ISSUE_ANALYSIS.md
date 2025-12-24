# 회원가입 문제 원인 분석 브리핑

## 🔍 현재 상태 요약

### ✅ 정상 동작하는 부분

1. **디버깅 로그 추가 완료** (`components/SignupModal.tsx:72-76`)

   - `preferred_language` 값이 콘솔에 출력됨
   - `selectedLanguage` (KR, EN, JP, CN)를 metadata로 전송

2. **Supabase Auth 회원가입 호출** (`SignupModal.tsx:79-90`)

   - `options.data`에 `login_id`, `preferred_language` 포함
   - 에러 처리 로직 존재

3. **user_profiles 테이블 upsert** (`SignupModal.tsx:116-131`)
   - 모든 필수 필드 포함 (user_id, provider, login_id, nickname, preferred_language, timezone, locale)
   - `onConflict: "user_id"` 설정

---

## ⚠️ 의심되는 문제점들

### 1. **백엔드 트리거/함수 문제 (가장 의심스러움) 🎯**

**증상:**

- Supabase Auth에서는 회원가입이 성공하지만
- 백엔드에서 `user_profiles` 테이블 생성 시 `preferred_language` 관련 오류 발생 가능

**확인 필요:**

- `auth.users` 테이블에 INSERT 시 자동으로 `user_profiles`를 생성하는 **트리거나 함수**가 있는지
- 해당 트리거/함수에서 `raw_user_meta_data.preferred_language`를 읽어서 처리하는 로직이 있는지
- 트리거가 프론트엔드의 `upsert`와 충돌하는지

**확인 방법:**

```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
SELECT * FROM pg_proc WHERE proname LIKE '%user%';

-- user_profiles 자동 생성 함수 확인
SELECT prosrc FROM pg_proc
WHERE proname LIKE '%handle_new_user%'
   OR proname LIKE '%on_auth_user_created%';
```

---

### 2. **RLS (Row Level Security) 정책 문제**

**증상:**

- `user_profiles` 테이블에 INSERT 권한이 없을 수 있음
- 에러 메시지에서 `23505` (unique violation) 또는 `23503` (foreign key violation) 발생 가능

**현재 코드의 에러 처리:**

```typescript
// SignupModal.tsx:133-144
if (profileError) {
  if (profileError.code === "23505") {
    throw new Error("이미 존재하는 사용자입니다.");
  } else if (profileError.code === "23503") {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }
  throw new Error(`프로필 저장에 실패했습니다: ${profileError.message}`);
}
```

**확인 필요:**

- `user_profiles` 테이블의 RLS 정책이 INSERT를 허용하는지
- `auth.uid()`가 새로 생성된 사용자 ID와 일치하는지

**확인 방법:**

```sql
-- RLS 활성화 여부 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- RLS 정책 확인
SELECT * FROM pg_policies
WHERE tablename = 'user_profiles';
```

---

### 3. **Supabase Auth 설정 문제**

**의심 지점:**

- **이메일 인증 필수 여부**: Supabase 프로젝트 설정에서 이메일 인증이 필수로 설정되어 있으면 세션이 즉시 생성되지 않음
- **Confirm email 옵션**: 설정에서 "Confirm email"이 켜져 있으면 `authData.session`이 `null`이 됨

**현재 코드:**

```typescript
// SignupModal.tsx:146-166
// 세션이 없으면 자동 로그인 시도
if (!authData.session && authData.user) {
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  // ...
}
```

**확인 필요:**

- Supabase Dashboard → Authentication → Settings에서
  - "Enable email confirmations" 설정 확인
  - "Enable email signups" 설정 확인

---

### 4. **데이터베이스 제약조건 문제**

**의심 지점:**

- `user_profiles.preferred_language` 컬럼이 `NOT NULL`이고 기본값이 `'KR'`인데
- 트리거나 함수에서 `NULL` 값을 넣으려고 시도할 수 있음

**확인 필요:**

```sql
-- user_profiles 테이블 스키마 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- CHECK 제약조건 확인
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%preferred_language%';
```

---

### 5. **에러 메시지가 제대로 표시되지 않는 문제**

**현재 코드:**

```typescript
// SignupModal.tsx:216-230
catch (err: any) {
  console.error("회원가입 오류:", err);
  if (err.details) {
    console.error("에러 상세:", err.details);
  }
  if (err.hint) {
    console.error("에러 힌트:", err.hint);
  }
  const errorMessage =
    err.message ||
    err.error_description ||
    "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.";
  setError(errorMessage);
}
```

**확인 필요:**

- 브라우저 콘솔에 실제 에러 메시지가 출력되는지
- `err.message`가 빈 문자열이거나 undefined인지
- Supabase 에러 객체의 구조가 예상과 다른지

**추가 디버깅 필요:**

```typescript
// SignupModal.tsx catch 블록에 추가
console.error("전체 에러 객체:", JSON.stringify(err, null, 2));
console.error("에러 코드:", err.code);
console.error("에러 메시지:", err.message);
```

---

## 🔧 즉시 확인해야 할 사항

### 1. 브라우저 콘솔 확인

회원가입 시도 시 콘솔에 출력되는 모든 에러 메시지 확인:

- `preferred_language 보내는 값: KR` (또는 선택한 언어)
- `raw metadata: { preferred_language: 'KR' }`
- `Auth 오류:` 또는 `프로필 저장 실패:`
- 전체 에러 스택 트레이스

### 2. Supabase Dashboard 확인

- **Authentication → Users**: 새로 가입한 사용자가 생성되었는지
- **Table Editor → user_profiles**: 프로필이 생성되었는지, `preferred_language` 값이 올바른지
- **SQL Editor**: 에러 로그 확인

### 3. 네트워크 탭 확인

- `auth/v1/signup` 요청의 응답 확인
- `rest/v1/user_profiles` 요청의 응답 확인
- HTTP 상태 코드와 응답 본문 확인

---

## 📝 추가 디버깅 코드 제안

### SignupModal.tsx에 더 상세한 로그 추가:

```typescript
// 1. Auth 성공 후 user 객체 확인
if (authData.user) {
  console.log("✅ Auth 사용자 생성 성공:", {
    id: authData.user.id,
    email: authData.user.email,
    raw_user_meta_data: authData.user.user_metadata,
  });
}

// 2. 프로필 저장 전 확인
console.log("프로필 저장 시도:", {
  user_id: authData.user.id,
  preferred_language: selectedLanguage,
  provider: "local",
  login_id: email.trim(),
});

// 3. 프로필 저장 응답 확인
const { data: profileData, error: profileError } = await supabase
  .from("user_profiles")
  .upsert(...);

console.log("프로필 저장 결과:", {
  data: profileData,
  error: profileError,
});
```

---

## 🎯 가장 가능성 높은 원인

**1순위: 백엔드 트리거/함수 문제**

- `auth.users`에 INSERT 시 자동으로 `user_profiles`를 생성하는 트리거가 있고
- 이 트리거가 `raw_user_meta_data.preferred_language`를 읽어서 처리하려고 하는데
- 값이 없거나 형식이 맞지 않아서 실패할 가능성

**2순위: RLS 정책 문제**

- `user_profiles` 테이블의 INSERT 정책이 제대로 설정되지 않았거나
- 새로 생성된 사용자에 대한 권한이 아직 적용되지 않아서 실패

**3순위: Supabase Auth 설정 문제**

- 이메일 인증이 필수로 설정되어 있어서 세션이 즉시 생성되지 않음
- 하지만 이것은 `user_profiles` 생성과는 직접적인 관련이 없음

---

## ✅ 다음 단계

1. **브라우저 콘솔에서 정확한 에러 메시지 확인**
2. **Supabase Dashboard에서 사용자 생성 여부 확인**
3. **백엔드에서 트리거/함수 존재 여부 확인**
4. **RLS 정책 확인 및 수정 필요 시 적용**
