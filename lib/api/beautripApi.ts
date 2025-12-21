// Beautrip API 관련 유틸리티 함수
import { supabase } from "../supabase";

// 언어 코드 타입
export type LanguageCode = "KR" | "EN" | "JP" | "CN";

// Supabase 테이블 이름
const TABLE_NAMES = {
  TREATMENT_MASTER: "treatment_master",
  TREATMENT_PDP_VIEW: "v_treatment_pdp", // 시술 PDP용 뷰 테이블
  HOSPITAL_PDP_VIEW: "v_hospital_pdp", // 병원 PDP용 뷰 테이블
  CATEGORY_TREATTIME_RECOVERY: "category_treattime_recovery",
  HOSPITAL_MASTER: "hospital_master",
  KEYWORD_MONTHLY_TRENDS: "keyword_monthly_trends",
  CATEGORY_TOGGLE_MAP: "category_toggle_map",
};

// 언어별 treatment_master 테이블 이름 반환
export function getTreatmentTableName(language?: LanguageCode): string {
  // 클라이언트 사이드에서 언어 가져오기 (localStorage 또는 기본값)
  let lang: LanguageCode = language || "KR";

  if (typeof window !== "undefined" && !language) {
    const saved = localStorage.getItem("language") as LanguageCode;
    if (
      saved &&
      (saved === "KR" || saved === "EN" || saved === "JP" || saved === "CN")
    ) {
      lang = saved;
    }
  }

  // 언어별 테이블 이름 매핑
  const tableMap: Record<LanguageCode, string> = {
    KR: "treatment_master",
    EN: "treatment_master_en",
    JP: "treatment_master_jp",
    CN: "treatment_master_cn",
  };

  return tableMap[lang] || "treatment_master";
}

// Supabase 클라이언트 안전 접근 헬퍼
// 환경변수가 없어서 supabase가 초기화되지 않은 경우
// 런타임 TypeError 대신 빈 결과를 반환하도록 각 함수에서 사용합니다.
function getSupabaseOrNull() {
  if (!supabase) {
    if (typeof window !== "undefined") {
      console.warn(
        "[beautripApi] Supabase 클라이언트가 초기화되지 않았습니다. 환경변수를 확인하세요."
      );
    }
    return null;
  }
  return supabase;
}

// 시술 마스터 데이터 인터페이스
export interface Treatment {
  treatment_id?: number;
  treatment_name?: string;
  hospital_name?: string;
  category_large?: string;
  category_mid?: string; // 중분류
  category_small?: string; // 소분류
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
  platform?: string; // 플랫폼 (gangnamunni, yeoti, babitalk 등)
  [key: string]: any; // 추가 필드 허용
}

// 카테고리별 시술 시간/회복 기간 인터페이스
export interface CategoryTreatTimeRecovery {
  category_large?: string;
  중분류?: string; // 중분류 (category_mid와 매칭)
  category_mid?: string; // category_mid (중분류와 동일)
  keyword_kr?: string; // 한국어 키워드 (keyword_monthly_trends의 keyword와 매칭)
  소분류_리스트?: string; // 소분류 리스트
  그룹?: string;
  procedure_type?: string;
  시술시간_min?: number; // 시술시간_min(분)
  시술시간_max?: number; // 시술시간_max(분)
  "회복기간_min(일)"?: number; // 회복기간_min(일)
  "회복기간_max(일)"?: number; // 회복기간_max(일)
  다운타임레벨?: number; // 다운타임레벨(0-3)
  권장체류일수?: number; // 권장체류일수(일)
  Trip_friendly_level?: number; // Trip_friendly_level(0-3)
  "1~3"?: string; // 1~3일 회복 기간 텍스트
  "4~7"?: string; // 4~7일 회복 기간 텍스트
  "8~14"?: string; // 8~14일 회복 기간 텍스트
  "15~21"?: string; // 15~21일 회복 기간 텍스트
  surgery_time?: number | string; // 하위 호환성
  downtime?: number | string; // 하위 호환성
  [key: string]: any;
}

// 병원 마스터 데이터 인터페이스 (실제 Supabase 테이블 구조)
export interface HospitalMaster {
  hospital_id?: number;
  hospital_name?: string;
  hospital_url?: string;
  platform?: string;
  hospital_rating?: number;
  review_count?: number;
  hospital_address?: string;
  hospital_intro?: string;
  hospital_info_raw?: string;
  hospital_departments?: string; // JSON 문자열 또는 배열
  hospital_doctors?: string; // JSON 문자열 또는 배열
  opening_hours?: string;
  hospital_img?: string; // 곧 추가될 예정
  hospital_img_url?: string; // 병원 썸네일 이미지 URL
  [key: string]: any;
}

// 병원 PDP 뷰 데이터 인터페이스 (v_hospital_pdp)
export interface HospitalPdp {
  platform: "gangnamunni" | "yeoshinticket" | "babitalk" | string;
  hospital_id_rd: number;
  hospital_name?: string | null;
  hospital_address?: string | null;
  opening_hours?: string | null;
  hospital_departments?: string | string[] | null;
  hospital_intro?: string | null;
  hospital_info_raw?: string | null;
  hospital_img_url?: string | null;
  hospital_rating?: number | null;
  review_count?: number | null;
  hospital_phone_safe?: string | null;
  hospital_language_support?: string | null;
  [key: string]: any;
}

// 키워드 월별 트렌드 인터페이스
export interface KeywordMonthlyTrend {
  id?: number;
  KR?: string; // 한국어 키워드 - category_treattime_recovery의 keyword_kr과 매칭
  EN?: string; // 영어 키워드
  CN?: string; // 중국어 키워드
  JP?: string; // 일본어 키워드
  keyword?: string; // 하위 호환성을 위한 필드 (KR과 동일)
  month?: string; // 월 정보
  // 국가별 월별 관심도 컬럼들 (예: CN_2023-12, JP_2023-12, EN_2023-12 등)
  // 국가별 평균 관심도 컬럼들
  Avg_CN?: number; // 중국 평균 관심도
  Avg_JP?: number; // 일본 평균 관심도
  Avg_EN?: number; // 영어권(미국 등) 평균 관심도
  Avg_KR?: number; // 한국 평균 관심도 (있는 경우)
  [key: string]: any; // 동적 컬럼들 (CN_2023-12, JP_2023-12 등)
}

// ---------------------------
// 카테고리 관련 함수
// ---------------------------
// 기본 카테고리 목록 (Fallback용)
const DEFAULT_CATEGORIES = [
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
];

// 언어별 treatment_master 테이블에서 대분류 카테고리 목록 가져오기
export async function getCategoryLargeList(
  language?: LanguageCode
): Promise<string[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return DEFAULT_CATEGORIES;

    const treatmentTable = getTreatmentTableName(language);
    console.log(`[getCategoryLargeList] 언어: ${language}, 테이블: ${treatmentTable}`);
    
    const { data, error } = await client
      .from(treatmentTable)
      .select("category_large")
      .not("category_large", "is", null);

    if (error) {
      console.error("카테고리 목록 로드 실패:", error);
      // 테이블이 없거나 에러가 발생하면 기본 카테고리 반환
      return DEFAULT_CATEGORIES;
    }

    if (!data || !Array.isArray(data)) {
      console.warn(`[getCategoryLargeList] 데이터가 없거나 배열이 아닙니다.`, data);
      return DEFAULT_CATEGORIES;
    }

    console.log(`[getCategoryLargeList] 원본 데이터 개수: ${data.length}`);
    
    // 중복 제거 및 정렬
    const uniqueCategories = Array.from(
      new Set(data.map((item) => item.category_large).filter(Boolean))
    ).sort();

    console.log(`[getCategoryLargeList] 중복 제거 후 카테고리 개수: ${uniqueCategories.length}`, uniqueCategories);

    // 카테고리가 5개 미만이면 기본 카테고리 사용 (데이터 부족으로 판단)
    if (uniqueCategories.length < 5) {
      console.warn(`[getCategoryLargeList] 카테고리가 ${uniqueCategories.length}개만 있어 기본 카테고리 사용`);
      return DEFAULT_CATEGORIES;
    }

    return uniqueCategories as string[];
  } catch (error) {
    console.error("카테고리 목록 로드 실패:", error);
    return DEFAULT_CATEGORIES;
  }
}

// ---------------------------
// 캐시 및 유틸
// ---------------------------
// category_mid -> 회복정보 캐시 (중복 호출/로그 폭주 방지)
const recoveryInfoCache = new Map<
  string,
  {
    recoveryMin: number;
    recoveryMax: number;
    recoveryText: string | null;
    procedureTimeMin: number;
    procedureTimeMax: number;
    recommendedStayDays: number;
    recoveryGuides: Record<string, string | null>;
  } | null
>();

// 이미 매칭 로그를 찍은 category_mid 모음 (콘솔 스팸 방지)
const recoveryLogPrinted = new Set<string>();

// 공통 데이터 정리 함수 (NaN을 null로 변환)
function cleanData<T>(data: any[]): T[] {
  return data.map((item: any) => {
    const cleaned: any = {};
    for (const key in item) {
      const value = item[key];
      cleaned[key] =
        value === "NaN" || (typeof value === "number" && isNaN(value))
          ? null
          : value;
    }
    return cleaned;
  }) as T[];
}

// 시술 마스터 데이터 로드 (Supabase에서 가져오기 - 모든 데이터)
export async function loadTreatments(): Promise<Treatment[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const allData: Treatment[] = [];
    const pageSize = 1000; // Supabase 기본 limit
    let from = 0;
    let hasMore = true;

    console.log("🔄 전체 데이터 로드 시작...");

    // 페이지네이션으로 모든 데이터 가져오기
    const treatmentTable = getTreatmentTableName();
    while (hasMore) {
      const { data, error } = await client
        .from(treatmentTable)
        .select("*")
        .range(from, from + pageSize - 1);

      if (error) {
        throw new Error(`Supabase 오류: ${error.message}`);
      }

      if (!data) {
        throw new Error("데이터를 가져올 수 없습니다.");
      }

      if (!Array.isArray(data)) {
        throw new Error("데이터 형식이 올바르지 않습니다. 배열이 아닙니다.");
      }

      // 데이터 추가
      const cleanedData = cleanData<Treatment>(data);
      allData.push(...cleanedData);

      console.log(
        `📥 ${from + 1}~${from + data.length}개 로드 완료 (총 ${
          allData.length
        }개)`
      );

      // 더 가져올 데이터가 있는지 확인
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    console.log(`✅ 전체 데이터 로드 완료: ${allData.length}개`);

    // 플랫폼 우선순위로 정렬 (gangnamunni → yeoti → babitalk)
    const sortedData = sortTreatmentsByPlatform(allData);
    console.log(`🔄 플랫폼 우선순위 정렬 완료`);

    return sortedData;
  } catch (error) {
    console.error("시술 데이터 로드 실패:", error);
    throw error;
  }
}

// Fisher-Yates 셔플 알고리즘 (랜덤 정렬)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 시술 데이터 페이지네이션 로드 (초기 일부만 로드)
export async function loadTreatmentsPaginated(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    searchTerm?: string;
    categoryLarge?: string;
    categoryMid?: string;
    categorySmall?: string; // 소분류 필터 추가
    skipPlatformSort?: boolean; // 랭킹 페이지용: 플랫폼 정렬 건너뛰기
    randomOrder?: boolean; // 랜덤 정렬 옵션
  }
): Promise<{ data: Treatment[]; total: number; hasMore: boolean }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return { data: [], total: 0, hasMore: false };
    }

    const treatmentTable = getTreatmentTableName();
    let query = client.from(treatmentTable).select("*", { count: "exact" });

    // 필터 적용 (최소 2글자 이상일 때만 검색)
    if (filters?.searchTerm && filters.searchTerm.trim().length >= 2) {
      const term = filters.searchTerm.toLowerCase().trim();
      // 특수문자 이스케이프 (PostgreSQL ILIKE에서 %와 _는 와일드카드이므로 이스케이프 필요)
      // 하지만 Supabase는 자동으로 처리하므로 여기서는 기본 검증만 수행
      try {
        query = query.or(
          `treatment_name.ilike.%${term}%,hospital_name.ilike.%${term}%,treatment_hashtags.ilike.%${term}%`
        );
      } catch (queryError) {
        console.error("쿼리 생성 오류:", {
          queryError,
          searchTerm: term,
          errorType: typeof queryError,
          errorMessage:
            queryError instanceof Error
              ? queryError.message
              : String(queryError),
        });
        // 쿼리 생성 실패 시 빈 결과 반환
        return { data: [], total: 0, hasMore: false };
      }
    } else if (filters?.searchTerm && filters.searchTerm.trim().length === 1) {
      // 1글자일 때는 검색하지 않음 (빈 결과 반환)
      return { data: [], total: 0, hasMore: false };
    }

    if (filters?.categoryLarge) {
      // 카테고리 매핑을 사용하여 여러 카테고리를 OR 조건으로 검색
      const mappedCategories = CATEGORY_MAPPING[filters.categoryLarge] || [
        filters.categoryLarge,
      ];

      if (mappedCategories.length === 0) {
        // "전체"인 경우 필터링하지 않음
        // (빈 배열이면 모든 데이터 반환)
      } else if (mappedCategories.length === 1) {
        // 단일 카테고리인 경우 정확한 일치 또는 부분 일치 검색
        query = query.ilike("category_large", `%${mappedCategories[0]}%`);
      } else {
        // 여러 카테고리인 경우 OR 조건으로 검색
        const orConditions = mappedCategories
          .map((cat) => `category_large.ilike.%${cat}%`)
          .join(",");
        query = query.or(orConditions);
      }

      console.log(
        `[loadTreatmentsPaginated] 대분류 필터: "${filters.categoryLarge}" -> 매핑된 카테고리:`,
        mappedCategories
      );
    }

    if (filters?.categoryMid) {
      query = query.eq("category_mid", filters.categoryMid);
    }

    if (filters?.categorySmall) {
      // 소분류는 정확 일치로 검색
      const trimmedCategorySmall = filters.categorySmall.trim();
      query = query.eq("category_small", trimmedCategorySmall);
      console.log(
        `[loadTreatmentsPaginated] 소분류 필터 (정확 일치): "${trimmedCategorySmall}"`
      );
    }

    let data, error, count;

    // 랜덤 정렬인 경우: Supabase에서 랜덤 정렬 후 페이지네이션
    // PostgreSQL의 RANDOM() 함수를 사용하여 서버에서 처리
    if (filters?.randomOrder) {
      try {
        // Supabase는 PostgreSQL 기반이므로 RPC 함수나 직접 쿼리로 랜덤 정렬 가능
        // 하지만 JS 클라이언트에서는 직접 지원하지 않으므로,
        // 전체 데이터를 로드하되 클라이언트(브라우저)에서 실행되므로 서버 메모리 사용 없음
        // 필터가 있으면 필터링된 결과만 로드
        const result = await query;
        data = result.data;
        error = result.error;
        count = result.count;
      } catch (fetchError) {
        // 네트워크 오류 처리
        if (
          fetchError instanceof TypeError &&
          fetchError.message === "Failed to fetch"
        ) {
          console.error(
            "네트워크 오류: Supabase 서버에 연결할 수 없습니다.",
            fetchError
          );
          return { data: [], total: 0, hasMore: false };
        }
        throw fetchError;
      }

      if (error) {
        // 에러 객체의 모든 속성을 확인하기 위해 JSON.stringify 사용
        const errorString = JSON.stringify(error, null, 2);
        const errorKeys = Object.keys(error || {});

        console.error("Supabase 쿼리 오류 (랜덤 정렬):", {
          error,
          errorString,
          errorKeys,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
          // 추가 디버깅 정보
          queryInfo: {
            table: treatmentTable,
            page,
            pageSize,
            filters,
          },
        });

        // 에러 메시지 추출 (다양한 형식 지원)
        let errorMessage = "알 수 없는 Supabase 오류";
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.details) {
          errorMessage = error.details;
        } else if (error?.hint) {
          errorMessage = error.hint;
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (errorString && errorString !== "{}") {
          errorMessage = `Supabase 오류: ${errorString}`;
        }

        throw new Error(`Supabase 오류: ${errorMessage}`);
      }

      if (!data) {
        return { data: [], total: 0, hasMore: false };
      }

      const cleanedData = cleanData<Treatment>(data);
      // 전체 데이터 랜덤 정렬 (클라이언트에서 실행되므로 서버 메모리 사용 없음)
      const shuffledData = shuffleArray(cleanedData);

      // 클라이언트에서 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = shuffledData.slice(from, to);
      const total = count || shuffledData.length;
      const hasMore = to < shuffledData.length;

      return { data: paginatedData, total, hasMore };
    } else {
      // 일반 정렬: 서버에서 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      try {
        const result = await query.range(from, to);
        data = result.data;
        error = result.error;
        count = result.count;
      } catch (fetchError) {
        // 네트워크 오류 처리
        if (
          fetchError instanceof TypeError &&
          fetchError.message === "Failed to fetch"
        ) {
          console.error(
            "네트워크 오류: Supabase 서버에 연결할 수 없습니다.",
            fetchError
          );
          return { data: [], total: 0, hasMore: false };
        }
        throw fetchError;
      }

      if (error) {
        // 에러 객체의 모든 속성을 확인하기 위해 JSON.stringify 사용
        const errorString = JSON.stringify(error, null, 2);
        const errorKeys = Object.keys(error || {});

        console.error("Supabase 쿼리 오류 (일반 정렬):", {
          error,
          errorString,
          errorKeys,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
          // 추가 디버깅 정보
          queryInfo: {
            table: treatmentTable,
            page,
            pageSize,
            filters,
          },
        });

        // 에러 메시지 추출 (다양한 형식 지원)
        let errorMessage = "알 수 없는 Supabase 오류";
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.details) {
          errorMessage = error.details;
        } else if (error?.hint) {
          errorMessage = error.hint;
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (errorString && errorString !== "{}") {
          errorMessage = `Supabase 오류: ${errorString}`;
        }

        throw new Error(`Supabase 오류: ${errorMessage}`);
      }

      if (!data) {
        return { data: [], total: 0, hasMore: false };
      }

      const cleanedData = cleanData<Treatment>(data);

      let sortedData: Treatment[];
      if (filters?.skipPlatformSort) {
        // 랭킹 페이지는 플랫폼 정렬을 건너뛰고 원본 순서 유지 (랭킹 알고리즘이 정렬함)
        sortedData = cleanedData;
      } else {
        // 플랫폼 우선순위 정렬
        sortedData = sortTreatmentsByPlatform(cleanedData);
      }

      const total = count || 0;
      const hasMore = to < total - 1;

      return { data: sortedData, total, hasMore };
    }
  } catch (error) {
    console.error("시술 데이터 페이지네이션 로드 실패:", error);
    throw error;
  }
}

