"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiStar,
  FiShare2,
  FiChevronRight,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiClock,
  FiMessageCircle,
} from "react-icons/fi";
import {
  loadHospitalsPaginated,
  HospitalMaster,
  loadHospitalTreatments,
  Treatment,
} from "@/lib/api/beautripApi";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import CommunityWriteModal from "./CommunityWriteModal";

interface HospitalDetailPageProps {
  hospitalId: number;
}

export default function HospitalDetailPage({
  hospitalId,
}: HospitalDetailPageProps) {
  const router = useRouter();
  const [hospital, setHospital] = useState<HospitalMaster | null>(null);
  const [hospitalTreatments, setHospitalTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 병원 데이터 로드 (hospital_id로 검색)
        const result = await loadHospitalsPaginated(1, 1000);
        const foundHospital = result.data.find(
          (h) => h.hospital_id === hospitalId
        );

        if (!foundHospital) {
          console.error("병원 데이터를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        setHospital(foundHospital);

        // 같은 병원의 시술 목록 로드
        if (foundHospital.hospital_name) {
          const treatments = await loadHospitalTreatments(
            foundHospital.hospital_name
          );
          setHospitalTreatments(treatments);
        }

        // 찜 상태 로드
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        setIsFavorite(
          favorites.some(
            (f: any) =>
              (typeof f === "object" ? f.id : f) === hospitalId &&
              (typeof f === "object" ? f.type : "clinic") === "clinic"
          )
        );
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hospitalId]);

  // 찜하기 토글
  const handleFavoriteToggle = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const favoriteItem = {
      id: hospitalId,
      type: "clinic" as const,
      title: hospital?.hospital_name || "병원명 없음",
      clinic: hospital?.hospital_name || "",
      location: hospital?.hospital_address || "",
      rating: hospital?.hospital_rating?.toFixed(1) || "0",
      reviewCount: hospital?.review_count?.toString() || "0",
      address: hospital?.hospital_address || "",
      phone: hospital?.hospital_info_raw || "",
      specialties: (() => {
        if (!hospital?.hospital_departments) return [];
        try {
          if (typeof hospital.hospital_departments === "string") {
            if (hospital.hospital_departments.trim().startsWith("[")) {
              return JSON.parse(hospital.hospital_departments);
            } else if (hospital.hospital_departments.includes(",")) {
              return hospital.hospital_departments
                .split(",")
                .map((d: string) => d.trim());
            } else if (hospital.hospital_departments.includes("/")) {
              return hospital.hospital_departments
                .split("/")
                .map((d: string) => d.trim());
            } else {
              return [hospital.hospital_departments];
            }
          } else if (Array.isArray(hospital.hospital_departments)) {
            return hospital.hospital_departments;
          }
        } catch (e) {
          if (typeof hospital.hospital_departments === "string") {
            if (hospital.hospital_departments.includes(",")) {
              return hospital.hospital_departments
                .split(",")
                .map((d: string) => d.trim());
            } else if (hospital.hospital_departments.includes("/")) {
              return hospital.hospital_departments
                .split("/")
                .map((d: string) => d.trim());
            } else {
              return [hospital.hospital_departments];
            }
          }
        }
        return [];
      })(),
    };

    if (isFavorite) {
      const newFavorites = favorites.filter(
        (f: any) =>
          !(
            (typeof f === "object" ? f.id : f) === hospitalId &&
            (typeof f === "object" ? f.type : "clinic") === "clinic"
          )
      );
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(favoriteItem);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      setIsFavorite(true);
    }

    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  // 공유하기
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hospital?.hospital_name || "병원 정보",
          text: `${hospital?.hospital_name} - ${hospital?.hospital_address}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">병원 정보를 찾을 수 없습니다.</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const rating = hospital.hospital_rating || 0;
  const reviewCount = hospital.review_count || 0;

  // hospital_departments 파싱 (JSON 또는 일반 문자열 처리)
  let departments: string[] = [];
  if (hospital.hospital_departments) {
    try {
      if (typeof hospital.hospital_departments === "string") {
        // JSON 문자열인지 확인
        if (hospital.hospital_departments.trim().startsWith("[")) {
          departments = JSON.parse(hospital.hospital_departments);
        } else if (hospital.hospital_departments.includes(",")) {
          // 쉼표로 구분된 문자열
          departments = hospital.hospital_departments
            .split(",")
            .map((d: string) => d.trim());
        } else if (hospital.hospital_departments.includes("/")) {
          // 슬래시로 구분된 문자열
          departments = hospital.hospital_departments
            .split("/")
            .map((d: string) => d.trim());
        } else {
          // 단일 문자열
          departments = [hospital.hospital_departments];
        }
      } else if (Array.isArray(hospital.hospital_departments)) {
        departments = hospital.hospital_departments;
      }
    } catch (e) {
      // JSON 파싱 실패 시 일반 문자열로 처리
      if (typeof hospital.hospital_departments === "string") {
        if (hospital.hospital_departments.includes(",")) {
          departments = hospital.hospital_departments
            .split(",")
            .map((d: string) => d.trim());
        } else if (hospital.hospital_departments.includes("/")) {
          departments = hospital.hospital_departments
            .split("/")
            .map((d: string) => d.trim());
        } else {
          departments = [hospital.hospital_departments];
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* 상단 헤더 */}
      <div className="sticky top-[48px] z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiChevronRight className="text-gray-700 text-xl rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">병원 상세</h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiShare2 className="text-gray-700 text-xl" />
          </button>
        </div>
      </div>

      <div className="pb-40">
        {/* 메인 이미지 */}
        <div className="relative w-full aspect-[2/1] bg-gray-100">
          {hospital.hospital_img_url || hospital.hospital_img ? (
            <img
              src={hospital.hospital_img_url || hospital.hospital_img}
              alt={hospital.hospital_name}
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
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="48"%3E🏥%3C/text%3E%3C/svg%3E';
                target.dataset.fallback = "true";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-primary-main/30">
              <span className="text-6xl">🏥</span>
            </div>
          )}
        </div>

        {/* 병원명 및 평점 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {hospital.hospital_name}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <FiStar className="text-yellow-400 fill-yellow-400" />
              <span className="text-gray-900 font-semibold">
                {rating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500">({reviewCount}개 리뷰)</span>
          </div>
        </div>

        {/* 병원 정보 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            병원 정보
          </h3>
          <div className="space-y-3">
            {hospital.hospital_address && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FiMapPin className="text-gray-400" />
                  <span className="font-medium">주소</span>
                </div>
                <p className="text-sm text-gray-500 pl-6">
                  {hospital.hospital_address}
                </p>
              </div>
            )}

            {hospital.opening_hours && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FiClock className="text-gray-400" />
                  <span className="font-medium">운영 시간</span>
                </div>
                <p className="text-sm text-gray-500 pl-6">
                  {hospital.opening_hours}
                </p>
              </div>
            )}

            {Array.isArray(departments) && departments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FiGlobe className="text-gray-400" />
                  <span className="font-medium">진료과</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {departments.map((dept: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-primary-light/20 text-primary-main px-2 py-1 rounded text-xs"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hospital.hospital_intro && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FiMessageCircle className="text-gray-400" />
                  <span className="font-medium">병원 소개</span>
                </div>
                <p className="text-sm text-gray-500 pl-6 whitespace-pre-line">
                  {hospital.hospital_intro}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 제공 시술 목록 */}
        {hospitalTreatments.length > 0 && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                제공 시술 ({hospitalTreatments.length}개)
              </h3>
              <button
                onClick={() => {
                  router.push(
                    `/explore?section=procedure&hospital=${encodeURIComponent(
                      hospital.hospital_name || ""
                    )}`
                  );
                }}
                className="flex items-center gap-1 text-primary-main text-sm font-medium"
              >
                전체보기 <FiChevronRight className="text-sm" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {hospitalTreatments.slice(0, 6).map((treatment) => (
                <div
                  key={treatment.treatment_id}
                  onClick={() => {
                    router.push(`/explore/treatment/${treatment.treatment_id}`);
                  }}
                  className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                    {treatment.treatment_name}
                  </h4>
                  {treatment.selling_price && (
                    <p className="text-xs text-gray-600">
                      {new Intl.NumberFormat("ko-KR").format(
                        treatment.selling_price
                      )}
                      원
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 리뷰 섹션 (별점, 리뷰 수만) */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">리뷰</h3>
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="text-primary-main text-sm font-medium"
            >
              후기 작성
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-yellow-400 text-2xl" />
                <span className="text-2xl font-bold text-gray-900">
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-gray-600">
              <span className="font-semibold">{reviewCount}개</span> 리뷰
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            리뷰 내용은 추후 구현 예정입니다.
          </p>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-[56px] left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleFavoriteToggle}
            className="flex flex-col items-center gap-1 p-2"
          >
            <FiHeart
              className={`text-xl ${
                isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"
              }`}
            />
          </button>

          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <FiMessageCircle className="text-lg" />
            후기 작성
          </button>

          <button
            onClick={() => {
              alert("문의하기 기능은 준비 중입니다.");
            }}
            className="flex-1 bg-primary-main text-white py-3 rounded-lg font-semibold hover:bg-primary-main/90 transition-colors"
          >
            문의하기
          </button>
        </div>
      </div>

      <BottomNavigation />

      {/* 후기 작성 모달 */}
      <CommunityWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
      />
    </div>
  );
}
