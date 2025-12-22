# RPC 함수 언어 지원 요구사항

## 현재 문제점

1. **RPC 함수가 언어를 구분하지 않음**

   - `rpc_mid_category_rankings`: 모든 언어 데이터를 반환
   - `rpc_small_category_rankings`: 모든 언어 데이터를 반환
   - 프론트엔드에서 `lang` 컬럼으로 필터링하고 있지만, 비효율적

2. **데이터 구조**
   - 한국어: `treatment_master` 테이블만 사용
   - 다른 언어: `v_treatment_i18n` 뷰 사용 (`lang` 컬럼으로 구분)
     - 영어: `lang === 'en'`
     - 일본어: `lang === 'ja'`
     - 중국어: `lang === 'zh-CN'`

## 해결 방법

### 방법 1: RPC 함수에 `p_lang` 파라미터 추가 (추천 ⭐)

**장점**:

- 기존 구조 유지
- 효율적 (서버에서 필터링)
- 확장성 좋음 (새 언어 추가 시 파라미터만 추가)

**RPC 함수 수정 예시**:

```sql
-- 중분류 랭킹 함수
CREATE OR REPLACE FUNCTION rpc_mid_category_rankings(
  p_category_large TEXT DEFAULT NULL,
  p_m INTEGER DEFAULT 20,
  p_dedupe_limit_per_name INTEGER DEFAULT 2,
  p_limit_per_category INTEGER DEFAULT 20,
  p_lang TEXT DEFAULT NULL  -- 추가: 언어 파라미터
)
RETURNS TABLE (...) AS $$
BEGIN
  -- p_lang이 null이면 treatment_master 사용 (한국어)
  -- p_lang이 있으면 v_treatment_i18n에서 lang 필터 적용
  IF p_lang IS NULL THEN
    RETURN QUERY
    SELECT ...
    FROM treatment_master
    WHERE ...
    -- 기존 로직
  ELSE
    RETURN QUERY
    SELECT ...
    FROM v_treatment_i18n
    WHERE lang = p_lang
    -- 기존 로직
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**프론트엔드 호출**:

```typescript
// 한국어
const result = await client.rpc("rpc_mid_category_rankings", {
  p_category_large: category,
  p_lang: null, // 또는 파라미터 생략
});

// 영어
const result = await client.rpc("rpc_mid_category_rankings", {
  p_category_large: category,
  p_lang: "en",
});
```

### 방법 2: 언어별 테이블 생성 (비추천 ❌)

**단점**:

- 데이터 중복
- 유지보수 어려움
- 확장성 낮음 (새 언어 추가 시 새 테이블 필요)
- 불필요한 복잡성

## 권장 사항

**방법 1 (RPC 함수에 `p_lang` 파라미터 추가)을 강력히 추천합니다.**

이유:

1. ✅ 기존 `treatment_translation` 테이블과 `v_treatment_i18n` 뷰 구조 활용
2. ✅ 데이터 중복 없음
3. ✅ 유지보수 용이
4. ✅ 확장성 좋음
5. ✅ 서버에서 필터링하여 효율적

## 구현 완료 ✅

1. **백엔드 작업** (완료):

   - ✅ `rpc_mid_category_rankings` 함수에 `p_lang` 파라미터 추가 완료
   - ✅ `p_lang`이 null이면 `treatment_master` 사용 (한국어)
   - ✅ `p_lang`이 있으면 `v_treatment_i18n`에서 `lang = p_lang` 필터 적용

2. **프론트엔드 작업** (완료):
   - ✅ `getMidCategoryRankings` 함수에서 `p_lang` 파라미터 전달
   - ✅ 프론트엔드 임시 필터링 로직 제거
   - ✅ `getSmallCategoryRankings` 함수도 동일하게 수정

## 참고사항

- 한국어(`KR`): `p_lang = null` 또는 파라미터 생략
- 영어(`EN`): `p_lang = 'en'`
- 일본어(`JP`): `p_lang = 'ja'`
- 중국어(`CN`): `p_lang = 'zh-CN'`