// 검색 자동완성을 위한 시술명/병원명 목록 가져오기 (category_small 기준)
export async function getTreatmentAutocomplete(
  searchTerm: string,
  limit: number = 10
): Promise<{ treatmentNames: string[]; hospitalNames: string[] }> {
  try {
    if (!searchTerm || searchTerm.length < 1) {
      return { treatmentNames: [], hospitalNames: [] };
    }

    const client = getSupabaseOrNull();
    if (!client) {
      return { treatmentNames: [], hospitalNames: [] };
    }

    const term = searchTerm.toLowerCase();
    const treatmentTable = getTreatmentTableName();
    const { data, error } = await client
      .from(treatmentTable)
      .select("category_small, hospital_name")
      .or(`category_small.ilike.%${term}%,hospital_name.ilike.%${term}%`)
      .limit(limit * 2);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return { treatmentNames: [], hospitalNames: [] };
    }

    // category_small만 반환 (소분류 기준)
    const treatmentNames: string[] = Array.from(
      new Set<string>(
        data
          .map((t: { category_small: string | null }) => t.category_small)
          .filter(
            (name: string | null): name is string =>
              name !== null && name.toLowerCase().includes(term)
          )
      )
    ).slice(0, limit);

    const hospitalNames: string[] = Array.from(
      new Set<string>(
        data
          .map((t: { hospital_name: string | null }) => t.hospital_name)
          .filter(
            (name: string | null): name is string =>
              name !== null && name.toLowerCase().includes(term)
          )
      )
    ).slice(0, limit);

    return { treatmentNames, hospitalNames };
  } catch (error) {
    console.error("자동완성 데이터 로드 실패:", error);
    return { treatmentNames: [], hospitalNames: [] };
  }
}

// 카테고리별 시술 시간/회복 기간 데이터 로드
export async function loadCategoryTreatTimeRecovery(): Promise<
  CategoryTreatTimeRecovery[]
> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_TREATTIME_RECOVERY)
      .select("*");

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return cleanData<CategoryTreatTimeRecovery>(data);
  } catch (error) {
    console.error("카테고리 시술 시간/회복 기간 데이터 로드 실패:", error);
    throw error;
  }
}

// category_mid로 회복 기간 정보 가져오기 (중분류 컬럼과 매칭)
export async function getRecoveryInfoByCategoryMid(
  categoryMid: string
): Promise<{
  recoveryMin: number;
  recoveryMax: number;
  recoveryText: string | null;
  procedureTimeMin: number;
  procedureTimeMax: number;
  recommendedStayDays: number; // 권장체류일수(일)
  recoveryGuides: Record<string, string | null>;
} | null> {
  try {
    if (!categoryMid) return null;

    const categoryMidTrimmed = categoryMid.trim();

    // "시력교정" 카테고리는 API 데이터에서 제거되었으므로 조용히 null 반환
    if (categoryMidTrimmed === "시력교정") {
      return null;
    }

    // 캐시 (중복 호출/로그 스팸 방지) - trim된 키 사용
    // ❗ null(매칭 실패)은 캐시하지 않고, 성공한 값만 캐시합니다.
    if (recoveryInfoCache.has(categoryMidTrimmed)) {
      const cached = recoveryInfoCache.get(categoryMidTrimmed);
      if (cached) return cached;
    }

    const recoveryData = await loadCategoryTreatTimeRecovery();

    // 키/샘플 확인 (디버깅용)
    console.log(
      "🔑 recovery 첫 행 keys:",
      recoveryData?.[0] ? Object.keys(recoveryData[0]) : null
    );
    console.log(
      "🔎 sample 중분류:",
      recoveryData
        ?.slice(0, 5)
        .map((x: any) => x["중분류"] ?? x.중분류 ?? x.category_mid)
    );

    const getMid = (item: any) =>
      String(
        item["중분류"] ??
          item.중분류 ??
          item["category_mid"] ??
          item.category_mid ??
          item["categoryMid"] ??
          item.categoryMid ??
          ""
      );

    // 정규화 함수: NFC + zero-width 제거 + 공백 제거 + 소문자
    // (슬래시(`/`) 같은 구분 문자는 그대로 둬서 "유두/유륜성형" 등의 매칭을 보존)
    const normalize = (str: string) =>
      str
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    // 정상화된 중분류 목록을 미리 만들어 정확/부분 일치에 사용
    const normalizedCategoryMid = normalize(categoryMidTrimmed);
    const normalizedRecoveryData = recoveryData.map((item: any) => {
      const mid = getMid(item).trim();
      return {
        ...item,
        _mid: mid,
        _normalized: normalize(mid),
      };
    });

    // 디버깅: 매칭 시도 전 로그 (한번만 찍기)
    if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
      console.log(`🔍 [매칭 시도] category_mid: "${categoryMidTrimmed}"`);
      console.log(`🔍 [매칭 시도] 정규화된 값: "${normalizedCategoryMid}"`);
      console.log(`🔍 [전체 데이터] 총 ${recoveryData.length}개 항목`);
    }

    // "V라인" 또는 입력값이 포함된 모든 중분류 찾기 (디버깅용)
    const relatedItems = normalizedRecoveryData.filter((item) => {
      if (!item._normalized) return false;
      return (
        item._normalized.includes(normalizedCategoryMid) ||
        normalizedCategoryMid.includes(item._normalized)
      );
    });

    if (
      relatedItems.length > 0 &&
      !recoveryLogPrinted.has(categoryMidTrimmed)
    ) {
      console.log(
        `🔍 [관련 항목 발견] ${relatedItems.length}개 항목 발견:`,
        relatedItems.map((item) => ({
          중분류: item.중분류,
          정규화: normalize(item.중분류 || ""),
          "권장체류일수(일)":
            (item as any)["권장체류일수(일)"] ?? (item as any).권장체류일수,
        }))
      );
    }

    // 중분류 컬럼과 category_mid를 정확히 일치시켜서 매칭 (정확 일치만 허용)
    // 1) 원본 문자열 정확 일치 (최우선)
    let matched = normalizedRecoveryData.find(
      (item) => item._mid === categoryMidTrimmed
    );

    // 2) 정규화된 정확 일치 (공백/대소문자 차이만 허용)
    if (!matched) {
      matched = normalizedRecoveryData.find(
        (item) => item._normalized && item._normalized === normalizedCategoryMid
      );
    }

    // 부분 일치 제거: 모든 category_mid 값이 정확히 일치해야 함

    if (!matched) {
      if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
        console.error(
          `❌ [매칭 실패] category_mid: "${categoryMidTrimmed}" (정규화: "${normalize(
            categoryMidTrimmed
          )}")`
        );
      }

      // "V라인"이 포함된 모든 항목 찾기
      const vlineItems = recoveryData.filter((item) => {
        const 중분류 = (item.중분류 || "").trim();
        return (
          중분류 &&
          (중분류.includes("V라인") ||
            중분류.includes("v라인") ||
            중분류.includes("V 라인"))
        );
      });

      if (
        vlineItems.length > 0 &&
        !recoveryLogPrinted.has(categoryMidTrimmed)
      ) {
        console.log(
          `🔍 [V라인 관련 항목] ${vlineItems.length}개 발견:`,
          vlineItems.map((item) => ({
            중분류: item.중분류,
            정규화: normalize(item.중분류 || ""),
            "권장체류일수(일)": item["권장체류일수(일)"] ?? item.권장체류일수,
          }))
        );
      }

      recoveryLogPrinted.add(categoryMidTrimmed);
      return null;
    }

    // 실제 컬럼명: 회복기간_min(일), 회복기간_max(일), 시술시간_min(분), 시술시간_max(분)
    if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
      console.log("🔍 매칭된 객체의 모든 키:", Object.keys(matched));
      console.log("🔍 매칭된 객체에서 회복기간 값 확인:", {
        "회복기간_max(일)": matched["회복기간_max(일)"],
        "회복기간_min(일)": matched["회복기간_min(일)"],
        "시술시간_max(분)": matched["시술시간_max"],
        "시술시간_min(분)": matched["시술시간_min"],
        타입_max: typeof matched["회복기간_max(일)"],
        타입_min: typeof matched["회복기간_min(일)"],
      });
    }

    const m: any = matched;

    const recoveryMax = m["회복기간_max(일)"] || m["회복기간_min(일)"] || 0;
    const recoveryMin = m["회복기간_min(일)"] || 0;
    const procedureTimeMax =
      m["시술시간_max(분)"] ||
      m["시술시간_min(분)"] ||
      m["시술시간_max"] ||
      m["시술시간_min"] ||
      0;
    const procedureTimeMin = m["시술시간_min(분)"] || m["시술시간_min"] || 0;

    console.log(
      `✅ 매칭 성공! category_mid: "${categoryMidTrimmed}", 회복기간_max: ${recoveryMax}, 회복기간_min: ${recoveryMin}`
    );

    if (recoveryMax === 0 && recoveryMin === 0) {
      console.warn(
        `⚠️ 회복 기간 값이 0입니다. category_mid: "${categoryMidTrimmed}", 매칭된 항목:`,
        matched
      );
      console.warn("🔍 사용 가능한 모든 키:", Object.keys(matched));
    }

    // 회복 기간 텍스트 가이드 (전체 범위 저장)
    const recoveryGuides: Record<string, string | null> = {
      "1~3": matched["1~3"] || null,
      "4~7": matched["4~7"] || null,
      "8~14": matched["8~14"] || null,
      "15~21": matched["15~21"] || null,
    };

    // 회복 기간에 맞는 대표 텍스트 컬럼 선택 (회복기간_max 기준)
    let recoveryText: string | null = null;
    if (recoveryMax >= 1 && recoveryMax <= 3) {
      recoveryText = recoveryGuides["1~3"];
    } else if (recoveryMax >= 4 && recoveryMax <= 7) {
      recoveryText = recoveryGuides["4~7"];
    } else if (recoveryMax >= 8 && recoveryMax <= 14) {
      recoveryText = recoveryGuides["8~14"];
    } else if (recoveryMax >= 15 && recoveryMax <= 21) {
      recoveryText = recoveryGuides["15~21"];
    }

    // 권장체류일수(일) 가져오기 - 컬럼명 변형까지 대응
    const recommendedStayDays = (() => {
      const direct =
        m["권장체류일수(일)"] ?? m["권장체류일수"] ?? m.권장체류일수;
      if (typeof direct === "number" && !isNaN(direct) && direct > 0) {
        if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
          console.log(`✅ [권장체류일수] 직접 매칭: ${direct}일`);
        }
        return direct;
      }

      const dynamicKey = Object.keys(m).find((k) =>
        k.replace(/\s+/g, "").includes("권장체류")
      );
      if (dynamicKey) {
        const value = m[dynamicKey];
        if (typeof value === "number" && !isNaN(value) && value > 0) {
          if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
            console.log(
              `✅ [권장체류일수] 동적 키 매칭 (${dynamicKey}): ${value}일`
            );
          }
          return value;
        }
      }

      if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
        console.warn(
          `⚠️ [권장체류일수] 찾을 수 없음. category_mid: "${categoryMidTrimmed}"`
        );
        console.log("🔍 [매칭된 객체의 모든 키]:", Object.keys(matched));
      }
      return 0;
    })();

    // 권장체류일수가 있으면 recoveryMax로 사용 (회복 기간 표시용)
    const finalRecoveryMax =
      recommendedStayDays > 0 ? recommendedStayDays : recoveryMax;
    const finalRecoveryMin =
      recommendedStayDays > 0 ? recommendedStayDays : recoveryMin;

    if (!recoveryLogPrinted.has(categoryMidTrimmed)) {
      console.log(
        `✅ [최종 회복 기간] category_mid: "${categoryMidTrimmed}", 권장체류일수: ${recommendedStayDays}일, 회복기간_max: ${recoveryMax}일, 최종 사용: ${finalRecoveryMax}일`
      );
    }

    const result = {
      recoveryMin: finalRecoveryMin,
      recoveryMax: finalRecoveryMax,
      recoveryText,
      procedureTimeMin,
      procedureTimeMax,
      recommendedStayDays,
      recoveryGuides,
    };

    // 캐시 & 로그 기록 (성공한 경우에만 캐시)
    recoveryInfoCache.set(categoryMidTrimmed, result);
    recoveryLogPrinted.add(categoryMidTrimmed);

    return result;
  } catch (error) {
    console.error("회복 기간 정보 로드 실패:", error);
    return null;
  }
}

// 병원 마스터 데이터 로드
export async function loadHospitalMaster(): Promise<HospitalMaster[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const { data, error } = await client
      .from(TABLE_NAMES.HOSPITAL_MASTER)
      .select("*");

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return cleanData<HospitalMaster>(data);
  } catch (error) {
    console.error("병원 데이터 로드 실패:", error);
    throw error;
  }
}

// ID로 단일 시술 데이터 로드 (PDP 페이지용)
// v_treatment_pdp 뷰 테이블 사용 (JOIN된 모든 데이터 포함)
export async function loadTreatmentById(
  treatmentId: number
): Promise<Treatment | null> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return null;

    const { data, error } = await client
      .from(TABLE_NAMES.TREATMENT_PDP_VIEW)
      .select("*")
      .eq("treatment_id", treatmentId)
      .single();

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return cleanData<Treatment>([data])[0];
  } catch (error) {
    console.error("시술 데이터 로드 실패:", error);
    return null;
  }
}

// 같은 시술명의 다른 옵션들 로드 (PDP 페이지용)
export async function loadRelatedTreatments(
  treatmentName: string,
  excludeId?: number
): Promise<Treatment[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const treatmentTable = getTreatmentTableName();
    let query = client
      .from(treatmentTable)
      .select("*")
      .eq("treatment_name", treatmentName);

    if (excludeId) {
      query = query.neq("treatment_id", excludeId);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return cleanData<Treatment>(data);
  } catch (error) {
    console.error("관련 시술 데이터 로드 실패:", error);
    return [];
  }
}

// 같은 병원의 다른 시술들 로드 (PDP 페이지용) - hospital_name 기반 (레거시)
export async function loadHospitalTreatments(
  hospitalName: string,
  excludeId?: number
): Promise<Treatment[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const treatmentTable = getTreatmentTableName();
    let query = client
      .from(treatmentTable)
      .select("*")
      .eq("hospital_name", hospitalName);

    if (excludeId) {
      query = query.neq("treatment_id", excludeId);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return cleanData<Treatment>(data);
  } catch (error) {
    console.error("병원 시술 데이터 로드 실패:", error);
    return [];
  }
}

// 병원 단건 조회 (v_hospital_pdp 뷰 사용) - (platform, hospital_id_rd) 기준
export async function loadHospitalByKey(
  platform: string,
  hospitalIdRd: number
): Promise<HospitalPdp | null> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return null;

    const { data, error } = await client
      .from(TABLE_NAMES.HOSPITAL_PDP_VIEW)
      .select("*")
      .eq("platform", platform)
      .eq("hospital_id_rd", hospitalIdRd)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return cleanData<HospitalPdp>([data])[0];
  } catch (error) {
    console.error("병원 데이터 로드 실패:", error);
    return null;
  }
}

// 병원 단건 조회 (hospital_id_rd만으로) - platform 자동 감지
export async function loadHospitalByIdRd(
  hospitalIdRd: number
): Promise<HospitalPdp | null> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return null;

    // hospital_id_rd로 조회 (여러 platform 결과 중 첫 번째 사용)
    const { data, error } = await client
      .from(TABLE_NAMES.HOSPITAL_PDP_VIEW)
      .select("*")
      .eq("hospital_id_rd", hospitalIdRd)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return cleanData<HospitalPdp>([data])[0];
  } catch (error) {
    console.error("병원 데이터 로드 실패:", error);
    return null;
  }
}

// 병원 시술 목록 조회 (treatment_master) - (platform, hospital_id_rd) 기준 (레거시)
export async function loadTreatmentsByKey(
  platform: string,
  hospitalIdRd: number
): Promise<Treatment[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const treatmentTable = getTreatmentTableName();
    const { data, error } = await client
      .from(treatmentTable)
      .select("*")
      .eq("platform", platform)
      .eq("hospital_id_rd", hospitalIdRd);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return cleanData<Treatment>(data);
  } catch (error) {
    console.error("병원 시술 데이터 로드 실패:", error);
    return [];
  }
}

// 병원 시술 목록 조회 (treatment_master) - hospital_id_rd만으로 조회
export async function loadTreatmentsByHospitalIdRd(
  hospitalIdRd: number
): Promise<Treatment[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const treatmentTable = getTreatmentTableName();
    const { data, error } = await client
      .from(treatmentTable)
      .select("*")
      .eq("hospital_id_rd", hospitalIdRd);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return cleanData<Treatment>(data);
  } catch (error) {
    console.error("병원 시술 데이터 로드 실패:", error);
    return [];
  }
}

