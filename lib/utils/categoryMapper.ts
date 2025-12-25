// 카테고리 번역값 → 한국어 원본값 매핑
// ⚠️ 중요: category_i18n 테이블을 우선 사용하되, 성능 향상을 위해 캐시로 하드코딩된 매핑을 사용합니다.
// 하드코딩된 매핑은 문서 기준으로 작성되었으며, category_i18n 테이블과 일치해야 합니다.

// 캐시: category_i18n 테이블 조회 결과를 메모리에 저장 (성능 향상)
const categoryCache = new Map<string, string>();

// 하드코딩된 매핑 (문서 기준, category_i18n 테이블과 일치해야 함)
// ⚠️ 주의: 이 매핑은 캐시로만 사용되며, category_i18n 테이블이 Single Source of Truth입니다.
const CATEGORY_MAP_CACHE: Record<string, string> = {
  // 한국어 (원본)
  눈성형: "눈성형",
  리프팅: "리프팅",
  보톡스: "보톡스",
  "안면윤곽/양악": "안면윤곽/양악",
  제모: "제모",
  지방성형: "지방성형",
  코성형: "코성형",
  피부: "피부",
  필러: "필러",
  가슴성형: "가슴성형",

  // 영어 (문서 기준: Eye surgery, Lifting, Botox, Facial contouring/maxillary surgery, waxing, liposuction, Rhinoplasty, skin, filler, breast augmentation)
  "Eye surgery": "눈성형",
  "eye surgery": "눈성형", // 대소문자 변형
  Lifting: "리프팅",
  lifting: "리프팅",
  Botox: "보톡스",
  botox: "보톡스",
  "Facial contouring/maxillary surgery": "안면윤곽/양악",
  "facial contouring/maxillary surgery": "안면윤곽/양악",
  waxing: "제모",
  Waxing: "제모",
  liposuction: "지방성형",
  Liposuction: "지방성형",
  Rhinoplasty: "코성형",
  rhinoplasty: "코성형",
  skin: "피부",
  Skin: "피부",
  filler: "필러",
  Filler: "필러",
  "breast augmentation": "가슴성형",
  "Breast augmentation": "가슴성형",

  // 일본어 (문서 기준: 目の整形, 持ち上がる, ボトックス, 顔面輪郭/ヤンアク, 脱毛, 脂肪成形, 鼻成形, 肌, フィラー, 胸の形成)
  目の整形: "눈성형",
  持ち上がる: "리프팅",
  ボトックス: "보톡스",
  "顔面輪郭/ヤンアク": "안면윤곽/양악",
  脱毛: "제모",
  脂肪成形: "지방성형",
  鼻成形: "코성형",
  肌: "피부",
  フィラー: "필러",
  胸の形成: "가슴성형",

  // 중국어 (문서 기준: 眼科手术, 举重, 肉毒杆菌, 面部轮廓整形/上颌手术, 打蜡, 抽脂术, 鼻整形术, 皮肤, 填料, 隆胸手术)
  眼科手术: "눈성형",
  举重: "리프팅",
  肉毒杆菌: "보톡스",
  "面部轮廓整形/上颌手术": "안면윤곽/양악",
  打蜡: "제모",
  抽脂术: "지방성형",
  鼻整形术: "코성형",
  皮肤: "피부",
  填料: "필러",
  隆胸手术: "가슴성형",
};

/**
 * category_i18n 테이블에서 카테고리를 한국어로 변환 (캐시 우선 사용)
 * @param translatedCategory 번역된 카테고리 값 (대분류, 중분류, 소분류 모두 지원)
 * @param currentLanguage 현재 언어 코드
 * @param categoryType 카테고리 타입: "large" | "mid" | "small"
 * @returns 한국어 원본 카테고리 값
 * @throws 에러: category_i18n 테이블에서 찾을 수 없을 때
 */
