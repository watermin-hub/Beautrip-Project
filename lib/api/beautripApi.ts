// Beautrip API 관련 유틸리티 함수

const API_URL =
  "https://raw.githubusercontent.com/watermin-hub/1205_api_practice/main/beautrip_treatments_sample_2000.json";

export interface Treatment {
  treatment_id?: number;
  treatment_name?: string;
  hospital_name?: string;
  category_large?: string;
  category_mid?: string;
  selling_price?: number;
  original_price?: number;
  dis_rate?: number;
  rating?: number;
  review_count?: number;
  main_image_url?: string;
  event_url?: string;
  vat_info?: string;
  treatment_hashtags?: string;
  surgery_time?: number | string; // 시술 시간 (분 단위 또는 문자열)
  downtime?: number | string; // 회복 기간 (일 단위 또는 문자열)
}

// 시술 데이터 로드
export async function loadTreatments(): Promise<Treatment[]> {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    // 텍스트로 먼저 받아서 NaN을 null로 치환
    const text = await res.text();
    const cleanedText = text.replace(/:\s*NaN\s*([,}])/g, ": null$1");
    const data = JSON.parse(cleanedText);

    if (!Array.isArray(data)) {
      throw new Error("데이터 형식이 올바르지 않습니다. 배열이 아닙니다.");
    }

    return data as Treatment[];
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    throw error;
  }
}

// 병원 정보 인터페이스
export interface HospitalInfo {
  hospital_name: string;
  treatments: Treatment[];
  averageRating: number;
  totalReviews: number;
  procedures: string[];
  categories: Set<string>;
}

// 시술 데이터에서 병원 정보 추출
export function extractHospitalInfo(treatments: Treatment[]): HospitalInfo[] {
  const hospitalMap = new Map<string, HospitalInfo>();

  treatments.forEach((treatment) => {
    if (!treatment.hospital_name) return;

    const hospitalName = treatment.hospital_name;

    if (!hospitalMap.has(hospitalName)) {
      hospitalMap.set(hospitalName, {
        hospital_name: hospitalName,
        treatments: [],
        averageRating: 0,
        totalReviews: 0,
        procedures: [],
        categories: new Set(),
      });
    }

    const hospital = hospitalMap.get(hospitalName)!;
    hospital.treatments.push(treatment);

    if (treatment.treatment_name) {
      hospital.procedures.push(treatment.treatment_name);
    }

    if (treatment.category_large) {
      hospital.categories.add(treatment.category_large);
    }

    if (treatment.rating) {
      hospital.averageRating += treatment.rating;
    }

    if (treatment.review_count) {
      hospital.totalReviews += treatment.review_count;
    }
  });

  // 평균 평점 계산 및 데이터 정리
  const hospitals: HospitalInfo[] = Array.from(hospitalMap.values()).map(
    (hospital) => {
      const treatmentCount = hospital.treatments.length;
      const avgRating =
        treatmentCount > 0 && hospital.averageRating > 0
          ? hospital.averageRating / treatmentCount
          : 0;

      // 중복 제거 및 정렬
      const uniqueProcedures = Array.from(new Set(hospital.procedures)).slice(
        0,
        10
      );

      return {
        ...hospital,
        averageRating: Math.round(avgRating * 10) / 10, // 소수점 1자리
        procedures: uniqueProcedures,
        categories: hospital.categories, // Set 유지
      };
    }
  );

  // 평점 순으로 정렬
  return hospitals.sort((a, b) => b.averageRating - a.averageRating);
}

// 썸네일 URL 생성 함수
export function getThumbnailUrl(treatment: Partial<Treatment>): string {
  // API에서 제공하는 main_image_url이 있으면 우선 사용
  if (treatment.main_image_url && treatment.main_image_url.trim() !== "") {
    return treatment.main_image_url;
  }

  // main_image_url이 없을 경우 고유한 플레이스홀더 생성
  const categoryColors: Record<string, string> = {
    리프팅: "667eea",
    피부: "f093fb",
    눈: "4facfe",
    코: "43e97b",
    입술: "fa709a",
    볼: "fee140",
    쁘띠: "30cfd0",
    기타: "667eea",
  };

  const category = treatment.category_large || "기타";
  const color = categoryColors[category] || "667eea";

  // treatment_id를 기반으로 고유한 이미지 생성
  const treatmentId = treatment.treatment_id || Math.random() * 1000;
  const seed = treatmentId % 1000;

  // 시술명의 첫 글자
  const firstChar = treatment.treatment_name
    ? treatment.treatment_name.charAt(0)
    : category.charAt(0);

  // 다양한 플레이스홀더 서비스 사용
  const placeholderServices = [
    `https://picsum.photos/seed/${seed}${treatmentId}/400/300`,
    `https://via.placeholder.com/400x300/${color}/ffffff?text=${encodeURIComponent(
      firstChar
    )}`,
  ];

  return placeholderServices[treatmentId % placeholderServices.length];
}

