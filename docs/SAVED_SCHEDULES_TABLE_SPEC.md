# saved_schedules 테이블 명세서

## 📋 개요

사용자가 저장한 여행 일정 정보를 Supabase에 저장하는 테이블입니다. 프론트엔드에서 "[내 일정]" 페이지의 "현재 일정 저장하기" 기능에서 사용됩니다.

---

## 🗄️ 테이블 구조

### 테이블명

`public.saved_schedules`

### 컬럼 명세

| 컬럼명            | 데이터 타입 | 제약조건                               | 설명                        | 예시                                   |
| ----------------- | ----------- | -------------------------------------- | --------------------------- | -------------------------------------- |
| `id`              | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | 일정 고유 ID                | `550e8400-e29b-41d4-a716-446655440000` |
| `user_id`         | UUID        | NOT NULL, FOREIGN KEY (auth.users.id)  | 사용자 ID (로그인한 사용자) | `b0a8d0cf-4435-490e-aadd-0917485a0f72` |
| `schedule_period` | TEXT        | NOT NULL                               | 여행 기간 (시작일~종료일)   | `"25.12.22~25.12.26"`                  |
| `treatment_ids`   | INTEGER[]   | NOT NULL, DEFAULT '{}'                 | 시술 ID 배열                | `[123, 456, 789]`                      |
| `created_at`      | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                | 생성 일시                   | `2025-12-22 10:30:00+09`               |
| `updated_at`      | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                | 수정 일시                   | `2025-12-22 10:30:00+09`               |

---

## 📝 데이터 예시

### 저장되는 데이터 예시

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "b0a8d0cf-4435-490e-aadd-0917485a0f72",
  "schedule_period": "25.12.22~25.12.26",
  "treatment_ids": [123, 456, 789, 101, 202, 303],
  "created_at": "2025-12-22T10:30:00+09:00",
  "updated_at": "2025-12-22T10:30:00+09:00"
}
```

### schedule_period 형식

- 형식: `"YY.MM.DD~YY.MM.DD"`
- 예시: `"25.12.22~25.12.26"` (2025년 12월 22일 ~ 12월 26일)
- 설명: 2자리 연도.월.일 형식으로 시작일과 종료일을 `~`로 연결

### treatment_ids 형식

- 타입: PostgreSQL INTEGER 배열 (`INTEGER[]`)
- 예시: `[123, 456, 789]`
- 설명: 시술 ID들의 배열 (최소 1개 이상, 최대 제한 없음)

---

## 🔐 보안 설정 (RLS 정책)

### Row Level Security (RLS) 활성화

- 테이블에 RLS가 활성화되어 있습니다.
- 사용자는 **자신의 일정만** 조회/생성/수정/삭제할 수 있습니다.

### 정책 목록

1. **SELECT 정책**: 사용자는 자신의 일정만 조회 가능

   ```sql
   USING (auth.uid() = user_id)
   ```

2. **INSERT 정책**: 사용자는 자신의 일정만 생성 가능

   ```sql
   WITH CHECK (auth.uid() = user_id)
   ```

3. **UPDATE 정책**: 사용자는 자신의 일정만 수정 가능

   ```sql
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id)
   ```

4. **DELETE 정책**: 사용자는 자신의 일정만 삭제 가능
   ```sql
   USING (auth.uid() = user_id)
   ```

---

## 🚀 API 사용 방법

### 1. 일정 저장 (INSERT)

**프론트엔드 코드 위치**: `lib/api/beautripApi.ts` - `saveSchedule()`

```typescript
const { data, error } = await supabase
  .from("saved_schedules")
  .insert({
    user_id: userId, // 현재 로그인한 사용자 ID
    schedule_period: "25.12.22~25.12.26", // 여행 기간
    treatment_ids: [123, 456, 789], // 시술 ID 배열
  })
  .select()
  .single();
```

**요구사항**:

- `user_id`: 로그인한 사용자의 UUID (필수)
- `schedule_period`: 여행 기간 문자열 (필수)
- `treatment_ids`: 시술 ID 배열, 최소 1개 이상 (필수)

### 2. 일정 목록 조회 (SELECT)

**프론트엔드 코드 위치**: `lib/api/beautripApi.ts` - `getSavedSchedules()`

```typescript
const { data, error } = await supabase
  .from("saved_schedules")
  .select("*")
  .eq("user_id", userId) // 현재 사용자의 일정만 조회
  .order("created_at", { ascending: false }); // 최신순 정렬