async function convertCategoryToKoreanFromDb(
  translatedCategory: string,
  currentLanguage: LanguageCode,
  categoryType: "large" | "mid" | "small" = "large"
): Promise<string> {
  if (!translatedCategory) {
    throw new Error("카테고리 값이 비어있습니다.");
  }

  const normalized = translatedCategory.trim();

  // 한국어는 변환 불필요
  if (currentLanguage === "KR") {
    // 한국어 카테고리인지 검증
    if (KOREAN_CATEGORIES.includes(normalized as any)) {
      return normalized;
    }
    throw new Error(
      `한국어 카테고리가 유효하지 않습니다: "${normalized}". 허용된 카테고리: ${KOREAN_CATEGORIES.join(
        ", "
      )}`
    );
  }

  // 캐시 키 생성
  const cacheKey = `${currentLanguage}:${categoryType}:${normalized}`;

  // 캐시에서 먼저 확인
  if (categoryCache.has(cacheKey)) {
    const cached = categoryCache.get(cacheKey)!;
    console.log(
      `[convertCategoryToKoreanFromDb] 캐시에서 변환: "${normalized}" → "${cached}"`
    );
    return cached;
  }

  // 하드코딩된 캐시에서 확인 (대분류만, 문서 기준)
  if (categoryType === "large") {
    const cachedMapping = CATEGORY_MAP_CACHE[normalized];
    if (cachedMapping) {
      // 캐시에 저장
      categoryCache.set(cacheKey, cachedMapping);
      console.log(
        `[convertCategoryToKoreanFromDb] 하드코딩 캐시에서 변환: "${normalized}" → "${cachedMapping}"`
      );
      return cachedMapping;
    }

    // 대소문자 구분 없이 시도
    const lowerKey = Object.keys(CATEGORY_MAP_CACHE).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (lowerKey) {
      const cachedMapping = CATEGORY_MAP_CACHE[lowerKey];
      categoryCache.set(cacheKey, cachedMapping);
      console.log(
        `[convertCategoryToKoreanFromDb] 하드코딩 캐시에서 변환 (대소문자 무시): "${normalized}" → "${cachedMapping}"`
      );
      return cachedMapping;
    }
  }

  // DB에서 조회
  try {
    // 동적 import로 supabase 클라이언트 가져오기
    const { getSupabaseOrNull } = await import("@/lib/api/beautripApi");
    const { TABLE_NAMES } = await import("@/lib/api/beautripApi");
    const client = getSupabaseOrNull();
    if (!client) {
      throw new Error("Supabase 클라이언트를 초기화할 수 없습니다.");
    }

    // 언어 코드 변환
    const langCode =
      currentLanguage === "EN"
        ? "en"
        : currentLanguage === "CN"
        ? "zh-CN"
        : currentLanguage === "JP"
        ? "ja"
        : null;

    if (!langCode) {
      throw new Error(`지원하지 않는 언어 코드입니다: ${currentLanguage}`);
    }

    const categoryField = `category_${categoryType}`;
    const categoryKrField = `category_${categoryType}_kr`;

    // category_i18n 테이블에서 조회
    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_I18N)
      .select(`${categoryKrField}, ${categoryField}`)
      .eq(categoryField, normalized)
      .eq("lang", langCode)
      .limit(1);

    if (error) {
      console.error(
        `[convertCategoryToKoreanFromDb] category_i18n 조회 실패:`,
        error
      );
      throw new Error(
        `category_i18n 테이블 조회 실패: ${error.message}. 카테고리: "${normalized}", 언어: ${langCode}, 타입: ${categoryType}`
      );
    }

    if (data && data.length > 0) {
      const row = data[0] as any;
      const koreanCategory = row[categoryKrField];
      if (koreanCategory) {
        // 캐시에 저장
        categoryCache.set(cacheKey, koreanCategory);
        console.log(
          `[convertCategoryToKoreanFromDb] DB에서 변환 성공: "${normalized}" (${langCode}) → "${koreanCategory}"`
        );
        return koreanCategory;
      }
    }

    // category_i18n 테이블에서 찾을 수 없음
    throw new Error(
      `category_i18n 테이블에서 카테고리를 찾을 수 없습니다: "${normalized}" (언어: ${langCode}, 타입: ${categoryType}). ` +
        `테이블에 해당 카테고리가 존재하는지 확인해주세요.`
    );
  } catch (error: any) {
    // 이미 에러 객체면 그대로 throw
    if (error instanceof Error && error.message.includes("category_i18n")) {
      throw error;
    }
    // 기타 에러는 래핑
    throw new Error(
      `카테고리 변환 중 에러 발생: ${error?.message || String(error)}`
    );
  }
}

