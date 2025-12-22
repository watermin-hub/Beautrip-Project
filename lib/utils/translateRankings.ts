/**
 * 랭킹 데이터의 언어를 변경하는 유틸리티 함수
 * 
 * 사용자님 아이디어: 같은 treatment_id로 lang만 바꿔서 번역 데이터 가져오기
 * 
 * @param rankings - 이미 로드된 랭킹 데이터 (중분류 또는 소분류)
 * @param newLanguage - 변경할 언어
 * @returns 번역된 랭킹 데이터
 */
import {
  Treatment,
  LanguageCode,
  loadTreatmentById,
  MidCategoryRanking,
  SmallCategoryRanking,
} from "@/lib/api/beautripApi";

/**
 * 중분류 랭킹 번역
 */
export async function translateMidCategoryRankings(
  rankings: MidCategoryRanking[],
  newLanguage: LanguageCode
): Promise<MidCategoryRanking[]> {
  // 한국어면 그대로 반환 (번역 불필요)
  if (newLanguage === "KR") {
    return rankings;
  }

  // 각 중분류별로 시술 번역
  const translated = await Promise.all(
    rankings.map(async (ranking) => {
      // 각 시술의 treatment_id로 번역 데이터만 가져오기
      const translatedTreatments = await Promise.all(
        ranking.treatments.map(async (treatment) => {
          // treatment_id가 없으면 원본 그대로 반환
          if (!treatment.treatment_id) {
            return treatment;
          }

          try {
            // 같은 treatment_id로 lang만 바꿔서 조회
            const translated = await loadTreatmentById(
              treatment.treatment_id,
              newLanguage
            );

            // 번역이 없으면 원본 사용 (fallback)
            if (!translated) {
              console.warn(
                `[translateMidCategoryRankings] treatment_id ${treatment.treatment_id}의 ${newLanguage} 번역이 없어 원본 사용`
              );
              return treatment;
            }

            // 번역된 데이터와 원본 데이터 병합
            // (랭킹 정보는 원본 유지, 텍스트만 번역)
            return {
              ...treatment, // 원본 데이터 (랭킹, 순서 등 유지)
              ...translated, // 번역된 데이터로 덮어쓰기
              treatment_id: treatment.treatment_id, // ID는 항상 동일
              // 랭킹 관련 필드는 원본 유지
              card_score: treatment.card_score,
              treatment_rank: treatment.treatment_rank,
            };
          } catch (error) {
            console.error(
              `[translateMidCategoryRankings] treatment_id ${treatment.treatment_id} 번역 실패:`,
              error
            );
            // 에러 발생 시 원본 반환
            return treatment;
          }
        })
      );

      // 중분류 정보는 그대로 유지 (랭킹, 집계 정보 등)
      return {
        ...ranking,
        treatments: translatedTreatments,
        // 집계 필드는 원본 유지 (랭킹 계산 결과)
        category_rank: ranking.category_rank,
        category_score: ranking.category_score,
        average_rating: ranking.average_rating,
        total_reviews: ranking.total_reviews,
        treatment_count: ranking.treatment_count,
      };
    })
  );

  return translated;
}

/**
 * 소분류 랭킹 번역
 */
export async function translateSmallCategoryRankings(
  rankings: SmallCategoryRanking[],
  newLanguage: LanguageCode
): Promise<SmallCategoryRanking[]> {
  // 한국어면 그대로 반환 (번역 불필요)
  if (newLanguage === "KR") {
    return rankings;
  }

  // 각 소분류별로 시술 번역
  const translated = await Promise.all(
    rankings.map(async (ranking) => {
      // 각 시술의 treatment_id로 번역 데이터만 가져오기
      const translatedTreatments = await Promise.all(
        ranking.treatments.map(async (treatment) => {
          // treatment_id가 없으면 원본 그대로 반환
          if (!treatment.treatment_id) {
            return treatment;
          }

          try {
            // 같은 treatment_id로 lang만 바꿔서 조회
            const translated = await loadTreatmentById(
              treatment.treatment_id,
              newLanguage
            );

            // 번역이 없으면 원본 사용 (fallback)
            if (!translated) {
              console.warn(
                `[translateSmallCategoryRankings] treatment_id ${treatment.treatment_id}의 ${newLanguage} 번역이 없어 원본 사용`
              );
              return treatment;
            }

            // 번역된 데이터와 원본 데이터 병합
            return {
              ...treatment, // 원본 데이터 (랭킹, 순서 등 유지)
              ...translated, // 번역된 데이터로 덮어쓰기
              treatment_id: treatment.treatment_id, // ID는 항상 동일
              // 랭킹 관련 필드는 원본 유지
              card_score: treatment.card_score,
              treatment_rank: treatment.treatment_rank,
            };
          } catch (error) {
            console.error(
              `[translateSmallCategoryRankings] treatment_id ${treatment.treatment_id} 번역 실패:`,
              error
            );
            // 에러 발생 시 원본 반환
            return treatment;
          }
        })
      );

      // 소분류 정보는 그대로 유지 (랭킹, 집계 정보 등)
      return {
        ...ranking,
        treatments: translatedTreatments,
        // 집계 필드는 원본 유지 (랭킹 계산 결과)
        category_rank: ranking.category_rank,
        category_score: ranking.category_score,
        average_rating: ranking.average_rating,
        total_reviews: ranking.total_reviews,
        treatment_count: ranking.treatment_count,
      };
    })
  );

  return translated;
}