// 병원 데이터 페이지네이션 로드
export async function loadHospitalsPaginated(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    searchTerm?: string;
    category?: string;
    randomOrder?: boolean; // 랜덤 정렬 옵션
  }
): Promise<{ data: HospitalMaster[]; total: number; hasMore: boolean }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return { data: [], total: 0, hasMore: false };
    }

    let query = client
      .from(TABLE_NAMES.HOSPITAL_MASTER)
      .select("*", { count: "exact" });

    // 필터 적용 (최소 2글자 이상일 때만 검색)
    if (filters?.searchTerm && filters.searchTerm.trim().length >= 2) {
      const term = filters.searchTerm.toLowerCase().trim();
      query = query.ilike("hospital_name", `%${term}%`);
    } else if (filters?.searchTerm && filters.searchTerm.trim().length === 1) {
      // 1글자일 때는 검색하지 않음 (빈 결과 반환)
      return { data: [], total: 0, hasMore: false };
    }

    let data, error, count;

    // 랜덤 정렬인 경우: 전체 데이터를 로드한 후 클라이언트에서 페이지네이션
    // 클라이언트(브라우저)에서 실행되므로 서버 메모리 사용 없음
    if (filters?.randomOrder) {
      // 전체 데이터 로드 (페이지네이션 없이)
      // 필터가 있으면 필터링된 결과만 로드
      const result = await query;
      data = result.data;
      error = result.error;
      count = result.count;

      if (error) {
        throw new Error(`Supabase 오류: ${error.message}`);
      }

      if (!data) {
        return { data: [], total: 0, hasMore: false };
      }

      const cleanedData = cleanData<HospitalMaster>(data);
      // 전체 데이터 랜덤 정렬 (클라이언트에서 실행되므로 서버 메모리 사용 없음)
      const shuffledData = shuffleArray(cleanedData);

      // 클라이언트에서 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = shuffledData.slice(from, to);
      const total = count || shuffledData.length;
      const hasMore = to < shuffledData.length;

      return { data: paginatedData, total, hasMore };
    } else {
      // 일반 정렬: 서버에서 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const result = await query.range(from, to);
      data = result.data;
      error = result.error;
      count = result.count;

      if (error) {
        throw new Error(`Supabase 오류: ${error.message}`);
      }

      if (!data) {
        return { data: [], total: 0, hasMore: false };
      }

      const cleanedData = cleanData<HospitalMaster>(data);
      // 플랫폼 우선순위 정렬
      const sortedData = sortHospitalsByPlatform(cleanedData);

      const total = count || 0;
      const hasMore = to < total - 1;

      return { data: sortedData, total, hasMore };
    }
  } catch (error) {
    console.error("병원 데이터 페이지네이션 로드 실패:", error);
    throw error;
  }
}

// 병원명 자동완성
export async function getHospitalAutocomplete(
  searchTerm: string,
  limit: number = 10
): Promise<string[]> {
  try {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const client = getSupabaseOrNull();
    if (!client) return [];

    const term = searchTerm.toLowerCase();
    const { data, error } = await client
      .from(TABLE_NAMES.HOSPITAL_MASTER)
      .select("hospital_name")
      .ilike("hospital_name", `%${term}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return Array.from(
      new Set(
        data
          .map((h: { hospital_name: string | null }) => h.hospital_name)
          .filter((name: string | null): name is string => !!name)
      )
    );
  } catch (error) {
    console.error("병원 자동완성 데이터 로드 실패:", error);
    return [];
  }
}

// 키워드 월별 트렌드 데이터 로드
export async function loadKeywordMonthlyTrends(filters?: {
  country?: string; // 국가 필터 (korea, china, japan, usa, all 등)
  limit?: number; // 최대 개수
}): Promise<KeywordMonthlyTrend[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    let query = client.from(TABLE_NAMES.KEYWORD_MONTHLY_TRENDS).select("*");

    // 국가별 평균 컬럼 기준으로 정렬
    // 주의: Avg_KR 컬럼이 없을 수 있으므로 한국은 Avg_CN으로 fallback
    let orderColumn = "Avg_CN"; // 기본값: 중국 평균
    if (filters?.country) {
      switch (filters.country) {
        case "china":
          orderColumn = "Avg_CN";
          break;
        case "japan":
          orderColumn = "Avg_JP";
          break;
        case "usa":
          orderColumn = "Avg_EN";
          break;
        case "korea":
          // Avg_KR이 없을 수 있으므로 Avg_CN 사용 (나중에 클라이언트에서 처리)
          orderColumn = "Avg_CN";
          break;
        case "all":
        default:
          // 전체일 때는 모든 국가 평균의 합계를 계산하기 위해 Avg_CN 사용 (나중에 클라이언트에서 합산)
          orderColumn = "Avg_CN";
          break;
      }
    }

    // 국가별 평균 기준으로 내림차순 정렬
    // null 값이 많은 경우를 대비해 nullsLast로 설정
    query = query.order(orderColumn, { ascending: false, nullsFirst: false });

    // limit 적용
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[loadKeywordMonthlyTrends] Supabase 오류:`, error);
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      console.warn(
        `[loadKeywordMonthlyTrends] 데이터가 없거나 배열이 아닙니다.`,
        data
      );
      return [];
    }

    console.log(
      `[loadKeywordMonthlyTrends] 로드된 데이터 수: ${data.length}, 정렬 컬럼: ${orderColumn}`
    );
    if (data.length > 0) {
      const firstItem = data[0];
      console.log(
        `[loadKeywordMonthlyTrends] 첫 번째 데이터 샘플 (전체):`,
        firstItem
      );
      console.log(
        `[loadKeywordMonthlyTrends] 첫 번째 데이터 키 목록:`,
        Object.keys(firstItem)
      );
      console.log(`[loadKeywordMonthlyTrends] 첫 번째 데이터 상세:`, {
        keyword: firstItem.keyword,
        keyword_type: typeof firstItem.keyword,
        keyword_exists: "keyword" in firstItem,
        Avg_CN: firstItem.Avg_CN,
        Avg_JP: firstItem.Avg_JP,
        Avg_EN: firstItem.Avg_EN,
        month: firstItem.month,
      });
    }

    return cleanData<KeywordMonthlyTrend>(data);
  } catch (error) {
    console.error("키워드 트렌드 데이터 로드 실패:", error);
    throw error;
  }
}

// keyword_kr로 category_mid 찾기
export async function getCategoryMidByKeyword(
  keyword: string
): Promise<string | null> {
  try {
    if (!keyword) return null;

    const recoveryData = await loadCategoryTreatTimeRecovery();
    const keywordTrimmed = keyword.trim();

    // keyword_kr 컬럼과 정확히 일치하는 항목 찾기
    const matched = recoveryData.find((item) => {
      const keywordKr = (item.keyword_kr || "").trim();
      return keywordKr === keywordTrimmed;
    });

    if (matched) {
      // 중분류 또는 category_mid 반환
      return matched.중분류 || matched.category_mid || null;
    }

    return null;
  } catch (error) {
    console.error("키워드로 category_mid 찾기 실패:", error);
    return null;
  }
}

// 국가별 인기 키워드 가져오기 (상위 N개)
// Avg_CN, Avg_JP, Avg_EN 컬럼을 기준으로 국가별 인기 키워드 반환
// 추천 시술이 있는 키워드만 필터링하여 반환
export interface PopularKeyword {
  translated: string; // 번역된 키워드 (표시용)
  original: string; // 한국어 키워드 (category_mid 찾기용)
}

export async function getPopularKeywordsByCountry(
  country: string = "all",
  limit: number = 6,
  language: "KR" | "EN" | "JP" | "CN" = "KR"
): Promise<PopularKeyword[]> {
  try {
    // 추천 시술 필터링을 위해 충분한 데이터 필요
    const loadLimit = limit * 20; // 충분히 많이 로드하여 필터링 후에도 limit 개수 확보

    // 국가별 평균 기준으로 정렬된 데이터 가져오기
    // 한국의 경우 정렬 컬럼은 Avg_CN 사용 (실제 점수는 모든 국가 합산)
    const trends = await loadKeywordMonthlyTrends({
      country: country === "korea" ? "all" : country, // 한국은 전체 데이터 가져오기
      limit: loadLimit,
    });

    console.log(
      `[getPopularKeywordsByCountry] 국가: ${country}, 언어: ${language}, 로드된 트렌드 수: ${trends.length}`
    );

    // 키워드별로 그룹화하고 국가별 평균값 합산 (같은 키워드가 여러 월에 있을 수 있음)
    const keywordMap = new Map<
      string,
      { score: number; krKeyword: string; translatedKeyword: string }
    >();

    // 한국어 키워드는 KR 컬럼에서 가져옴
    for (const trend of trends) {
      // KR 컬럼에서 한국어 키워드 가져오기
      const krKeyword = trend.KR || trend.keyword || null;

      if (krKeyword && typeof krKeyword === "string" && krKeyword.trim()) {
        let score = 0;

        if (country === "all" || country === "korea") {
          // 전체 또는 한국: 모든 국가 평균의 합계
          score =
            (trend.Avg_CN || 0) + (trend.Avg_JP || 0) + (trend.Avg_EN || 0);
        } else {
          // 특정 국가일 때는 해당 국가 평균값 사용
          switch (country) {
            case "china":
              score = trend.Avg_CN || 0;
              break;
            case "japan":
              score = trend.Avg_JP || 0;
              break;
            case "usa":
              score = trend.Avg_EN || 0;
              break;
            default:
              score = 0;
          }
        }

        if (score > 0) {
          // 언어에 맞는 번역된 키워드 가져오기
          let translatedKeyword = krKeyword; // 기본값은 한국어
          if (language === "EN" && trend.EN) {
            translatedKeyword = trend.EN;
          } else if (language === "CN" && trend.CN) {
            translatedKeyword = trend.CN;
          } else if (language === "JP" && trend.JP) {
            translatedKeyword = trend.JP;
          }

          const existing = keywordMap.get(krKeyword);
          if (existing) {
            existing.score += score;
            // 번역된 키워드 업데이트 (더 높은 점수의 번역 사용)
            if (score > existing.score - score) {
              existing.translatedKeyword = translatedKeyword;
            }
          } else {
            keywordMap.set(krKeyword, {
              score,
              krKeyword,
              translatedKeyword,
            });
          }
        }
      }
    }

    console.log(
      `[getPopularKeywordsByCountry] 키워드 맵 크기: ${keywordMap.size}`
    );

    // 추천 시술이 있는 키워드만 필터링
    const keywordsWithCategoryMid: Array<{
      krKeyword: string;
      translatedKeyword: string;
      score: number;
    }> = [];

    for (const [krKeyword, data] of keywordMap.entries()) {
      // category_mid가 있는지 확인
      const categoryMid = await getCategoryMidByKeyword(krKeyword);
      if (categoryMid) {
        keywordsWithCategoryMid.push(data);
      }
    }

    console.log(
      `[getPopularKeywordsByCountry] 추천 시술이 있는 키워드 수: ${keywordsWithCategoryMid.length}`
    );

    // 점수 기준으로 정렬하고 상위 N개 반환 (번역된 키워드와 한국어 키워드 함께 반환)
    const sortedKeywords = keywordsWithCategoryMid
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        translated: item.translatedKeyword,
        original: item.krKeyword,
      }));

    console.log(
      `[getPopularKeywordsByCountry] 최종 키워드 수: ${sortedKeywords.length}`,
      sortedKeywords
    );

    return sortedKeywords;
  } catch (error) {
    console.error("국가별 인기 키워드 로드 실패:", error);
    return [];
  }
}

