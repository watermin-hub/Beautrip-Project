// 카테고리 번역값 → 한국어 원본값 매핑
// CHECK 제약조건에 한국어 원본값만 허용되므로 변환이 필요

export const CATEGORY_MAP: Record<string, string> = {
  // 한국어 (원본)
  "눈성형": "눈성형",
  "리프팅": "리프팅",
  "보톡스": "보톡스",
  "안면윤곽/양악": "안면윤곽/양악",
  "제모": "제모",
  "지방성형": "지방성형",
  "코성형": "코성형",
  "피부": "피부",
  "필러": "필러",
  "가슴성형": "가슴성형",

  // 영어 (다양한 대소문자 변형 포함)
  "Eye Surgery": "눈성형",
  "Eye surgery": "눈성형",
  "eye surgery": "눈성형",
  "Lifting": "리프팅",
  "lifting": "리프팅",
  "Botox": "보톡스",
  "botox": "보톡스",
  "Facial Contour / Orthognathic": "안면윤곽/양악",
  "Facial contour / orthognathic": "안면윤곽/양악",
  "facial contour / orthognathic": "안면윤곽/양악",
  "Hair Removal": "제모",
  "Hair removal": "제모",
  "hair removal": "제모",
  "Liposuction": "지방성형",
  "liposuction": "지방성형",
  "Nose Surgery": "코성형",
  "Nose surgery": "코성형",
  "nose surgery": "코성형",
  "Skin": "피부",
  "skin": "피부",
  "Filler": "필러",
  "filler": "필러",
  "Breast Surgery": "가슴성형",
  "Breast surgery": "가슴성형",
  "breast surgery": "가슴성형",

  // 일본어
  "目の整形": "눈성형",
  "リフティング": "리프팅",
  "ボトックス": "보톡스",
  "顔面輪郭/顎": "안면윤곽/양악",
  "脱毛": "제모",
  "脂肪吸引": "지방성형",
  "鼻整形": "코성형",
  "肌": "피부",
  "フィラー": "필러",
  "胸の整形": "가슴성형",

  // 중국어
  "眼部整形": "눈성형",
  "提升": "리프팅",
  "肉毒素": "보톡스",
  "面部轮廓/正颌": "안면윤곽/양악",
  // "脱毛"은 일본어와 동일하므로 중복 제거 (일본어 키 사용)
  "吸脂": "지방성형",
  "鼻部整形": "코성형",
  "皮肤": "피부",
  "填充": "필러",
  "胸部整形": "가슴성형",
};

/**
 * 번역된 카테고리 값을 한국어 원본값으로 변환
 * @param translatedCategory 번역된 카테고리 값
 * @returns 한국어 원본 카테고리 값 (없으면 원본 그대로 반환)
 */
export function convertCategoryToKorean(
  translatedCategory: string
): string {
  if (!translatedCategory) {
    return translatedCategory;
  }

  // 공백 제거 및 정규화
  const normalized = translatedCategory.trim();
  
  // 매핑에 있으면 변환
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }

  // 대소문자 구분 없이 매핑 시도 (영어 카테고리의 경우)
  const lowerKey = Object.keys(CATEGORY_MAP).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  if (lowerKey) {
    console.log(`[convertCategoryToKorean] 대소문자 구분 없이 매핑 성공: "${normalized}" → "${CATEGORY_MAP[lowerKey]}"`);
    return CATEGORY_MAP[lowerKey];
  }
  
  // 추가: 공백 제거 후 매핑 시도 (예: "Eye Surgery" vs "EyeSurgery")
  const noSpaceKey = Object.keys(CATEGORY_MAP).find(
    key => key.replace(/\s+/g, "").toLowerCase() === normalized.replace(/\s+/g, "").toLowerCase()
  );
  if (noSpaceKey) {
    console.log(`[convertCategoryToKorean] 공백 제거 후 매핑 성공: "${normalized}" → "${CATEGORY_MAP[noSpaceKey]}"`);
    return CATEGORY_MAP[noSpaceKey];
  }

  // 매핑에 없으면 원본 그대로 반환 (이미 한국어일 수 있음)
  // 하지만 유효성 검증 후 DB 제약조건에 맞지 않으면 에러 발생 가능
  
  // 한국어 카테고리 목록에 포함되어 있으면 그대로 반환
  if (KOREAN_CATEGORIES.includes(normalized as any)) {
    return normalized;
  }
  
  // 매핑에 없고 한국어도 아니면 경고 로그 출력
  console.warn(
    `[convertCategoryToKorean] 매핑 실패: "${normalized}" → 한국어 변환 불가. DB 제약조건 위반 가능성 있음.`
  );
  
  return normalized;
}

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

