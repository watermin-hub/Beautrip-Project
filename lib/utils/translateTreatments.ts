/**
 * 이미 로드된 시술 카드의 언어를 변경하는 유틸리티 함수
 *
 * 사용자님 아이디어: 같은 treatment_id로 lang만 바꿔서 번역 데이터 가져오기
 *
 * @param treatments - 이미 로드된 시술 카드 배열
 * @param newLanguage - 변경할 언어
 * @returns 번역된 시술 카드 배열
 */
import {
  Treatment,
  LanguageCode,
  loadTreatmentById,
} from "@/lib/api/beautripApi";

export async function translateTreatments(
  treatments: Treatment[],
  newLanguage: LanguageCode
): Promise<Treatment[]> {
  // 한국어면 그대로 반환 (번역 불필요)
  if (newLanguage === "KR") {
    return treatments;
  }

  // 각 시술의 treatment_id로 번역 데이터만 가져오기
  const translated = await Promise.all(
    treatments.map(async (treatment) => {
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
            `[translateTreatments] treatment_id ${treatment.treatment_id}의 ${newLanguage} 번역이 없어 원본 사용`
          );
          return treatment;
        }

        // 번역된 데이터와 원본 데이터 병합
        // (번역되지 않은 필드는 원본 유지)
        // ⚠️ 중요: dis_rate, vat_info 등 가격 관련 필드는 원본 데이터에서 보존
        // 번역된 데이터에서 가격 관련 필드를 제거하고 원본 필드로 덮어쓰기
        const {
          dis_rate: _translatedDisRate,
          vat_info: _translatedVatInfo,
          selling_price: _translatedSellingPrice,
          original_price: _translatedOriginalPrice,
          ...translatedWithoutPrice
        } = translated;

        return {
          ...treatment, // 원본 데이터 (위치, 순서 등 유지)
          ...translatedWithoutPrice, // 번역된 데이터로 덮어쓰기 (가격 필드 제외)
          treatment_id: treatment.treatment_id, // ID는 항상 동일
          // 가격 관련 필드는 항상 원본에서 보존 (번역 테이블에 없을 수 있음)
          dis_rate: treatment.dis_rate ?? _translatedDisRate,
          vat_info: treatment.vat_info ?? _translatedVatInfo,
          selling_price: treatment.selling_price ?? _translatedSellingPrice,
          original_price: treatment.original_price ?? _translatedOriginalPrice,
        };
      } catch (error) {
        console.error(
          `[translateTreatments] treatment_id ${treatment.treatment_id} 번역 실패:`,
          error
        );
        // 에러 발생 시 원본 반환
        return treatment;
      }
    })
  );

  return translated;
}