// 모든 테이블 데이터를 한 번에 로드
export async function loadAllData() {
  try {
    const [treatments, categoryData, hospitals, trends] = await Promise.all([
      loadTreatments(),
      loadCategoryTreatTimeRecovery(),
      loadHospitalMaster(),
      loadKeywordMonthlyTrends(),
    ]);

    return {
      treatments,
      categoryTreatTimeRecovery: categoryData,
      hospitals,
      keywordTrends: trends,
    };
  } catch (error) {
    console.error("전체 데이터 로드 실패:", error);
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

  // data URI로 플레이스홀더 생성 (외부 서비스 의존성 제거)
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23${color}" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="48" font-weight="bold"%3E${encodeURIComponent(
    firstChar
  )}%3C/text%3E%3C/svg%3E`;
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
  averageRecoveryPeriodMin: number;
  averageRecoveryPeriodMax: number;
  averageProcedureTime: number;
  averageProcedureTimeMin: number;
  averageProcedureTimeMax: number;
}

// 대분류 카테고리 매핑 (사용자 선택 카테고리 -> API 카테고리)
// 이 매핑은 UI에서 사용하는 카테고리 이름을 실제 데이터베이스의 category_large 값으로 변환합니다.
export const CATEGORY_MAPPING: Record<string, string[]> = {
  눈성형: ["눈", "눈성형"],
  리프팅: ["리프팅", "윤곽", "볼륨"],
  보톡스: ["보톡스", "주사"],
  "안면윤곽/양악": ["안면", "윤곽", "양악", "턱"],
  제모: ["제모", "레이저"],
  지방성형: ["지방", "체형", "다이어트", "지방흡입"],
  코성형: ["코", "코성형"],
  피부: ["피부", "피부관리"],
  필러: ["필러", "주사"],
  가슴성형: ["가슴", "유방", "보형물"],
  기타: ["기타"], // 다른 카테고리에 속하지 않는 것만
  전체: [], // 모든 카테고리 포함
};

export async function getScheduleBasedRecommendations(
  treatments: Treatment[],
  categoryLarge: string,
  startDate: string,
  endDate: string
): Promise<ScheduleBasedRecommendation[]> {
  console.log(
    `🚀 [일정 기반 추천 시작] 입력 데이터: ${treatments.length}개 시술, 카테고리: "${categoryLarge}"`
  );

  // 여행 일수 계산
  const start = new Date(startDate);
  const end = new Date(endDate);
  const travelDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // n박 n일

  // 아주 짧은 일정(당일 or 1박 2일)일 때는,
  // 회복친화적인 3일짜리 시술까지는 보여주기 위해
  // 필터 기준을 최소 3일로 완화
  // const effectiveTravelDays = travelDays <= 2 ? 3 : travelDays;
  const effectiveTravelDays = travelDays; // 임시: 1박2일에서 3일짜리 포함 로직 주석 처리 (확인용)

  console.log(
    `📅 [여행 일수 계산] 시작: ${startDate}, 종료: ${endDate}, 여행일수: ${travelDays}일, effectiveTravelDays: ${effectiveTravelDays}일`
  );

  // 대분류 카테고리로 필터링
  const mappedCategories = CATEGORY_MAPPING[categoryLarge] || [categoryLarge];
  console.log(
    `🔍 [카테고리 매핑] "${categoryLarge}" → 매핑된 카테고리:`,
    mappedCategories
  );

  const categoryFiltered = treatments.filter((t) => {
    if (!t.category_large) return false;

    // 디버깅: 피부관리 중분류 확인
    if (t.category_mid === "피부관리") {
      console.log(
        `🔍 [피부관리 대분류 필터링] category_large: "${t.category_large}", category_mid: "${t.category_mid}", 선택된 대분류: "${categoryLarge}"`
      );
    }

    // "전체"인 경우 모든 시술 포함
    if (categoryLarge === "전체") {
      return true;
    }

    // "기타"인 경우: 다른 카테고리에 속하지 않는 것만
    if (categoryLarge === "기타") {
      const allOtherCategories = [
        "눈",
        "눈성형",
        "리프팅",
        "윤곽",
        "볼륨",
        "보톡스",
        "주사",
        "안면",
        "양악",
        "턱",
        "제모",
        "레이저",
        "지방",
        "체형",
        "다이어트",
        "지방흡입",
        "코",
        "코성형",
        "피부",
        "피부관리",
        "필러",
        "가슴",
        "유방",
        "보형물",
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

    // 일반 카테고리: category_large와 category_mid 모두 확인
    // category_large 또는 category_mid가 매핑된 카테고리 중 하나와 일치하는 경우 포함
    const categoryLargeLower = (t.category_large || "").toLowerCase();
    const categoryMidLower = (t.category_mid || "").toLowerCase();

    // category_large가 매핑된 카테고리 중 하나와 일치하는 경우
    const matchesLarge = mappedCategories.some((mapped) => {
      const mappedLower = mapped.toLowerCase();
      return categoryLargeLower.includes(mappedLower);
    });

    if (matchesLarge) {
      return true;
    }

    // category_mid도 확인 (예: "피부관리" 중분류는 "피부" 대분류 선택 시 포함되어야 함)
    const matchesMid = mappedCategories.some((mapped) => {
      const mappedLower = mapped.toLowerCase();
      return categoryMidLower.includes(mappedLower);
    });

    if (matchesMid) {
      return true;
    }

    return false;
  });

  console.log(
    `✅ [대분류 필터링 완료] 선택 카테고리: "${categoryLarge}", 여행일수: ${effectiveTravelDays}일, 필터링된 데이터: ${categoryFiltered.length}개 (전체 ${treatments.length}개 중)`
  );

  // 디버깅: 모든 카테고리에 대한 필터링 결과 확인
  const categoryMids = new Set<string>();
  categoryFiltered.forEach((t) => {
    if (t.category_mid) categoryMids.add(t.category_mid);
    if (t.category_large)
      console.log(
        `  - category_large: "${t.category_large}", category_mid: "${
          t.category_mid || "없음"
        }"`
      );
  });

  console.log(
    `🔍 [중분류 목록] 필터링된 시술의 중분류들 (${categoryMids.size}개):`,
    Array.from(categoryMids).slice(0, 20)
  );

  // "피부" 카테고리 특별 로그
  if (categoryLarge === "피부") {
    const pibuCategoryMids = new Set<string>();
    categoryFiltered.forEach((t) => {
      if (t.category_mid) pibuCategoryMids.add(t.category_mid);
    });
    console.log(
      `🔍 [피부 카테고리 상세] 총 ${categoryFiltered.length}개 시술, 중분류 (${pibuCategoryMids.size}개):`,
      Array.from(pibuCategoryMids)
    );

    // "피부관리" 중분류가 있는지 확인
    if (pibuCategoryMids.has("피부관리")) {
      const pibuGwanriCount = categoryFiltered.filter(
        (t) => t.category_mid === "피부관리"
      ).length;
      console.log(`✅ [피부관리 발견] ${pibuGwanriCount}개 시술 발견!`);
    } else {
      console.warn(
        `❌ [피부관리 없음] 필터링된 시술 중 "피부관리" 중분류가 없습니다!`
      );
    }
  }

  // 중분류별로 그룹화 (대분류 + 중분류 조합으로 키 생성하여 중복 방지)
  const midCategoryMap = new Map<string, Treatment[]>();

  // "정맥주사" 중복 확인을 위한 디버깅
  const jeongmaekjusaTreatments: Array<{
    categoryLarge: string;
    categoryMid: string;
    treatmentName: string;
    treatmentId: number | undefined;
    selectedCategory: string;
  }> = [];

  categoryFiltered.forEach((treatment) => {
    const categoryLarge = treatment.category_large || "";
    const midCategory = treatment.category_mid || "기타";

    // "정맥주사" 데이터 수집 (선택된 카테고리 정보 포함)
    if (midCategory === "정맥주사" || midCategory.includes("정맥주사")) {
      jeongmaekjusaTreatments.push({
        categoryLarge,
        categoryMid: midCategory,
        treatmentName: treatment.treatment_name || "이름 없음",
        treatmentId: treatment.treatment_id,
        selectedCategory: categoryLarge,
      });
    }

    // 대분류와 중분류를 조합하여 고유 키 생성
    const uniqueKey = `${categoryLarge}::${midCategory}`;

    if (!midCategoryMap.has(uniqueKey)) {
      midCategoryMap.set(uniqueKey, []);
    }
    midCategoryMap.get(uniqueKey)!.push(treatment);
  });

  // 디버깅: "피부" 카테고리 선택 시 중분류별 그룹화 결과
  if (categoryLarge === "피부") {
    console.log(
      `🔍 [피부 중분류 그룹화] 총 ${midCategoryMap.size}개 중분류 그룹:`,
      Array.from(midCategoryMap.keys())
        .filter((k) => k.includes("피부"))
        .slice(0, 10)
    );
  }

  // "정맥주사" 중복 확인 로그 - 각 대분류별로 다른 시술인지 확인
  if (jeongmaekjusaTreatments.length > 0) {
    const categoryLargeSet = new Set(
      jeongmaekjusaTreatments.map((t) => t.categoryLarge)
    );
    console.log("🔍 [정맥주사 데이터 분석]");
    console.log(`- 선택된 카테고리: ${categoryLarge}`);
    console.log(
      `- 총 ${jeongmaekjusaTreatments.length}개의 정맥주사 시술 발견`
    );
    console.log(
      `- 속한 대분류(category_large): ${Array.from(categoryLargeSet).join(
        ", "
      )}`
    );
    console.log(`- 대분류 개수: ${categoryLargeSet.size}개`);

    // 대분류별로 그룹화하여 상세 정보 출력
    const byCategory = new Map<
      string,
      {
        count: number;
        treatments: Array<{ name: string; id: number | undefined }>;
      }
    >();
    jeongmaekjusaTreatments.forEach((t) => {
      const existing = byCategory.get(t.categoryLarge) || {
        count: 0,
        treatments: [],
      };
      existing.count += 1;
      existing.treatments.push({ name: t.treatmentName, id: t.treatmentId });
      byCategory.set(t.categoryLarge, existing);
    });

    // 각 대분류별 시술 목록 출력
    byCategory.forEach((data, cat) => {
      console.log(`\n📋 [${cat}] 대분류의 정맥주사 시술 (${data.count}개):`);
      const treatmentNames = data.treatments.map((t) => t.name);
      const treatmentIds = data.treatments
        .map((t) => t.id)
        .filter((id) => id !== undefined);
      console.log(
        `  시술명: ${treatmentNames.slice(0, 5).join(", ")}${
          treatmentNames.length > 5
            ? ` ... 외 ${treatmentNames.length - 5}개`
            : ""
        }`
      );
      console.log(
        `  시술 ID: ${treatmentIds.slice(0, 5).join(", ")}${
          treatmentIds.length > 5 ? ` ... 외 ${treatmentIds.length - 5}개` : ""
        }`
      );
    });

    // 중복 시술 확인 (같은 시술 ID가 여러 대분류에 있는지)
    const allTreatmentIds = new Map<number, string[]>();
    jeongmaekjusaTreatments.forEach((t) => {
      if (t.treatmentId !== undefined) {
        const existing = allTreatmentIds.get(t.treatmentId) || [];
        if (!existing.includes(t.categoryLarge)) {
          existing.push(t.categoryLarge);
        }
        allTreatmentIds.set(t.treatmentId, existing);
      }
    });

    const duplicateTreatments: Array<{
      id: number;
      name: string;
      categories: string[];
    }> = [];
    allTreatmentIds.forEach((categories, id) => {
      if (categories.length > 1) {
        const treatment = jeongmaekjusaTreatments.find(
          (t) => t.treatmentId === id
        );
        if (treatment) {
          duplicateTreatments.push({
            id,
            name: treatment.treatmentName,
            categories,
          });
        }
      }
    });

    if (duplicateTreatments.length > 0) {
      console.error(
        "❌ [문제 발견] 같은 시술이 여러 대분류에 중복되어 있습니다:"
      );
      duplicateTreatments.forEach((d) => {
        console.error(
          `  - 시술 ID ${d.id} (${d.name}): ${d.categories.join(
            ", "
          )} 대분류에 중복`
        );
      });
      console.error(
        "💡 이는 필터링 로직 문제로 인해 발생할 수 있습니다. 각 대분류별로 다른 시술이 표시되어야 합니다."
      );
    } else {
      console.log("✅ 각 대분류별로 다른 시술이 표시되고 있습니다.");
    }

    if (categoryLargeSet.size > 1) {
      console.warn(
        "⚠️ 정맥주사가 여러 대분류에 속해있습니다:",
        Array.from(categoryLargeSet)
      );
      console.log(
        "💡 이는 데이터 상에서 '정맥주사' 중분류가 실제로 여러 대분류에 속해있기 때문입니다."
      );
    }
  }

  // 중분류별로 추천 데이터 생성
  const recommendationsPromises = Array.from(midCategoryMap.entries()).map(
    async ([
      uniqueKey,
      treatmentList,
    ]): Promise<ScheduleBasedRecommendation | null> => {
      // uniqueKey에서 중분류 이름만 추출 (대분류::중분류 형식)
      // ⚠️ 중요: treatment_master의 category_mid와 정확히 일치해야 함
      const categoryMid = uniqueKey.split("::")[1] || "기타";

      // 디버깅: category_mid 정확 일치 확인
      const allCategoryMidsInGroup = new Set(
        treatmentList.map((t) => t.category_mid || "").filter(Boolean)
      );
      if (
        allCategoryMidsInGroup.size > 1 ||
        !allCategoryMidsInGroup.has(categoryMid)
      ) {
        console.warn(
          `⚠️ [중분류 그룹 불일치] uniqueKey: "${uniqueKey}", categoryMid: "${categoryMid}", 실제 category_mid들:`,
          Array.from(allCategoryMidsInGroup)
        );
      }

      // 먼저 category_treattime_recovery 테이블에서 권장체류일수 및 회복기간 범위 가져오기
      // ⚠️ 중요: 정확히 같은 category_mid로만 매칭 (부분 일치 제거)
      let recommendedStayDays = 0;
      let recoveryMin = 0;
      let recoveryMax = 0;
      let procedureTimeMin = 0;
      let procedureTimeMax = 0;
      try {
        const recoveryInfo = await getRecoveryInfoByCategoryMid(categoryMid);
        if (recoveryInfo) {
          recoveryMin = recoveryInfo.recoveryMin;
          recoveryMax = recoveryInfo.recoveryMax;
          procedureTimeMin = recoveryInfo.procedureTimeMin;
          procedureTimeMax = recoveryInfo.procedureTimeMax;
          recommendedStayDays = recoveryInfo.recommendedStayDays;

          // 디버깅: 모든 중분류에 대한 매칭 결과 로그
          console.log(
            `📊 [중분류 매칭] "${categoryMid}": 권장체류일수=${recommendedStayDays}일, 시술수=${treatmentList.length}개`
          );
        } else {
          console.warn(
            `⚠️ [중분류 매칭 실패] "${categoryMid}": category_treattime_recovery에서 찾을 수 없음, 시술수=${treatmentList.length}개`
          );
        }
      } catch (error) {
        console.warn(
          `회복 기간 정보 로드 실패 (category_mid: ${categoryMid}):`,
          error
        );
      }

      // 권장체류일수(일)만 사용하여 여행 기간에 맞는 시술만 필터링
      // - 결정 기준은 category_treattime_recovery 테이블의 "권장체류일수(일)" 컬럼
      // - 이 값이 없을 때만 기존 로직(downtime)으로 fallback
      const groupStayDays = recommendedStayDays;

      // 디버깅: 피부관리 카테고리 확인
      if (categoryMid === "피부관리") {
        console.log(
          `🔍 [피부관리 디버깅] category_mid: "${categoryMid}", 권장체류일수: ${groupStayDays}, effectiveTravelDays: ${effectiveTravelDays}, 여행일수: ${effectiveTravelDays}일`
        );
      }

      // 권장체류일수가 여행 일수보다 크면, 이 중분류 전체를 추천에서 제외
      // 단, 당일/1박 2일은 effectiveTravelDays=3으로 간주하여 3일짜리 시술까지 허용
      // (임시 주석 처리: 1박2일에서 3일짜리 포함 로직 비활성화)
      if (groupStayDays > 0 && groupStayDays > effectiveTravelDays) {
        console.log(
          `❌ [필터링 제외] "${categoryMid}": 권장체류일수 ${groupStayDays}일 > 여행일수 ${effectiveTravelDays}일로 제외됨`
        );
        return null;
      }

      // 권장체류일수가 0이 아니고 여행일수 이하이면 포함 (로그 추가)
      if (groupStayDays > 0) {
        console.log(
          `✅ [필터링 포함] "${categoryMid}": 권장체류일수 ${groupStayDays}일 <= 여행일수 ${effectiveTravelDays}일로 포함됨`
        );
      }

      let suitableTreatments: Treatment[];
      if (groupStayDays > 0) {
        // 권장체류일수가 여행 일수 이내면 해당 중분류 전체를 포함
        if (categoryMid === "피부관리") {
          console.log(
            `✅ [피부관리 포함] 권장체류일수 ${groupStayDays}일 <= 여행일수 ${effectiveTravelDays}일, 시술 ${treatmentList.length}개 포함`
          );
        }
        suitableTreatments = treatmentList;
      } else {
        // 권장체류일수가 없으면 기존 로직 사용 (downtime 기반)
        suitableTreatments = treatmentList.filter((treatment) => {
          const recoveryPeriod = parseRecoveryPeriod(treatment.downtime);
          // 회복기간 정보가 없으면 포함 (기본적으로 표시)
          if (recoveryPeriod === 0) return true;
          // 여행 일수에서 최소 1일은 여유를 둠 (시술 당일 제외)
          // 당일/1박 2일의 경우 effectiveTravelDays=3이므로 2일까지 허용
          // (임시 주석 처리: 1박2일에서 3일짜리 포함 로직 비활성화)
          return recoveryPeriod <= effectiveTravelDays - 1;
        });
      }

      // 필터링 결과가 없거나 회복기간 정보가 없으면 전체 시술 표시 (최대 20개)
      // 권장체류일수 또는 개별 downtime 정보가 있는 경우에만 필터링 적용
      const hasRecoveryData =
        recommendedStayDays > 0 ||
        treatmentList.some((t) => parseRecoveryPeriod(t.downtime) > 0);

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
              .slice(0, 20); // 최대 20개

      // 회복 기간 정보가 없으면 downtime에서 계산
      if (recoveryMin === 0 && recoveryMax === 0) {
        const recoveryPeriods = finalTreatments
          .map((t) => parseRecoveryPeriod(t.downtime))
          .filter((r) => r > 0);
        if (recoveryPeriods.length > 0) {
          recoveryMin = Math.min(...recoveryPeriods);
          recoveryMax = Math.max(...recoveryPeriods);
        }
      }

      // 시술 시간 정보가 없으면 surgery_time에서 계산
      if (procedureTimeMin === 0 && procedureTimeMax === 0) {
        const procedureTimes = finalTreatments
          .map((t) => parseProcedureTime(t.surgery_time))
          .filter((t) => t > 0);
        if (procedureTimes.length > 0) {
          procedureTimeMin = Math.min(...procedureTimes);
          procedureTimeMax = Math.max(...procedureTimes);
        }
      }

      // 평균 회복 기간 계산 (표시용)
      const recoveryPeriods = finalTreatments
        .map((t) => parseRecoveryPeriod(t.downtime))
        .filter((r) => r > 0);
      const averageRecoveryPeriod =
        recoveryPeriods.length > 0
          ? recoveryPeriods.reduce((sum, r) => sum + r, 0) /
            recoveryPeriods.length
          : recoveryMax > 0
          ? (recoveryMin + recoveryMax) / 2
          : 0;

      // 평균 시술 시간 계산 (표시용)
      const procedureTimes = finalTreatments
        .map((t) => parseProcedureTime(t.surgery_time))
        .filter((t) => t > 0);
      const averageProcedureTime =
        procedureTimes.length > 0
          ? procedureTimes.reduce((sum, t) => sum + t, 0) /
            procedureTimes.length
          : procedureTimeMax > 0
          ? (procedureTimeMin + procedureTimeMax) / 2
          : 0;

      // 추천 점수로 정렬
      const sortedTreatments = finalTreatments
        .map((treatment) => ({
          ...treatment,
          recommendationScore: calculateRecommendationScore(treatment),
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      const result = {
        categoryMid,
        treatments: sortedTreatments,
        averageRecoveryPeriod: Math.round(averageRecoveryPeriod * 10) / 10,
        averageRecoveryPeriodMin: recoveryMin,
        averageRecoveryPeriodMax: recoveryMax,
        averageProcedureTime: Math.round(averageProcedureTime),
        averageProcedureTimeMin: procedureTimeMin,
        averageProcedureTimeMax: procedureTimeMax,
      };

      // 디버깅: 최종 결과 로그
      console.log(
        `✅ [최종 추천] "${categoryMid}": ${sortedTreatments.length}개 시술 포함, 권장체류일수=${recommendedStayDays}일, 여행일수=${effectiveTravelDays}일`
      );

      return result;
    }
  );

  const recommendations = (await Promise.all(recommendationsPromises)).filter(
    (rec): rec is ScheduleBasedRecommendation => rec !== null
  );

  console.log(
    `📋 [일정 기반 추천 완료] 총 ${recommendations.length}개 중분류 추천 생성됨 (여행일수: ${effectiveTravelDays}일)`
  );

  const filteredRecommendations = recommendations.filter(
    (rec) => rec.treatments.length > 0
  ); // 시술이 있는 중분류만

  console.log(
    `📋 [최종 필터링] 시술이 있는 중분류: ${filteredRecommendations.length}개`
  );

  if (categoryLarge === "피부") {
    console.log(
      `🔍 [피부 최종 결과] 중분류 목록:`,
      filteredRecommendations.map((r) => ({
        중분류: r.categoryMid,
        시술수: r.treatments.length,
      }))
    );
  }

  return filteredRecommendations.sort((a, b) => {
    // 1순위: 인기 점수(가장 상위 시술의 recommendationScore) 높은 순
    const scoreA = a.treatments[0]?.recommendationScore || 0;
    const scoreB = b.treatments[0]?.recommendationScore || 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 2순위: 평균 회복 기간이 짧은 순 (동점일 때 여행 친화적인 순서)
    if (a.averageRecoveryPeriod !== b.averageRecoveryPeriod) {
      return a.averageRecoveryPeriod - b.averageRecoveryPeriod;
    }

    return 0;
  });
}

// 플랫폼 우선순위 (높을수록 우선)
const PLATFORM_PRIORITY: Record<string, number> = {
  gangnamunni: 3,
  yeoti: 2,
  babitalk: 1,
};

// 플랫폼 우선순위에 따라 정렬 (gangnamunni → yeoti → babitalk 순서)
export function sortTreatmentsByPlatform(treatments: Treatment[]): Treatment[] {
  return [...treatments].sort((a, b) => {
    const platformA = (a.platform || "").toLowerCase();
    const platformB = (b.platform || "").toLowerCase();
    const priorityA = PLATFORM_PRIORITY[platformA] || 0;
    const priorityB = PLATFORM_PRIORITY[platformB] || 0;

    // 우선순위가 높은 것이 앞에 오도록 (내림차순)
    return priorityB - priorityA;
  });
}

// 병원 데이터도 플랫폼 우선순위에 따라 정렬
export function sortHospitalsByPlatform(
  hospitals: HospitalMaster[]
): HospitalMaster[] {
  return [...hospitals].sort((a, b) => {
    const platformA = (a.platform || "").toLowerCase();
    const platformB = (b.platform || "").toLowerCase();
    const priorityA = PLATFORM_PRIORITY[platformA] || 0;
    const priorityB = PLATFORM_PRIORITY[platformB] || 0;

    // 우선순위가 높은 것이 앞에 오도록 (내림차순)
    return priorityB - priorityA;
  });
}

// ============================================
// 후기 작성 관련 API 함수
// ============================================

// 시술후기 데이터 인터페이스
export interface ProcedureReviewData {
  id?: string; // UUID
  category: string;
  procedure_name: string;
  hospital_name?: string;
  cost?: number; // 비필수 항목으로 변경
  procedure_rating: number;
  hospital_rating: number;
  gender: "여" | "남";
  age_group: string;
  surgery_date?: string;
  content: string;
  images?: string[];
  user_id?: string; // Supabase Auth UUID
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// 병원후기 데이터 인터페이스
export interface HospitalReviewData {
  id?: string; // UUID
  hospital_name: string;
  category_large: string;
  procedure_name?: string;
  visit_date?: string;
  overall_satisfaction?: number;
  hospital_kindness?: number;
  has_translation?: boolean;
  translation_satisfaction?: number;
  content: string;
  images?: string[];
  user_id?: string; // Supabase Auth UUID
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// 고민글 데이터 인터페이스
export interface ConcernPostData {
  id?: string; // UUID (primary key)
  uuid?: string; // UUID (별도 컬럼, 실제 DB에 있는 경우)
  title: string;
  concern_category: string;
  content: string;
  image_paths?: string[]; // 이미지 URL 배열 (비필수)
  user_id?: string; // Supabase Auth UUID
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// 문의 데이터 인터페이스
export interface InquiryData {
  id?: string; // UUID
  inquiry_type: "chat" | "phone" | "email";
  treatment_id: number;
  treatment_name?: string;
  hospital_name?: string;
  hospital_phone?: string; // 전화 문의인 경우
  user_email?: string; // 메일 문의인 경우
  user_id?: string; // Supabase Auth UUID (선택적)
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// 시술후기 저장
export async function saveProcedureReview(
  data: ProcedureReviewData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // user_id가 없으면 현재 로그인한 사용자 ID 가져오기
    let userId = data.user_id;
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return {
        success: false,
        error: "로그인 후에만 시술 후기를 작성할 수 있습니다.",
      };
    }

    const reviewData = {
      user_id: userId, // ✅ 작성자 ID (UUID)
      category: data.category,
      procedure_name: data.procedure_name,
      hospital_name: data.hospital_name || null,
      cost: data.cost || null, // 비필수 항목 (NULL 허용)
      procedure_rating: data.procedure_rating,
      hospital_rating: data.hospital_rating,
      gender: data.gender,
      age_group: data.age_group,
      surgery_date: data.surgery_date || null,
      content: data.content,
      images: data.images && data.images.length > 0 ? data.images : null,
    };

    const { data: insertedData, error } = await supabase
      .from("procedure_reviews")
      .insert([reviewData])
      .select("id")
      .single();

    if (error) {
      console.error("시술후기 저장 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: insertedData?.id };
  } catch (error: any) {
    console.error("시술후기 저장 중 오류:", error);
    return {
      success: false,
      error: error?.message || "시술후기 저장에 실패했습니다.",
    };
  }
}

// 병원후기 저장
export async function saveHospitalReview(
  data: HospitalReviewData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // user_id가 없으면 현재 로그인한 사용자 ID 가져오기
    let userId = data.user_id;
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return {
        success: false,
        error: "로그인 후에만 병원 후기를 작성할 수 있습니다.",
      };
    }

    const reviewData = {
      user_id: userId, // ✅ 작성자 ID (UUID)
      hospital_name: data.hospital_name,
      category_large: data.category_large,
      procedure_name: data.procedure_name || null,
      visit_date: data.visit_date || null,
      overall_satisfaction: data.overall_satisfaction || null,
      hospital_kindness: data.hospital_kindness || null,
      has_translation: data.has_translation ?? false,
      translation_satisfaction:
        data.has_translation && data.translation_satisfaction
          ? data.translation_satisfaction
          : null,
      content: data.content,
      images: data.images && data.images.length > 0 ? data.images : null,
    };

    const { data: insertedData, error } = await supabase
      .from("hospital_reviews")
      .insert([reviewData])
      .select("id")
      .single();

    if (error) {
      console.error("병원후기 저장 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: insertedData?.id };
  } catch (error: any) {
    console.error("병원후기 저장 중 오류:", error);
    return {
      success: false,
      error: error?.message || "병원후기 저장에 실패했습니다.",
    };
  }
}

// 고민글 저장
export async function saveConcernPost(
  data: ConcernPostData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // user_id가 없으면 현재 로그인한 사용자 ID 가져오기
    let userId = data.user_id;
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return {
        success: false,
        error: "로그인 후에만 고민글을 작성할 수 있습니다.",
      };
    }

    const postData = {
      user_id: userId, // ✅ 작성자 ID (UUID)
      title: data.title,
      concern_category: data.concern_category,
      content: data.content,
      image_paths:
        data.image_paths && data.image_paths.length > 0
          ? data.image_paths
          : [],
    };

    const { data: insertedData, error } = await supabase
      .from("concern_posts")
      .insert([postData])
      .select("id")
      .single();

    if (error) {
      console.error("고민글 저장 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: insertedData?.id };
  } catch (error: any) {
    console.error("고민글 저장 중 오류:", error);
    return {
      success: false,
      error: error?.message || "고민글 저장에 실패했습니다.",
    };
  }
}

// 시술후기 수정
export async function updateProcedureReview(
  reviewId: string,
  data: ProcedureReviewData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 현재 로그인한 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "로그인 후에만 시술 후기를 수정할 수 있습니다.",
      };
    }

    // 작성자 확인
    const { data: existingReview, error: fetchError } = await supabase
      .from("procedure_reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !existingReview) {
      return {
        success: false,
        error: "후기를 찾을 수 없습니다.",
      };
    }

    if (existingReview.user_id !== user.id) {
      return {
        success: false,
        error: "본인이 작성한 후기만 수정할 수 있습니다.",
      };
    }

    const updateData: any = {
      category: data.category,
      procedure_name: data.procedure_name,
      hospital_name: data.hospital_name || null,
      cost: data.cost || null,
      procedure_rating: data.procedure_rating,
      hospital_rating: data.hospital_rating,
      gender: data.gender,
      age_group: data.age_group,
      surgery_date: data.surgery_date || null,
      content: data.content,
    };

    // 이미지가 제공된 경우에만 업데이트
    if (data.images !== undefined) {
      updateData.images = data.images && data.images.length > 0 ? data.images : null;
    }

    const { error } = await supabase
      .from("procedure_reviews")
      .update(updateData)
      .eq("id", reviewId);

    if (error) {
      console.error("시술후기 수정 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("시술후기 수정 중 오류:", error);
    return {
      success: false,
      error: error?.message || "시술후기 수정에 실패했습니다.",
    };
  }
}

// 병원후기 수정
export async function updateHospitalReview(
  reviewId: string,
  data: HospitalReviewData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 현재 로그인한 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "로그인 후에만 병원 후기를 수정할 수 있습니다.",
      };
    }

    // 작성자 확인
    const { data: existingReview, error: fetchError } = await supabase
      .from("hospital_reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !existingReview) {
      return {
        success: false,
        error: "후기를 찾을 수 없습니다.",
      };
    }

    if (existingReview.user_id !== user.id) {
      return {
        success: false,
        error: "본인이 작성한 후기만 수정할 수 있습니다.",
      };
    }

    const updateData: any = {
      hospital_name: data.hospital_name,
      category_large: data.category_large,
      procedure_name: data.procedure_name || null,
      visit_date: data.visit_date || null,
      overall_satisfaction: data.overall_satisfaction || null,
      hospital_kindness: data.hospital_kindness || null,
      has_translation: data.has_translation ?? false,
      translation_satisfaction:
        data.has_translation && data.translation_satisfaction
          ? data.translation_satisfaction
          : null,
      content: data.content,
    };

    // 이미지가 제공된 경우에만 업데이트
    if (data.images !== undefined) {
      updateData.images = data.images && data.images.length > 0 ? data.images : null;
    }

    const { error } = await supabase
      .from("hospital_reviews")
      .update(updateData)
      .eq("id", reviewId);

    if (error) {
      console.error("병원후기 수정 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("병원후기 수정 중 오류:", error);
    return {
      success: false,
      error: error?.message || "병원후기 수정에 실패했습니다.",
    };
  }
}

// 고민글 수정
export async function updateConcernPost(
  postId: string,
  data: ConcernPostData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 현재 로그인한 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "로그인 후에만 고민글을 수정할 수 있습니다.",
      };
    }

    // 작성자 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from("concern_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existingPost) {
      return {
        success: false,
        error: "고민글을 찾을 수 없습니다.",
      };
    }

    if (existingPost.user_id !== user.id) {
      return {
        success: false,
        error: "본인이 작성한 고민글만 수정할 수 있습니다.",
      };
    }

    const updateData: any = {
      title: data.title,
      concern_category: data.concern_category,
      content: data.content,
    };

    // 이미지가 제공된 경우에만 업데이트
    if (data.image_paths !== undefined) {
      updateData.image_paths = data.image_paths && data.image_paths.length > 0 ? data.image_paths : [];
    }

    const { error } = await supabase
      .from("concern_posts")
      .update(updateData)
      .eq("id", postId);

    if (error) {
      console.error("고민글 수정 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("고민글 수정 중 오류:", error);
    return {
      success: false,
      error: error?.message || "고민글 수정에 실패했습니다.",
    };
  }
}

// 시술후기 삭제
export async function deleteProcedureReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "로그인 후에만 시술 후기를 삭제할 수 있습니다.",
      };
    }

    // 작성자 확인
    const { data: existingReview, error: fetchError } = await supabase
      .from("procedure_reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !existingReview) {
      return {
        success: false,
        error: "후기를 찾을 수 없습니다.",
      };
    }

    if (existingReview.user_id !== user.id) {
      return {
        success: false,
        error: "본인이 작성한 후기만 삭제할 수 있습니다.",
      };
    }

    const { error } = await supabase
      .from("procedure_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("시술후기 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("시술후기 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "시술후기 삭제에 실패했습니다.",
    };
  }
}

