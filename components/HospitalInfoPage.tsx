"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiStar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiGlobe,
  FiMessageCircle,
  FiEdit3,
} from "react-icons/fi";
import {
  loadHospitalsPaginated,
  getHospitalAutocomplete,
  HospitalMaster,
  getThumbnailUrl,
} from "@/lib/api/beautripApi";
import CommunityWriteModal from "./CommunityWriteModal";
import AutocompleteInput from "./AutocompleteInput";

export default function HospitalInfoPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [inquiryModalOpen, setInquiryModalOpen] = useState<string | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50; // 한 번에 로드할 개수

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // 자동완성 상태
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);

  // 리뷰 작성 여부 확인
  useEffect(() => {
    const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    setHasWrittenReview(reviews.length > 0);
  }, []);

  // 자동완성 데이터 로드
  useEffect(() => {
    const loadAutocomplete = async () => {
      if (searchTerm.length < 1) {
        setAutocompleteSuggestions([]);
        return;
      }

      const suggestions = await getHospitalAutocomplete(searchTerm, 10);
      setAutocompleteSuggestions(suggestions);
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

      const result = await loadHospitalsPaginated(page, pageSize, {
        searchTerm: searchTerm || undefined,
        category: filterCategory || undefined,
      });

      // 랜덤으로 섞기
      const shuffledData = [...result.data].sort(() => Math.random() - 0.5);

      if (reset) {
        setHospitals(shuffledData);
      } else {
        setHospitals((prev) => [...prev, ...shuffledData]);
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

  // 초기 데이터 로드 및 필터 변경 시 재로드
  useEffect(() => {
    // 검색어가 1글자 이하일 때는 검색하지 않음
    if (searchTerm && searchTerm.trim().length === 1) {
      setHospitals([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }
    loadData(1, true);
  }, [searchTerm, filterCategory]);

  // 카테고리 목록 (정적 데이터로 관리 - 필요시 별도 API 호출)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    hospitals.forEach((hospital: HospitalMaster) => {
      if (hospital.hospital_departments) {
        try {
          const departments =
            typeof hospital.hospital_departments === "string"
              ? JSON.parse(hospital.hospital_departments)
              : hospital.hospital_departments;

          if (Array.isArray(departments)) {
            departments.forEach((dept: string) => cats.add(dept));
          } else if (typeof departments === "string") {
            departments.split(",").forEach((dept: string) => {
              const trimmed = dept.trim();
              if (trimmed) cats.add(trimmed);
            });
          }
        } catch (e) {
          if (typeof hospital.hospital_departments === "string") {
            cats.add(hospital.hospital_departments);
          }
        }
      }
    });
    return Array.from(cats).sort();
  }, [hospitals]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadData(currentPage + 1, false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // localStorage에서 찜한 병원 목록 불러오기
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const clinicFavorites = savedFavorites
      .filter((f: any) => f.type === "clinic")
      .map((f: any) => f.name || f.title || f.clinic);
    setFavorites(new Set(clinicFavorites));
  }, []);

  const handleFavoriteClick = (hospital: HospitalMaster) => {
    const hospitalName = hospital.hospital_name || "";
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = savedFavorites.some(
      (f: any) =>
        (f.name === hospitalName ||
          f.title === hospitalName ||
          f.clinic === hospitalName) &&
        f.type === "clinic"
    );

    let updated;
    if (isFavorite) {
      updated = savedFavorites.filter(
        (f: any) =>
          !(
            (f.name === hospitalName ||
              f.title === hospitalName ||
              f.clinic === hospitalName) &&
            f.type === "clinic"
          )
      );
    } else {
      // hospital_departments를 배열로 변환
      let departments: string[] = [];
      if (hospital.hospital_departments) {
        try {
          const depts =
            typeof hospital.hospital_departments === "string"
              ? JSON.parse(hospital.hospital_departments)
              : hospital.hospital_departments;
          departments = Array.isArray(depts) ? depts : [depts];
        } catch (e) {
          if (typeof hospital.hospital_departments === "string") {
            departments = hospital.hospital_departments
              .split(",")
              .map((d) => d.trim());
          }
        }
      }

      const newFavorite = {
        name: hospitalName,
        title: hospitalName,
        clinic: hospitalName,
        rating: hospital.hospital_rating || 0,
        reviewCount: hospital.review_count || 0,
        procedures: departments,
        specialties: departments,
        address: hospital.hospital_address,
        type: "clinic" as const,
      };
      updated = [...savedFavorites, newFavorite];
    }

    localStorage.setItem("favorites", JSON.stringify(updated));

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.delete(hospitalName);
      } else {
        newFavorites.add(hospitalName);
      }
      return newFavorites;
    });

    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  const handleInquiryClick = (hospitalName: string) => {
    setInquiryModalOpen(
      inquiryModalOpen === hospitalName ? null : hospitalName
    );
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

  return (
    <div className="bg-white">
      {/* 필터 섹션 */}
      <div className="sticky top-[156px] z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="space-y-2">
          <AutocompleteInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="병원명을 입력해 주세요."
            suggestions={autocompleteSuggestions}
            onSuggestionSelect={(suggestion) => {
              setSearchTerm(suggestion);
            }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 py-6">
        {hospitals.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              총 {totalCount}개의 병원{" "}
              {hospitals.length > 0 && `(표시: ${hospitals.length}개)`}
            </div>

            {/* 그리드 레이아웃 (3열 4행) - 상세 정보 포함 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {hospitals.map((hospital: HospitalMaster) => {
                const hospitalName = hospital.hospital_name || "병원명 없음";
                const isFavorite = favorites.has(hospitalName);

                // 실제 테이블 필드명 사용 (빈 문자열 방지)
                const thumbnailUrl = hospital.hospital_img || null;

                // hospital_departments에서 첫 번째 진료과를 대표 시술로 사용
                let topDepartment = "진료과 정보 없음";
                if (hospital.hospital_departments) {
                  try {
                    const departments =
                      typeof hospital.hospital_departments === "string"
                        ? JSON.parse(hospital.hospital_departments)
                        : hospital.hospital_departments;

                    if (Array.isArray(departments) && departments.length > 0) {
                      topDepartment = departments[0];
                    } else if (typeof departments === "string") {
                      topDepartment =
                        departments.split(",")[0].trim() || departments;
                    }
                  } catch (e) {
                    if (typeof hospital.hospital_departments === "string") {
                      topDepartment = hospital.hospital_departments;
                    }
                  }
                }

                const location = hospital.hospital_address || "주소 정보 없음";

                return (
                  <div
                    key={hospital.hospital_id || hospitalName}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (hospital.hospital_id) {
                        router.push(`/hospital/${hospital.hospital_id}`);
                      }
                    }}
                  >
                    {/* 썸네일 - 2:1 비율 */}
                    <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={hospitalName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // 이미 fallback을 시도했다면 더 이상 시도하지 않음
                            if (
                              target.src.includes("data:image") ||
                              target.dataset.fallback === "true"
                            ) {
                              target.style.display = "none";
                              return;
                            }
                            // data URI로 빈 이미지 사용 (에러 방지)
                            target.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="24"%3E🏥%3C/text%3E%3C/svg%3E';
                            target.dataset.fallback = "true";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            이미지 없음
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(hospital);
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
                      {/* 번역 뱃지 */}
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] font-semibold">
                        통역
                      </div>
                    </div>

                    {/* 상세 정보 */}
                    <div className="p-2">
                      {/* 병원명 / 위치 */}
                      <h5 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[28px]">
                        {hospitalName} · {location.split(" ")[0] || location}
                      </h5>
                      {/* 대표 진료과 */}
                      <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">
                        {topDepartment}
                      </p>
                      {/* 평점 */}
                      {(hospital.hospital_rating || 0) > 0 && (
                        <div className="flex items-center gap-0.5">
                          <FiStar className="text-yellow-400 fill-yellow-400 text-[9px]" />
                          <span className="text-[10px] font-semibold text-gray-700">
                            {(hospital.hospital_rating || 0).toFixed(1)}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            ({hospital.review_count || 0})
                          </span>
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
            {!hasWrittenReview && hospitals.length >= 12 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-primary-main/30 text-center">
                <FiEdit3 className="text-primary-main text-2xl mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  리뷰를 작성하면
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  더 많은 병원 정보를 볼 수 있어요!
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
    </div>
  );
}
