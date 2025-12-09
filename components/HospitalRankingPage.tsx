"use client";

import { useState, useEffect, useMemo } from "react";
import { FiHeart, FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { loadTreatments, extractHospitalInfo, HospitalInfo, getThumbnailUrl } from "@/lib/api/beautripApi";

const ITEMS_PER_PAGE = 20;

export default function HospitalRankingPage() {
  const [allTreatments, setAllTreatments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadTreatments();
        setAllTreatments(data);
        const hospitalData = extractHospitalInfo(data);
        // 평점 높은 순으로 정렬 (이미 extractHospitalInfo에서 정렬되어 있음)
        setHospitals(hospitalData);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      <div className="px-4 py-6">
        <h3 className="text-lg font-bold mb-2 text-gray-900">
          추천 병원 랭킹
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          평점과 리뷰를 기반으로 한 추천 병원 랭킹입니다.
        </p>

        {hospitals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">병원 정보가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              총 {hospitals.length}개의 병원을 찾았습니다.
              {hospitals.length > ITEMS_PER_PAGE && (
                <span className="ml-2 text-gray-500">
                  ({startIndex + 1}-{Math.min(endIndex, hospitals.length)} / {hospitals.length})
                </span>
              )}
            </div>

            <div className="space-y-4">
              {currentHospitals.map((hospital, index) => {
                const rank = startIndex + index + 1;
                const isFavorite = favorites.has(hospital.hospital_name);
                const firstTreatment = hospital.treatments[0];
                const thumbnailUrl = firstTreatment
                  ? getThumbnailUrl(firstTreatment)
                  : "https://via.placeholder.com/400x300/667eea/ffffff?text=🏥";

                return (
                  <div
                    key={hospital.hospital_name}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-primary-main text-white rounded-lg font-bold text-lg">
                        {rank}
                      </div>

                      {/* Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={thumbnailUrl}
                          alt={hospital.hospital_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/200x200/667eea/ffffff?text=🏥";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                              {hospital.hospital_name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                                <span className="text-gray-900 font-semibold text-sm">
                                  {hospital.averageRating > 0
                                    ? hospital.averageRating.toFixed(1)
                                    : "-"}
                                </span>
                              </div>
                              {hospital.totalReviews > 0 && (
                                <span className="text-gray-500 text-xs">
                                  리뷰 {hospital.totalReviews}개
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleFavoriteClick(hospital)}
                            className="flex-shrink-0 ml-2 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            <FiHeart
                              className={`text-lg ${
                                isFavorite
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Categories */}
                        {hospital.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {hospital.categories.slice(0, 3).map((category, idx) => (
                              <span
                                key={idx}
                                className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-medium"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Procedures Count */}
                        <div className="text-gray-600 text-sm">
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