// 병원후기 삭제
export async function deleteHospitalReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "로그인 후에만 병원 후기를 삭제할 수 있습니다.",
      };
    }

    // 작성자 확인
    const { data: existingReview, error: fetchError } = await supabase
      .from("hospital_reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !existingReview) {
      return {
        success: false,
        error: "후기를 찾을 수 없습니다.",
      };
    }

    if (existingReview.user_id !== user.id) {
      return {
        success: false,
        error: "본인이 작성한 후기만 삭제할 수 있습니다.",
      };
    }

    const { error } = await supabase
      .from("hospital_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("병원후기 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("병원후기 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "병원후기 삭제에 실패했습니다.",
    };
  }
}

// 고민글 삭제
export async function deleteConcernPost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "로그인 후에만 고민글을 삭제할 수 있습니다.",
      };
    }

    // 작성자 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from("concern_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existingPost) {
      return {
        success: false,
        error: "고민글을 찾을 수 없습니다.",
      };
    }

    if (existingPost.user_id !== user.id) {
      return {
        success: false,
        error: "본인이 작성한 고민글만 삭제할 수 있습니다.",
      };
    }

    const { error } = await supabase
      .from("concern_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("고민글 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("고민글 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "고민글 삭제에 실패했습니다.",
    };
  }
}

// 문의 저장 (메일 문의인 경우 Supabase에 저장)
export async function saveInquiry(
  data: InquiryData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    // 메일 문의인 경우에만 Supabase에 저장
    if (data.inquiry_type === "email") {
      // 현재 사용자 정보 가져오기 (선택적)
      let userId: string | null = data.user_id || null;
      if (!userId) {
        try {
          const {
            data: { session },
          } = await client.auth.getSession();
          if (session?.user) {
            userId = session.user.id;
          }
        } catch (authError) {
          // 인증 정보가 없어도 계속 진행 (비로그인 사용자도 문의 가능)
          console.log("로그인 정보를 가져올 수 없습니다:", authError);
        }
      }

      const inquiryData = {
        inquiry_type: data.inquiry_type,
        treatment_id: data.treatment_id,
        treatment_name: data.treatment_name || null,
        hospital_name: data.hospital_name || null,
        hospital_phone: data.hospital_phone || null,
        user_email: data.user_email || null,
        user_id: userId || null,
      };

      const { data: insertedData, error } = await client
        .from("inquiries")
        .insert([inquiryData])
        .select("id")
        .single();

      if (error) {
        console.error("문의 저장 실패:", error);
        // 테이블이 없을 수도 있으므로 에러를 반환하지 않고 로그만 남김
        console.warn(
          "inquiries 테이블이 없거나 저장에 실패했습니다. 테이블을 생성해주세요."
        );
        // 에러가 나도 mailto는 작동하므로 성공으로 처리
        return { success: true };
      }

      return { success: true, id: insertedData?.id };
    }

    // 전화 또는 AI 채팅 문의는 저장하지 않음 (로컬스토리지만 사용)
    return { success: true };
  } catch (error: any) {
    console.error("문의 저장 중 오류:", error);
    // 에러가 나도 mailto/tel 링크는 작동하므로 성공으로 처리
    return { success: true };
  }
}

// 시술 후기 목록 가져오기 (최신순)
export async function loadProcedureReviews(
  limit: number = 50
): Promise<ProcedureReviewData[]> {
  try {
    const { data, error } = await supabase
      .from("procedure_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 이미지 URL 처리 및 닉네임 추가
    const processedData = await Promise.all(
      data.map(async (review: any) => {
        if (review.images && Array.isArray(review.images)) {
          review.images = review.images.map((imgUrl: string) => {
            // 이미 전체 URL이면 그대로 반환
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              return imgUrl;
            }
            // Storage 경로인 경우 공개 URL로 변환
            if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("review_images").getPublicUrl(imgUrl);
              return publicUrl;
            }
            return imgUrl;
          });
        }
        // 닉네임 추가 (이메일의 @ 앞부분)
        review.nickname = await getUserNickname(review.user_id);
        return review;
      })
    );

    return processedData as ProcedureReviewData[];
  } catch (error) {
    console.error("시술 후기 로드 실패:", error);
    return [];
  }
}

// 병원 후기 목록 가져오기 (최신순)
export async function loadHospitalReviews(
  limit: number = 50
): Promise<HospitalReviewData[]> {
  try {
    const { data, error } = await supabase
      .from("hospital_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 이미지 URL 처리 및 닉네임 추가
    const processedData = await Promise.all(
      data.map(async (review: any) => {
        if (review.images && Array.isArray(review.images)) {
          review.images = review.images.map((imgUrl: string) => {
            // 이미 전체 URL이면 그대로 반환
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              return imgUrl;
            }
            // Storage 경로인 경우 공개 URL로 변환
            if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("review_images").getPublicUrl(imgUrl);
              return publicUrl;
            }
            return imgUrl;
          });
        }
        // 닉네임 추가 (이메일의 @ 앞부분)
        review.nickname = await getUserNickname(review.user_id);
        return review;
      })
    );

    return processedData as HospitalReviewData[];
  } catch (error) {
    console.error("병원 후기 로드 실패:", error);
    return [];
  }
}

// 고민글 목록 가져오기 (최신순)
export async function loadConcernPosts(
  limit: number = 50
): Promise<ConcernPostData[]> {
  try {
    const { data, error } = await supabase
      .from("concern_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 이미지 URL 처리 및 닉네임 추가
    const processedData = await Promise.all(
      data.map(async (post: any) => {
        // uuid가 있으면 id로 사용 (실제 DB 구조에 맞춤)
        if (post.uuid && !post.id) {
          post.id = post.uuid;
        }
        // id가 없으면 uuid를 id로 사용
        if (!post.id && post.uuid) {
          post.id = post.uuid;
        }
        
        // 이미지 URL 처리 (Storage 경로를 getPublicUrl로 변환)
        if (post.image_paths && Array.isArray(post.image_paths)) {
          post.image_paths = post.image_paths.map((imgUrl: string) => {
            // 이미 공개 URL이면 그대로 반환
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              return imgUrl;
            }
            // Storage 경로인 경우 getPublicUrl로 변환 (concern-images 버킷)
            if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("concern-images").getPublicUrl(imgUrl);
              return publicUrl;
            }
            return imgUrl;
          });
        }
        post.nickname = await getUserNickname(post.user_id);
        return post;
      })
    );

    return processedData as ConcernPostData[];
  } catch (error) {
    console.error("고민글 로드 실패:", error);
    return [];
  }
}

// 사용자가 작성한 시술 후기 가져오기
export async function loadMyProcedureReviews(
  userId: string
): Promise<ProcedureReviewData[]> {
  try {
    const { data, error } = await supabase
      .from("procedure_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 이미지 URL 처리 및 닉네임 추가
    const processedData = await Promise.all(
      data.map(async (review: any) => {
        if (review.images && Array.isArray(review.images)) {
          review.images = review.images.map((imgUrl: string) => {
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              return imgUrl;
            }
            if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("review_images").getPublicUrl(imgUrl);
              return publicUrl;
            }
            return imgUrl;
          });
        }
        review.nickname = await getUserNickname(review.user_id);
        return review;
      })
    );

    return processedData as ProcedureReviewData[];
  } catch (error) {
    console.error("내 시술 후기 로드 실패:", error);
    return [];
  }
}

// 사용자가 작성한 병원 후기 가져오기
export async function loadMyHospitalReviews(
  userId: string
): Promise<HospitalReviewData[]> {
  try {
    const { data, error } = await supabase
      .from("hospital_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 이미지 URL 처리 및 닉네임 추가
    const processedData = await Promise.all(
      data.map(async (review: any) => {
        if (review.images && Array.isArray(review.images)) {
          review.images = review.images.map((imgUrl: string) => {
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              return imgUrl;
            }
            if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("review_images").getPublicUrl(imgUrl);
              return publicUrl;
            }
            return imgUrl;
          });
        }
        review.nickname = await getUserNickname(review.user_id);
        return review;
      })
    );

    return processedData as HospitalReviewData[];
  } catch (error) {
    console.error("내 병원 후기 로드 실패:", error);
    return [];
  }
}

// 사용자가 작성한 고민글 가져오기
export async function loadMyConcernPosts(
  userId: string
): Promise<ConcernPostData[]> {
  try {
    const { data, error } = await supabase
      .from("concern_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // 이미지 URL 처리 및 닉네임 추가
    const processedData = await Promise.all(
      data.map(async (post: any) => {
        // 이미지 URL 처리 (Storage 경로를 getPublicUrl로 변환)
        if (post.images && Array.isArray(post.images)) {
          post.images = post.images.map((imgUrl: string) => {
            // 이미 공개 URL이면 그대로 반환
            if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
              return imgUrl;
            }
            // Storage 경로인 경우 getPublicUrl로 변환 (concern-images 버킷)
            if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("concern-images").getPublicUrl(imgUrl);
              return publicUrl;
            }
            return imgUrl;
          });
        }
        post.nickname = await getUserNickname(post.user_id);
        return post;
      })
    );

    return processedData as ConcernPostData[];
  } catch (error) {
    console.error("내 고민글 로드 실패:", error);
    return [];
  }
}

