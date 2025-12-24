# 회복 가이드 데이터 Supabase 마이그레이션 가이드

## 📋 개요

현재 프론트엔드에 하드코딩된 회복 가이드 데이터를 Supabase로 마이그레이션합니다.

**대상 파일:**

1. `lib/content/recoveryGuidePosts.ts` - 19개의 회복 가이드 포스트
2. `lib/content/recoveryGuideContent.ts` - 10개 그룹의 주차별 상세 정보 (다국어 지원)

---

## 📊 테이블 설계

### 1. `recovery_guide_posts` 테이블

회복 가이드 포스트 정보를 저장하는 테이블입니다.

#### 컬럼 구조

```sql
CREATE TABLE recovery_guide_posts (
  id TEXT PRIMARY KEY,                    -- 고유 ID (예: "jaw-contour-surgery")
  procedure_name TEXT NOT NULL,           -- 시술명 (예: "턱·윤곽·양악 수술")
  title TEXT NOT NULL,                    -- 표시 제목 (예: "턱·윤곽·양악 수술에 대한 회복 가이드🍀")
  description TEXT,                      -- 간단한 설명
  category TEXT NOT NULL DEFAULT '회복 가이드',  -- 항상 "회복 가이드"
  content TEXT NOT NULL,                 -- 마크다운 형식의 본문 내용
  read_time TEXT,                        -- 예상 읽기 시간 (예: "10분")
  views INTEGER DEFAULT 0,               -- 조회수
  thumbnail TEXT,                        -- 썸네일 이미지 URL
  keywords TEXT[],                       -- 키워드 배열 (예: ["턱", "윤곽", "양악"])
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_recovery_guide_posts_keywords ON recovery_guide_posts USING GIN(keywords);
CREATE INDEX idx_recovery_guide_posts_procedure_name ON recovery_guide_posts(procedure_name);
```

#### 데이터 예시

```json
{
  "id": "jaw-contour-surgery",
  "procedure_name": "턱·윤곽·양악 수술",
  "title": "턱·윤곽·양악 수술에 대한 회복 가이드🍀",
  "description": "턱·윤곽·양악 등 얼굴 뼈 구조가 크게 변하는 수술의 회복 과정을 안내합니다.",
  "category": "회복 가이드",
  "content": "## 턱·윤곽·양악 수술\n\n권장 회복 기간 : 4주 이상\n\n...",
  "read_time": "10분",
  "views": 0,
  "keywords": ["턱", "윤곽", "양악", "V라인", "사각턱", "턱끝", "하악", "상악"]
}
```

---

### 2. `recovery_guide_groups` 테이블

회복 가이드 그룹 정보를 저장하는 테이블입니다. (10개 그룹)

#### 컬럼 구조

```sql
CREATE TABLE recovery_guide_groups (
  group_key TEXT PRIMARY KEY,            -- 그룹 키 (예: "jaw", "breast", "body")
  title TEXT NOT NULL,                   -- 그룹 제목
  badge TEXT NOT NULL,                   -- 배지 텍스트
  summary TEXT NOT NULL,                 -- 요약 설명
  recommended TEXT,                      -- 권장 회복 기간 (예: "권장 회복 기간: 4주 이상")
  procedures TEXT,                       -- 해당 시술 목록
  summary_title TEXT,                    -- 요약 제목
  summary_body TEXT[],                   -- 요약 본문 배열
  closing_title TEXT,                    -- 마무리 제목
  closing_body TEXT[],                   -- 마무리 본문 배열
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 그룹 키 목록

- `jaw` - 턱·윤곽·양악 수술
- `breast` - 가슴 + 유두·유륜 + 여유증 + 부유방
- `body` - 바디 지방흡입 · 거상 · 재수술 + 힙업 · 골반지방이식
- `upperFace` - 광대 · 관자 · 이마 · 뒤통수 · 눈썹뼈 · 안면윤곽 재수술
- `nose` - 코끝 · 콧볼 · 복코 · 비공 라인 개선
- `eyeSurgery` - 눈 성형 · 트임 · 눈밑 지방 · 재수술
- `eyeVolume` - 눈 지방이식 · 눈물골 · 애교살 · 눈 주변 지방
- `faceFat` - 얼굴 지방이식 · 팔자 · 풀페이스 볼륨
- `lifting` - 안면거상 · 이마거상 · 팔자박리 · 주름 개선 수술
- `procedures` - 시술 (필러 · 보톡스 · 지방분해 · 리프팅 · 레이저)

---

### 3. `recovery_guide_weeks` 테이블

각 그룹의 주차별 상세 정보를 저장하는 테이블입니다.

#### 컬럼 구조

```sql
CREATE TABLE recovery_guide_weeks (
  id SERIAL PRIMARY KEY,
  group_key TEXT NOT NULL REFERENCES recovery_guide_groups(group_key) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,         -- 주차 번호 (1, 2, 3, 4)
  label TEXT NOT NULL,                   -- 라벨 (예: "🕐 1주차 (Day 0–7)")
  subtitle TEXT NOT NULL,                -- 부제목
  description TEXT[] NOT NULL,           -- 설명 배열
  tips TEXT[] NOT NULL,                  -- 팁 배열
  cautions TEXT[] NOT NULL,              -- 주의사항 배열
  quote TEXT,                           -- 인용구 (선택)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_key, week_number)
);

