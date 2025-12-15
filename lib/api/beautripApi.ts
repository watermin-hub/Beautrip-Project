// Beautrip API 관련 유틸리티 함수
import { supabase } from "../supabase";

// Supabase 테이블 이름
const TABLE_NAMES = {
  TREATMENT_MASTER: "treatment_master",
  CATEGORY_TREATTIME_RECOVERY: "category_treattime_recovery",
  HOSPITAL_MASTER: "hospital_master",
  KEYWORD_MONTHLY_TRENDS: "keyword_monthly_trends",
};

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

// 키워드 월별 트렌드 인터페이스
export interface KeywordMonthlyTrend {
  keyword?: string;
  month?: string;
  trend_count?: number;
  [key: string]: any;
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
    while (hasMore) {
      const { data, error } = await client
        .from(TABLE_NAMES.TREATMENT_MASTER)
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

// 시술 데이터 페이지네이션 로드 (초기 일부만 로드)
export async function loadTreatmentsPaginated(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    searchTerm?: string;
    categoryLarge?: string;
    categoryMid?: string;
    skipPlatformSort?: boolean; // 랭킹 페이지용: 플랫폼 정렬 건너뛰기
  }
): Promise<{ data: Treatment[]; total: number; hasMore: boolean }> {
  try {
    const client = getSupabaseOrNull();
    if (!client) {
      return { data: [], total: 0, hasMore: false };
    }

    let query = client
      .from(TABLE_NAMES.TREATMENT_MASTER)
      .select("*", { count: "exact" });

    // 필터 적용 (최소 2글자 이상일 때만 검색)
    if (filters?.searchTerm && filters.searchTerm.trim().length >= 2) {
      const term = filters.searchTerm.toLowerCase().trim();
      query = query.or(
        `treatment_name.ilike.%${term}%,hospital_name.ilike.%${term}%,treatment_hashtags.ilike.%${term}%`
      );
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

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return { data: [], total: 0, hasMore: false };
    }

    const cleanedData = cleanData<Treatment>(data);
    // 랭킹 페이지는 플랫폼 정렬을 건너뛰고 원본 순서 유지 (랭킹 알고리즘이 정렬함)
    const sortedData = filters?.skipPlatformSort
      ? cleanedData
      : sortTreatmentsByPlatform(cleanedData);
    const total = count || 0;
    const hasMore = to < total - 1;

    return { data: sortedData, total, hasMore };
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
    const { data, error } = await client
      .from(TABLE_NAMES.TREATMENT_MASTER)
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

    // 중분류 컬럼과 category_mid를 매칭 (더 강력한 매칭 로직)
    // 1) 정규화된 정확 일치 우선
    let matched = normalizedRecoveryData.find(
      (item) => item._normalized && item._normalized === normalizedCategoryMid
    );

    // 2) 원본 문자열 정확 일치
    if (!matched) {
      matched = normalizedRecoveryData.find(
        (item) => item._mid === categoryMidTrimmed
      );
    }

    // 3) 정규화된 부분 일치
    if (!matched) {
      matched = normalizedRecoveryData.find((item) => {
        if (!item._normalized) return false;
        return (
          item._normalized.includes(normalizedCategoryMid) ||
          normalizedCategoryMid.includes(item._normalized)
        );
      });
    }

    // 4) 원본 부분 일치
    if (!matched) {
      matched = normalizedRecoveryData.find((item) => {
        const mid = item._mid;
        if (!mid) return false;
        return (
          mid.includes(categoryMidTrimmed) || categoryMidTrimmed.includes(mid)
        );
      });
    }

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
export async function loadTreatmentById(
  treatmentId: number
): Promise<Treatment | null> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return null;

    const { data, error } = await client
      .from(TABLE_NAMES.TREATMENT_MASTER)
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

    let query = client
      .from(TABLE_NAMES.TREATMENT_MASTER)
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

// 같은 병원의 다른 시술들 로드 (PDP 페이지용)
export async function loadHospitalTreatments(
  hospitalName: string,
  excludeId?: number
): Promise<Treatment[]> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    let query = client
      .from(TABLE_NAMES.TREATMENT_MASTER)
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

// 병원 데이터 페이지네이션 로드
export async function loadHospitalsPaginated(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    searchTerm?: string;
    category?: string;
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

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data) {
      return { data: [], total: 0, hasMore: false };
    }

    const cleanedData = cleanData<HospitalMaster>(data);
    // 플랫폼 우선순위로 정렬 (gangnamunni 우선, babitalk/yeoti 후순위)
    const sortedData = sortHospitalsByPlatform(cleanedData);
    const total = count || 0;
    const hasMore = to < total - 1;

    return { data: sortedData, total, hasMore };
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
export async function loadKeywordMonthlyTrends(): Promise<
  KeywordMonthlyTrend[]
> {
  try {
    const client = getSupabaseOrNull();
    if (!client) return [];

    const { data, error } = await client
      .from(TABLE_NAMES.KEYWORD_MONTHLY_TRENDS)
      .select("*");

    if (error) {
      throw new Error(`Supabase 오류: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return cleanData<KeywordMonthlyTrend>(data);
  } catch (error) {
    console.error("키워드 트렌드 데이터 로드 실패:", error);
    throw error;
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
  // 여행 일수 계산
  const start = new Date(startDate);
  const end = new Date(endDate);
  const travelDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // n박 n일

  // 아주 짧은 일정(당일 or 1박 2일)일 때는,
  // 회복친화적인 3일짜리 시술까지는 보여주기 위해
  // 필터 기준을 최소 3일로 완화
  const effectiveTravelDays = travelDays <= 2 ? 3 : travelDays;

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

    // 일반 카테고리: category_large를 우선적으로 확인
    // category_large가 매핑된 카테고리 중 하나와 일치하는지 확인
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

    // category_large가 매칭되지 않으면, category_mid만으로는 선택하지 않음
    // (이렇게 하면 다른 대분류의 시술이 잘못 필터링되는 것을 방지)
    //
    // TODO: 데이터가 10,000개 이상일 때는 더 엄격한 필터링 필요
    // - category_large와 category_mid 모두 정확히 매칭되어야 함
    // - 키워드 포함 검사 대신 정확한 문자열 매칭 사용
    // - 예: category_large === mapped (정확히 일치) && category_mid가 매핑된 중분류와 일치
    return false;
  });

  console.log(
    `[일정 기반 추천] 선택 카테고리: ${categoryLarge}, 필터링된 데이터: ${categoryFiltered.length}개`
  );

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
      const categoryMid = uniqueKey.split("::")[1] || "기타";

      // 먼저 category_treattime_recovery 테이블에서 권장체류일수 및 회복기간 범위 가져오기
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

      // 권장체류일수가 여행 일수보다 크면, 이 중분류 전체를 추천에서 제외
      // 단, 당일/1박 2일은 effectiveTravelDays=3으로 간주하여 3일짜리 시술까지 허용
      if (groupStayDays > 0 && groupStayDays > effectiveTravelDays) {
        return null;
      }

      let suitableTreatments: Treatment[];
      if (groupStayDays > 0) {
        // 권장체류일수가 여행 일수 이내면 해당 중분류 전체를 포함
        suitableTreatments = treatmentList;
      } else {
        // 권장체류일수가 없으면 기존 로직 사용 (downtime 기반)
        suitableTreatments = treatmentList.filter((treatment) => {
          const recoveryPeriod = parseRecoveryPeriod(treatment.downtime);
          // 회복기간 정보가 없으면 포함 (기본적으로 표시)
          if (recoveryPeriod === 0) return true;
          // 여행 일수에서 최소 1일은 여유를 둠 (시술 당일 제외)
          // 당일/1박 2일의 경우 effectiveTravelDays=3이므로 2일까지 허용
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

      return {
        categoryMid,
        treatments: sortedTreatments,
        averageRecoveryPeriod: Math.round(averageRecoveryPeriod * 10) / 10,
        averageRecoveryPeriodMin: recoveryMin,
        averageRecoveryPeriodMax: recoveryMax,
        averageProcedureTime: Math.round(averageProcedureTime),
        averageProcedureTimeMin: procedureTimeMin,
        averageProcedureTimeMax: procedureTimeMax,
      };
    }
  );

  const recommendations = (await Promise.all(recommendationsPromises)).filter(
    (rec): rec is ScheduleBasedRecommendation => rec !== null
  );

  return recommendations
    .filter((rec) => rec.treatments.length > 0) // 시술이 있는 중분류만
    .sort((a, b) => {
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
  cost: number;
  procedure_rating: number;
  hospital_rating: number;
  gender: "여" | "남";
  age_group: string;
  surgery_date?: string;
  content: string;
  images?: string[];
  user_id?: number; // 선택사항, 기본값 0
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
  user_id?: number; // 선택사항, 기본값 0
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// 고민글 데이터 인터페이스
export interface ConcernPostData {
  id?: string; // UUID
  title: string;
  concern_category: string;
  content: string;
  user_id?: number; // 선택사항, 기본값 0
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// 시술후기 저장
export async function saveProcedureReview(
  data: ProcedureReviewData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const reviewData = {
      user_id: data.user_id ?? 0,
      category: data.category,
      procedure_name: data.procedure_name,
      hospital_name: data.hospital_name || null,
      cost: data.cost,
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
    const reviewData = {
      user_id: data.user_id ?? 0,
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
    const postData = {
      user_id: data.user_id ?? 0,
      title: data.title,
      concern_category: data.concern_category,
      content: data.content,
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

    return data as ProcedureReviewData[];
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

    return data as HospitalReviewData[];
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

    return data as ConcernPostData[];
  } catch (error) {
    console.error("고민글 로드 실패:", error);
    return [];
  }
}
