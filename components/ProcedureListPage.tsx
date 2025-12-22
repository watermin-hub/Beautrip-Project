"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiHeart,
  FiPhone,
  FiMail,
  FiMessageCircle,
  FiStar,
  FiCalendar,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  loadTreatmentsPaginated,
  getThumbnailUrl,
  getTreatmentAutocomplete,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  toggleProcedureFavorite,
  getFavoriteStatus,
  Treatment,
} from "@/lib/api/beautripApi";
import AutocompleteInput from "./AutocompleteInput";
import AddToScheduleModal from "./AddToScheduleModal";

interface ProcedureListPageProps {
  activeSection?: string;
}

export default function ProcedureListPage({
  activeSection = "procedure",
}: ProcedureListPageProps) {
  const { t, language } = useLanguage();
  const isActive = activeSection === "procedure";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [inquiryModalOpen, setInquiryModalOpen] = useState<number | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10; // 한 번에 로드할 개수 (2칸 x 5줄)

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryLarge, setCategoryLarge] = useState("");
  const [categoryMid, setCategoryMid] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // 자동완성 상태
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isSearchExecuted, setIsSearchExecuted] = useState(false); // 검색 실행 여부

  // URL 쿼리 파라미터에서 검색어 읽기
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // 대분류 카테고리 10개 (정적 목록 - 번역 지원)
  const largeCategories = [
    { key: "category.eyes", value: "눈성형" },
    { key: "category.lifting", value: "리프팅" },
    { key: "category.botox", value: "보톡스" },
    { key: "category.facial", value: "안면윤곽/양악" },
    { key: "category.hairRemoval", value: "제모" },
    { key: "category.liposuction", value: "지방성형" },
    { key: "category.nose", value: "코성형" },
    { key: "category.skin", value: "피부" },
    { key: "category.filler", value: "필러" },
    { key: "category.breast", value: "가슴성형" },
  ];

  const midCategories = useMemo(() => {
    if (!categoryLarge) return [];
    const categorySet = new Set<string>();
    treatments
      .filter((t) => t.category_large === categoryLarge)
      .forEach((t) => {
        if (t.category_mid) {
          categorySet.add(t.category_mid);
        }
      });
    return Array.from(categorySet).sort();
  }, [treatments, categoryLarge]);

  // 자동완성 데이터 로드
  useEffect(() => {
    // 검색이 실행된 후에는 자동완성 로드하지 않음
    if (isSearchExecuted) {
      setAutocompleteSuggestions([]);
      return;
    }

    const loadAutocomplete = async () => {
      // 최소 2글자 이상 완성된 글자만 자동완성 검색
      if (searchTerm.length < 2) {
        setAutocompleteSuggestions([]);
        return;
      }

      const result = await getTreatmentAutocomplete(searchTerm, 10);
      const allSuggestions = [
        ...result.treatmentNames,
        ...result.hospitalNames,
      ];
      setAutocompleteSuggestions(allSuggestions);
    };

    const debounceTimer = setTimeout(() => {
      loadAutocomplete();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, isSearchExecuted]);

  // 데이터 로드 (페이지네이션)
  const loadData = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        // 검색 실행 플래그 설정 (자동완성 숨기기)
        if (searchTerm && searchTerm.trim().length >= 2) {
          setIsSearchExecuted(true);
        }
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const result = await loadTreatmentsPaginated(page, pageSize, {
        searchTerm: searchTerm || undefined,
        categoryLarge: categoryLarge || undefined,
        categoryMid: categoryMid || undefined,
        randomOrder: true, // 랜덤 정렬
        language: language,
      });

      // 플랫폼 정렬은 loadTreatmentsPaginated에서 이미 적용됨 (gangnamunni 우선, babitalk/yeoti 후순위)

      if (reset) {
        setTreatments(result.data);
      } else {
        setTreatments((prev) => [...prev, ...result.data]);
      }

      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 검색 실행 상태 (자동완성 선택 또는 엔터 입력 시에만 true)
  const [shouldExecuteSearch, setShouldExecuteSearch] = useState(false);

  // 초기 데이터 로드 및 필터 변경 시 재로드
  useEffect(() => {
    // 검색어가 없을 때는 초기 데이터 로드 (검색어 없이 전체 데이터)
    if (!searchTerm || searchTerm.trim().length === 0) {
      loadData(1, true);
      setShouldExecuteSearch(false);
      return;
    }

    // 검색어가 2글자 미만일 때는 검색하지 않음 (한글 조합 중 방지)
    if (searchTerm.trim().length < 2) {
      setTreatments([]);
      setTotalCount(0);
      setHasMore(false);
      setShouldExecuteSearch(false);
      return;
    }

    // 검색 실행 플래그가 true일 때만 검색 실행 (자동완성 선택 또는 엔터 입력 시)
    if (shouldExecuteSearch) {
      loadData(1, true);
      setShouldExecuteSearch(false); // 검색 실행 후 플래그 리셋
    }
  }, [shouldExecuteSearch, searchTerm, categoryLarge, categoryMid]);

  // 카테고리 변경 시에는 자동으로 검색 실행
  useEffect(() => {
    if (categoryLarge || categoryMid) {
      setShouldExecuteSearch(true);
    }
  }, [categoryLarge, categoryMid]);

  // URL 쿼리 파라미터에서 검색어 읽기
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
      // URL 파라미터로 들어온 검색어는 자동으로 검색 실행
      setShouldExecuteSearch(true);
    }
  }, [searchParams]);

  // 찜한 항목 로드 (Supabase에서)
  useEffect(() => {
    const loadFavorites = async () => {
      if (treatments.length === 0) return;

      const treatmentIds = treatments
        .map((t) => t.treatment_id)
        .filter((id): id is number => id !== undefined);

      if (treatmentIds.length > 0) {
        const favoriteStatus = await getFavoriteStatus(treatmentIds);
        setFavorites(favoriteStatus);
      }
    };

    loadFavorites();
  }, [treatments]);

  // 대분류 변경 시 중분류 초기화
  useEffect(() => {
    setCategoryMid("");
  }, [categoryLarge]);

  // 정렬 적용 (로컬 정렬)
  const sortedTreatments = useMemo(() => {
    let sorted = [...treatments];

    if (sortBy === "price-low") {
      sorted.sort((a, b) => (a.selling_price || 0) - (b.selling_price || 0));
    } else if (sortBy === "price-high") {
      sorted.sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0));
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "review") {
      sorted.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }

    return sorted;
  }, [treatments, sortBy]);

  const handleFavoriteClick = async (treatment: Treatment) => {
    if (!treatment.treatment_id) return;

    const result = await toggleProcedureFavorite(treatment.treatment_id);

    if (result.success) {
      // Supabase 업데이트 성공 시 로컬 상태 업데이트
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (result.isFavorite) {
          newFavorites.add(treatment.treatment_id!);
        } else {
          newFavorites.delete(treatment.treatment_id!);
        }
        return newFavorites;
      });
      window.dispatchEvent(new Event("favoritesUpdated"));
    } else {
      console.error("찜하기 처리 실패:", result.error);
    }
  };

  const handleInquiryClick = (treatmentId: number) => {
    setInquiryModalOpen(inquiryModalOpen === treatmentId ? null : treatmentId);
  };

  // 일정 추가 핸들러
  const handleDateSelect = async (date: string) => {
    if (!selectedTreatment) return;

    // category_mid로 회복 기간 정보 가져오기 (소분류_리스트와 매칭)
    let recoveryDays = 0;
    let recoveryText: string | null = null;
    let recoveryGuides: Record<string, string | null> | undefined = undefined;

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax; // 회복기간_max 기준
        recoveryText = recoveryInfo.recoveryText;
        recoveryGuides = recoveryInfo.recoveryGuides; // 회복 가이드 범위별 텍스트 추가
      }
    }

    // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");

    // 중복 체크: 같은 날짜에 동일한 시술이 있는지 확인
    const procedureName =
      selectedTreatment.treatment_name || t("common.noTreatmentName");
    const hospital =
      selectedTreatment.hospital_name || t("common.noHospitalName");
    const treatmentId = selectedTreatment.treatment_id;

    const isDuplicate = schedules.some((s: any) => {
      if (s.procedureDate !== date) return false;
      // treatmentId가 있으면 treatmentId로 비교
      if (treatmentId && s.treatmentId) {
        return s.treatmentId === treatmentId;
      }
      // treatmentId가 없으면 procedureName과 hospital 조합으로 비교
      return s.procedureName === procedureName && s.hospital === hospital;
    });

    if (isDuplicate) {
      alert(t("alert.duplicateSchedule"));
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
      return;
    }

    const newSchedule = {
      id: Date.now(),
      treatmentId: treatmentId,
      procedureDate: date,
      procedureName: procedureName,
      hospital: hospital,
      category:
        selectedTreatment.category_mid ||
        selectedTreatment.category_large ||
        "기타",
      categoryMid: selectedTreatment.category_mid || null,
      categorySmall: selectedTreatment.category_small || null, // 소분류 추가
      recoveryDays,
      recoveryText, // 회복 기간 텍스트 추가
      recoveryGuides, // 회복 가이드 범위별 텍스트 추가
      procedureTime: parseProcedureTime(selectedTreatment.surgery_time) || 0,
      price: selectedTreatment.selling_price || null,
      rating: selectedTreatment.rating || 0,
      reviewCount: selectedTreatment.review_count || 0,
    };

    schedules.push(newSchedule);

    // localStorage 저장 시도 (에러 처리 추가)
    try {
      const schedulesJson = JSON.stringify(schedules);
      localStorage.setItem("schedules", schedulesJson);
      window.dispatchEvent(new Event("scheduleAdded"));
      alert(`${date}에 일정이 추가되었습니다!`);
      setIsScheduleModalOpen(false);
      setSelectedTreatment(null);
    } catch (error: any) {
      console.error("일정 저장 실패:", error);
      if (error.name === "QuotaExceededError") {
        alert(t("alert.storageFull"));
      } else {
        alert(`일정 저장 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="text-center py-12">
          <p className="text-lg text-gray-700 mb-2">
            데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-main text-white rounded-lg font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadData(currentPage + 1, false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // 검색어 입력 중에는 검색하지 않음 (자동완성만 보여줌)
    setShouldExecuteSearch(false);
    // 검색어가 변경되거나 비워지면 검색 실행 플래그 리셋 (자동완성 다시 표시)
    if (isSearchExecuted) {
      setIsSearchExecuted(false);
    }
  };

  // 자동완성 선택 시 검색 실행
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShouldExecuteSearch(true);
  };

  // 엔터 입력 시 검색 실행
  const handleSearchEnter = () => {
    if (searchTerm && searchTerm.trim().length >= 2) {
      setShouldExecuteSearch(true);
    }
  };

  return (
    <div className="bg-white">
      {/* 타이틀 + 필터 섹션 (하나의 고정 덩어리) */}
      <div
        className={`${
          isActive ? "sticky top-[104px]" : "relative"
        } z-40 bg-white px-4 py-3 shadow-md border-b border-gray-200`}
      >
        <h2 className="text-lg font-bold text-gray-900">
          {t("explore.section.procedure")}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {t("explore.section.procedureDesc")}
        </p>
        <div className="mt-3 space-y-2">
          <AutocompleteInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t("placeholder.procedureName")}
            suggestions={isSearchExecuted ? [] : autocompleteSuggestions}
            onSuggestionSelect={handleSuggestionSelect}
            onEnter={handleSearchEnter}
          />
          <div className="flex gap-2">
            <select
              value={categoryLarge}
              onChange={(e) => setCategoryLarge(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="">{t("home.category.all")}</option>
              {largeCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {t(category.key)}
                </option>
              ))}
            </select>
            <select
              value={categoryMid}
              onChange={(e) => setCategoryMid(e.target.value)}
              disabled={!categoryLarge}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">중분류</option>
              {midCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="default">{t("label.sort")}</option>
              <option value="price-low">가격 낮은순</option>
              <option value="price-high">가격 높은순</option>
              <option value="rating">평점 높은순</option>
              <option value="review">리뷰 많은순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 시술 목록 */}
      <div className="px-4 py-4">
        {treatments.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{t("common.noSearchResults")}</p>
          </div>
        ) : (
          <>
            {/* 그리드 레이아웃 (2열 4행) - 상세 정보 포함 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sortedTreatments.map((treatment) => {
                const treatmentId = treatment.treatment_id || 0;
                const isFavorite = favorites.has(treatmentId);
                const thumbnailUrl = getThumbnailUrl(treatment);
                const fallbackUrl = getThumbnailUrl({
                  category_large: treatment.category_large,
                });
                const sellingPrice = treatment.selling_price
                  ? `${Math.round(treatment.selling_price / 10000)}만원`
                  : t("common.priceInquiry");
                const discountRate = treatment.dis_rate
                  ? `${treatment.dis_rate}%`
                  : "";
                const rating = treatment.rating || 0;
                const reviewCount = treatment.review_count || 0;
                const location = "서울"; // 데이터에 위치 값이 없어 기본값 처리

                return (
                  <div
                    key={treatmentId}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col"
                    onClick={() => {
                      router.push(`/explore/treatment/${treatmentId}`);
                    }}
                  >
                    {/* 썸네일 - 2:1 비율 */}
                    <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                      <img
                        src={thumbnailUrl}
                        alt={treatment.treatment_name || "시술 이미지"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackUrl;
                        }}
                      />
                      {discountRate && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                          {discountRate}
                        </div>
                      )}
                      {/* 번역 뱃지 */}
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] font-semibold z-10">
                        통역
                      </div>
                      {/* 찜 버튼 - 썸네일 우측 상단 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(treatment);
                        }}
                        className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors"
                      >
                        <FiHeart
                          className={`text-base ${
                            isFavorite
                              ? "text-red-500 fill-red-500"
                              : "text-gray-700"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 카드 내용 */}
                    <div className="p-3 relative">
                      {/* 시술명 */}
                      <h5 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[40px]">
                        {treatment.treatment_name}
                      </h5>

                      {/* 병원명 */}
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {treatment.hospital_name} · {location}
                      </p>

                      {/* 평점 */}
                      {rating > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                          <span className="text-xs font-semibold text-gray-700">
                            {rating.toFixed(1)}
                          </span>
                          {reviewCount > 0 && (
                            <span className="text-xs text-gray-400">
                              ({reviewCount})
                            </span>
                          )}
                        </div>
                      )}

                      {/* 가격 */}
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-primary-main">
                          {sellingPrice}
                        </span>
                        {treatment.vat_info && (
                          <span className="text-[10px] text-gray-500">
                            {treatment.vat_info}
                          </span>
                        )}
                      </div>

                      {/* 일정 추가 버튼 - 카드 우측 하단 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTreatment(treatment);
                          setIsScheduleModalOpen(true);
                        }}
                        className="absolute bottom-3 right-3 p-2 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-colors"
                      >
                        <FiCalendar className="text-base text-primary-main" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? t("common.loading") : t("common.seeMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 일정 추가 모달 */}
      {selectedTreatment && (
        <AddToScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedTreatment(null);
          }}
          onDateSelect={handleDateSelect}
          treatmentName={
            selectedTreatment.treatment_name || t("common.noTreatmentName")
          }
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}
    </div>
  );
}
