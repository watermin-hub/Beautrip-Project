# 다국어 데이터베이스 구조 최적화 가이드

## 📋 개요

이 문서는 BeauTrip 프로젝트에서 16,000개의 시술 데이터와 7,000개의 병원 데이터를 효율적으로 다국어(en, jp, cn)로 번역하고 관리하는 방법을 설명합니다.

## ✅ 현재 구조 (이미 올바르게 구현됨)

현재 데이터베이스 구조는 **이미 최적화된 구조**입니다:

### 1. 시술 데이터 구조

```
treatment_master (한국어 원본)
├── treatment_id (PK)
├── treatment_name (한국어)
├── hospital_name (한국어)
├── category_large (한국어)
├── category_mid (한국어)
├── category_small (한국어)
└── ... (기타 필드)

treatment_translation (번역 데이터)
├── treatment_id (FK → treatment_master.treatment_id)
├── lang (언어 코드: 'en', 'ja', 'zh-CN')
├── treatment_name (번역된 시술명)
├── hospital_name (번역된 병원명)
├── category_large (번역된 대분류)
├── category_mid (번역된 중분류)
├── category_small (번역된 소분류)
└── ... (기타 번역 필드)

v_treatment_i18n (통합 뷰)
├── treatment_master와 treatment_translation을 LEFT JOIN
├── lang 컬럼으로 언어 구분
└── 번역이 없으면 한국어 원본으로 fallback
```

### 2. 병원 데이터 구조

```
hospital_master (한국어 원본)
├── hospital_id_rd (PK)
├── hospital_name (한국어)
├── hospital_address (한국어)
├── hospital_intro (한국어)
└── ... (기타 필드)

hospital_translation (번역 데이터)
├── hospital_id_rd (FK → hospital_master.hospital_id_rd)
├── lang (언어 코드: 'en', 'ja', 'zh-CN')
├── hospital_name (번역된 병원명)
├── hospital_address (번역된 주소)
├── hospital_intro (번역된 소개)
└── ... (기타 번역 필드)

v_hospital_i18n (통합 뷰)
├── hospital_master와 hospital_translation을 LEFT JOIN
├── lang 컬럼으로 언어 구분
└── 번역이 없으면 한국어 원본으로 fallback
```

## 🎯 핵심 설계 원칙

### 1. **FK + Language 컬럼 구조** ✅

사용자가 생각한 구조가 정확합니다:
- `treatment_id` (FK) + `lang` 컬럼으로 구분
- `hospital_id_rd` (FK) + `lang` 컬럼으로 구분

이 구조의 장점:
- ✅ 같은 ID로 여러 언어 버전 관리
- ✅ 번역이 없는 경우 원본(한국어)으로 fallback 가능
- ✅ 새로운 언어 추가 시 기존 구조 변경 불필요
- ✅ 인덱스 최적화 용이 (`treatment_id + lang` 복합 인덱스)

### 2. **뷰(View)를 통한 통합 접근**

`v_treatment_i18n`과 `v_hospital_i18n` 뷰를 사용하면:
- 프론트엔드에서 단일 테이블처럼 조회 가능
- 번역이 없으면 자동으로 한국어 원본 반환
- 쿼리 로직 단순화

## 📊 데이터 입력 방법

### 1. 시술 데이터 번역 입력

```sql
-- 예시: treatment_id = 1인 시술을 영어로 번역
INSERT INTO treatment_translation (
  treatment_id,
  lang,
  treatment_name,
  hospital_name,
  category_large,
  category_mid,
  category_small
) VALUES (
  1,
  'en',
  'Double Eyelid Surgery',
  'Gangnam Unni Clinic',
  'Eye Surgery',
  'Double Eyelid',
  'Incisional Double Eyelid'
);
```

### 2. 병원 데이터 번역 입력

```sql
-- 예시: hospital_id_rd = 100인 병원을 일본어로 번역
INSERT INTO hospital_translation (
  hospital_id_rd,
  lang,
  hospital_name,
  hospital_address,
  hospital_intro
) VALUES (
  100,
  'ja',
  '江南ウニクリニック',
  'ソウル特別市江南区',
  '江南ウニクリニックは...'
);
```

## 🔍 프론트엔드에서 사용하는 방법

### 1. API 호출 시 언어 파라미터 전달

```typescript
// ✅ 올바른 방법
const treatments = await getMidCategoryRankings(
  selectedCategory,
  20,
  2,
  20,
  language // 'KR' | 'EN' | 'JP' | 'CN'
);
```

