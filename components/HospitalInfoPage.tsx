"use client";

import { useState, useEffect, useMemo } from "react";
import { FiHeart, FiStar, FiMapPin, FiPhone, FiMail, FiClock, FiGlobe, FiMessageCircle } from "react-icons/fi";
import { loadTreatments, extractHospitalInfo, HospitalInfo, getThumbnailUrl } from "@/lib/api/beautripApi";

export default function HospitalInfoPage() {
  const [allTreatments, setAllTreatments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [inquiryModalOpen, setInquiryModalOpen] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadTreatments();
        setAllTreatments(data);
        const hospitalData = extractHospitalInfo(data);
        setHospitals(hospitalData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 카테고리 목록
  const categories = useMemo(() => {
    const cats = new Set<string>();
    hospitals.forEach((hospital) => {
      hospital.categories.forEach((cat) => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [hospitals]);

  // 필터링된 병원 목록
  const filteredHospitals = useMemo(() => {
    let filtered = [...hospitals];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (hospital) =>
          hospital.hospital_name.toLowerCase().includes(term) ||
          hospital.procedures.some((proc) =>
            proc.toLowerCase().includes(term)
          )
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((hospital) =>
        hospital.categories.includes(filterCategory)
      );
    }

    return filtered;
  }, [hospitals, searchTerm, filterCategory]);

  // 상위 10개만 표시 (스크롤 페이지용)
  const displayHospitals = filteredHospitals.slice(0, 10);

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

  const handleFavoriteClick = (hospital: HospitalInfo) => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = savedFavorites.some(
      (f: any) =>
        (f.name === hospital.hospital_name || f.title === hospital.hospital_name || f.clinic === hospital.hospital_name) &&
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

  const handleInquiryClick = (hospitalName: string) => {
    setInquiryModalOpen(inquiryModalOpen === hospitalName ? null : hospitalName);
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
          <p className="text-lg text-gray-700 mb-2">데이터를 불러오는 중 오류가 발생했습니다.</p>
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
          <input
            type="text"
            placeholder="병원명 / 시술명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
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

      <div className="px-4 py-6 space-y-4">
        {filteredHospitals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              총 {filteredHospitals.length}개의 병원 중 상위 10개를 표시합니다.
            </div>
            {displayHospitals.map((hospital) => {
              const isFavorite = favorites.has(hospital.hospital_name);
              // 병원의 첫 번째 시술 이미지 사용
              const firstTreatment = hospital.treatments[0];
              const thumbnailUrl = firstTreatment
                ? getThumbnailUrl(firstTreatment)
                : "https://via.placeholder.com/400x300/667eea/ffffff?text=🏥";

              return (
                <div
                  key={hospital.hospital_name}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-primary-light/20 to-primary-main/30">
                    <img
                      src={thumbnailUrl}
                      alt={hospital.hospital_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/400x300/667eea/ffffff?text=🏥";
                      }}
                    />
                    <button
                      onClick={() => handleFavoriteClick(hospital)}
                      className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors"
                    >
                      <FiHeart
                        className={`text-lg ${
                          isFavorite ? "text-red-500 fill-red-500" : "text-gray-700"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {hospital.hospital_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-900 font-semibold">
                          {hospital.averageRating > 0
                            ? hospital.averageRating.toFixed(1)
                            : "-"}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({hospital.totalReviews > 0 ? `${hospital.totalReviews}개` : "리뷰 없음"})
                        </span>
                      </div>
                    </div>

                    {/* 카테고리 */}
                    {hospital.categories.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {hospital.categories.map((category, idx) => (
                            <span
                              key={idx}
                              className="bg-primary-light/20 text-primary-main px-2 py-1 rounded text-xs font-medium"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Procedures */}
                    {hospital.procedures.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">
                          주요 시술 ({hospital.treatments.length}개)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {hospital.procedures.slice(0, 6).map((procedure, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                            >
                              {procedure}
                            </span>
                          ))}
                          {hospital.procedures.length > 6 && (
                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                              +{hospital.procedures.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 시술정보 섹션 */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">시술정보</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {hospital.procedures.slice(0, 5).map((procedure, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-main rounded-full"></span>
                            <span>{procedure}</span>
                          </div>
                        ))}
                        {hospital.procedures.length > 5 && (
                          <div className="text-gray-500 text-xs mt-1">
                            외 {hospital.procedures.length - 5}개 시술
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - 문의하기, 찜하기 */}
                    <div className="flex gap-2 relative">
                      <button
                        onClick={() => handleInquiryClick(hospital.hospital_name)}
                        className="flex-1 bg-primary-main hover:bg-[#2DB8A0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FiMessageCircle className="text-base" />
                        문의하기
                      </button>
                      <button
                        onClick={() => handleFavoriteClick(hospital)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                          isFavorite
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <FiHeart className={`text-base ${isFavorite ? "fill-red-600" : ""}`} />
                        {isFavorite ? "찜함" : "찜하기"}
                      </button>

                      {/* 문의하기 모달 (채팅 문의, 전화 문의, 메일 문의) */}
                      {inquiryModalOpen === hospital.hospital_name && (
                        <>
                          <div
                            className="fixed inset-0 z-40 bg-black/20"
                            onClick={() => setInquiryModalOpen(null)}
                          ></div>
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                            <button
                              onClick={() => {
                                alert(`${hospital.hospital_name} AI 채팅 문의 기능은 추후 구현 예정입니다.`);
                                setInquiryModalOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
                            >
                              <FiMessageCircle className="text-primary-main text-lg" />
                              <span className="text-sm font-medium text-gray-900">AI 채팅 문의</span>
                            </button>
                            <button
                              onClick={() => {
                                const phone = prompt("전화번호를 입력해주세요:");
                                if (phone) {
                                  window.location.href = `tel:${phone}`;
                                }
                                setInquiryModalOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
                            >
                              <FiPhone className="text-primary-main text-lg" />
                              <span className="text-sm font-medium text-gray-900">전화 문의</span>
                            </button>
                            <button
                              onClick={() => {
                                const email = prompt("이메일 주소를 입력해주세요:");
                                if (email) {
                                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(`${hospital.hospital_name} 문의`)}`;
                                }
                                setInquiryModalOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                              <FiMail className="text-primary-main text-lg" />
                              <span className="text-sm font-medium text-gray-900">메일 문의</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 페이지네이션 제거 (스크롤 페이지에서는 상위 10개만 표시) */}
          </>
        )}
      </div>
    </div>
  );
}