// 사용자 프로필 전체 정보 가져오기 (timezone, locale 포함)
export interface UserProfile {
  user_id: string;
  nickname?: string | null;
  display_name?: string | null;
  login_id?: string | null;
  timezone?: string | null;
  locale?: string | null;
  preferred_language?: string | null;
  [key: string]: any;
}

export async function getUserProfile(
  userId: string | null | undefined
): Promise<UserProfile | null> {
  if (!userId) {
    return null;
  }

  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select(
        "user_id, nickname, display_name, login_id, timezone, locale, preferred_language"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getUserProfile] 사용자 프로필 조회 실패:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("[getUserProfile] 사용자 프로필 조회 중 오류:", error);
    return null;
  }
}

// user_id로 닉네임 가져오기
// ✅ 백엔드에 nickname 컬럼이 추가되면 nickname을 직접 읽습니다.
// 트리거로 자동 채워지므로 항상 nickname이 있을 것입니다.
export async function getUserNickname(
  userId: string | null | undefined
): Promise<string> {
  if (!userId) {
    return "익명";
  }

  try {
    // user_profiles에서 nickname 컬럼 직접 읽기 (백엔드에 추가되면)
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("nickname, display_name, login_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getUserNickname] 사용자 프로필 조회 실패:", {
        userId: userId,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return "익명";
    }

    if (profile) {
      console.log("[getUserNickname] 프로필 조회 성공:", {
        userId: userId,
        nickname: profile.nickname,
        display_name: profile.display_name,
        login_id: profile.login_id,
      });

      // 1순위: nickname 컬럼 (백엔드 트리거로 자동 채워짐)
      if (profile.nickname) {
        return profile.nickname;
      }

      // 2순위: display_name (fallback)
      if (profile.display_name) {
        return profile.display_name;
      }

      // 3순위: login_id에서 @ 앞부분 추출 (fallback)
      if (profile.login_id && profile.login_id.includes("@")) {
        return profile.login_id.split("@")[0];
      }

      // 4순위: login_id 그대로 (fallback)
      if (profile.login_id) {
        return profile.login_id;
      }
    } else {
      console.warn("[getUserNickname] 프로필 없음 (RLS 정책 문제 가능성):", {
        userId: userId,
        hint: "user_profiles 테이블에 공개 읽기 정책이 있는지 확인하세요.",
      });
    }

    return "익명";
  } catch (error) {
    console.error("[getUserNickname] 닉네임 조회 실패:", error);
    return "익명";
  }
}

// 시술 후기 상세 가져오기
export async function getProcedureReview(
  reviewId: string
): Promise<ProcedureReviewData | null> {
  try {
    const { data, error } = await supabase
      .from("procedure_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (error) {
      console.error("Supabase 오류:", error);
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // 이미지 URL 처리: Storage 경로를 공개 URL로 변환
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((imgUrl: string) => {
        // 이미 전체 URL이면 그대로 반환
        if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
          return imgUrl;
        }
        // Storage 경로인 경우 공개 URL로 변환
        // 형식: {reviewId}/{index}.{ext} 또는 review_images/{reviewId}/{index}.{ext}
        if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
          // review_images 버킷의 공개 URL 생성
          const {
            data: { publicUrl },
          } = supabase.storage.from("review_images").getPublicUrl(imgUrl);
          return publicUrl;
        }
        return imgUrl;
      });
    }

    // 닉네임 추가 (user_id는 내부 식별자로만 사용, 화면에는 nickname만 표시)
    const userId = data.user_id ? String(data.user_id) : null;

    console.log("[getProcedureReview] user_id 체크:", {
      reviewId: reviewId,
      raw_user_id: data.user_id,
      userId_string: userId,
    });

    // UUID 형식 체크 (user_id가 유효한 UUID인지 확인)
    const isUuid =
      userId &&
      userId !== "0" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId
      );

    console.log("[getProcedureReview] nickname 조회:", {
      reviewId: reviewId,
      userId: userId,
      isUuid: isUuid,
    });

    const nickname = isUuid ? await getUserNickname(userId) : "익명";
    (data as any).nickname = nickname;

    console.log("[getProcedureReview] nickname 결과:", {
      reviewId: reviewId,
      nickname: nickname,
    });

    return data as ProcedureReviewData | null;
  } catch (error) {
    console.error("시술 후기 상세 로드 실패:", error);
    return null;
  }
}

// 병원 후기 상세 가져오기
export async function getHospitalReview(
  reviewId: string
): Promise<HospitalReviewData | null> {
  try {
    const { data, error } = await supabase
      .from("hospital_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (error) {
      console.error("Supabase 오류:", error);
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // 이미지 URL 처리: Storage 경로를 공개 URL로 변환
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((imgUrl: string) => {
        // 이미 전체 URL이면 그대로 반환
        if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
          return imgUrl;
        }
        // Storage 경로인 경우 공개 URL로 변환
        // 형식: {reviewId}/{index}.{ext} 또는 review_images/{reviewId}/{index}.{ext}
        if (imgUrl.includes("/") && !imgUrl.startsWith("http")) {
          // review_images 버킷의 공개 URL 생성
          const {
            data: { publicUrl },
          } = supabase.storage.from("review_images").getPublicUrl(imgUrl);
          return publicUrl;
        }
        return imgUrl;
      });
    }

    // 닉네임 추가 (user_id는 내부 식별자로만 사용, 화면에는 nickname만 표시)
    const userId = data.user_id ? String(data.user_id) : null;
    // UUID 형식 체크 (user_id가 유효한 UUID인지 확인)
    const isUuid =
      userId &&
      userId !== "0" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId
      );

    console.log("[getHospitalReview] nickname 조회:", {
      reviewId: reviewId,
      userId: userId,
      isUuid: isUuid,
    });

    const nickname = isUuid ? await getUserNickname(userId) : "익명";
    (data as any).nickname = nickname;

    console.log("[getHospitalReview] nickname 결과:", {
      reviewId: reviewId,
      nickname: nickname,
    });

    return data as HospitalReviewData | null;
  } catch (error) {
    console.error("병원 후기 상세 로드 실패:", error);
    return null;
  }
}

// ============================================
// category_toggle_map 관련 API 함수
// ============================================

// category_toggle_map 테이블 인터페이스
export interface CategoryToggleMap {
  id?: number;
  category_mid?: string; // 중분류
  category_small?: string; // 소분류
  toggle_family?: string; // 타이틀 패밀리 (회복 가이드 제목 매칭용)
  keyword?: string; // 키워드
  recovery_guide_id?: string; // 회복 가이드 ID (slug)
  recovery_guide_keyword?: string; // 회복 가이드 키워드
  [key: string]: any;
}

// category_toggle_map 데이터 로드
export async function loadCategoryToggleMap(): Promise<CategoryToggleMap[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_TOGGLE_MAP)
      .select("*");

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return cleanData<CategoryToggleMap>(data);
  } catch (error) {
    console.error("category_toggle_map 데이터 로드 실패:", error);
    return [];
  }
}

// category_mid 또는 keyword로 회복 가이드 ID 찾기
export async function getRecoveryGuideIdByCategory(
  categoryMid?: string,
  keyword?: string
): Promise<string | null> {
  try {
    if (!categoryMid && !keyword) return null;

    const toggleMap = await loadCategoryToggleMap();

    // category_mid로 먼저 찾기
    if (categoryMid) {
      const matched = toggleMap.find(
        (item) =>
          item.category_mid?.toLowerCase().trim() ===
          categoryMid.toLowerCase().trim()
      );
      if (matched?.recovery_guide_id) {
        return matched.recovery_guide_id;
      }
    }

    // keyword로 찾기
    if (keyword) {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const matched = toggleMap.find(
        (item) =>
          item.keyword?.toLowerCase().includes(normalizedKeyword) ||
          item.recovery_guide_keyword?.toLowerCase().includes(normalizedKeyword)
      );
      if (matched?.recovery_guide_id) {
        return matched.recovery_guide_id;
      }
    }

    return null;
  } catch (error) {
    console.error("회복 가이드 ID 조회 실패:", error);
    return null;
  }
}

// category_mid로 toggle_family 찾기
export async function getToggleFamilyByCategoryMid(
  categoryMid: string
): Promise<string | null> {
  try {
    if (!categoryMid) {
      console.warn("⚠️ categoryMid가 없음");
      return null;
    }

    const client = getSupabaseOrNull();
    if (!client) {
      console.warn("⚠️ Supabase 클라이언트가 없음");
      return null;
    }

    console.log("🔍 category_toggle_map에서 categoryMid로 조회:", categoryMid);

    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_TOGGLE_MAP)
      .select("toggle_family, category_mid")
      .eq("category_mid", categoryMid)
      .limit(1);

    if (error) {
      console.error("❌ toggle_family 조회 실패:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn(
        "⚠️ category_toggle_map에서 categoryMid로 데이터를 찾을 수 없음:",
        categoryMid
      );
      return null;
    }

    const toggleFamily = data[0]?.toggle_family;
    console.log("✅ toggle_family 찾음 (categoryMid):", toggleFamily);
    return toggleFamily || null;
  } catch (error) {
    console.error("❌ toggle_family 조회 실패:", error);
    return null;
  }
}

// category_mid로 category_small 찾기
export async function getCategorySmallByCategoryMid(
  categoryMid: string
): Promise<string | null> {
  try {
    if (!categoryMid) return null;

    const client = getSupabaseOrNull();
    if (!client) return null;

    console.log("🔍 category_mid로 category_small 찾기:", categoryMid);

    // category_toggle_map에서 category_mid로 category_small 찾기
    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_TOGGLE_MAP)
      .select("category_small")
      .eq("category_mid", categoryMid)
      .limit(1);

    if (error) {
      console.warn("⚠️ category_small 조회 실패:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ category_toggle_map에서 category_small을 찾을 수 없음");
      return null;
    }

    const categorySmall = data[0]?.category_small;
    console.log("✅ category_small 찾음:", categorySmall);
    return categorySmall || null;
  } catch (error) {
    console.error("❌ category_small 조회 실패:", error);
    return null;
  }
}

// category_small로 toggle_family 찾기
export async function getToggleFamilyByCategorySmall(
  categorySmall: string
): Promise<string | null> {
  try {
    if (!categorySmall) {
      console.warn("⚠️ categorySmall이 없음");
      return null;
    }

    const client = getSupabaseOrNull();
    if (!client) {
      console.warn("⚠️ Supabase 클라이언트가 없음");
      return null;
    }

    console.log("🔍 category_toggle_map에서 조회:", categorySmall);

    const { data, error } = await client
      .from(TABLE_NAMES.CATEGORY_TOGGLE_MAP)
      .select("toggle_family, category_small")
      .eq("category_small", categorySmall)
      .limit(1);

    if (error) {
      console.error("❌ toggle_family 조회 실패:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn(
        "⚠️ category_toggle_map에서 데이터를 찾을 수 없음:",
        categorySmall
      );
      // category_small이 정확히 일치하지 않을 수 있으므로 부분 일치로도 시도
      const { data: partialData } = await client
        .from(TABLE_NAMES.CATEGORY_TOGGLE_MAP)
        .select("toggle_family, category_small")
        .ilike("category_small", `%${categorySmall}%`)
        .limit(1);

      if (partialData && partialData.length > 0) {
        console.log("✅ 부분 일치로 찾음:", partialData[0].toggle_family);
        return partialData[0].toggle_family || null;
      }
      return null;
    }

    const toggleFamily = data[0]?.toggle_family;
    console.log("✅ toggle_family 찾음:", toggleFamily);
    return toggleFamily || null;
  } catch (error) {
    console.error("❌ toggle_family 조회 실패:", error);
    return null;
  }
}

// category_small로 회복 가이드 찾기 (toggle_family를 회복 가이드 제목과 매칭)
export async function findRecoveryGuideByCategorySmall(
  categorySmall: string,
  language: string = "KR"
): Promise<string | null> {
  try {
    if (!categorySmall) {
      console.warn("⚠️ categorySmall이 없음");
      return null;
    }

    console.log("🔍 toggle_family 찾는 중... categorySmall:", categorySmall);
    // toggle_family 가져오기
    const toggleFamily = await getToggleFamilyByCategorySmall(categorySmall);
    if (!toggleFamily) {
      console.warn("⚠️ toggle_family를 찾을 수 없음");
      return null;
    }

    return await findRecoveryGuideByToggleFamily(toggleFamily, language);
  } catch (error) {
    console.error("❌ 회복 가이드 찾기 실패:", error);
    return null;
  }
}

// toggle_family로 회복 가이드 찾기 (공통 함수)
async function findRecoveryGuideByToggleFamily(
  toggleFamily: string,
  language: string = "KR"
): Promise<string | null> {
  try {
    if (!toggleFamily) {
      console.warn("⚠️ toggleFamily이 없음");
      return null;
    }

    console.log(
      "🔍 회복 가이드 목록에서 매칭 중... toggle_family:",
      toggleFamily,
      "language:",
      language
    );
    // 회복 가이드 목록 가져오기 (recoveryGuidePosts에서)
    const { getAllRecoveryGuides } = await import(
      "@/lib/content/recoveryGuidePosts"
    );
    const recoveryGuides = await getAllRecoveryGuides(language);

    console.log("📋 회복 가이드 개수:", recoveryGuides.length);

    // toggle_family가 회복 가이드 제목에 포함되어 있는지 확인
    const matchedGuide = recoveryGuides.find((guide) =>
      guide.title.includes(toggleFamily)
    );

    if (matchedGuide) {
      console.log(
        "✅ 회복 가이드 매칭 성공:",
        matchedGuide.id,
        matchedGuide.title
      );
    } else {
      console.warn("⚠️ 회복 가이드 매칭 실패. toggle_family:", toggleFamily);
      console.warn(
        "📋 사용 가능한 회복 가이드 제목:",
        recoveryGuides.map((g) => g.title)
      );
    }

    return matchedGuide?.id || null;
  } catch (error) {
    console.error("❌ 회복 가이드 찾기 실패:", error);
    return null;
  }
}

// category_mid로 회복 가이드 찾기
export async function findRecoveryGuideByCategoryMid(
  categoryMid: string
): Promise<string | null> {
  try {
    if (!categoryMid) {
      console.warn("⚠️ categoryMid가 없음");
      return null;
    }

    console.log("🔍 toggle_family 찾는 중... categoryMid:", categoryMid);
    // toggle_family 가져오기
    const toggleFamily = await getToggleFamilyByCategoryMid(categoryMid);
    if (!toggleFamily) {
      console.warn("⚠️ toggle_family를 찾을 수 없음 (categoryMid)");
      return null;
    }

    return await findRecoveryGuideByToggleFamily(toggleFamily);
  } catch (error) {
    console.error("❌ 회복 가이드 찾기 실패:", error);
    return null;
  }
}

// ============================================
// 찜하기 및 좋아요 기능 API 함수
// ============================================

// 시술 찜하기 인터페이스
export interface ProcedureFavorite {
  id?: string;
  user_id: string;
  treatment_id: number;
  created_at?: string;
  updated_at?: string;
}

// 글 좋아요 인터페이스
export interface PostLike {
  id?: string;
  user_id: string;
  post_id: string;
  post_type: "treatment_review" | "hospital_review" | "concern_post";
  created_at?: string;
  updated_at?: string;
}

// 현재 사용자 ID 가져오기 (헬퍼 함수)
// Supabase 세션만 사용 (localStorage fallback 제거하여 계정별 데이터 분리 보장)
async function getCurrentUserId(): Promise<string | null> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      console.warn("Supabase 클라이언트가 초기화되지 않았습니다.");
      return null;
    }

    // Supabase 세션만 확인 (localStorage fallback 제거)
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error) {
      console.warn("Supabase 세션 확인 실패:", error.message);
      return null;
    }

    if (user) {
      // 세션이 있으면 userId 반환
      return user.id;
    }

    // 세션이 없으면 null 반환 (이전 계정의 데이터를 사용하지 않도록)
    return null;
  } catch (error) {
    console.error("사용자 ID 가져오기 실패:", error);
    return null;
  }
}

// 시술 찜하기 추가
export async function addProcedureFavorite(
  treatmentId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 이미 찜하기가 있는지 확인
    const { data: existing } = await client
      .from("procedure_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("treatment_id", treatmentId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "이미 찜한 시술입니다." };
    }

    // 찜하기 추가
    const { error } = await client.from("procedure_favorites").insert({
      user_id: userId,
      treatment_id: treatmentId,
    });

    if (error) {
      console.error("시술 찜하기 추가 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("시술 찜하기 추가 중 오류:", error);
    return {
      success: false,
      error: error?.message || "시술 찜하기에 실패했습니다.",
    };
  }
}

// 시술 찜하기 삭제
export async function removeProcedureFavorite(
  treatmentId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { error } = await client
      .from("procedure_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("treatment_id", treatmentId);

    if (error) {
      console.error("시술 찜하기 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("시술 찜하기 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "시술 찜하기 삭제에 실패했습니다.",
    };
  }
}

// 시술 찜하기 토글 (추가/삭제)
export async function toggleProcedureFavorite(
  treatmentId: number
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        isFavorite: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        isFavorite: false,
        error: "로그인이 필요합니다.",
      };
    }

    // 현재 찜하기 상태 확인
    const { data: existing } = await client
      .from("procedure_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("treatment_id", treatmentId)
      .maybeSingle();

    if (existing) {
      // 이미 찜하기가 있으면 삭제
      const result = await removeProcedureFavorite(treatmentId);
      return { ...result, isFavorite: false };
    } else {
      // 찜하기가 없으면 추가
      const result = await addProcedureFavorite(treatmentId);
      return { ...result, isFavorite: true };
    }
  } catch (error: any) {
    console.error("시술 찜하기 토글 중 오류:", error);
    return {
      success: false,
      isFavorite: false,
      error: error?.message || "시술 찜하기 토글에 실패했습니다.",
    };
  }
}