-- 인덱스
CREATE INDEX idx_recovery_guide_weeks_group_key ON recovery_guide_weeks(group_key);
```

---

### 4. `recovery_guide_translations` 테이블

다국어 지원을 위한 번역 테이블입니다.

#### 컬럼 구조

```sql
CREATE TABLE recovery_guide_translations (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,              -- 원본 테이블명 ("recovery_guide_posts" 또는 "recovery_guide_groups")
  record_id TEXT NOT NULL,               -- 원본 레코드 ID (posts의 id 또는 groups의 group_key)
  language_code TEXT NOT NULL,           -- 언어 코드 ("KR", "EN", "JP", "CN")
  field_name TEXT NOT NULL,              -- 필드명 (예: "title", "description", "content")
  translated_value TEXT NOT NULL,        -- 번역된 값
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_name, record_id, language_code, field_name)
);

-- 인덱스
CREATE INDEX idx_recovery_guide_translations_lookup ON recovery_guide_translations(table_name, record_id, language_code);
```

**참고:** 다국어 지원이 복잡할 수 있으므로, 초기에는 `recovery_guide_groups`와 `recovery_guide_weeks`에 `language_code` 컬럼을 추가하는 방식도 고려할 수 있습니다.

---

## 🔄 대안 설계 (더 간단한 방법)

다국어 지원을 단순화하기 위해 각 테이블에 `language_code` 컬럼을 추가하는 방법:

### `recovery_guide_groups` (수정)

```sql
CREATE TABLE recovery_guide_groups (
  id SERIAL PRIMARY KEY,
  group_key TEXT NOT NULL,              -- 그룹 키 (예: "jaw")
  language_code TEXT NOT NULL DEFAULT 'KR',  -- 언어 코드 ("KR", "EN", "JP", "CN")
  title TEXT NOT NULL,
  badge TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommended TEXT,
  procedures TEXT,
  summary_title TEXT,
  summary_body TEXT[],
  closing_title TEXT,
  closing_body TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_key, language_code)
);
```

### `recovery_guide_weeks` (수정)

```sql
CREATE TABLE recovery_guide_weeks (
  id SERIAL PRIMARY KEY,
  group_key TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'KR',
  week_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT[] NOT NULL,
  tips TEXT[] NOT NULL,
  cautions TEXT[] NOT NULL,
  quote TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_key, language_code, week_number)
);
```

---

## 📝 데이터 마이그레이션 SQL 예시

### 1. recovery_guide_posts 데이터 삽입

```sql
INSERT INTO recovery_guide_posts (
  id, procedure_name, title, description, category, content, read_time, views, keywords
) VALUES (
  'jaw-contour-surgery',
  '턱·윤곽·양악 수술',
  '턱·윤곽·양악 수술에 대한 회복 가이드🍀',
  '턱·윤곽·양악 등 얼굴 뼈 구조가 크게 변하는 수술의 회복 과정을 안내합니다.',
  '회복 가이드',
  '## 턱·윤곽·양악 수술

권장 회복 기간 : 4주 이상

(해당 시술: V라인축소술, 사각턱수술, 턱끝수술, 턱끝축소술, 피질절골술, 교근축소술, 비절개턱성형, 이중턱근육묶기, 하악수술, 상악수술, 양악수술, 턱끝보형물삽입, 턱끝보형물제거, 턱끝이물질제거)

## 🕐 1주차 (Day 0–7)
...',
  '10분',
  0,
  ARRAY['턱', '윤곽', '양악', 'V라인', '사각턱', '턱끝', '하악', '상악']
);
```

### 2. recovery_guide_groups 데이터 삽입

```sql
-- 한국어 버전
INSERT INTO recovery_guide_groups (
  group_key, language_code, title, badge, summary, recommended, procedures, summary_title, summary_body, closing_title, closing_body
) VALUES (
  'jaw',
  'KR',
  '턱·윤곽·양악 수술',
  '뼈 수술',
  '턱·윤곽·양악 등 얼굴 뼈 구조가 크게 변하는 수술군',
  '권장 회복 기간: 4주 이상',
  'V라인축소술, 사각턱수술, 턱끝수술, 턱끝축소, 피질절골, 교근축소술, 비절개턱성형, 이중턱근육묶기, 하악수술, 상악수술, 양악수술, 턱끝보형물, 턱끝보형물제거, 턱끝이물질제거',
  '이 그룹의 핵심 정리',
  ARRAY['턱·윤곽·양악 수술의 회복은 속도가 아니라 순서입니다.', '지금 주차에 맞는 관리만 꾸준히 해주고 있다면, 결과는 대부분 그 다음에 자연스럽게 따라옵니다.'],
  '의사·간호사 공통 안내',
  ARRAY['턱·윤곽·양악 수술의 회복은 속도가 아니라 순서입니다.', '지금 주차에 맞는 관리만 꾸준히 해주고 있다면, 결과는 대부분 그 다음에 자연스럽게 따라옵니다.']
);
```

### 3. recovery_guide_weeks 데이터 삽입

```sql
INSERT INTO recovery_guide_weeks (
  group_key, language_code, week_number, label, subtitle, description, tips, cautions, quote
) VALUES (
  'jaw',
  'KR',
  1,
  '🕐 1주차 (Day 0–7)',
  '몸이 ''수술을 인지하고 가장 강하게 반응하는 시기''',
  ARRAY[
    '수술 부위와 주변 조직이 ''얼굴 구조에 큰 변화가 생겼다''는 사실을 인지하며 붓기, 멍, 당김, 압박감을 가장 강하게 만들어내는 단계입니다.',
    '뼈의 위치가 바뀌고, 그 위를 덮고 있던 근육·피부·신경이 아직 새로운 위치에 적응하지 못해 얼굴은 실제 결과보다 더 부어 있고, 더 넓고, 더 둔탁해 보이는 것이 정상입니다.'
  ],
  ARRAY[
    '가능한 한 일정은 최소화하고, 회복을 최우선으로 두기',
    '수면 시 머리를 살짝 높여 붓기 압력 줄이기',
    '하루 여러 번, 방 안이나 복도에서 3–5분 정도 짧게 걷기 (혈액순환과 붓기 관리에 도움이 됩니다)'
  ],
  ARRAY[
    '거울을 자주 보며 결과를 평가하지 않기',
    '무리한 외출, 장시간 이동 피하기',
    '통증·붓기가 있다고 해서 ''문제가 생겼다''고 단정하지 않기'
  ],
  '이 시기의 목표는 ''얼굴이 예뻐 보이게 만드는 것''이 아니라 ''붓기를 키우지 않고, 몸이 회복을 시작하도록 돕는 것''입니다.'
);
```

---

## 🔍 주요 쿼리 예시

### 1. ID로 회복 가이드 포스트 조회

```sql
SELECT * FROM recovery_guide_posts WHERE id = 'jaw-contour-surgery';
```

### 2. 키워드로 회복 가이드 포스트 검색

```sql
-- 키워드 배열에 특정 키워드가 포함된 포스트 검색
SELECT * FROM recovery_guide_posts
WHERE '턱' = ANY(keywords)
   OR '윤곽' = ANY(keywords);
