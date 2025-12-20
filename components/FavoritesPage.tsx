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

        const allFavorites: FavoriteItem[] = [];

        // 1. Supabase에서 찜한 시술 목록 가져오기
        const result = await getFavoriteProcedures();
        if (result.success && result.treatmentIds) {
          // 각 시술의 상세 정보 로드
          const treatmentPromises = result.treatmentIds.map((treatmentId) =>
            loadTreatmentById(treatmentId)
          );
          const treatments = await Promise.all(treatmentPromises);

          // 시술 찜 FavoriteItem 형식으로 변환
          const procedureFavorites: FavoriteItem[] = treatments
            .filter((t): t is Treatment => t !== null)
            .map((treatment) => ({
              id: treatment.treatment_id || 0,
              title: treatment.treatment_name || t("favorites.noTreatmentName"),
              clinic: treatment.hospital_name || t("favorites.noHospitalName"),
              location: "강남", // 추후 주소 정보 추가
              price: treatment.selling_price
                ? `${Math.round(treatment.selling_price / 10000)}만원`
                : t("common.priceInquiry"),
              rating: treatment.rating ? treatment.rating.toFixed(1) : "0.0",
              reviewCount: treatment.review_count
                ? `${treatment.review_count}`
                : undefined,
              type: "procedure" as const,
              treatment,
            }));

          allFavorites.push(...procedureFavorites);
        }

        // 2. localStorage에서 병원 찜 목록 가져오기 (병원 찜하기는 아직 Supabase 미지원)
        const savedFavorites = JSON.parse(
          localStorage.getItem("favorites") || "[]"
        );
        const clinicFavorites = savedFavorites.filter(
          (f: any) => f.type === "clinic"
        );

        // 병원 찜 FavoriteItem 형식으로 변환
        const hospitalFavorites: FavoriteItem[] = clinicFavorites.map(
          (f: any, index: number) => {
            // 고유 ID 생성: 기존 ID가 있으면 사용, 없으면 이름 기반 해시 생성
            let uniqueId: number;
            if (f.id && typeof f.id === "number") {
              uniqueId = f.id;
            } else {
              // 이름 기반 간단한 해시 생성 (고유성 보장)
              const name = f.title || f.name || f.clinic || `clinic-${index}`;
              let hash = 0;
              for (let i = 0; i < name.length; i++) {
                const char = name.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash; // Convert to 32bit integer
              }
              uniqueId = Math.abs(hash) || index + 1000000; // 절대값 또는 index 기반
            }

            return {
              id: uniqueId,
              title:
                f.title || f.name || f.clinic || t("common.noHospitalName"),
              clinic: f.clinic || f.name || t("common.noHospitalName"),
              address: f.address || "",
              location: f.location || "",
              rating: f.rating ? f.rating.toFixed(1) : "0.0",
              reviewCount: f.reviewCount ? `${f.reviewCount}` : undefined,
              type: "clinic" as const,
            };
          }
        );

        allFavorites.push(...hospitalFavorites);

        // Supabase에서 가져온 시술 찜이 없고 localStorage에도 없으면 localStorage 전체 로드 (하위 호환성)
        if (allFavorites.length === 0) {
          setFavorites(savedFavorites);
        } else {
          setFavorites(allFavorites);
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

    // 찜하기 업데이트 이벤트 리스너 - Supabase와 localStorage 모두 반영
    const handleFavoritesUpdate = () => {
      loadFavorites();
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
      // 시술 찜인지 병원 찜인지 확인
      const item = favorites.find((f) => f.id === id);

      if (item?.type === "procedure") {
        // Supabase에서 시술 찜하기 삭제
        const result = await removeProcedureFavorite(id);
        if (result.success) {
          // 로컬 상태 업데이트
          const updated = favorites.filter((item) => item.id !== id);
          setFavorites(updated);
          // localStorage도 업데이트 (하위 호환성)
          const savedFavorites = JSON.parse(
            localStorage.getItem("favorites") || "[]"
          );
          const updatedLocal = savedFavorites.filter(
            (f: any) => !(f.id === id && f.type === "procedure")
          );
          localStorage.setItem("favorites", JSON.stringify(updatedLocal));
          window.dispatchEvent(new Event("favoritesUpdated"));
        } else {
          alert(result.error || t("favorites.removeError"));
        }
      } else {
        // 병원 찜은 localStorage에서만 삭제
        const updated = favorites.filter((item) => item.id !== id);
        setFavorites(updated);
        const savedFavorites = JSON.parse(
          localStorage.getItem("favorites") || "[]"
        );
        const updatedLocal = savedFavorites.filter(
          (f: any) =>
            !(
              (f.id === id ||
                f.name === item?.title ||
                f.title === item?.title) &&
              f.type === "clinic"
            )
        );
        localStorage.setItem("favorites", JSON.stringify(updatedLocal));
        window.dispatchEvent(new Event("favoritesUpdated"));
      }
    } catch (error) {
      console.error("찜하기 삭제 실패:", error);
      alert(t("favorites.removeErrorDesc"));
    }
  };

  const procedures = favorites.filter((item) => item.type === "procedure");
  const clinics = favorites.filter((item) => item.type === "clinic");

  const displayedItems = activeTab === "procedure" ? procedures : clinics;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-gray-500">{t("common.loading")}</div>
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
      {/* 탭 선택 - sticky로 설정하여 헤더에 가려지지 않도록 */}
      {/* Header(48px) + 찜 목록 헤더(약 56px: py-3 + 텍스트) = 104px */}
      <div className="sticky top-[104px] z-[25] bg-white pb-4 pt-2 mb-4 -mx-4 px-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab("procedure")}
            className={`w-full h-[44px] px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap leading-none ${
              activeTab === "procedure"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("mypage.procedure")} ({procedures.length})
          </button>
          <button
            onClick={() => setActiveTab("clinic")}
            className={`w-full h-[44px] px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap leading-none ${
              activeTab === "clinic"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("mypage.hospital")} ({clinics.length})
          </button>
        </div>
      </div>

      {/* 찜 목록 */}
      <div className="space-y-4">
        {displayedItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (item.type === "procedure" && item.id) {
                router.push(`/favorites/treatment/${item.id}`);
              } else if (item.type === "clinic") {
                // 병원 상세 페이지로 이동 (병원명으로 검색)
                router.push(`/hospital?name=${encodeURIComponent(item.title)}`);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {item.type === "procedure" ? (
                  // 시술 찜 카드: 시술명/병원명/가격/평점/리뷰수
                  <>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{item.clinic}</p>
                    <div className="flex items-center gap-4">
                      {item.price && (
                        <span className="text-base font-bold text-primary-main">
                          {item.price}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                        <span className="text-sm font-semibold text-gray-900">
                          {item.rating}
                        </span>
                        {item.reviewCount && (
                          <span className="text-xs text-gray-500">
                            ({item.reviewCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // 병원 찜 카드: 병원명/주소/평점/리뷰수
                  <>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    {item.address && (
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <FiMapPin className="text-primary-main text-xs" />
                        <span>{item.address}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                      <span className="text-sm font-semibold text-gray-900">
                        {item.rating}
                      </span>
                      {item.reviewCount && (
                        <span className="text-xs text-gray-500">
                          ({item.reviewCount})
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(item.id);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
              >
                <FiHeart className="text-red-500 fill-red-500 text-xl" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