// 찜한 시술 목록 조회
export async function getFavoriteProcedures(): Promise<{
  success: boolean;
  favorites?: ProcedureFavorite[];
  treatmentIds?: number[];
  error?: string;
}> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { data, error } = await client
      .from("procedure_favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // 에러 정보 상세 수집
      const errorKeys = Object.keys(error);
      const errorInfo: any = {
        hasError: true,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorKeys: errorKeys,
        errorKeysLength: errorKeys.length,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      };

      // JSON 직렬화 시도
      try {
        errorInfo.stringified = JSON.stringify(error, null, 2);
      } catch (e) {
        errorInfo.stringifyError = String(e);
      }

      // 모든 속성 직접 접근
      const allProps: any = {};
      for (const key in error) {
        allProps[key] = (error as any)[key];
      }
      errorInfo.allProperties = allProps;

      // 에러 메시지 추출 (여러 소스에서 시도)
      const errorMessage =
        error?.message ||
        error?.details ||
        error?.hint ||
        (errorKeys.length > 0
          ? `에러 발생 (속성: ${errorKeys.join(", ")})`
          : null) ||
        (typeof error === "string" ? error : null) ||
        (errorInfo.stringified && errorInfo.stringified !== "{}"
          ? errorInfo.stringified
          : null) ||
        "찜한 시술 목록 조회 중 오류가 발생했습니다.";

      console.error("찜한 시술 목록 조회 실패 - 상세 정보:", errorInfo);
      console.error("원본 에러 객체:", error);
      console.error("에러 객체 타입 체크:", {
        isObject: typeof error === "object",
        isNull: error === null,
        isArray: Array.isArray(error),
        toString: String(error),
        valueOf: error?.valueOf?.(),
      });

      return { success: false, error: errorMessage };
    }

    const favorites = (data || []) as ProcedureFavorite[];
    const treatmentIds = favorites.map((f) => f.treatment_id);

    return { success: true, favorites, treatmentIds };
  } catch (error: any) {
    console.error("찜한 시술 목록 조회 중 오류:", error);
    return {
      success: false,
      error: error?.message || "찜한 시술 목록 조회에 실패했습니다.",
    };
  }
}

// 특정 시술의 찜하기 여부 확인
export async function isProcedureFavorite(
  treatmentId: number
): Promise<boolean> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { data } = await client
      .from("procedure_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("treatment_id", treatmentId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error("시술 찜하기 여부 확인 중 오류:", error);
    return false;
  }
}

// 여러 시술의 찜하기 여부 일괄 확인
export async function getFavoriteStatus(
  treatmentIds: number[]
): Promise<Set<number>> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return new Set();

    const userId = await getCurrentUserId();
    if (!userId) return new Set();

    if (treatmentIds.length === 0) return new Set();

    const { data } = await client
      .from("procedure_favorites")
      .select("treatment_id")
      .eq("user_id", userId)
      .in("treatment_id", treatmentIds);

    return new Set((data || []).map((f: any) => f.treatment_id));
  } catch (error) {
    console.error("시술 찜하기 상태 일괄 확인 중 오류:", error);
    return new Set();
  }
}

// 커뮤니티 글 좋아요 추가
export async function addPostLike(
  postId: string,
  postType: "treatment_review" | "hospital_review" | "concern_post" | "guide"
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 이미 좋아요가 있는지 확인
    const { data: existing } = await client
      .from("post_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .eq("post_type", postType)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "이미 좋아요를 누른 글입니다." };
    }

    // 입력값 검증
    const validPostTypes = [
      "treatment_review",
      "hospital_review",
      "concern_post",
      "guide",
    ];
    if (!validPostTypes.includes(postType)) {
      console.error("잘못된 post_type:", postType);
      return {
        success: false,
        error: `잘못된 글 타입입니다: ${postType}`,
      };
    }

    // UUID 형식 검증 (post_id는 UUID여야 함, guide는 예외)
    if (postType !== "guide") {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        console.error("잘못된 post_id 형식:", postId);
        return {
          success: false,
          error: `잘못된 글 ID 형식입니다: ${postId}`,
        };
      }
    }

    // 좋아요 추가
    const { error } = await client.from("post_likes").insert({
      user_id: userId,
      post_id: postId,
      post_type: postType,
    });

    if (error) {
      console.error("글 좋아요 추가 실패:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        postId,
        postType,
        userId,
      });
      return {
        success: false,
        error: error.message || error.details || "글 좋아요에 실패했습니다.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("글 좋아요 추가 중 오류:", error);
    return {
      success: false,
      error: error?.message || "글 좋아요에 실패했습니다.",
    };
  }
}

// 커뮤니티 글 좋아요 삭제
export async function removePostLike(
  postId: string,
  postType: "treatment_review" | "hospital_review" | "concern_post" | "guide"
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { error } = await client
      .from("post_likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId)
      .eq("post_type", postType);

    if (error) {
      console.error("글 좋아요 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("글 좋아요 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "글 좋아요 삭제에 실패했습니다.",
    };
  }
}

// 커뮤니티 글 좋아요 토글
export async function togglePostLike(
  postId: string,
  postType: "treatment_review" | "hospital_review" | "concern_post" | "guide"
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        isLiked: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, isLiked: false, error: "로그인이 필요합니다." };
    }

    // 현재 좋아요 상태 확인
    const { data: existing } = await client
      .from("post_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .eq("post_type", postType)
      .maybeSingle();

    if (existing) {
      // 이미 좋아요가 있으면 삭제
      const result = await removePostLike(postId, postType);
      return { ...result, isLiked: false };
    } else {
      // 좋아요가 없으면 추가
      const result = await addPostLike(postId, postType);
      return { ...result, isLiked: true };
    }
  } catch (error: any) {
    console.error("글 좋아요 토글 중 오류:", error);
    return {
      success: false,
      isLiked: false,
      error: error?.message || "글 좋아요 토글에 실패했습니다.",
    };
  }
}

// 좋아요한 글 목록 조회
export async function getLikedPosts(): Promise<{
  success: boolean;
  likes?: PostLike[];
  error?: string;
}> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { data, error } = await client
      .from("post_likes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("좋아요한 글 목록 조회 실패:", error);
      return { success: false, error: error.message };
    }

    const likes = (data || []) as PostLike[];

    return { success: true, likes };
  } catch (error: any) {
    console.error("좋아요한 글 목록 조회 중 오류:", error);
    return {
      success: false,
      error: error?.message || "좋아요한 글 목록 조회에 실패했습니다.",
    };
  }
}

// 특정 글의 좋아요 여부 확인
export async function isPostLiked(
  postId: string,
  postType: "treatment_review" | "hospital_review" | "concern_post" | "guide"
): Promise<boolean> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { data } = await client
      .from("post_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .eq("post_type", postType)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error("글 좋아요 여부 확인 중 오류:", error);
    return false;
  }
}

// 글의 좋아요 개수 조회
export async function getPostLikeCount(
  postId: string,
  postType: "treatment_review" | "hospital_review" | "concern_post" | "guide"
): Promise<number> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return 0;

    const { count, error } = await client
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("post_type", postType);

    if (error) {
      console.error("글 좋아요 개수 조회 실패:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("글 좋아요 개수 조회 중 오류:", error);
    return 0;
  }
}

// 좋아요한 글의 상세 정보 조회 (카테고리명, 글 제목, 작성자 이름 포함)
export interface LikedPostDetail {
  id: string;
  postType: "treatment_review" | "hospital_review" | "concern_post";
  categoryName: string; // "후기", "가이드", "고민"
  title: string; // 글 제목
  authorName: string; // 작성자 이름(닉네임)
  createdAt: string;
}

export async function getLikedPostsWithDetails(): Promise<{
  success: boolean;
  posts?: LikedPostDetail[];
  error?: string;
}> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 좋아요한 글 목록 가져오기
    const { data: likes, error: likesError } = await client
      .from("post_likes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (likesError) {
      console.error("좋아요한 글 목록 조회 실패:", likesError);
      return { success: false, error: likesError.message };
    }

    if (!likes || likes.length === 0) {
      return { success: true, posts: [] };
    }

    // 각 글 타입별로 상세 정보 가져오기
    const postDetails: LikedPostDetail[] = [];

    for (const like of likes) {
      try {
        let postData: any = null;
        let categoryName = "";
        let title = "";
        let authorName = "익명";

        // 글 타입에 따라 다른 테이블에서 데이터 가져오기
        if (like.post_type === "treatment_review") {
          const { data, error } = await client
            .from("procedure_reviews")
            .select("id, category, procedure_name, user_id")
            .eq("id", like.post_id)
            .single();

          if (!error && data) {
            postData = data;
            categoryName = "후기";
            title = data.procedure_name || "시술 후기";
          }
        } else if (like.post_type === "hospital_review") {
          const { data, error } = await client
            .from("hospital_reviews")
            .select("id, category_large, hospital_name, user_id")
            .eq("id", like.post_id)
            .single();

          if (!error && data) {
            postData = data;
            categoryName = "후기";
            title = data.hospital_name || "병원 후기";
          }
        } else if (like.post_type === "concern_post") {
          const { data, error } = await client
            .from("concern_posts")
            .select("id, title, concern_category, user_id")
            .eq("id", like.post_id)
            .single();

          if (!error && data) {
            postData = data;
            categoryName = "고민";
            title = data.title || "고민글";
          }
        }

        // 작성자 이름 가져오기
        if (postData && postData.user_id) {
          const { data: profile } = await client
            .from("user_profiles")
            .select("display_name, login_id")
            .eq("user_id", postData.user_id)
            .maybeSingle();

          if (profile && profile.display_name) {
            authorName = profile.display_name;
          } else if (profile && profile.login_id) {
            // display_name이 없으면 login_id에서 이메일 앞부분 사용
            authorName = profile.login_id.split("@")[0];
          } else {
            // 프로필이 없으면 기본값 사용
            authorName = "익명";
          }
        }

        if (postData) {
          postDetails.push({
            id: like.post_id,
            postType: like.post_type,
            categoryName,
            title,
            authorName,
            createdAt: like.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`글 상세 정보 로드 실패 (${like.post_id}):`, error);
        // 에러가 발생해도 다음 글 계속 처리
      }
    }

    return { success: true, posts: postDetails };
  } catch (error: any) {
    console.error("좋아요한 글 상세 정보 조회 중 오류:", error);
    return {
      success: false,
      error: error?.message || "좋아요한 글 상세 정보 조회에 실패했습니다.",
    };
  }
}

// ==================== 랭킹 RPC 함수 ====================

// 중분류 랭킹 결과 인터페이스
export interface MidCategoryRanking {
  category_mid: string;
  category_rank: number;
  treatment_count: number;
  total_reviews: number;
  average_rating: number;
  category_score: number;
  treatments: Treatment[]; // 이미 정렬된 시술 목록
}

// 소분류 랭킹 결과 인터페이스
export interface SmallCategoryRanking {
  category_small_key: string; // category_small 또는 treatment_name 또는 '기타'
  category_rank: number;
  treatment_count: number;
  total_reviews: number;
  average_rating: number;
  category_score: number;
  treatments: Treatment[]; // 이미 정렬된 시술 목록
}

// 중분류 랭킹 조회 (RPC)
export async function getMidCategoryRankings(
  p_category_large: string | null = null,
  p_m: number = 20, // 베이지안 평균 신뢰 임계값
  p_dedupe_limit_per_name: number = 2, // 같은 시술명 최대 노출 개수
  p_limit_per_category: number = 20 // 각 중분류당 상위 N개 카드만 노출
): Promise<{
  success: boolean;
  data?: MidCategoryRanking[];
  error?: string;
}> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const { data, error } = await client.rpc("rpc_mid_category_rankings", {
      p_category_large: p_category_large,
      p_m: p_m,
      p_dedupe_limit_per_name: p_dedupe_limit_per_name,
      p_limit_per_category: p_limit_per_category,
    });

    if (error) {
      // 에러 객체 상세 로깅
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        error: error,
      };
      console.error("중분류 랭킹 조회 실패:", errorDetails);

      // RPC 함수가 아직 준비되지 않은 경우를 위한 상세 에러 로그
      if (error.message?.includes("function") || error.code === "42883") {
        console.warn(
          "⚠️ RPC 함수가 아직 생성되지 않았을 수 있습니다. 백엔드 담당자에게 확인하세요."
        );
      }

      return {
        success: false,
        error:
          error.message || error.code || "랭킹 데이터 조회에 실패했습니다.",
      };
    }

    if (!data) {
      return { success: false, error: "데이터를 가져올 수 없습니다." };
    }

    // 디버깅: 실제 반환된 데이터 구조 확인
    if (data.length > 0) {
      console.log("🔍 [RPC 반환 데이터 샘플]:", {
        keys: Object.keys(data[0]),
        hasTreatments: "treatments" in data[0],
        treatmentsType: typeof data[0].treatments,
        treatmentsIsArray: Array.isArray(data[0].treatments),
        sample: data[0],
      });
    }

    // 데이터 정리 (NaN 처리)
    const cleanedData = cleanData<MidCategoryRanking>(data);

    // treatments 배열이 없는 경우 빈 배열로 초기화
    const processedData = cleanedData.map((item) => ({
      ...item,
      treatments: Array.isArray(item.treatments) ? item.treatments : [],
    }));

    console.log(
      `✅ [중분류 랭킹] ${processedData.length}개 항목 처리 완료`,
      processedData[0]
        ? `첫 번째 항목 구조: ${Object.keys(processedData[0]).join(", ")}`
        : ""
    );

    return { success: true, data: processedData };
  } catch (error: any) {
    // catch 블록에서 발생하는 에러도 상세 로깅
    const errorDetails = {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      error: error,
    };
    console.error("중분류 랭킹 조회 중 예외 발생:", errorDetails);

    // 네트워크 에러인 경우
    if (error?.message?.includes("fetch") || error?.name === "TypeError") {
      console.warn("⚠️ 네트워크 에러 또는 Supabase 연결 문제일 수 있습니다.");
    }

    return {
      success: false,
      error:
        error?.message ||
        error?.toString() ||
        "중분류 랭킹 조회에 실패했습니다.",
    };
  }
}

// 소분류 랭킹 조회 (RPC)
export async function getSmallCategoryRankings(
  p_category_mid: string,
  p_m: number = 20, // 베이지안 평균 신뢰 임계값
  p_dedupe_limit_per_name: number = 2, // 같은 시술명 최대 노출 개수
  p_limit_per_category: number = 20 // 각 소분류당 상위 N개 카드만 노출
): Promise<{
  success: boolean;
  data?: SmallCategoryRanking[];
  error?: string;
}> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    if (!p_category_mid) {
      return { success: false, error: "중분류가 필요합니다." };
    }

    const { data, error } = await client.rpc("rpc_small_category_rankings", {
      p_category_mid: p_category_mid,
      p_m: p_m,
      p_dedupe_limit_per_name: p_dedupe_limit_per_name,
      p_limit_per_category: p_limit_per_category,
    });

    if (error) {
      console.error("소분류 랭킹 조회 실패:", error);
      // RPC 함수가 아직 준비되지 않은 경우를 위한 상세 에러 로그
      if (error.message?.includes("function") || error.code === "42883") {
        console.warn(
          "⚠️ RPC 함수가 아직 생성되지 않았을 수 있습니다. 백엔드 담당자에게 확인하세요."
        );
      }
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "데이터를 가져올 수 없습니다." };
    }

    // 디버깅: 실제 반환된 데이터 구조 확인
    if (data.length > 0) {
      console.log("🔍 [RPC 반환 데이터 샘플]:", {
        keys: Object.keys(data[0]),
        hasTreatments: "treatments" in data[0],
        treatmentsType: typeof data[0].treatments,
        treatmentsIsArray: Array.isArray(data[0].treatments),
        sample: data[0],
      });
    }

    // 데이터 정리 (NaN 처리)
    const cleanedData = cleanData<SmallCategoryRanking>(data);

    // treatments 배열이 없는 경우 빈 배열로 초기화
    const processedData = cleanedData.map((item) => ({
      ...item,
      treatments: Array.isArray(item.treatments) ? item.treatments : [],
    }));

    console.log(
      `✅ [소분류 랭킹] ${processedData.length}개 항목 처리 완료`,
      processedData[0]
        ? `첫 번째 항목 구조: ${Object.keys(processedData[0]).join(", ")}`
        : ""
    );

    return { success: true, data: processedData };
  } catch (error: any) {
    console.error("소분류 랭킹 조회 중 오류:", error);
    return {
      success: false,
      error: error?.message || "소분류 랭킹 조회에 실패했습니다.",
    };
  }
}

// ==================== 일정 저장 관련 API ====================

// 저장된 일정 인터페이스
export interface SavedSchedule {
  id?: string;
  user_id: string;
  schedule_period: string; // 일정 기간 (예: "25.12.14~25.12.20")
  treatment_ids: number[]; // 시술 ID 배열
  treatment_names: string[]; // 시술 이름 배열 (DB 트리거가 자동으로 채움)
  treatment_dates?: (string | null)[]; // 시술별 날짜 정보 배열 (treatment_ids와 같은 순서) ["YYYY-MM-DD" | null]
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null; // Soft delete용 (삭제된 일정은 null이 아님)
}