/**
 * 번역된 카테고리 값을 한국어 원본값으로 변환
 * ⚠️ 중요: category_i18n 테이블만 사용합니다. 테이블에 없는 카테고리는 에러를 발생시킵니다.
 * @param translatedCategory 번역된 카테고리 값
 * @param currentLanguage 현재 언어 코드 (필수)
 * @param categoryType 카테고리 타입: "large" | "mid" | "small" (기본값: "large")
 * @returns 한국어 원본 카테고리 값
 * @throws 에러: category_i18n 테이블에서 찾을 수 없을 때
 */
export async function convertCategoryToKorean(
  translatedCategory: string,
  currentLanguage: LanguageCode,
  categoryType: "large" | "mid" | "small" = "large"
): Promise<string> {
  if (!translatedCategory) {
    return translatedCategory;
  }

  if (!currentLanguage) {
    throw new Error("언어 코드가 제공되지 않았습니다.");
  }

  // category_i18n 테이블에서만 조회 (하드코딩된 매핑 제거)
  return await convertCategoryToKoreanFromDb(
    translatedCategory.trim(),
    currentLanguage,
    categoryType
  );
}

// LanguageCode 타입 import
type LanguageCode = "KR" | "EN" | "JP" | "CN";

/**
 * 한국어 원본 카테고리 값 목록
 */
export const KOREAN_CATEGORIES = [
  "눈성형",
  "리프팅",
  "보톡스",
  "안면윤곽/양악",
  "제모",
  "지방성형",
  "코성형",
  "피부",
  "필러",
  "가슴성형",
] as const;

/**
 * 카테고리 값이 유효한지 확인 (CHECK 제약조건과 일치)
 */
export function isValidCategory(category: string): boolean {
  return KOREAN_CATEGORIES.includes(category as any);
}

/**
 * 한국어 카테고리를 현재 언어로 변환 (category_i18n 테이블 사용)
 * @param koreanCategory 한국어 카테고리 값
 * @param targetLanguage 목표 언어 코드
 * @param categoryType 카테고리 타입: "large" | "mid" | "small" (기본값: "large")
 * @returns 번역된 카테고리 값
 */
export async function convertCategoryFromKorean(
  koreanCategory: string,
  targetLanguage: LanguageCode,
  categoryType: "large" | "mid" | "small" = "large"
): Promise<string> {
  if (!koreanCategory) {
    return koreanCategory;
  }

  // 한국어는 변환 불필요
  if (targetLanguage === "KR") {
    return koreanCategory;
  }

  try {
    // 동적 import로 supabase 클라이언트 가져오기
    const { getSupabaseOrNull } = await import("@/lib/api/beautripApi");
    const { TABLE_NAMES } = await import("@/lib/api/beautripApi");
    const client = getSupabaseOrNull();
    if (!client) {
      return koreanCategory; // fallback
    }

    // 언어 코드 변환
    const langCode =
      targetLanguage === "EN"
        ? "en"
        : targetLanguage === "CN"
        ? "zh-CN"
        : targetLanguage === "JP"
        ? "ja"
        : null;

    if (!langCode) {
      return koreanCategory; // fallback
    }

    const normalized = koreanCategory.trim();
    const categoryKrField = `category_${categoryType}_kr`;
    const categoryField = `category_${categoryType}`;

    // category_i18n 테이블에서 조회
    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_I18N)
      .select(categoryField)
      .eq(categoryKrField, normalized)
      .eq("lang", langCode)
      .limit(1);

    if (error) {
      console.error(
        `[convertCategoryFromKorean] category_i18n 조회 실패:`,
        error
      );
      return koreanCategory; // fallback
    }

    if (data && data.length > 0) {
      const row = data[0] as any;
      const translatedCategory = row[categoryField];
      if (translatedCategory) {
        return translatedCategory;
      }
    }

    // 찾을 수 없으면 원본 반환
    return koreanCategory;
  } catch (error: any) {
    console.error(`[convertCategoryFromKorean] 카테고리 변환 중 에러:`, error);
    return koreanCategory; // fallback
  }
}
