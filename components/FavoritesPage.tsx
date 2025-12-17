"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FiHeart,
  FiMapPin,
  FiStar,
  FiPhone,
  FiClock,
  FiGlobe,
} from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getFavoriteProcedures,
  loadTreatmentById,
  Treatment,
  removeProcedureFavorite,
} from "@/lib/api/beautripApi";
import { useRouter } from "next/navigation";

interface FavoriteItem {
  id: number;
  title: string;
  clinic: string;
  location: string;
  price?: string;
  rating: string;
  reviewCount?: string;
  address?: string;
  phone?: string;
  procedures?: string[];
  specialties?: string[];
  type: "procedure" | "clinic";
  treatment?: Treatment; // Supabase에서 가져온 시술 정보
}

export default function FavoritesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // URL 쿼리 파라미터에서 type 읽기, 없으면 기본값 "procedure"
  const initialTab = (
    searchParams.get("type") === "clinic" ? "clinic" : "procedure"
  ) as "procedure" | "clinic";
  const [activeTab, setActiveTab] = useState<"procedure" | "clinic">(
    initialTab
  );

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);

        // Supabase에서 찜한 시술 목록 가져오기
        const result = await getFavoriteProcedures();
        if (result.success && result.treatmentIds) {
          // 각 시술의 상세 정보 로드
          const treatmentPromises = result.treatmentIds.map((treatmentId) =>
            loadTreatmentById(treatmentId)
          );
          const treatments = await Promise.all(treatmentPromises);

          // FavoriteItem 형식으로 변환
          const favoriteItems: FavoriteItem[] = treatments
            .filter((t): t is Treatment => t !== null)
            .map((treatment) => ({
              id: treatment.treatment_id || 0,
              title: treatment.treatment_name || "시술명 없음",
              clinic: treatment.hospital_name || "병원명 없음",
              location: "강남", // 추후 주소 정보 추가
              price: treatment.selling_price
                ? `${Math.round(treatment.selling_price / 10000)}만원`
                : "가격 문의",
              rating: treatment.rating ? treatment.rating.toFixed(1) : "0.0",
              reviewCount: treatment.review_count
                ? `${treatment.review_count}`
                : undefined,
              type: "procedure" as const,
              treatment,
            }));

          setFavorites(favoriteItems);
        } else {
          // Supabase에서 가져오기 실패 시 localStorage에서 로드 (하위 호환성)
          const savedFavorites = JSON.parse(
            localStorage.getItem("favorites") || "[]"
          );
          setFavorites(savedFavorites);
        }
      } catch (error) {
        console.error("찜 목록 로드 실패:", error);
        // 에러 발생 시 localStorage에서 로드
        const savedFavorites = JSON.parse(
          localStorage.getItem("favorites") || "[]"
        );
        setFavorites(savedFavorites);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();

    // localStorage 업데이트 이벤트 리스너 (하위 호환성)
    const handleFavoritesUpdate = () => {
      const updated = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavorites(updated);
    };

    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () =>
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, []);

  // URL 쿼리 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "clinic" || type === "procedure") {
      setActiveTab(type);
    }
  }, [searchParams]);

  const removeFavorite = async (id: number) => {
    try {
      // Supabase에서 찜하기 삭제
      const result = await removeProcedureFavorite(id);
      if (result.success) {
        // 로컬 상태 업데이트
        const updated = favorites.filter((item) => item.id !== id);
        setFavorites(updated);
        // localStorage도 업데이트 (하위 호환성)
        localStorage.setItem("favorites", JSON.stringify(updated));
        window.dispatchEvent(new Event("favoritesUpdated"));
      } else {
        alert(result.error || "찜하기 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("찜하기 삭제 실패:", error);
      alert("찜하기 삭제 중 오류가 발생했습니다.");
    }
  };

  const procedures = favorites.filter((item) => item.type === "procedure");
  const clinics = favorites.filter((item) => item.type === "clinic");

  const displayedItems = activeTab === "procedure" ? procedures : clinics;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <FiHeart className="text-gray-300 text-6xl mb-4" />
        <p className="text-gray-500 text-lg font-medium mb-2">
          {t("favorites.empty")}
        </p>
        <p className="text-gray-400 text-sm text-center">
          {t("favorites.emptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* 탭 선택 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("procedure")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "procedure"
              ? "bg-primary-main text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          시술 ({procedures.length})
        </button>
        <button
          onClick={() => setActiveTab("clinic")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "clinic"
              ? "bg-primary-main text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          병원 ({clinics.length})
        </button>
      </div>

      {/* 찜 목록 */}
      <div className="space-y-4">
        {displayedItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (item.type === "procedure" && item.id) {
                router.push(`/treatment/${item.id}`);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-semibold">
                    {item.type === "procedure" ? "시술" : "병원"}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">
                    {item.title}
                  </h3>
                </div>
                {item.type === "procedure" ? (
                  <>
                    <p className="text-sm text-gray-600 mb-1">{item.clinic}</p>
                    {item.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FiMapPin className="text-gray-400" />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <FiMapPin className="text-primary-main" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.address && (
                      <p className="text-sm text-gray-600 mb-2">
                        {item.address}
                      </p>
                    )}
                    {item.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <FiPhone className="text-primary-main" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                    {item.specialties && item.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => removeFavorite(item.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiHeart className="text-red-500 fill-red-500 text-xl" />
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">
                  {item.rating}
                </span>
                {item.reviewCount && (
                  <span className="text-xs text-gray-500">
                    ({item.reviewCount})
                  </span>
                )}
              </div>
              {item.price && (
                <span className="text-base font-bold text-primary-main">
                  {item.price}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
