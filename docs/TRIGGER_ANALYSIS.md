# handle_new_auth_user 트리거 함수 분석

## 🔍 트리거 함수 구조 분석

### 현재 트리거 로직

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
      when v_provider_raw = 'google' then 'google'
      else 'local'
    end;

  if v_provider = 'google' then
    v_provider_user_id := coalesce(
      new.raw_user_meta_data->>'sub',
      new.raw_user_meta_data->>'provider_user_id'
    );
  else
    v_provider_user_id := null;
  end if;

  -- language 정규화
  v_lang_raw := coalesce(new.raw_user_meta_data->>'preferred_language', 'KR');
  v_lang := v_lang_raw;

  insert into public.user_profiles (
    user_id,
    login_id,
    preferred_language,
    provider,
    provider_user_id
  )
  values (
    new.id,       -- user_id (PK)
    new.email,    -- login_id(= email)
    v_lang,       -- preferred_language
    v_provider,
    v_provider_user_id
  );

  return new;
end;
$$;
```

---

## ⚠️ 잠재적 문제점

### 1. **트리거가 auth.users에 연결되지 않았을 가능성** 🎯

트리거 함수는 정의되어 있지만, **실제로 `auth.users` 테이블에 연결되지 않았을 수 있습니다.**

**확인 필요:**
```sql
-- 트리거가 실제로 존재하는지 확인
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false
  AND tgname LIKE '%user%';
```

**만약 트리거가 없다면 추가해야 함:**
```sql
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

---

### 2. **CHECK 제약조건 위반 가능성**

#### A. `preferred_language` CHECK 위반
```sql
check (preferred_language in ('KR','EN','JP','CN'))
```

**문제 가능성:**
- `v_lang_raw`가 공백 문자열이거나 공백 포함 문자열일 수 있음
- `coalesce(..., 'KR')`로 기본값은 있지만, 실제 값이 잘못된 형식일 수 있음

**개선 제안:**
```sql
-- language 정규화 (대문자 변환 및 트림)
v_lang_raw := coalesce(new.raw_user_meta_data->>'preferred_language', 'KR');
v_lang := upper(trim(v_lang_raw));

-- 유효성 검증 추가
if v_lang not in ('KR', 'EN', 'JP', 'CN') then
  v_lang := 'KR';  -- 기본값으로 fallback
end if;
```

#### B. `provider` CHECK 위반
```sql
check (provider in ('local','google'))
```

**현재 코드:**
- `v_provider := case when v_provider_raw = 'google' then 'google' else 'local' end;`
- ✅ 안전함 (항상 'google' 또는 'local')

#### C. `chk_google_uid_required` CHECK 위반
```sql
constraint chk_google_uid_required
  check (
    (provider <> 'google')
    OR (provider_user_id is not null and length(provider_user_id) > 0)
  )
```

**문제 가능성:**
- Google 로그인인데 `provider_user_id`가 NULL이거나 빈 문자열일 때 실패
- 하지만 local 로그인(`provider = 'local'`)일 때는 `provider_user_id = null`이어도 OK

**현재 코드:**
```sql
if v_provider = 'google' then
  v_provider_user_id := coalesce(...);
else
  v_provider_user_id := null;  -- ✅ local이면 null이어도 OK
end if;
```

---

### 3. **에러 처리 없음** ⚠️

트리거 함수에 **예외 처리(exception handling)가 없습니다.**

INSERT가 실패하면 트리거가 실패하고, 그 결과 `auth.users` INSERT도 롤백됩니다.

**개선 제안:**
```sql
begin
  -- ... 기존 로직 ...

  insert into public.user_profiles (...)
  values (...);

  return new;

exception
  when others then
    -- 에러 로깅 (선택사항)
    raise warning 'handle_new_auth_user failed: %', SQLERRM;
    -- 트리거 실패로 auth.users INSERT도 롤백됨
    raise;
end;
```

---

### 4. **login_id UNIQUE 제약조건 위반** 🎯

```sql
login_id text unique,
```

**문제:**
- `login_id := new.email`로 설정
- 이미 존재하는 이메일로 회원가입 시도하면 UNIQUE 제약조건 위반
- `23505` 에러 발생 가능

**하지만:**
- `auth.users`에도 이메일 UNIQUE 제약조건이 있어서, `auth.users` INSERT 단계에서 먼저 실패해야 함
- 트리거는 `auth.users` INSERT 성공 후 실행되므로, 이 경우는 발생하지 않아야 함

---

### 5. **외래 키 제약조건 문제**

```sql
user_id uuid primary key references auth.users(id) on delete cascade,
```

**문제 가능성:**
- `new.id`가 아직 커밋되지 않은 상태에서 INSERT 시도
- 하지만 트리거가 `AFTER INSERT`라면 이미 `auth.users`에 INSERT된 후이므로 문제없어야 함
- 만약 `BEFORE INSERT`로 설정되어 있다면 문제 발생 가능

---

## 🔧 확인 및 수정 SQL

### 1. 트리거 존재 여부 확인 및 생성

```sql
-- 트리거 확인
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgtype,
  tgenabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false;

-- 트리거가 없다면 생성
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

### 2. 개선된 트리거 함수 (에러 처리 및 검증 강화)

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
      when v_provider_raw = 'google' then 'google'
      else 'local'
    end;

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

  -- language 정규화 및 검증
  v_lang_raw := coalesce(new.raw_user_meta_data->>'preferred_language', 'KR');
  v_lang := upper(trim(v_lang_raw));
  
  -- 유효하지 않은 언어 코드는 기본값으로
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
  when unique_violation then
    -- login_id 중복 (이미 존재하는 이메일)
    raise exception 'User profile already exists for email: %', new.email;
  when check_violation then
    -- CHECK 제약조건 위반
    raise exception 'Check constraint violation in user_profiles: %', SQLERRM;
  when others then
    -- 기타 에러
    raise exception 'Failed to create user profile: %', SQLERRM;
end;
$$;
```

---

## 📋 체크리스트

- [ ] **트리거가 실제로 auth.users에 연결되어 있는지 확인**
- [ ] **Supabase Dashboard → SQL Editor → Logs에서 상세 에러 메시지 확인**
- [ ] **에러가 CHECK 제약조건 위반인지 확인** (코드: `23514`)
- [ ] **에러가 UNIQUE 제약조건 위반인지 확인** (코드: `23505`)
- [ ] **에러가 외래 키 제약조건 위반인지 확인** (코드: `23503`)
- [ ] **트리거 함수에 예외 처리 추가 고려**

---

## 🎯 가장 가능성 높은 원인

1. **트리거가 auth.users에 연결되지 않음** (50%)
   - 트리거 함수는 정의되어 있지만 실제로 작동하지 않음

2. **CHECK 제약조건 위반** (30%)
   - `preferred_language` 값이 예상과 다른 형식
   - 또는 다른 CHECK 제약조건 위반

3. **에러 처리 없음** (20%)
   - 트리거 내부에서 예외 발생 시 원인 파악이 어려움

