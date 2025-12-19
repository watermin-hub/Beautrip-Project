"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiStar,
  FiShare2,
  FiChevronRight,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiMail,
  FiGlobe,
} from "react-icons/fi";
import {
  loadTreatmentById,
  loadRelatedTreatments,
  loadHospitalTreatments,
  loadHospitalsPaginated,
  Treatment,
  getThumbnailUrl,
  parseRecoveryPeriod,
  parseProcedureTime,
  getRecoveryInfoByCategoryMid,
  toggleProcedureFavorite,
  isProcedureFavorite,
  getFavoriteStatus,
  saveInquiry,
} from "@/lib/api/beautripApi";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import AddToScheduleModal from "./AddToScheduleModal";

interface TreatmentDetailPageProps {
  treatmentId: number;
}

export default function TreatmentDetailPage({
  treatmentId,
}: TreatmentDetailPageProps) {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [isInquiryDropdownOpen, setIsInquiryDropdownOpen] = useState(false);
  const [isAddToScheduleModalOpen, setIsAddToScheduleModalOpen] =
    useState(false);
  const [hospitalIdMap, setHospitalIdMap] = useState<Map<string, number>>(
    new Map()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inquiryButtonRef = useRef<HTMLButtonElement>(null);

  // 현재 시술 정보
  const currentTreatment = useMemo(() => {
    return treatments.find((t) => t.treatment_id === treatmentId);
  }, [treatments, treatmentId]);

  // 같은 시술명의 다른 옵션들 (같은 treatment_name, 다른 treatment_id)
  const relatedOptions = useMemo(() => {
    if (!currentTreatment?.treatment_name) return [];
    return treatments.filter(
      (t) =>
        t.treatment_name === currentTreatment.treatment_name &&
        t.treatment_id !== treatmentId
    );
  }, [treatments, currentTreatment, treatmentId]);

  // 같은 병원의 다른 시술들
  const hospitalTreatments = useMemo(() => {
    if (!currentTreatment?.hospital_name) return [];
    return treatments
      .filter(
        (t) =>
          t.hospital_name === currentTreatment.hospital_name &&
          t.treatment_id !== treatmentId
      )
      .slice(0, 10);
  }, [treatments, currentTreatment, treatmentId]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 현재 시술 데이터 로드
        const treatment = await loadTreatmentById(treatmentId);
        if (!treatment) {
          console.error("시술 데이터를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        // 같은 시술명의 다른 옵션들과 같은 병원의 다른 시술들 로드
        const [relatedOptions, hospitalTreatments] = await Promise.all([
          treatment.treatment_name
            ? loadRelatedTreatments(treatment.treatment_name, treatmentId)
            : Promise.resolve([]),
          treatment.hospital_name
            ? loadHospitalTreatments(treatment.hospital_name, treatmentId)
            : Promise.resolve([]),
        ]);

        // 모든 데이터를 하나의 배열로 합치기 (현재 시술 + 관련 옵션 + 병원 시술)
        const allTreatments = [
          treatment,
          ...relatedOptions,
          ...hospitalTreatments,
        ];
        setTreatments(allTreatments);

        // 찜 상태 로드 (Supabase)
        const favoriteStatus = await isProcedureFavorite(treatmentId);
        setIsFavorite(favoriteStatus);

        // 찜 개수는 일단 0으로 설정 (추후 통계 기능 추가 시 수정)
        setFavoriteCount(0);

        // 문의 개수 (로컬스토리지에서)
        const inquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
        const treatmentInquiries = inquiries.filter(
          (i: any) => i.treatmentId === treatmentId
        );
        setInquiryCount(treatmentInquiries.length);

        // 병원명으로 hospital_id 매핑 생성
        if (treatment.hospital_name) {
          const hospitalsResult = await loadHospitalsPaginated(1, 1000);
          const idMap = new Map<string, number>();
          hospitalsResult.data.forEach((h) => {
            if (h.hospital_name && h.hospital_id) {
              idMap.set(h.hospital_name, h.hospital_id);
            }
          });
          setHospitalIdMap(idMap);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [treatmentId]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsInquiryDropdownOpen(false);
      }
    };

    if (isInquiryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInquiryDropdownOpen]);

  // 찜하기 토글 (Supabase 연동)
  const handleFavoriteToggle = async () => {
    try {
      const result = await toggleProcedureFavorite(treatmentId);
      if (result.success) {
        setIsFavorite(result.isFavorite);
        // 찜 개수는 추후 통계 기능 추가 시 업데이트
      } else {
        if (result.error?.includes("로그인이 필요")) {
          alert("로그인이 필요합니다.");
          // 로그인 모달 표시 또는 로그인 페이지로 이동
        } else {
          alert(result.error || "찜하기 처리에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("찜하기 토글 실패:", error);
      alert("찜하기 처리 중 오류가 발생했습니다.");
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTreatment?.treatment_name || "시술 정보",
          text: `${currentTreatment?.treatment_name} - ${currentTreatment?.hospital_name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      // 폴백: URL 복사
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다.");
    }
  };

  // 문의하기
  const handleInquiry = async (type: "chat" | "phone" | "email") => {
    if (!currentTreatment) return;

    // 로컬스토리지에 문의 기록 저장
    const inquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
    inquiries.push({
      treatmentId,
      type,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("inquiries", JSON.stringify(inquiries));
    setInquiryCount((prev) => prev + 1);

    if (type === "chat") {
      // AI 채팅 - 추후 API 연동 예정
      alert("AI 채팅 문의 기능은 준비 중입니다.");
    } else if (type === "phone") {
      // 전화 문의 - treatment_master 테이블의 hospital_phone_safe 컬럼 사용
      const phoneNumber =
        (currentTreatment as any).hospital_phone_safe ||
        (currentTreatment as any).hospital_phone;

      if (phoneNumber) {
        // 전화번호에서 숫자와 +, -만 추출
        const cleanedPhone = phoneNumber.replace(/[^\d+\-]/g, "");
        window.location.href = `tel:${cleanedPhone}`;
      } else {
        alert("등록된 전화번호가 없습니다.");
      }
    } else if (type === "email") {
      // 메일 문의 - yb8259@naver.com으로 전송, Supabase에도 저장
      const treatmentName = currentTreatment.treatment_name || "시술";
      const hospitalName = currentTreatment.hospital_name || "";
      const subject = encodeURIComponent(
        `[BeauTrip 문의] ${treatmentName}${
          hospitalName ? ` - ${hospitalName}` : ""
        }`
      );
      const body = encodeURIComponent(
        `시술명: ${treatmentName}\n병원명: ${
          hospitalName || "미입력"
        }\n\n문의 내용을 작성해주세요.`
      );

      // mailto 링크 생성
      window.location.href = `mailto:yb8259@naver.com?subject=${subject}&body=${body}`;

      // Supabase에 문의 내역 저장 (CRM - Zapier - KIT 자동화를 위해)
      try {
        await saveInquiry({
          inquiry_type: "email",
          treatment_id: treatmentId,
          treatment_name: treatmentName,
          hospital_name: hospitalName || undefined,
        });
        console.log("문의 내역이 Supabase에 저장되었습니다.");
      } catch (error) {
        console.error("문의 저장 중 오류:", error);
        // mailto는 이미 열렸으므로 에러를 사용자에게 알리지 않음
      }
    }
  };

  // 일정에 추가
  const handleAddToSchedule = async (date: string) => {
    if (!currentTreatment) return;

    // 해당 날짜의 기존 일정 개수 확인 (시술 + 회복 기간 합쳐서)
    const schedules = JSON.parse(localStorage.getItem("schedules") || "[]");
    const formatDate = (dateStr: string): string => {
      return dateStr; // 이미 YYYY-MM-DD 형식
    };

    // 해당 날짜의 시술 및 회복 기간 카드 개수 계산
    let countOnDate = 0;
    schedules.forEach((s: any) => {
      const procDate = new Date(s.procedureDate);
      const procDateStr = formatDate(s.procedureDate);

      // 시술 날짜
      if (procDateStr === date) {
        countOnDate++;
      }

      // 회복 기간 날짜들 (시술 당일 제외)
      for (let i = 1; i <= (s.recoveryDays || 0); i++) {
        const recoveryDate = new Date(procDate);
        recoveryDate.setDate(recoveryDate.getDate() + i);
        const recoveryDateStr = formatDate(
          `${recoveryDate.getFullYear()}-${String(
            recoveryDate.getMonth() + 1
          ).padStart(2, "0")}-${String(recoveryDate.getDate()).padStart(
            2,
            "0"
          )}`
        );
        if (recoveryDateStr === date) {
          countOnDate++;
        }
      }
    });

    // 최대 3개 제한 체크
    if (countOnDate >= 3) {
      alert("일정이 꽉 찼습니다! 3개 이하로 정리 후 다시 시도해 주세요.");
      return;
    }

    // category_mid로 회복 기간 정보 가져오기 (소분류_리스트와 매칭)
    let recoveryDays = 0;
    let recoveryText: string | null = null;
    let recoveryGuides: Record<string, string | null> | undefined = undefined;

    if (currentTreatment.category_mid) {
      const recoveryInfo = await getRecoveryInfoByCategoryMid(
        currentTreatment.category_mid
      );
      if (recoveryInfo) {
        recoveryDays = recoveryInfo.recoveryMax; // 회복기간_max 기준
        recoveryText = recoveryInfo.recoveryText;
        // 회복 가이드 전체 맵도 일정에 저장해 두어, 각 회복일 카드에서 공통으로 사용
        recoveryGuides = recoveryInfo.recoveryGuides;
      }
    }

    // recoveryInfo가 없으면 기존 downtime 사용 (fallback)
    if (recoveryDays === 0) {
      recoveryDays = parseRecoveryPeriod(currentTreatment.downtime) || 0;
    }

    // 중복 체크: 같은 날짜에 동일한 시술이 있는지 확인
    const procedureName = currentTreatment.treatment_name || "시술명 없음";
    const hospital = currentTreatment.hospital_name || "병원명 없음";
    const treatmentId = currentTreatment.treatment_id;

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
      alert("같은 날짜에 이미 동일한 시술이 추가되어 있습니다.");
      return;
    }

    // 새로운 일정 데이터 생성
    const newSchedule = {
      id: Date.now(),
      treatmentId: treatmentId,
      procedureDate: date,
      procedureName: procedureName,
      hospital: hospital,
      category:
        currentTreatment.category_mid ||
        currentTreatment.category_large ||
        "기타",
      categoryMid: currentTreatment.category_mid || null,
      recoveryDays,
      recoveryText, // 대표 회복 기간 텍스트
      recoveryGuides, // 각 구간별 회복 가이드 텍스트
      procedureTime: parseProcedureTime(currentTreatment.surgery_time) || 0,
      price: currentTreatment.selling_price || null,
      rating: currentTreatment.rating || 0,
      reviewCount: currentTreatment.review_count || 0,
    };

    schedules.push(newSchedule);

    // localStorage 저장 시도 (에러 처리 추가)
    try {
      const schedulesJson = JSON.stringify(schedules);
      localStorage.setItem("schedules", schedulesJson);
      // 일정 추가 이벤트 발생
      window.dispatchEvent(new Event("scheduleAdded"));
      alert(`${date}에 일정이 추가되었습니다!`);
    } catch (error: any) {
      console.error("일정 저장 실패:", error);
      if (error.name === "QuotaExceededError") {
        alert("저장 공간이 부족합니다. 브라우저 캐시를 정리해주세요.");
      } else {
        alert(`일정 저장 중 오류가 발생했습니다: ${error.message}`);
      }
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

  if (!currentTreatment) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">시술 정보를 찾을 수 없습니다.</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const thumbnailUrl = getThumbnailUrl(currentTreatment);
  const rating = currentTreatment.rating || 0;
  const reviewCount = currentTreatment.review_count || 0;
  const price = currentTreatment.selling_price
    ? new Intl.NumberFormat("ko-KR").format(currentTreatment.selling_price)
    : null;
  const originalPrice = currentTreatment.original_price
    ? new Intl.NumberFormat("ko-KR").format(currentTreatment.original_price)
    : null;
  const discountRate = currentTreatment.dis_rate
    ? `${currentTreatment.dis_rate}%`
    : null;
  const surgeryTime = parseProcedureTime(currentTreatment.surgery_time);
  const downtime = parseRecoveryPeriod(currentTreatment.downtime);
  const hashtags = currentTreatment.treatment_hashtags
    ? currentTreatment.treatment_hashtags.split(",").map((tag) => tag.trim())
    : [];

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* 상단 헤더 (뒤로가기 / 공유하기) */}
      <div className="sticky top-[48px] z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiChevronRight className="text-gray-700 text-xl rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">시술 상세</h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiShare2 className="text-gray-700 text-xl" />
          </button>
        </div>
      </div>

      <div className="pb-40">
        {/* 메인 이미지 - 2:1 비율 */}
        <div className="relative w-full aspect-[2/1] bg-gray-100">
          <img
            src={thumbnailUrl}
            alt={currentTreatment.treatment_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.dataset.fallback === "true") {
                target.style.display = "none";
                return;
              }
              target.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="24"%3E🏥%3C/text%3E%3C/svg%3E';
              target.dataset.fallback = "true";
            }}
          />
          {discountRate && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {discountRate} 할인
            </div>
          )}
        </div>

        {/* 시술명, category_small, 평점 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentTreatment.treatment_name}
          </h2>
          {/* category_small - 시술명과 별점 사이에 배치 */}
          {currentTreatment?.category_small && (
            <p className="text-base font-medium text-gray-700 mb-2">
              {currentTreatment.category_small}
            </p>
          )}
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

        {/* 가격 정보 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-baseline gap-2 mb-1">
            {price && (
              <span className="text-2xl font-bold text-gray-900">
                {price}원
              </span>
            )}
            {!price && (
              <span className="text-2xl font-bold text-gray-900">
                가격 문의
              </span>
            )}
            {originalPrice && price && (
              <span className="text-lg text-gray-400 line-through">
                {originalPrice}원
              </span>
            )}
          </div>
          {currentTreatment.vat_info && (
            <p className="text-xs text-gray-500">{currentTreatment.vat_info}</p>
          )}
          {!currentTreatment.vat_info && price && (
            <p className="text-xs text-gray-500">VAT 포함</p>
          )}
        </div>

        {/* 이벤트 */}
        {currentTreatment.event_url && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="bg-primary-light/10 rounded-lg p-3">
              <p className="text-sm font-medium text-primary-main mb-1">
                🎉 특별 이벤트 진행 중
              </p>
              <a
                href={currentTreatment.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 underline"
              >
                이벤트 자세히 보기
              </a>
            </div>
          </div>
        )}

        {/* 병원 정보 */}
        {currentTreatment.hospital_name && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {currentTreatment.hospital_name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400" />
                    <span>
                      {rating.toFixed(1)} ({reviewCount}개 리뷰)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (currentTreatment.hospital_name) {
                    const hospitalId = hospitalIdMap.get(
                      currentTreatment.hospital_name
                    );
                    if (hospitalId) {
                      router.push(`/hospital/${hospitalId}`);
                    } else {
                      // hospital_id를 찾을 수 없으면 explore 페이지로 이동
                      router.push(
                        `/explore?hospital=${encodeURIComponent(
                          currentTreatment.hospital_name
                        )}`
                      );
                    }
                  }
                }}
                className="flex items-center gap-1 text-primary-main text-sm font-medium"
              >
                병원정보 보러가기 <FiChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        )}

        {/* 시술 키워드 */}
        {hashtags.length > 0 && (
          <div className="px-4 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              시술 키워드
            </h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 리뷰 섹션 (별점, 리뷰 수만) */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">리뷰</h3>
            <button
              onClick={() => {
                // 후기 작성 모달 열기 (추후 구현)
                alert("후기 작성 기능은 준비 중입니다.");
              }}
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

        {/* 병원 정보 */}
        {currentTreatment.hospital_name && (
          <div className="px-4 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              병원 정보
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FiMapPin className="text-gray-400" />
                  <span className="font-medium">위치</span>
                </div>
                <p className="text-sm text-gray-500 pl-6">
                  {currentTreatment.hospital_name}
                </p>
              </div>

              {/* 가능 시술 목록 */}
              {hospitalTreatments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiGlobe className="text-gray-400" />
                    <span className="font-medium">가능 시술 목록</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {hospitalTreatments.slice(0, 5).map((treatment, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {treatment.treatment_name}
                      </span>
                    ))}
                    {hospitalTreatments.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{hospitalTreatments.length - 5}개 더
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 하단 고정 버튼 영역 */}
        <div className="fixed bottom-[56px] left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-40">
          <div className="px-4 py-3">
            {/* 별점 및 리뷰 수 표시 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-yellow-400" />
                <span className="text-gray-900 font-semibold">
                  {rating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500 text-sm">
                ({reviewCount}개 리뷰)
              </span>
            </div>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleFavoriteToggle}
                className="flex flex-col items-center gap-1 p-2"
              >
                <FiHeart
                  className={`text-xl ${
                    isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"
                  }`}
                />
                <span className="text-xs text-gray-500">{favoriteCount}</span>
              </button>

              <button
                onClick={() => {
                  setIsInquiryDropdownOpen(!isInquiryDropdownOpen);
                }}
                className="flex flex-col items-center gap-1 p-2"
              >
                <FiMessageCircle className="text-xl text-gray-400" />
                <span className="text-xs text-gray-500">{inquiryCount}</span>
              </button>

              <button
                onClick={() => setIsAddToScheduleModalOpen(true)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <FiCalendar className="text-lg" />
                일정에 추가
              </button>

              <button
                ref={inquiryButtonRef}
                onClick={() => setIsInquiryDropdownOpen(!isInquiryDropdownOpen)}
                className="flex-1 bg-primary-main text-white py-3 rounded-lg font-semibold hover:bg-primary-main/90 transition-colors relative"
              >
                문의하기
              </button>
              {/* 문의 옵션 드롭다운 (별도 레이어, 버튼 내부에 중첩 버튼 없음) */}
              {isInquiryDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[39]"
                    onClick={() => setIsInquiryDropdownOpen(false)}
                  />
                  <div
                    ref={dropdownRef}
                    className="absolute right-4 bottom-[88px] mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[41] min-w-[180px]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        handleInquiry("chat");
                        setIsInquiryDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <FiMessageCircle className="text-gray-500" />
                      AI 채팅 문의
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        handleInquiry("phone");
                        setIsInquiryDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <FiPhone className="text-gray-500" />
                      전화 문의
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        handleInquiry("email");
                        setIsInquiryDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <FiMail className="text-gray-500" />
                      메일 문의
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />

      {/* 일정에 추가 모달 */}
      {currentTreatment && (
        <AddToScheduleModal
          isOpen={isAddToScheduleModalOpen}
          onClose={() => setIsAddToScheduleModalOpen(false)}
          onDateSelect={handleAddToSchedule}
          treatmentName={currentTreatment.treatment_name || "시술명 없음"}
          categoryMid={currentTreatment.category_mid || null}
        />
      )}
    </div>
  );
}
