# 저장된 일정 테이블 (saved_schedules)

## 📋 개요

사용자가 저장한 일정 정보를 관리하는 테이블입니다.

## 📊 테이블 구조

### 컬럼 정의

| 컬럼명            | 타입          | 제약조건                                | 설명                                |
| ----------------- | ------------- | --------------------------------------- | ----------------------------------- |
| `id`              | `uuid`        | PRIMARY KEY, DEFAULT uuid_generate_v4() | 고유 ID                             |
| `user_id`         | `uuid`        | NOT NULL, REFERENCES auth.users(id)     | 사용자 ID (Supabase Auth의 UUID)    |
| `schedule_period` | `text`        | NOT NULL                                | 일정 기간 (예: "25.12.14~25.12.20") |
| `treatment_ids`   | `integer[]`   | NOT NULL, DEFAULT '{}'                  | 시술 ID 배열                        |
| `created_at`      | `timestamptz` | NOT NULL, DEFAULT now()                 | 생성일시                            |
| `updated_at`      | `timestamptz` | NOT NULL, DEFAULT now()                 | 수정일시                            |

## 🔧 SQL 생성 쿼리

```sql
-- saved_schedules 테이블 생성
CREATE TABLE saved_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_period TEXT NOT NULL,
  treatment_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_saved_schedules_user_id ON saved_schedules(user_id);
CREATE INDEX idx_saved_schedules_created_at ON saved_schedules(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_saved_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_schedules_updated_at
  BEFORE UPDATE ON saved_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_schedules_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE saved_schedules ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일정만 조회 가능
CREATE POLICY "Users can view their own saved schedules"
  ON saved_schedules
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 일정만 생성 가능
CREATE POLICY "Users can insert their own saved schedules"
  ON saved_schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 일정만 수정 가능
CREATE POLICY "Users can update their own saved schedules"
  ON saved_schedules
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 일정만 삭제 가능
CREATE POLICY "Users can delete their own saved schedules"
  ON saved_schedules
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 📝 사용 예시

### 일정 저장

```typescript
import { saveSchedule } from "@/lib/api/beautripApi";

const result = await saveSchedule("25.12.14~25.12.20", [1, 2, 3]);
if (result.success) {
  console.log("일정이 저장되었습니다:", result.data);
}
```

### 저장된 일정 목록 조회

```typescript
import { getSavedSchedules } from "@/lib/api/beautripApi";

const result = await getSavedSchedules();
if (result.success && result.schedules) {
  console.log("저장된 일정:", result.schedules);
}
```

### 저장된 일정 삭제

```typescript
import { deleteSavedSchedule } from "@/lib/api/beautripApi";

const result = await deleteSavedSchedule(scheduleId);
if (result.success) {
  console.log("일정이 삭제되었습니다.");
}
```

## 🔒 보안 고려사항

1. **RLS (Row Level Security)**: 모든 사용자는 자신의 일정만 조회/수정/삭제할 수 있습니다.
2. **CASCADE 삭제**: 사용자가 삭제되면 해당 사용자의 모든 저장된 일정도 자동으로 삭제됩니다.
3. **인증 필수**: 모든 API 함수는 로그인한 사용자만 사용할 수 있습니다.

## 📌 참고사항

- `treatment_ids`는 배열 타입이므로 PostgreSQL의 배열 연산자를 사용할 수 있습니다.
- `schedule_period`는 사용자에게 표시되는 형식으로 저장됩니다 (예: "25.12.14~25.12.20").
- 향후 일정 이름, 메모 등의 추가 필드를 확장할 수 있습니다.