### 2. 언어 변경 시 자동 재로드

```typescript
// ✅ useEffect dependency에 language 추가
useEffect(() => {
  loadRankings();
}, [selectedCategory, selectedMidCategory, language]); // language 추가
```

## ⚡ 성능 최적화

### 1. 인덱스 생성

```sql
-- treatment_translation 테이블 인덱스
CREATE INDEX idx_treatment_translation_lookup 
ON treatment_translation(treatment_id, lang);

-- hospital_translation 테이블 인덱스
CREATE INDEX idx_hospital_translation_lookup 
ON hospital_translation(hospital_id_rd, lang);
```

### 2. 뷰 최적화

`v_treatment_i18n`과 `v_hospital_i18n` 뷰는 이미 최적화되어 있습니다:
- LEFT JOIN으로 번역이 없어도 원본 반환
- `lang` 필터로 필요한 언어만 조회

### 3. 캐싱 전략

- 프론트엔드에서 언어별로 데이터 캐싱 가능
- 언어 변경 시에만 새로운 데이터 로드
- 같은 언어로 다시 변경 시 캐시 사용

## 🚀 언어 토글 시 자동 변경 구현

### 1. LanguageContext에서 언어 변경 이벤트 발생

```typescript
// contexts/LanguageContext.tsx
useEffect(() => {
  if (isMounted && typeof window !== "undefined") {
    localStorage.setItem("language", language);
    // 언어 변경 이벤트 발생
    window.dispatchEvent(
      new CustomEvent("languageChanged", { detail: language })
    );
  }
}, [language, isMounted]);
```

### 2. 컴포넌트에서 언어 변경 감지

```typescript
// ✅ CategoryRankingPage.tsx
const { t, language } = useLanguage();

useEffect(() => {
  const loadRankings = async () => {
    const result = await getMidCategoryRankings(
      selectedCategory,
      20,
      2,
      20,
      language // 언어 파라미터 전달
    );
    // ... 데이터 처리
  };
  loadRankings();
}, [selectedCategory, selectedMidCategory, language]); // language dependency 추가
```

## 📝 데이터 마이그레이션 가이드

### 1. 기존 데이터 번역 입력

```sql
-- 1. treatment_translation 테이블에 번역 데이터 입력
-- (CSV 파일 또는 배치 스크립트 사용)

-- 2. hospital_translation 테이블에 번역 데이터 입력
-- (CSV 파일 또는 배치 스크립트 사용)

-- 3. 뷰가 자동으로 JOIN하므로 별도 작업 불필요
```

### 2. 번역 데이터 검증

```sql
-- 번역이 완료된 시술 개수 확인
SELECT lang, COUNT(*) 
FROM treatment_translation 
GROUP BY lang;

-- 번역이 완료된 병원 개수 확인
SELECT lang, COUNT(*) 
FROM hospital_translation 
GROUP BY lang;
```

## ⚠️ 주의사항

### 1. 카테고리 필드 처리

- `category_mid`는 **로직/그룹핑용**으로 한국어 원본을 사용해야 함
- UI 표시용으로만 번역된 값 사용
- `category_mid_key` (한국어)와 `category_mid` (번역) 구분

### 2. NULL 처리

- 번역이 없는 경우 한국어 원본으로 fallback
- 뷰에서 자동 처리되므로 프론트엔드에서 별도 처리 불필요

### 3. 데이터 일관성

- 같은 `treatment_id`에 대해 모든 언어의 번역이 동일한 구조 유지
- 필수 필드(treatment_name, hospital_name 등)는 모든 언어에 번역 필요

## 🎉 결론

현재 데이터베이스 구조는 **이미 최적화된 구조**입니다:
- ✅ FK + Language 컬럼 구조 (사용자가 생각한 구조와 동일)
- ✅ 뷰를 통한 통합 접근
- ✅ 번역이 없으면 자동 fallback
- ✅ 새로운 언어 추가 용이

**추가 작업 필요 사항:**
1. ✅ 프론트엔드 컴포넌트에서 `language` dependency 추가 (완료)
2. ✅ API 호출 시 `language` 파라미터 전달 (완료)
3. 📝 번역 데이터 입력 (16,000개 시술 + 7,000개 병원)

번역 데이터만 입력하면 언어 토글 시 자동으로 변경됩니다!

