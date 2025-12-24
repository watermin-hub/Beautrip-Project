# provider CHECK 제약조건 문제 분석

## 🔴 문제 상황

1. **로컬 회원가입**: "Database error saving new user" 에러
2. **구글 로그인**: 같은 에러 발생
3. **원인**: `user_profiles` 테이블의 CHECK 제약조건 위반 가능성

---

## ⚠️ CHECK 제약조건

```sql
-- provider는 'local' 또는 'google'만 허용
CHECK (provider IN ('local', 'google'))

-- Google인 경우 provider_user_id가 필수
CHECK (
  provider <> 'google'
  OR (provider_user_id IS NOT NULL AND length(provider_user_id) > 0)
)
```

**의미:**
- `provider = 'google'`인 경우 → `provider_user_id`는 **반드시 NULL이 아니고 빈 문자열이 아니어야 함**
- `provider = 'local'`인 경우 → `provider_user_id`는 NULL이어도 OK

---

## 🔍 트리거 함수 분석

### 현재 트리거 로직

```sql
-- provider 정규화
v_provider_raw := coalesce(
  new.app_metadata->>'provider',
  new.raw_user_meta_data->>'provider',
  'local'
);

v_provider :=
  case
    when v_provider_raw = 'google' then 'google'
    else 'local'
  end;

if v_provider = 'google' then
  v_provider_user_id := coalesce(
    new.raw_user_meta_data->>'sub',
    new.raw_user_meta_data->>'provider_user_id'
  );
else
  v_provider_user_id := null;  -- ✅ local이면 null OK
end if;

-- INSERT
insert into public.user_profiles (
  user_id,
  login_id,
  preferred_language,
  provider,
  provider_user_id
)
values (
  new.id,
  new.email,
  v_lang,
  v_provider,
  v_provider_user_id
);
```

### 🐛 잠재적 문제

#### 문제 1: Google 로그인 시 provider_user_id가 없을 수 있음

Google 로그인인데 `raw_user_meta_data`에 `sub`나 `provider_user_id`가 없으면:
- `v_provider_user_id := coalesce(..., null)` → **NULL**
- `provider = 'google'`이고 `provider_user_id = NULL` → **CHECK 제약조건 위반!**

**해결책:**
```sql
if v_provider = 'google' then
  v_provider_user_id := coalesce(
    new.raw_user_meta_data->>'sub',
    new.raw_user_meta_data->>'provider_user_id'
  );
  
  -- Google인데 provider_user_id가 없으면 에러
  if v_provider_user_id is null or length(trim(v_provider_user_id)) = 0 then
    raise exception 'Google provider requires provider_user_id';
  end if;
else
  v_provider_user_id := null;
end if;
```

#### 문제 2: app_metadata에서 provider를 잘못 읽을 수 있음

`new.app_metadata->>'provider'`를 먼저 확인하는데, 이 값이 없거나 잘못된 경우:
- 로컬 회원가입인데 `app_metadata->>'provider'`가 'google'로 잘못 설정되어 있을 수 있음
- 그런데 `provider_user_id`는 없음 → CHECK 제약조건 위반

---

## 🔍 프론트엔드 코드 확인

### 로컬 회원가입 (SignupModal.tsx)

```typescript
const profileData = {
  user_id: authData.user.id,
  provider: "local",  // ✅ 명시적으로 'local'
  login_id: email.trim(),
  nickname: email.trim().split("@")[0],
  preferred_language: selectedLanguage,
  timezone: timezone,
  locale: locale,
  // provider_user_id 없음 (NULL) → ✅ 'local'이면 OK
};
```

### 구글 로그인 (LoginModal.tsx 확인 필요)

구글 로그인 코드에서 `provider_user_id`를 제대로 설정하는지 확인 필요

---

## ✅ 확인 방법

### 1. 트리거 함수에서 provider 판단 로직 확인

```sql
-- 트리거 함수 수정 전에 로그 추가 (디버깅용)
-- 실제로는 트리거에서 raise를 사용해서 에러 메시지로 확인
```

### 2. Supabase Dashboard → Logs 확인

```
Database error saving new user
상세 에러 메시지 확인:
- CHECK 제약조건 위반인지 (23514 에러 코드)
- 어떤 CHECK 제약조건인지
```

### 3. 트리거 함수 개선 (에러 처리 강화)

```sql
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_provider_raw text;
  v_provider text;
  v_provider_user_id text;
  v_lang_raw text;
  v_lang text;
begin
  -- provider 정규화
  v_provider_raw := coalesce(
    new.app_metadata->>'provider',
    new.raw_user_meta_data->>'provider',
    'local'
  );

  v_provider :=
    case
      when lower(trim(v_provider_raw)) = 'google' then 'google'
      else 'local'
    end;

  if v_provider = 'google' then
    v_provider_user_id := coalesce(
      new.raw_user_meta_data->>'sub',
      new.raw_user_meta_data->>'provider_user_id'
    );
    
    -- ✅ Google인데 provider_user_id가 없으면 에러 (명시적으로)
    if v_provider_user_id is null or length(trim(v_provider_user_id)) = 0 then
      raise exception 'Google provider requires provider_user_id (sub or provider_user_id in raw_user_meta_data)';
    end if;
  else
    v_provider_user_id := null;
  end if;

  -- language 정규화
  v_lang_raw := coalesce(new.raw_user_meta_data->>'preferred_language', 'KR');
  v_lang := upper(trim(v_lang_raw));
  
  if v_lang not in ('KR', 'EN', 'JP', 'CN') then
    v_lang := 'KR';
  end if;

  -- user_profiles INSERT
  insert into public.user_profiles (
    user_id,
    login_id,
    preferred_language,
    provider,
    provider_user_id
  )
  values (
    new.id,
    coalesce(new.email, ''),
    v_lang,
    v_provider,
    v_provider_user_id
  );

  return new;

exception
  when check_violation then
    -- CHECK 제약조건 위반 시 상세 메시지
    raise exception 'Check constraint violation: provider=%, provider_user_id=%, error=%', 
      v_provider, v_provider_user_id, SQLERRM;
  when others then
    raise exception 'Failed to create user profile: %', SQLERRM;
end;
$$;
```

---

## 📋 체크리스트

- [ ] Supabase Dashboard → SQL Editor → Logs에서 상세 에러 확인
- [ ] 에러 코드가 `23514` (CHECK 제약조건 위반)인지 확인
- [ ] 트리거 함수에서 provider 판단 로직 확인
- [ ] Google 로그인 시 `raw_user_meta_data`에 `sub` 또는 `provider_user_id`가 있는지 확인
- [ ] 트리거 함수에 에러 처리 추가

---

## 🎯 예상 원인

1. **Google 로그인**: `provider = 'google'`인데 `provider_user_id`가 NULL
2. **로컬 회원가입**: 트리거에서 provider를 잘못 판단하여 `'google'`로 설정했는데 `provider_user_id`가 없음