// 일정 저장
export async function saveSchedule(
  schedulePeriod: string,
  treatmentIds: number[],
  treatmentDates?: (string | null)[] // 시술별 날짜 정보 배열 (treatment_ids와 같은 순서) ["YYYY-MM-DD" | null]
): Promise<{ success: boolean; data?: SavedSchedule; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // auth.uid() 확인 (RLS 정책 검증용)
    const { data: sessionData } = await client.auth.getSession();
    const authUid = sessionData?.session?.user?.id || null;

    // 디버깅용 체크 (RLS 문제 진단)
    console.log("[saveSchedule] auth uid 체크:", {
      authUid: authUid,
      payloadUserId: userId,
      isMatch: authUid === userId,
      authUidType: typeof authUid,
      userIdType: typeof userId,
    });

    if (authUid !== userId) {
      console.error("[saveSchedule] user_id 불일치:", {
        authUid,
        userId,
        message: "RLS 정책 위반 가능성 높음",
      });
    }

    console.log("[saveSchedule] 저장 시도:", {
      userId,
      schedulePeriod,
      treatmentIds,
      treatmentIdsLength: treatmentIds.length,
    });

    // upsert로 변경: 같은 기간은 덮어쓰기
    // treatment_dates는 배열로 보내야 함 (treatment_ids와 같은 길이)
    const payload: any = {
      user_id: userId,
      schedule_period: schedulePeriod,
      treatment_ids: treatmentIds, // number[]
      deleted_at: null, // 저장 시 deleted_at은 null로 설정
    };

    // treatment_dates가 있으면 배열로 추가 (길이가 treatment_ids와 같아야 함)
    if (treatmentDates && Array.isArray(treatmentDates)) {
      // 길이 확인 및 보정
      if (treatmentDates.length !== treatmentIds.length) {
        console.warn(
          "[saveSchedule] treatment_dates 길이가 treatment_ids와 다릅니다. null로 채웁니다.",
          {
            treatmentIdsLength: treatmentIds.length,
            treatmentDatesLength: treatmentDates.length,
          }
        );
        // 길이를 맞추기 위해 null로 채움
        while (treatmentDates.length < treatmentIds.length) {
          treatmentDates.push(null);
        }
        treatmentDates = treatmentDates.slice(0, treatmentIds.length);
      }
      payload.treatment_dates = treatmentDates; // (string|null)[]
    } else if (treatmentIds.length > 0) {
      // treatment_dates가 없으면 null로 채운 배열 생성
      payload.treatment_dates = treatmentIds.map(() => null);
    }

    // 디버깅용 체크
    console.log("[saveSchedule] payload 체크:", {
      user_id: payload.user_id,
      authUid: authUid,
      user_id_match: payload.user_id === authUid,
      treatment_ids: payload.treatment_ids,
      treatment_ids_isArray: Array.isArray(payload.treatment_ids),
      treatment_dates: payload.treatment_dates,
      treatment_dates_isArray: Array.isArray(payload.treatment_dates),
      treatment_dates_sample: payload.treatment_dates?.[0], // 첫 번째 날짜 샘플 확인
      lengths_match:
        payload.treatment_ids?.length === payload.treatment_dates?.length,
    });

    // unique constraint가 없을 수 있으므로, 기존 레코드를 확인하고 update/insert 분기
    // 먼저 기존 레코드 확인
    const { data: existingData } = await client
      .from("saved_schedules")
      .select("id")
      .eq("user_id", userId)
      .eq("schedule_period", schedulePeriod)
      .is("deleted_at", null)
      .maybeSingle();

    let data, error;

    if (existingData?.id) {
      // 기존 레코드가 있으면 update
      const payloadWithoutDates = { ...payload };
      delete payloadWithoutDates.treatment_dates;

      try {
        const result = await client
          .from("saved_schedules")
          .update(payload)
          .eq("id", existingData.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } catch (updateError: any) {
        // treatment_dates로 인한 에러일 수 있으므로, 없이 재시도
        console.warn(
          "[saveSchedule] treatment_dates 포함 업데이트 실패, 재시도:",
          updateError
        );
        const retryResult = await client
          .from("saved_schedules")
          .update(payloadWithoutDates)
          .eq("id", existingData.id)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }
    } else {
      // 기존 레코드가 없으면 insert
      const payloadWithoutDates = { ...payload };
      delete payloadWithoutDates.treatment_dates;

      try {
        const result = await client
          .from("saved_schedules")
          .insert(payload)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } catch (insertError: any) {
        // treatment_dates로 인한 에러일 수 있으므로, 없이 재시도
        console.warn(
          "[saveSchedule] treatment_dates 포함 삽입 실패, 재시도:",
          insertError
        );
        const retryResult = await client
          .from("saved_schedules")
          .insert(payloadWithoutDates)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }
    }

    console.log("[saveSchedule] 응답:", {
      hasData: !!data,
      hasError: !!error,
      errorType: typeof error,
      errorStringified: error ? JSON.stringify(error) : null,
      dataStringified: data ? JSON.stringify(data) : null,
    });

    // 에러가 있거나 데이터가 없는 경우
    if (error || !data) {
      // 에러 객체의 모든 속성을 안전하게 추출
      let errorCode: string | undefined;
      let errorMessage: string = "";
      let errorDetails: string = "";
      let errorHint: string = "";

      // 에러가 객체인 경우
      if (error && typeof error === "object") {
        errorCode = (error as any)?.code || error?.code;
        errorMessage = (error as any)?.message || error?.message || "";
        errorDetails = (error as any)?.details || error?.details || "";
        errorHint = (error as any)?.hint || error?.hint || "";
      } else if (error) {
        // 에러가 문자열이거나 다른 타입인 경우
        errorMessage = String(error);
      }

      const fullErrorMessage =
        errorMessage ||
        errorDetails ||
        (error
          ? "알 수 없는 에러가 발생했습니다."
          : "데이터가 반환되지 않았습니다.");

      console.error("[saveSchedule] 일정 저장 실패:", {
        error,
        errorType: typeof error,
        errorCode,
        errorMessage,
        errorDetails,
        errorHint,
        errorStringified: error
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : "null",
        errorKeys: error && typeof error === "object" ? Object.keys(error) : [],
        hasData: !!data,
        payload: JSON.stringify(payload),
      });

      // RLS (Row Level Security) 정책 위반 에러
      if (
        fullErrorMessage.includes("row-level security") ||
        fullErrorMessage.includes("violates row-level security policy") ||
        fullErrorMessage.includes("RLS") ||
        errorCode === "42501"
      ) {
        return {
          success: false,
          error:
            "로그인 권한 문제로 일정 저장에 실패했습니다. 다시 로그인하거나 관리자에게 문의해주세요.",
        };
      }
      // PGRST205: 테이블을 찾을 수 없음 (Supabase PostgREST 에러)
      else if (
        errorCode === "PGRST205" ||
        errorCode === "42P01" ||
        fullErrorMessage.includes("saved_schedules") ||
        fullErrorMessage.includes("does not exist") ||
        fullErrorMessage.includes("Could not find the table") ||
        fullErrorMessage.includes("schema cache") ||
        fullErrorMessage.includes("relation") ||
        fullErrorMessage.includes("table")
      ) {
        return {
          success: false,
          error:
            "일정 저장 기능이 아직 준비되지 않았습니다. 관리자에게 문의해주세요.",
        };
      }
      // 권한 문제
      else if (
        fullErrorMessage.includes("permission") ||
        fullErrorMessage.includes("권한")
      ) {
        return {
          success: false,
          error: "일정 저장 권한이 없습니다. 로그인 상태를 확인해주세요.",
        };
      }
      // 기타 에러
      return {
        success: false,
        error: fullErrorMessage || "일정 저장에 실패했습니다.",
      };
    }

    console.log("[saveSchedule] 저장 성공:", data);
    return { success: true, data: data as SavedSchedule };
  } catch (error: any) {
    console.error("일정 저장 중 오류:", {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });

    // 에러 메시지 추출
    let errorMessage = "일정 저장에 실패했습니다.";

    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.details) {
      errorMessage = error.details;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // 테이블이 없는 경우
    if (
      error?.code === "42P01" ||
      errorMessage.includes("saved_schedules") ||
      errorMessage.includes("does not exist")
    ) {
      errorMessage =
        "일정 저장 기능이 아직 준비되지 않았습니다. 관리자에게 문의해주세요.";
    }
    // 권한 문제
    else if (error?.code === "42501" || errorMessage.includes("permission")) {
      errorMessage = "일정 저장 권한이 없습니다. 로그인 상태를 확인해주세요.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// 저장된 일정 목록 조회
export async function getSavedSchedules(): Promise<{
  success: boolean;
  schedules?: SavedSchedule[];
  error?: string;
}> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { data, error } = await client
      .from("saved_schedules")
      .select(
        "id, schedule_period, treatment_ids, treatment_names, treatment_dates, created_at, updated_at"
      )
      .eq("user_id", userId)
      .is("deleted_at", null) // 삭제된 일정 제외
      .order("created_at", { ascending: false });

    if (error) {
      console.error("저장된 일정 목록 조회 실패:", error);
      return { success: false, error: error.message };
    }

    const schedules = (data || []) as SavedSchedule[];

    return { success: true, schedules };
  } catch (error: any) {
    console.error("저장된 일정 목록 조회 중 오류:", error);
    return {
      success: false,
      error: error?.message || "저장된 일정 목록 조회에 실패했습니다.",
    };
  }
}

// 저장된 일정 삭제
export async function deleteSavedSchedule(
  scheduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 인증 상태 확인 (디버깅용)
    const {
      data: { user: authUser },
    } = await client.auth.getUser();
    
    if (!authUser || authUser.id !== userId) {
      console.error("인증 불일치:", {
        userId,
        authUserId: authUser?.id,
      });
      return {
        success: false,
        error: "인증 정보가 일치하지 않습니다.",
      };
    }

    // Soft delete: 실제 삭제 대신 deleted_at만 업데이트
    const { data, error } = await client
      .from("saved_schedules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", scheduleId)
      .eq("user_id", userId)
      .select();

    if (error) {
      // 에러 객체의 모든 속성을 안전하게 추출
      let errorCode: string | undefined;
      let errorMessage: string = "";
      let errorDetails: string = "";
      let errorHint: string = "";

      if (error && typeof error === "object") {
        errorCode = (error as any)?.code || error?.code;
        errorMessage = (error as any)?.message || error?.message || "";
        errorDetails = (error as any)?.details || error?.details || "";
        errorHint = (error as any)?.hint || error?.hint || "";
      } else if (error) {
        errorMessage = String(error);
      }

      const fullErrorMessage =
        errorMessage ||
        errorDetails ||
        errorHint ||
        "저장된 일정 삭제에 실패했습니다.";

      console.error("저장된 일정 삭제 실패:", {
        error,
        errorType: typeof error,
        errorCode,
        errorMessage,
        errorDetails,
        errorHint,
        errorStringified: error
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : "null",
        errorKeys: error && typeof error === "object" ? Object.keys(error) : [],
        scheduleId,
        userId,
      });

      return { success: false, error: fullErrorMessage };
    }

    return { success: true };
  } catch (error: any) {
    console.error("저장된 일정 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "저장된 일정 삭제에 실패했습니다.",
    };
  }
}

// ==================== 댓글 관련 인터페이스 및 함수 ====================

export interface CommentData {
  id?: string;
  post_id: string;
  post_type: "procedure" | "hospital" | "concern" | "guide";
  user_id?: string; // ✅ UUID (Supabase Auth의 auth.users.id)
  content: string;
  parent_comment_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommentWithUser extends CommentData {
  user_nickname?: string;
  user_display_name?: string;
  user_avatar_url?: string;
}

// 댓글 저장
export async function saveComment(
  data: CommentData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    // 현재 로그인한 사용자 ID 가져오기 (UUID)
    const {
      data: { user },
    } = await client.auth.getUser();
    const userId = user?.id || null;

    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    // ✅ RLS 정책을 위해 반드시 auth.uid()를 user_id에 사용
    // data.user_id는 무시하고 항상 현재 로그인한 사용자의 ID 사용
    const commentData = {
      post_id: data.post_id,
      post_type: data.post_type,
      user_id: userId, // ✅ 무조건 auth.uid() 사용 (RLS 정책과 일치)
      content: data.content.trim(),
      parent_comment_id: data.parent_comment_id || null,
    };

    const { data: insertedData, error } = await client
      .from("community_comments")
      .insert([commentData])
      .select("id")
      .single();

    if (error) {
      console.error("댓글 저장 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: insertedData?.id };
  } catch (error: any) {
    console.error("댓글 저장 중 오류:", error);
    return {
      success: false,
      error: error?.message || "댓글 저장에 실패했습니다.",
    };
  }
}

// 댓글 목록 조회 (게시글별)
export async function loadComments(
  postId: string,
  postType: "procedure" | "hospital" | "concern" | "guide"
): Promise<CommentWithUser[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("post_type", postType)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 조회 실패:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // user_profiles에서 사용자 정보 가져오기 (UUID)
    const userIds = Array.from(
      new Set(
        data.map((comment) => comment.user_id).filter((id) => id && id !== "0")
      )
    );

    const commentsWithUser: CommentWithUser[] = await Promise.all(
      data.map(async (comment) => {
        if (comment.user_id && comment.user_id !== "0") {
          const { data: profile } = await client
            .from("user_profiles")
            .select("nickname, display_name, avatar_url")
            .eq("user_id", comment.user_id)
            .maybeSingle();

          return {
            ...comment,
            user_nickname: profile?.nickname || null,
            user_display_name: profile?.display_name || null,
            user_avatar_url: profile?.avatar_url || null,
          };
        }
        return {
          ...comment,
          user_nickname: null,
          user_display_name: null,
          user_avatar_url: null,
        };
      })
    );

    return commentsWithUser;
  } catch (error: any) {
    console.error("댓글 조회 중 오류:", error);
    return [];
  }
}

// 댓글 삭제
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    // 현재 로그인한 사용자 확인 (UUID)
    const {
      data: { user },
    } = await client.auth.getUser();
    const userId = user?.id || null;

    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 댓글 작성자 확인
    const { data: comment, error: fetchError } = await client
      .from("community_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    // 작성자 확인 (본인만 삭제 가능)
    if (comment.user_id !== userId) {
      return { success: false, error: "본인의 댓글만 삭제할 수 있습니다." };
    }

    const { error } = await client
      .from("community_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("댓글 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("댓글 삭제 중 오류:", error);
    return {
      success: false,
      error: error?.message || "댓글 삭제에 실패했습니다.",
    };
  }
}

// 내가 작성한 댓글 조회
export async function loadMyComments(
  userId?: string // ✅ UUID
): Promise<CommentWithUser[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return [];
    }

    // 현재 로그인한 사용자 ID 가져오기 (UUID)
    let currentUserId = userId;
    if (!currentUserId) {
      const {
        data: { user },
      } = await client.auth.getUser();
      currentUserId = user?.id || undefined;
    }

    if (!currentUserId) {
      return [];
    }

    const { data, error } = await client
      .from("community_comments")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("내 댓글 조회 실패:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // user_profiles에서 사용자 정보 가져오기
    const { data: profile } = await client
      .from("user_profiles")
      .select("nickname, display_name, avatar_url")
      .eq("user_id", currentUserId)
      .maybeSingle();

    // 게시글 정보도 함께 가져오기 (선택사항)
    const commentsWithUser: CommentWithUser[] = data.map((comment) => ({
      ...comment,
      user_nickname: profile?.nickname || null,
      user_display_name: profile?.display_name || null,
      user_avatar_url: profile?.avatar_url || null,
    }));

    return commentsWithUser;
  } catch (error: any) {
    console.error("내 댓글 조회 중 오류:", error);
    return [];
  }
}

// 댓글 수 조회
export async function getCommentCount(
  postId: string,
  postType: "procedure" | "hospital" | "concern"
): Promise<number> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return 0;
    }

    const { count, error } = await client
      .from("community_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("post_type", postType);

    if (error) {
      console.error("댓글 수 조회 실패:", error);
      return 0;
    }

    return count || 0;
  } catch (error: any) {
    console.error("댓글 수 조회 중 오류:", error);
    return 0;
  }
}

// 조회수 증가
export async function incrementViewCount(
  postId: string,
  postType: "procedure" | "hospital" | "concern" | "guide"
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return {
        success: false,
        error: "Supabase 클라이언트가 초기화되지 않았습니다.",
      };
    }

    // 테이블명 결정
    let tableName: string;
    if (postType === "procedure") {
      tableName = "procedure_reviews";
    } else if (postType === "hospital") {
      tableName = "hospital_reviews";
    } else {
      tableName = "concern_posts";
    }

    // 현재 조회수 가져오기
    const { data: currentData, error: fetchError } = await client
      .from(tableName)
      .select("views")
      .eq("id", postId)
      .single();

    if (fetchError) {
      // views 컬럼이 없을 수도 있으므로 무시하고 진행 (오류 메시지 숨김)
      // console.error("조회수 조회 실패:", fetchError);
    }

    const currentViews = (currentData?.views as number) || 0;

    // 조회수 증가 (views 컬럼이 없으면 생성)
    const { error: updateError } = await client
      .from(tableName)
      .update({ views: currentViews + 1 })
      .eq("id", postId);

    if (updateError) {
      // views 컬럼이 없으면 에러가 발생할 수 있음 (오류 메시지 숨김)
      // console.error("조회수 증가 실패:", updateError);
      // 에러가 발생해도 성공으로 처리 (views 컬럼이 없을 수 있음)
      return { success: true };
    }

    return { success: true };
  } catch (error: any) {
    // views 컬럼이 없을 수 있으므로 오류 메시지 숨김
    // console.error("조회수 증가 중 오류:", error);
    // 에러가 발생해도 성공으로 처리 (views 컬럼이 없을 수 있음)
    return { success: true };
  }
}

// 조회수 조회
export async function getViewCount(
  postId: string,
  postType: "procedure" | "hospital" | "concern" | "guide"
): Promise<number> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return 0;
    }

    // 테이블명 결정
    let tableName: string;
    if (postType === "procedure") {
      tableName = "procedure_reviews";
    } else if (postType === "hospital") {
      tableName = "hospital_reviews";
    } else {
      tableName = "concern_posts";
    }

    const { data, error } = await client
      .from(tableName)
      .select("views")
      .eq("id", postId)
      .single();

    if (error) {
      // views 컬럼이 없을 수도 있음
      return 0;
    }

    return (data?.views as number) || 0;
  } catch (error: any) {
    // views 컬럼이 없을 수 있으므로 오류 메시지 숨김
    // console.error("조회수 조회 중 오류:", error);
    return 0;
  }
}
