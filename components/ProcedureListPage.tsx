"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiHeart,
  FiPhone,
  FiMail,
  FiMessageCircle,
  FiEdit3,
  FiStar,
  FiCalendar,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadTreatmentsPaginated,
  getThumbnailUrl,
  getTreatmentAutocomplete,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  Treatment,
} from "@/lib/api/beautripApi";
import CommunityWriteModal from "./CommunityWriteModal";
import AutocompleteInput from "./AutocompleteInput";
import AddToScheduleModal from "./AddToScheduleModal";

export default function ProcedureListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [inquiryModalOpen, setInquiryModalOpen] = useState<number | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12; // 한 번에 로드할 개수 (3칸 x 4줄)

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

  // URL 쿼리 파라미터에서 검색어 읽기
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // 리뷰 작성 여부 확인
  useEffect(() => {
    const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    setHasWrittenReview(reviews.length > 0);
  }, []);

  // 카테고리 옵션 (정적 데이터로 관리 - 필요시 별도 API 호출)
  const largeCategories = useMemo(() => {
    const categorySet = new Set<string>();
    treatments.forEach((t) => {
      if (t.category_large) {
        categorySet.add(t.category_large);
      }
    });
    return Array.from(categorySet).sort();
  }, [treatments]);

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
  }, [searchTerm]);

  // 데이터 로드 (페이지네이션)
  const loadData = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const result = await loadTreatmentsPaginated(page, pageSize, {
        searchTerm: searchTerm || undefined,
        categoryLarge: categoryLarge || undefined,
        categoryMid: categoryMid || undefined,
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
    }
  }, [searchParams]);

  // 찜한 항목 로드
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const procedureFavorites = savedFavorites
      .filter((f: any) => f.type === "procedure")
      .map((f: any) => f.id);
    setFavorites(new Set(procedureFavorites));
  }, []);

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

  const handleFavoriteClick = (treatment: Treatment) => {
    if (!treatment.treatment_id) return;

    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = savedFavorites.some(
      (f: any) => f.id === treatment.treatment_id && f.type === "procedure"
    );

    let updated;
    if (isFavorite) {
      updated = savedFavorites.filter(
        (f: any) => !(f.id === treatment.treatment_id && f.type === "procedure")
      );
    } else {
      const newFavorite = {
        id: treatment.treatment_id,
        title: treatment.treatment_name,
        clinic: treatment.hospital_name,
        price: treatment.selling_price,
        rating: treatment.rating,
        reviewCount: treatment.review_count,
        type: "procedure" as const,
      };
      updated = [...savedFavorites, newFavorite];
    }

    localStorage.setItem("favorites", JSON.stringify(updated));

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.delete(treatment.treatment_id!);
      } else {
        newFavorites.add(treatment.treatment_id!);
      }
      return newFavorites;
    });

    window.dispatchEvent(new Event("favoritesUpdated"));
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

    if (selectedTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        selectedTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax; // 회복기간_max 기준
        recoveryText = recoveryInfo.recoveryText;
      }
    }

    // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(selectedTreatment.downtime) || 0;
    }

    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");

    const newSchedule = {
      id: Date.now(),
      treatmentId: selectedTreatment.treatment_id,
      procedureDate: date,
      procedureName: selectedTreatment.treatment_name || "시술명 없음",
      hospital: selectedTreatment.hospital_name || "병원명 없음",
      category:
        selectedTreatment.category_mid ||
        selectedTreatment.category_large ||
        "기타",
      categoryMid: selectedTreatment.category_mid || null,
      recoveryDays,
      recoveryText, // 회복 기간 텍스트 추가
      procedureTime: parseProcedureTime(selectedTreatment.surgery_time) || 0,
      price: selectedTreatment.selling_price || null,
      rating: selectedTreatment.rating || 0,
      reviewCount: selectedTreatment.review_count || 0,
    };

    schedules.push(newSchedule);
    localStorage.setItem("schedules", JSON.stringify(schedules));
    window.dispatchEvent(new Event("scheduleAdded"));

    alert(`${date}에 일정이 추가되었습니다!`);
    setIsScheduleModalOpen(false);
    setSelectedTreatment(null);
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
      {/* 필터 섹션 */}
      <div className="sticky top-[156px] z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="space-y-2">
          <AutocompleteInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="시술명/수술명을 입력해 주세요."
            suggestions={autocompleteSuggestions}
            onSuggestionSelect={handleSuggestionSelect}
            onEnter={handleSearchEnter}
          />
          <div className="flex gap-2">
            <select
              value={categoryLarge}
              onChange={(e) => setCategoryLarge(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="">전체 카테고리</option>
              {largeCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
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
              <option value="default">정렬</option>
              <option value="price-low">가격 낮은순</option>
              <option value="price-high">가격 높은순</option>
              <option value="rating">평점 높은순</option>
              <option value="review">리뷰 많은순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 시술 목록 */}
      <div className="px-4 py-6">
        {treatments.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              총 {totalCount}개의 시술{" "}
              {treatments.length > 0 && `(표시: ${treatments.length}개)`}
            </div>

            {/* 그리드 레이아웃 (3열 4행) - 상세 정보 포함 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {sortedTreatments.map((treatment) => {
                const treatmentId = treatment.treatment_id || 0;
                const isFavorite = favorites.has(treatmentId);
                const thumbnailUrl = getThumbnailUrl(treatment);
                const fallbackUrl = getThumbnailUrl({
                  category_large: treatment.category_large,
                });
                const sellingPrice = treatment.selling_price
                  ? `${Math.round(treatment.selling_price / 10000)}만원`
                  : "가격 문의";
                const discountRate = treatment.dis_rate
                  ? `${treatment.dis_rate}%`
                  : "";
                const rating = treatment.rating || 0;
                const reviewCount = treatment.review_count || 0;
                const location = "서울"; // 데이터에 위치 값이 없어 기본값 처리

                return (
                  <div
                    key={treatmentId}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      router.push(`/treatment/${treatmentId}`);
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
                        <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">
                          {discountRate}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(treatment);
                        }}
                        className="absolute top-1 right-1 bg-white/90 p-1 rounded-full shadow-sm hover:bg-white transition-colors"
                      >
                        <FiHeart
                          className={`text-xs ${
                            isFavorite
                              ? "text-red-500 fill-red-500"
                              : "text-gray-700"
                          }`}
                        />
                      </button>
                      {/* 번역 뱃지 (예시) */}
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] font-semibold">
                        통역
                      </div>
                    </div>

                    {/* 상세 정보 */}
                    <div className="p-2">
                      {/* 병원명 */}
                      <p className="text-[10px] text-gray-500 mb-0.5 line-clamp-1">
                        {treatment.hospital_name} · {location}
                      </p>
                      {/* 시술명 */}
                      <h5 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[28px]">
                        {treatment.treatment_name}
                      </h5>
                      {/* 가격 */}
                      <div className="mb-1">
                        <span className="text-sm font-bold text-primary-main">
                          {sellingPrice}
                        </span>
                        {treatment.vat_info && (
                          <span className="text-[9px] text-gray-500 ml-0.5">
                            {treatment.vat_info}
                          </span>
                        )}
                      </div>
                      {/* 평점 */}
                      {rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <FiStar className="text-yellow-400 fill-yellow-400 text-[9px]" />
                          <span className="text-[10px] font-semibold text-gray-700">
                            {rating.toFixed(1)}
                          </span>
                          {reviewCount > 0 && (
                            <span className="text-[9px] text-gray-400">
                              ({reviewCount})
                            </span>
                          )}
                        </div>
                      )}
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
                  {loadingMore ? "로딩 중..." : "더보기"}
                </button>
              </div>
            )}

            {/* 글 작성 유도 섹션 (리뷰 미작성 시에만 표시) */}
            {!hasWrittenReview && treatments.length >= 12 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-primary-main/30 text-center">
                <FiEdit3 className="text-primary-main text-2xl mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  리뷰를 작성하면
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  더 많은 시술 정보를 볼 수 있어요!
                </p>
                <button
                  onClick={() => setIsWriteModalOpen(true)}
                  className="bg-primary-main hover:bg-[#2DB8A0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  리뷰 작성하기
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 커뮤니티 글쓰기 모달 */}
      <CommunityWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => {
          setIsWriteModalOpen(false);
          // 리뷰 작성 후 상태 업데이트
          const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
          setHasWrittenReview(reviews.length > 0);
        }}
      />

      {/* 일정 추가 모달 */}
      {selectedTreatment && (
        <AddToScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedTreatment(null);
          }}
          onDateSelect={handleDateSelect}
          treatmentName={selectedTreatment.treatment_name || "시술명 없음"}
          categoryMid={selectedTreatment.category_mid || null}
        />
      )}
    </div>
  );
}