```

**반환 데이터**:

- 사용자가 저장한 모든 일정 목록
- `created_at` 기준 내림차순 정렬 (최신순)

### 3. 일정 삭제 (DELETE)

**프론트엔드 코드 위치**: `lib/api/beautripApi.ts` - `deleteSavedSchedule()`

```typescript
const { error } = await supabase
  .from("saved_schedules")
  .delete()
  .eq("id", scheduleId) // 삭제할 일정 ID
  .eq("user_id", userId); // 본인의 일정만 삭제 가능 (RLS)
```

**요구사항**:

- `id`: 삭제할 일정의 UUID
- `user_id`: 현재 로그인한 사용자 ID (RLS로 자동 검증)

---

## ⚡ 성능 최적화

### 인덱스

1. **user_id 인덱스**

   ```sql
   CREATE INDEX idx_saved_schedules_user_id ON public.saved_schedules(user_id);
   ```

   - 사용자별 일정 조회 성능 향상

2. **created_at 인덱스**
   ```sql
   CREATE INDEX idx_saved_schedules_created_at ON public.saved_schedules(created_at DESC);
   ```
   - 최신순 정렬 성능 향상

---

## 🔄 자동 업데이트 기능

### updated_at 자동 업데이트

테이블의 레코드가 수정될 때마다 `updated_at` 컬럼이 자동으로 현재 시간으로 업데이트됩니다.

**트리거 함수**:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**트리거**:

```sql
CREATE TRIGGER update_saved_schedules_updated_at
    BEFORE UPDATE ON public.saved_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 데이터 무결성

### Foreign Key 제약조건

- `user_id`는 `auth.users(id)`를 참조합니다.
- `ON DELETE CASCADE`: 사용자가 삭제되면 해당 사용자의 모든 일정도 자동 삭제됩니다.

### NOT NULL 제약조건

- `user_id`: 필수 (로그인한 사용자만 저장 가능)
- `schedule_period`: 필수 (여행 기간 정보 필수)
- `treatment_ids`: 필수 (최소 1개 이상의 시술 ID 필요)

---

## 🛠️ 마이그레이션 실행 방법

### Supabase Dashboard에서 실행

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `supabase_migration_create_saved_schedules.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. 실행 (Run)

### Supabase CLI에서 실행

```bash
supabase db push
# 또는
psql -h [host] -U [user] -d [database] -f supabase_migration_create_saved_schedules.sql
```

---

## ✅ 검증 방법

### 1. 테이블 생성 확인

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'saved_schedules'
ORDER BY ordinal_position;
```

### 2. 인덱스 확인

```sql
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'saved_schedules';
```

### 3. RLS 정책 확인

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'saved_schedules';
```

### 4. 테스트 데이터 삽입 (개발 환경에서만)

```sql
-- 테스트용 사용자 ID 필요 (실제 auth.users에 존재하는 ID)
INSERT INTO public.saved_schedules (user_id, schedule_period, treatment_ids)
VALUES (
    'b0a8d0cf-4435-490e-aadd-0917485a0f72',  -- 실제 사용자 ID로 변경
    '25.12.22~25.12.26',
    ARRAY[123, 456, 789]
);
```

---

## 🐛 문제 해결

### 에러: "Could not find the table 'public.saved_schedules' in the schema cache"

**원인**: 테이블이 생성되지 않았거나 Supabase 스키마 캐시 문제

**해결 방법**:

1. 테이블이 생성되었는지 확인
2. Supabase Dashboard에서 "Reload Schema" 실행
3. 또는 Supabase 재시작

### 에러: "permission denied for table saved_schedules"

**원인**: RLS 정책이 제대로 설정되지 않음

**해결 방법**:

1. RLS 정책이 모두 생성되었는지 확인
2. `auth.uid()` 함수가 정상 작동하는지 확인
3. 사용자가 로그인되어 있는지 확인

### 에러: "violates foreign key constraint"

**원인**: `user_id`가 `auth.users` 테이블에 존재하지 않음

**해결 방법**:

1. 사용자가 실제로 로그인되어 있는지 확인
2. `auth.users` 테이블에 해당 사용자가 존재하는지 확인

---

## 📚 관련 파일

- **마이그레이션 SQL**: `supabase_migration_create_saved_schedules.sql`
- **프론트엔드 API**: `lib/api/beautripApi.ts`
  - `saveSchedule()`: 일정 저장
  - `getSavedSchedules()`: 일정 목록 조회
  - `deleteSavedSchedule()`: 일정 삭제
- **프론트엔드 컴포넌트**: `components/MySchedulePage.tsx`

---

## 📞 문의

테이블 생성 중 문제가 발생하면 프론트엔드 개발자에게 문의하세요.
