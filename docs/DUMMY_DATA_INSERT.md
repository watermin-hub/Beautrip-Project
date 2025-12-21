# 더미데이터 삽입 가이드

이 문서는 Supabase에 더미데이터를 삽입하는 방법을 설명합니다.

## 📋 준비사항

1. Supabase 프로젝트가 설정되어 있어야 합니다.
2. 다음 테이블이 생성되어 있어야 합니다:
   - `procedure_reviews` (시술후기)
   - `hospital_reviews` (병원후기)
   - `concern_posts` (고민글)

## 🚀 삽입 방법

### 방법 1: npm 스크립트 사용 (권장)

가장 간단한 방법입니다:

```bash
npm run insert-dummy
```

### 방법 2: 직접 실행

```bash
node scripts/insertDummyData.js
```

## 📝 삽입되는 데이터

- **시술후기**: 29개
- **병원후기**: 17개
- **고민글**: 19개

## ⚠️ 주의사항

1. **중복 삽입 방지**: 스크립트를 여러 번 실행하면 중복 데이터가 삽입될 수 있습니다.
2. **RLS 정책**: Supabase의 Row Level Security (RLS) 정책이 활성화되어 있다면, 적절한 권한이 필요할 수 있습니다.
3. **환경 변수**: `.env.local` 파일에 Supabase URL과 키가 설정되어 있으면 자동으로 사용됩니다.

## 🔧 문제 해결

### 에러: "permission denied"

RLS 정책 때문에 삽입이 실패하는 경우:

1. Supabase 대시보드 > Authentication > Policies
2. 개발 단계에서는 임시로 모든 사용자에게 읽기/쓰기 권한 부여

또는 SQL Editor에서 다음 명령 실행:

```sql
-- 개발용: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations for procedure_reviews"
  ON public.procedure_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for hospital_reviews"
  ON public.hospital_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for concern_posts"
  ON public.concern_posts
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 에러: "relation does not exist"

테이블이 생성되지 않은 경우:

1. `docs/SUPABASE_TABLES.md` 파일 참고
2. Supabase SQL Editor에서 테이블 생성 쿼리 실행

## 📊 데이터 확인

삽입 후 Supabase 대시보드에서 데이터를 확인할 수 있습니다:

1. Supabase 대시보드 접속
2. Table Editor 메뉴 클릭
3. 각 테이블(`procedure_reviews`, `hospital_reviews`, `concern_posts`) 확인

## 🗑️ 데이터 삭제

더미데이터를 삭제하려면 Supabase SQL Editor에서:

```sql
-- 모든 더미데이터 삭제 (주의!)
DELETE FROM procedure_reviews;
DELETE FROM hospital_reviews;
DELETE FROM concern_posts;
```

또는 특정 조건으로 삭제:

```sql
-- user_id가 1000 이상인 데이터만 삭제 (더미데이터)
DELETE FROM procedure_reviews WHERE user_id >= 1000;
DELETE FROM hospital_reviews WHERE user_id >= 2000;
DELETE FROM concern_posts WHERE user_id >= 3000;
```
