# v_treatment_i18n 뷰 에러 해결 가이드

## 🔴 주요 문제점

### 1. 한국어일 때 v_treatment_i18n 사용 시 에러

- 한국어(KR)일 때는 `treatment_master` 테이블을 사용해야 함
- `v_treatment_i18n` 뷰에는 `lang` 컬럼이 있지만, 한국어 데이터는 `treatment_master`에만 있음
- 실수로 `v_treatment_i18n`을 사용하면 데이터를 찾을 수 없음

### 2. lang 필터 누락 시 에러

- `v_treatment_i18n`을 사용할 때는 반드시 `lang` 필터를 적용해야 함
- `lang` 필터가 없으면 모든 언어 버전이 반환되어 중복 데이터 발생

### 3. 뷰에 데이터가 없을 때 에러

- 번역 데이터가 없는 경우 빈 결과 반환
- 에러 처리 없이 `.single()` 사용 시 에러 발생

### 4. 컬럼명 불일치

- `v_treatment_i18n` 뷰의 컬럼명이 `treatment_master`와 다를 수 있음
- 예: `main_img_url` vs `main_image_url`

## ✅ 해결 방법

### 1. getTreatmentTableName 함수 확인

```typescript
export function getTreatmentTableName(language?: LanguageCode): string {
  let lang: LanguageCode = language || "KR";

  // localStorage에서 언어 가져오기
  if (typeof window !== "undefined" && !language) {
    const saved = localStorage.getItem("language") as LanguageCode;
    if (
      saved &&
      (saved === "KR" || saved === "EN" || saved === "JP" || saved === "CN")
    ) {
      lang = saved;
    }
  }

  // ✅ 한국어일 때는 treatment_master, 다른 언어일 때는 v_treatment_i18n
  if (lang === "KR") {
    return TABLE_NAMES.TREATMENT_MASTER;
  }
  return TABLE_NAMES.TREATMENT_I18N_VIEW;
}
```

### 2. lang 필터 적용 확인

```typescript
const treatmentTable = getTreatmentTableName(language);
const dbLang = getCurrentLanguageForDb(language);
let query = client.from(treatmentTable).select("*");

// ✅ lang 필터 추가 (한국어가 아닌 경우만)
// ⚠️ 중요: v_treatment_i18n에만 lang 컬럼이 있음
if (dbLang) {
  query = query.eq("lang", dbLang);
}
```

### 3. 에러 처리 개선

```typescript
// ❌ 잘못된 방법
const { data, error } = await query.single();
if (error) {
  throw new Error(`Supabase 오류: ${error.message}`);
}

// ✅ 올바른 방법
const { data, error } = await query.maybeSingle(); // .single() 대신 .maybeSingle() 사용

if (error) {
  console.error("데이터 로드 실패:", error);
  // 한국어일 때는 treatment_master로 fallback
  if (language && language !== "KR") {
    console.warn("번역 데이터가 없어 한국어 원본으로 fallback");
    return await loadTreatmentById(treatmentId, "KR");
  }
  return null;
}

if (!data) {
  // 데이터가 없을 때 한국어로 fallback
  if (language && language !== "KR") {
    console.warn("번역 데이터가 없어 한국어 원본으로 fallback");
    return await loadTreatmentById(treatmentId, "KR");
  }
  return null;
}
```

### 4. 컬럼명 매핑

```typescript
// v_treatment_i18n 뷰의 컬럼명이 다를 수 있으므로 매핑 필요
function mapTreatmentData(data: any): Treatment {
  return {
    ...data,
    main_image_url: data.main_image_url || data.main_img_url,
    // 기타 컬럼명 매핑
  };
}
```

## 🔧 수정이 필요한 함수들

### 1. loadTreatmentById

- ✅ `getTreatmentTableName` 사용 확인
- ✅ `lang` 필터 적용 확인
- ⚠️ 에러 처리 개선 필요

### 2. loadTreatmentsPaginated

- ✅ `getTreatmentTableName` 사용 확인
- ✅ `lang` 필터 적용 확인
- ✅ 에러 처리 확인

### 3. getCategoryLargeList

- ✅ `getTreatmentTableName` 사용 확인
- ✅ `lang` 필터 적용 확인
- ✅ 에러 처리 확인

### 4. getMidCategoryRankings (RPC 사용)

- ✅ RPC 함수에서 `p_lang` 파라미터 전달 확인
- ⚠️ RPC 함수 내부에서 뷰 사용 시 에러 처리 확인

## 🚨 자주 발생하는 에러

### 에러 1: "relation v_treatment_i18n does not exist"

**원인:** 뷰가 생성되지 않음
**해결:** Supabase에서 뷰 생성 확인

### 에러 2: "column lang does not exist"

**원인:** `treatment_master`에 `lang` 필터 적용 시도
**해결:** 한국어일 때는 `lang` 필터 적용하지 않음

### 에러 3: "no rows returned"

**원인:** 번역 데이터가 없음
**해결:** `.maybeSingle()` 사용 및 한국어로 fallback

### 에러 4: "multiple rows returned"

**원인:** `lang` 필터 없이 `v_treatment_i18n` 조회
**해결:** 반드시 `lang` 필터 적용

## 📝 체크리스트

- [ ] `getTreatmentTableName` 함수가 올바르게 동작하는지 확인
- [ ] 한국어일 때 `treatment_master` 사용하는지 확인
- [ ] 다른 언어일 때 `v_treatment_i18n` 사용하는지 확인
- [ ] `lang` 필터가 올바르게 적용되는지 확인
- [ ] 에러 처리가 개선되었는지 확인
- [ ] 한국어로 fallback 로직이 있는지 확인
- [ ] 컬럼명 매핑이 필요한지 확인