// 추천 점수 계산 함수 (평점, 리뷰 수, 가격 등을 종합)
export function calculateRecommendationScore(treatment: Treatment): number {
  const rating = treatment.rating || 0;
  const reviewCount = treatment.review_count || 0;
  const price = treatment.selling_price || 0;

  // 평점 가중치 (40%)
  const ratingScore = rating * 40;

  // 리뷰 수 가중치 (30%) - 리뷰가 많을수록 좋음 (로그 스케일 사용)
  const reviewScore = Math.log10(reviewCount + 1) * 10 * 3;

  // 가격 인기도 점수 (20%) - 합리적인 가격대일수록 높은 점수
  // 평균 가격대 근처일수록 높은 점수 (간단한 휴리스틱)
  const priceScore = price > 0 && price < 1000000 ? 20 : 10;

  // 할인율 보너스 (10%)
  const discountBonus = treatment.dis_rate ? treatment.dis_rate * 0.1 : 0;

  return ratingScore + reviewScore + priceScore + discountBonus;
}

// 카테고리별 랭킹 생성
export function getCategoryRankings(
  treatments: Treatment[],
  category?: string
) {
  let filtered = treatments;

  if (category) {
    filtered = treatments.filter(
      (t) => t.category_large === category || t.category_mid === category
    );
  }

  // 추천 점수 계산 후 정렬
  return filtered
    .map((treatment) => ({
      ...treatment,
      recommendationScore: calculateRecommendationScore(treatment),
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}

// 시술별 랭킹 (시술명으로 그룹화)
export interface TreatmentRanking {
  treatmentName: string;
  treatments: Treatment[];
  averageRating: number;
  totalReviews: number;
  averagePrice: number;
  recommendationScore: number;
  topTreatments: Treatment[];
}

export function getTreatmentRankings(
  treatments: Treatment[]
): TreatmentRanking[] {
  const treatmentMap = new Map<string, Treatment[]>();

  // 시술명으로 그룹화
  treatments.forEach((treatment) => {
    if (!treatment.treatment_name) return;

    const name = treatment.treatment_name;
    if (!treatmentMap.has(name)) {
      treatmentMap.set(name, []);
    }
    treatmentMap.get(name)!.push(treatment);
  });

  // 랭킹 데이터 생성
  const rankings: TreatmentRanking[] = Array.from(treatmentMap.entries())
    .map(([treatmentName, treatmentList]) => {
      const ratings = treatmentList
        .map((t) => t.rating || 0)
        .filter((r) => r > 0);
      const reviews = treatmentList
        .map((t) => t.review_count || 0)
        .reduce((sum, count) => sum + count, 0);
      const prices = treatmentList
        .map((t) => t.selling_price || 0)
        .filter((p) => p > 0);

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 0;
      const averagePrice =
        prices.length > 0
          ? prices.reduce((sum, p) => sum + p, 0) / prices.length
          : 0;

      // 대표 시술 3개 선택 (평점 높은 순)
      const topTreatments = [...treatmentList]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);

      // 추천 점수 계산
      const representativeTreatment: Treatment = {
        ...topTreatments[0],
        rating: averageRating,
        review_count: reviews,
      };
      const recommendationScore = calculateRecommendationScore(
        representativeTreatment
      );

      return {
        treatmentName,
        treatments: treatmentList,
        averageRating,
        totalReviews: reviews,
        averagePrice,
        recommendationScore,
        topTreatments,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  return rankings;
}

// K-beauty 관련 시술 필터링 (키워드 기반)
const KBEAUTY_KEYWORDS = [
  "리쥬란",
  "인모드",
  "슈링크",
  "윤곽",
  "주사",
  "보톡스",
  "필러",
  "리프팅",
  "탄력",
  "미백",
  "백옥",
  "프락셀",
  "피코",
  "레이저",
];

export function getKBeautyRankings(treatments: Treatment[]): Treatment[] {
  return treatments
    .filter((treatment) => {
      const name = (treatment.treatment_name || "").toLowerCase();
      const hashtags = (treatment.treatment_hashtags || "").toLowerCase();
      const category = (treatment.category_large || "").toLowerCase();

      return KBEAUTY_KEYWORDS.some(
        (keyword) =>
          name.includes(keyword.toLowerCase()) ||
          hashtags.includes(keyword.toLowerCase()) ||
          category.includes(keyword.toLowerCase())
      );
    })
    .map((treatment) => ({
      ...treatment,
      recommendationScore: calculateRecommendationScore(treatment),
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}

// 회복 기간을 숫자로 변환 (문자열 "1일", "2일" 또는 숫자)
export function parseRecoveryPeriod(
  downtime: number | string | undefined
): number {
  if (!downtime) return 0;
  if (typeof downtime === "number") return downtime;

  // 문자열인 경우 "1일", "2일", "1-2일" 등의 형식 파싱
  const match = downtime.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// 시술 시간을 숫자로 변환 (문자열 "30분", "60분" 또는 숫자)
export function parseProcedureTime(
  surgeryTime: number | string | undefined
): number {
  if (!surgeryTime) return 0;
  if (typeof surgeryTime === "number") return surgeryTime;

  // 문자열인 경우 "30분", "60분" 등의 형식 파싱
  const match = surgeryTime.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// 일정 기반 시술 추천 (n박 n일 계산)
export interface ScheduleBasedRecommendation {
  categoryMid: string;
  treatments: Treatment[];
  averageRecoveryPeriod: number;
  averageProcedureTime: number;
}

// 대분류 카테고리 매핑 (사용자 선택 카테고리 -> API 카테고리)
const CATEGORY_MAPPING: Record<string, string[]> = {
  피부관리: ["피부", "피부관리"],
  "흉터/자국": ["흉터", "자국", "상처"],
  "윤곽/리프팅": ["리프팅", "윤곽", "볼륨"],
  코성형: ["코", "코성형"],
  눈성형: ["눈", "눈성형"],
  "보톡스/필러": ["보톡스", "필러", "주사"],
  "체형/지방": ["체형", "지방", "다이어트", "가슴", "유방"], // 가슴 수술 포함
  기타: ["기타"], // 다른 카테고리에 속하지 않는 것만
  전체: [], // 모든 카테고리 포함
};

export function getScheduleBasedRecommendations(
  treatments: Treatment[],
  categoryLarge: string,
  startDate: string,
  endDate: string
): ScheduleBasedRecommendation[] {
  // 여행 일수 계산
  const start = new Date(startDate);
  const end = new Date(endDate);
  const travelDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // n박 n일

  // 대분류 카테고리로 필터링
  const mappedCategories = CATEGORY_MAPPING[categoryLarge] || [categoryLarge];

  const categoryFiltered = treatments.filter((t) => {
    if (!t.category_large) return false;

    // "전체"인 경우 모든 시술 포함
    if (categoryLarge === "전체") {
      return true;
    }

    // "기타"인 경우: 다른 카테고리에 속하지 않는 것만
    if (categoryLarge === "기타") {
      const allOtherCategories = [
        "피부",
        "피부관리",
        "흉터",
        "자국",
        "상처",
        "리프팅",
        "윤곽",
        "볼륨",
        "코",
        "코성형",
        "눈",
        "눈성형",
        "보톡스",
        "필러",
        "주사",
        "체형",
        "지방",
        "다이어트",
        "가슴",
        "유방",
      ];
      const categoryLower = t.category_large?.toLowerCase() || "";
      const midCategoryLower = t.category_mid?.toLowerCase() || "";

      // 다른 카테고리에 속하지 않는지 확인
      const isInOtherCategory = allOtherCategories.some(
        (otherCat) =>
          categoryLower.includes(otherCat.toLowerCase()) ||
          midCategoryLower.includes(otherCat.toLowerCase())
      );

      return !isInOtherCategory;
    }

    // 일반 카테고리: 매핑된 카테고리 중 하나라도 포함되면 선택
    return mappedCategories.some(
      (mapped) =>
        t.category_large?.toLowerCase().includes(mapped.toLowerCase()) ||
        t.category_mid?.toLowerCase().includes(mapped.toLowerCase())
    );
  });

  console.log(
    `[일정 기반 추천] 선택 카테고리: ${categoryLarge}, 필터링된 데이터: ${categoryFiltered.length}개`
  );

  // 중분류별로 그룹화
  const midCategoryMap = new Map<string, Treatment[]>();

  categoryFiltered.forEach((treatment) => {
    const midCategory = treatment.category_mid || "기타";
    if (!midCategoryMap.has(midCategory)) {
      midCategoryMap.set(midCategory, []);
    }
    midCategoryMap.get(midCategory)!.push(treatment);
  });

  // 중분류별로 추천 데이터 생성
  const recommendations: ScheduleBasedRecommendation[] = Array.from(
    midCategoryMap.entries()
  )
    .map(([categoryMid, treatmentList]) => {
      // 여행 기간에 맞는 시술만 필터링
      // 회복 기간이 여행 일수보다 작거나 같은 시술만 선택
      const suitableTreatments = treatmentList.filter((treatment) => {
        const recoveryPeriod = parseRecoveryPeriod(treatment.downtime);
        // 회복기간 정보가 없으면 포함 (기본적으로 표시)
        if (recoveryPeriod === 0) return true;
        // 여행 일수에서 최소 1일은 여유를 둠 (시술 당일 제외)
        return recoveryPeriod <= travelDays - 1;
      });

      // 필터링 결과가 없거나 회복기간 정보가 없으면 전체 시술 표시 (최대 10개)
      // 회복기간 정보가 있는 경우에만 필터링 적용
      const hasRecoveryData = treatmentList.some(
        (t) => parseRecoveryPeriod(t.downtime) > 0
      );

      const finalTreatments =
        hasRecoveryData && suitableTreatments.length > 0
          ? suitableTreatments
          : [...treatmentList]
              .sort((a, b) => {
                // 추천 점수로 정렬
                const scoreA = calculateRecommendationScore(a);
                const scoreB = calculateRecommendationScore(b);
                return scoreB - scoreA;
              })
              .slice(0, 10); // 최대 10개

      // 평균 회복 기간 계산
      const recoveryPeriods = finalTreatments
        .map((t) => parseRecoveryPeriod(t.downtime))
        .filter((r) => r > 0);
      const averageRecoveryPeriod =
        recoveryPeriods.length > 0
          ? recoveryPeriods.reduce((sum, r) => sum + r, 0) /
            recoveryPeriods.length
          : 0;

      // 평균 시술 시간 계산
      const procedureTimes = finalTreatments
        .map((t) => parseProcedureTime(t.surgery_time))
        .filter((t) => t > 0);
      const averageProcedureTime =
        procedureTimes.length > 0
          ? procedureTimes.reduce((sum, t) => sum + t, 0) /
            procedureTimes.length
          : 0;

      // 추천 점수로 정렬
      const sortedTreatments = finalTreatments
        .map((treatment) => ({
          ...treatment,
          recommendationScore: calculateRecommendationScore(treatment),
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      return {
        categoryMid,
        treatments: sortedTreatments,
        averageRecoveryPeriod: Math.round(averageRecoveryPeriod * 10) / 10,
        averageProcedureTime: Math.round(averageProcedureTime),
      };
    })
    .filter((rec) => rec.treatments.length > 0) // 치료가 있는 중분류만
    .sort((a, b) => {
      // 회복 기간이 짧은 순으로 정렬 (여행에 적합한 순서)
      if (a.averageRecoveryPeriod !== b.averageRecoveryPeriod) {
        return a.averageRecoveryPeriod - b.averageRecoveryPeriod;
      }
      // 추천 점수 순으로 정렬
      const scoreA = a.treatments[0]?.recommendationScore || 0;
      const scoreB = b.treatments[0]?.recommendationScore || 0;
      return scoreB - scoreA;
    });

  return recommendations;
}
