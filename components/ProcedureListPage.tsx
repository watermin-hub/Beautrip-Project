"use client";

import { useState, useEffect, useMemo } from "react";
import { FiHeart, FiPhone, FiMail, FiMessageCircle } from "react-icons/fi";
import { loadTreatments, getThumbnailUrl, Treatment } from "@/lib/api/beautripApi";

export default function ProcedureListPage() {
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [inquiryModalOpen, setInquiryModalOpen] = useState<number | null>(null);

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryLarge, setCategoryLarge] = useState("");
  const [categoryMid, setCategoryMid] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // 카테고리 옵션 생성
  const largeCategories = useMemo(() => {
    const categories = [
      ...new Set(allTreatments.map((t) => t.category_large).filter(Boolean)),
    ];
    return categories.sort() as string[];
  }, [allTreatments]);

  const midCategories = useMemo(() => {
    if (!categoryLarge) return [];
    const categories = [
      ...new Set(
        allTreatments
          .filter((t) => t.category_large === categoryLarge)
          .map((t) => t.category_mid)
          .filter(Boolean)
      ),
    ];
    return categories.sort() as string[];
  }, [allTreatments, categoryLarge]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadTreatments();
        setAllTreatments(data);
        setFilteredTreatments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  // 필터 및 정렬 적용
  useEffect(() => {
    let filtered = [...allTreatments];

    // 검색 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (treatment) =>
          treatment.treatment_name?.toLowerCase().includes(term) ||
          treatment.hospital_name?.toLowerCase().includes(term) ||
          treatment.treatment_hashtags?.toLowerCase().includes(term)
      );
    }

    // 카테고리 필터
    if (categoryLarge) {
      filtered = filtered.filter(
        (treatment) => treatment.category_large === categoryLarge
      );
    }

    if (categoryMid) {
      filtered = filtered.filter(
        (treatment) => treatment.category_mid === categoryMid
      );
    }

    // 정렬
    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.selling_price || 0) - (b.selling_price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0));
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "review") {
      filtered.sort(
        (a, b) => (b.review_count || 0) - (a.review_count || 0)
      );
    }

    setFilteredTreatments(filtered);
  }, [allTreatments, searchTerm, categoryLarge, categoryMid, sortBy]);

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

  // 상위 10개만 표시 (스크롤 페이지용)
  const displayTreatments = filteredTreatments.slice(0, 10);

  return (
    <div className="bg-white">
      {/* 필터 섹션 */}
      <div className="sticky top-[156px] z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="시술명 / 병원명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
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
        {filteredTreatments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              총 {filteredTreatments.length}개의 시술 중 상위 10개를 표시합니다.
            </div>
            <div className="space-y-4">
              {displayTreatments.map((treatment) => {
                const treatmentId = treatment.treatment_id || 0;
                const isFavorite = favorites.has(treatmentId);
                const thumbnailUrl = getThumbnailUrl(treatment);
                const fallbackUrl = getThumbnailUrl({
                  category_large: treatment.category_large,
                });
                const originalPrice = treatment.original_price
                  ? new Intl.NumberFormat("ko-KR").format(treatment.original_price) + "원"
                  : "";
                const sellingPrice = treatment.selling_price
                  ? new Intl.NumberFormat("ko-KR").format(treatment.selling_price) + "원"
                  : "-";
                const discountRate = treatment.dis_rate ? `${treatment.dis_rate}%` : "";
                const rating = treatment.rating || 0;
                const reviewCount = treatment.review_count || 0;

                return (
                  <div
                    key={treatmentId}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    {/* 썸네일 */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-primary-light/20 to-primary-main/30">
                      <img
                        src={thumbnailUrl}
                        alt={treatment.treatment_name || "시술 이미지"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackUrl;
                        }}
                      />
                      {discountRate && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          {discountRate}
                        </div>
                      )}
                      <button
                        onClick={() => handleFavoriteClick(treatment)}
                        className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-full shadow-sm hover:bg-opacity-100 transition-colors"
                      >
                        <FiHeart
                          className={`text-lg ${
                            isFavorite ? "text-red-500 fill-red-500" : "text-gray-700"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 콘텐츠 */}
                    <div className="p-4">
                      {/* 헤더 */}
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {treatment.treatment_name || "시술명 없음"}
                        </h3>
                        <div className="text-sm text-gray-600 mb-2">
                          {treatment.hospital_name || "병원명 없음"}
                        </div>
                      </div>

                      {/* 카테고리 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {treatment.category_large && (
                          <span className="bg-primary-light/20 text-primary-main px-2 py-1 rounded text-xs font-medium">
                            {treatment.category_large}
                          </span>
                        )}
                        {treatment.category_mid && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {treatment.category_mid}
                          </span>
                        )}
                      </div>

                      {/* 가격 */}
                      <div className="mb-3">
                        {originalPrice && treatment.original_price && treatment.selling_price && treatment.original_price > treatment.selling_price && (
                          <div className="text-sm text-gray-500 line-through mb-1">
                            {originalPrice}
                          </div>
                        )}
                        <div className="text-xl font-bold text-gray-900">
                          {sellingPrice}
                        </div>
                        {treatment.vat_info && (
                          <div className="text-xs text-gray-500 mt-1">
                            {treatment.vat_info}
                          </div>
                        )}
                      </div>

                      {/* 평점 및 리뷰 */}
                      <div className="flex items-center gap-2 mb-4">
                        {rating > 0 ? (
                          <span className="text-sm font-medium text-gray-900">
                            ⭐ {rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">평점 없음</span>
                        )}
                        {reviewCount > 0 && (
                          <span className="text-sm text-gray-500">
                            리뷰 {reviewCount}개
                          </span>
                        )}
                      </div>

                      {/* 병원 정보 섹션 */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">병원 정보</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>{treatment.hospital_name || "병원명 없음"}</div>
                          <button
                            onClick={() => {
                              // AI 채팅 문의 기능 (추후 구현)
                              alert("AI 채팅 문의 기능은 추후 구현 예정입니다.");
                            }}
                            className="text-primary-main hover:underline mt-2"
                          >
                            AI 채팅 문의
                          </button>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 relative">
                        <button
                          onClick={() => handleInquiryClick(treatmentId)}
                          className="flex-1 bg-primary-main hover:bg-[#2DB8A0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <FiMessageCircle className="text-base" />
                          문의하기
                        </button>
                        <button
                          onClick={() => handleFavoriteClick(treatment)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                            isFavorite
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <FiHeart className={`text-base ${isFavorite ? "fill-red-600" : ""}`} />
                          {isFavorite ? "찜함" : "찜하기"}
                        </button>

                        {/* 문의하기 모달 */}
                        {inquiryModalOpen === treatmentId && (
                          <>
                            <div
                              className="fixed inset-0 z-40 bg-black/20"
                              onClick={() => setInquiryModalOpen(null)}
                            ></div>
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                              <button
                                onClick={() => {
                                  alert(`${treatment.treatment_name} AI 채팅 문의 기능은 추후 구현 예정입니다.`);
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
                                    window.location.href = `mailto:${email}`;
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
            </div>

            {/* 페이지네이션 제거 (스크롤 페이지에서는 상위 10개만 표시) */}
            {/* {totalPages > 1 && (
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // 현재 페이지 주변 2페이지만 표시
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 2) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // 이전 페이지 번호와 간격이 있으면 ... 표시
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-primary-main text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
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
            )} */}
          </>
        )}
      </div>
    </div>
  );
}

