"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  loadTreatmentsPaginated,
  extractHospitalInfo,
  HospitalInfo,
  getThumbnailUrl,
  loadHospitalsPaginated,
} from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";

const ITEMS_PER_PAGE = 20;

export default function HospitalRankingPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [allTreatments, setAllTreatments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hospitalIdMap, setHospitalIdMap] = useState<Map<string, number>>(
    new Map()
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 필요한 만큼만 로드 (300개)
        // 랭킹 페이지는 플랫폼 우선순위 정렬 없이 원본 데이터 순서로 로드
        const [treatmentsResult, hospitalsResult] = await Promise.all([
          loadTreatmentsPaginated(1, 300, { skipPlatformSort: true, language: language }),
          loadHospitalsPaginated(1, 1000, { language: language }),
        ]);

        const data = treatmentsResult.data;
        setAllTreatments(data);
        const hospitalData = extractHospitalInfo(data);
        // 평점 높은 순으로 정렬 (이미 extractHospitalInfo에서 정렬되어 있음)
        setHospitals(hospitalData);

        // 병원명으로 hospital_id 매핑 생성
        const idMap = new Map<string, number>();
        hospitalsResult.data.forEach((h) => {
          if (h.hospital_name && h.hospital_id) {
            idMap.set(h.hospital_name, h.hospital_id);
          }
        });
        setHospitalIdMap(idMap);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]);

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const clinicFavorites = savedFavorites
      .filter((f: any) => f.type === "clinic")
      .map((f: any) => f.name || f.title || f.clinic);
    setFavorites(new Set(clinicFavorites));
  }, []);

  // 페이지네이션
  const totalPages = Math.ceil(hospitals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentHospitals = hospitals.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavoriteClick = (hospital: HospitalInfo) => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = savedFavorites.some(
      (f: any) =>
        (f.name === hospital.hospital_name ||
          f.title === hospital.hospital_name ||
          f.clinic === hospital.hospital_name) &&
        f.type === "clinic"
    );

    let updated;
    if (isFavorite) {
      updated = savedFavorites.filter(
        (f: any) =>
          !(
            (f.name === hospital.hospital_name ||
              f.title === hospital.hospital_name ||
              f.clinic === hospital.hospital_name) &&
            f.type === "clinic"
          )
      );
    } else {
      const newFavorite = {
        name: hospital.hospital_name,
        title: hospital.hospital_name,
        clinic: hospital.hospital_name,
        rating: hospital.averageRating,
        reviewCount: hospital.totalReviews,
        procedures: hospital.procedures,
        specialties: hospital.categories,
        type: "clinic" as const,
      };
      updated = [...savedFavorites, newFavorite];
    }

    localStorage.setItem("favorites", JSON.stringify(updated));

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.delete(hospital.hospital_name);
      } else {
        newFavorites.add(hospital.hospital_name);
      }
      return newFavorites;
    });

    window.dispatchEvent(new Event("favoritesUpdated"));
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

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 pt-4 pb-6">
        <h3 className="text-lg font-bold mb-2 text-gray-900">추천 병원 랭킹</h3>
        <p className="text-sm text-gray-600 mb-6">
          평점과 리뷰를 기반으로 한 추천 병원 랭킹입니다.
        </p>

        {hospitals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">병원 정보가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentHospitals.map((hospital, index) => {
                const rank = startIndex + index + 1;
                const isFavorite = favorites.has(hospital.hospital_name);
                const firstTreatment = hospital.treatments[0];
                const thumbnailUrl = firstTreatment
                  ? getThumbnailUrl(firstTreatment)
                  : "";

                const hospitalId = hospitalIdMap.get(hospital.hospital_name);
                // Set<string>을 배열로 변환 (한 번만 변환하여 재사용)
                const categoriesArr = Array.from(hospital.categories ?? []);

                return (
                  <div
                    key={hospital.hospital_name}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (hospitalId) {
                        const query =
                          hospital.hospital_id_rd && hospital.platform
                            ? `?platform=${hospital.platform}`
                            : "";
                        router.push(`/hospital/${hospitalId}${query}`);
                      }
                    }}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Rank Badge - 더 작고 세련되게 */}
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-md font-bold text-sm">
                        {rank}
                      </div>

                      {/* Image - 2:1 비율, 더 크게 */}
                      <div className="relative w-32 aspect-[2/1] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={thumbnailUrl}
                          alt={hospital.hospital_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.fallback === "true") {
                              target.style.display = "none";
                              return;
                            }
                            target.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="20"%3E🏥%3C/text%3E%3C/svg%3E';
                            target.dataset.fallback = "true";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1.5">
                            <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug flex-1">
                              {hospital.hospital_name}
                            </h3>
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteClick(hospital);
                              }}
                            className="flex-shrink-0 ml-2 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            <FiHeart
                                className={`text-base ${
                                isFavorite
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                        </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                              <span className="text-gray-900 font-semibold text-xs">
                                {hospital.averageRating > 0
                                  ? hospital.averageRating.toFixed(1)
                                  : "-"}
                              </span>
                            </div>
                            {hospital.totalReviews > 0 && (
                              <span className="text-gray-500 text-[10px]">
                                리뷰 {hospital.totalReviews}개
                              </span>
                            )}
                          </div>

                        {/* Categories */}
                        {categoriesArr.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {categoriesArr
                                .slice(0, 3)
                                .map((category, idx) => (
                              <span
                                key={idx}
                                    className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-[10px] font-medium"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Procedures Count */}
                          <div className="text-gray-600 text-xs">
                          시술 {hospital.treatments.length}개
                          {hospital.procedures.length > 0 && (
                            <span className="ml-2 text-gray-500">
                              • {hospital.procedures.slice(0, 2).join(", ")}
                              {hospital.procedures.length > 2 && " 외"}
                            </span>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <FiChevronLeft className="text-lg" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-primary-main text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <FiChevronRight className="text-lg" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