```

### 3. 그룹별 주차 정보 조회 (다국어)

```sql
-- 한국어 버전
SELECT
  g.*,
  json_agg(
    json_build_object(
      'week_number', w.week_number,
      'label', w.label,
      'subtitle', w.subtitle,
      'description', w.description,
      'tips', w.tips,
      'cautions', w.cautions,
      'quote', w.quote
    ) ORDER BY w.week_number
  ) as weeks
FROM recovery_guide_groups g
LEFT JOIN recovery_guide_weeks w ON g.group_key = w.group_key AND g.language_code = w.language_code
WHERE g.group_key = 'jaw' AND g.language_code = 'KR'
GROUP BY g.id;
```

### 4. 모든 그룹 조회 (다국어)

```sql
SELECT * FROM recovery_guide_groups WHERE language_code = 'KR' ORDER BY group_key;
```

### 5. 시술명으로 회복 가이드 포스트 검색

```sql
-- procedure_name에 특정 키워드가 포함된 포스트 검색
SELECT * FROM recovery_guide_posts
WHERE procedure_name ILIKE '%턱%'
   OR procedure_name ILIKE '%윤곽%';
```

---

## 🎯 프론트엔드에서 사용할 API 함수 구조

백엔드 개발자가 제공해야 할 API 함수들:

### 1. `getRecoveryGuidePostById(id: string)`

- ID로 회복 가이드 포스트 조회
- 반환: `RecoveryGuidePost | null`

### 2. `getRecoveryGuidePostByKeyword(keyword: string)`

- 키워드로 회복 가이드 포스트 검색
- 반환: `RecoveryGuidePost | null`

### 3. `getAllRecoveryGuidePosts()`

- 모든 회복 가이드 포스트 조회
- 반환: `RecoveryGuidePost[]`

### 4. `getRecoveryGuideGroup(groupKey: string, languageCode: string = 'KR')`

- 그룹 키와 언어 코드로 그룹 정보 조회 (주차 정보 포함)
- 반환: `RecoveryGroupContent | null`

### 5. `getAllRecoveryGuideGroups(languageCode: string = 'KR')`

- 모든 그룹 조회 (주차 정보 포함)
- 반환: `Record<RecoveryGroupKey, RecoveryGroupContent>`

---

## 📌 주의사항

1. **다국어 지원**: 현재 코드는 `KR`, `EN`, `JP`, `CN` 4개 언어를 지원합니다. 테이블 설계 시 이를 고려해야 합니다.

2. **키워드 검색**: `recoveryGuidePosts.ts`의 `findRecoveryGuideByKeyword` 함수는 키워드 배열을 사용하여 매칭합니다. Supabase에서도 유사한 로직을 구현해야 합니다.

3. **데이터 타입**:

   - `keywords`는 배열 타입 (`TEXT[]`)
   - `description`, `tips`, `cautions`, `summary_body`, `closing_body`도 배열 타입 (`TEXT[]`)

4. **마크다운 콘텐츠**: `content` 필드는 마크다운 형식의 긴 텍스트입니다. `TEXT` 타입을 사용하세요.

5. **인덱싱**: 키워드 검색 성능을 위해 `keywords` 컬럼에 GIN 인덱스를 생성하는 것을 권장합니다.

---

## 🚀 마이그레이션 체크리스트

- [ ] `recovery_guide_posts` 테이블 생성
- [ ] `recovery_guide_groups` 테이블 생성
- [ ] `recovery_guide_weeks` 테이블 생성
- [ ] 다국어 지원 테이블/컬럼 추가
- [ ] 인덱스 생성
- [ ] 기존 데이터 마이그레이션 (19개 포스트, 10개 그룹 × 4주차 × 4개 언어)
- [ ] API 엔드포인트 구현
- [ ] 프론트엔드 코드 수정 (하드코딩된 데이터 제거, API 호출로 변경)

---

## 📞 문의사항

마이그레이션 중 문제가 발생하면 프론트엔드 개발자에게 문의하세요.

