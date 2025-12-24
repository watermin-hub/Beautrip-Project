"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiHeart, FiStar, FiX, FiChevronRight } from "react-icons/fi";
import {
  loadTreatmentsPaginated,
  getThumbnailUrl,
  calculateRecommendationScore,
  getPopularKeywordsByCountry,
  getCategoryMidByKeyword,
  getTreatmentTableName,
  toggleProcedureFavorite,
  hasUserWrittenReview,
  type Treatment,
  type PopularKeyword,
} from "@/lib/api/beautripApi";
import {
  formatPrice,
  getCurrencyFromStorage,
  getCurrencyFromLanguage,
} from "@/lib/utils/currency";
import LoginRequiredPopup from "./LoginRequiredPopup";
import ReviewRequiredPopup from "./ReviewRequiredPopup";
import CommunityWriteModal from "./CommunityWriteModal";
import { supabase } from "@/lib/supabase";
import { trackPdpClick } from "@/lib/gtm";

// 고민 키워드와 시술 매핑 (fallback용)
const CONCERN_KEYWORDS: Record<string, string[]> = {
  주름: ["보톡스", "리쥬란", "리프팅", "인모드", "슈링크", "주름"],
  다크서클: ["필러", "지방재배치", "리쥬란", "다크서클", "눈밑"],
  모공: ["프락셀", "레이저", "모공", "피코", "아쿠아필"],
  피부톤: ["미백", "레이저", "프락셀", "피부톤", "백옥"],
  트러블: ["레이저", "프락셀", "트러블", "피코", "아쿠아필"],
  탄력: ["리프팅", "인모드", "슈링크", "울쎄라", "탄력"],
};

export default function CountryPainPointSection() {
  const router = useRouter();
  const { t, language } = useLanguage();
  // 통화 설정 (언어에 따라 자동 설정, 또는 localStorage에서 가져오기)
  const currency = useMemo(() => {
    return getCurrencyFromLanguage(language) || getCurrencyFromStorage();
  }, [language]);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [recommendedTreatments, setRecommendedTreatments] = useState<
    Treatment[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showReviewRequiredPopup, setShowReviewRequiredPopup] = useState(false);
  const [showCommunityWriteModal, setShowCommunityWriteModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);
  // 로그인 성공 후 실행할 동작 저장
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  // 번역된 키워드 -> 한국어 키워드 매핑
  const [keywordMap, setKeywordMap] = useState<Map<string, string>>(new Map());

  const countries = [
    { id: "all", key: "home.country.all" },
    { id: "korea", key: "home.country.korea" },
    { id: "china", key: "home.country.china" },
    { id: "japan", key: "home.country.japan" },
    { id: "usa", key: "home.country.usa" },
    // { id: "sea", key: "home.country.sea" }, // 동남아 제거
  ];

  // 국가별 키워드 로드
  useEffect(() => {
    const loadKeywords = async () => {
      setKeywordsLoading(true);
      try {
        const languageCode = language || "KR";

        const keywords = await getPopularKeywordsByCountry(
          selectedCountry,
          6, // 6개만 표시
          languageCode as "KR" | "EN" | "JP" | "CN"
        );
        setPopularKeywords(keywords.length > 0 ? keywords : []);

        // 번역된 키워드 -> 한국어 키워드 매핑 생성
        const map = new Map<string, string>();
        keywords.forEach((kw) => {
          map.set(kw.translated, kw.original);
        });
        setKeywordMap(map);
      } catch (error) {
        console.error("인기 키워드 로드 실패:", error);
        // fallback: 기본 키워드 사용
        const fallbackKeywords: Record<string, string[]> = {
          all: ["주름", "다크서클", "모공", "피부톤", "트러블"],
          korea: ["주름", "탄력", "모공", "피부톤", "다크서클"],
          china: ["주름", "다크서클", "모공", "피부톤", "트러블"],
          japan: ["모공", "주름", "다크서클", "피부톤", "트러블"],
          usa: ["주름", "다크서클", "피부톤", "모공", "트러블"],
        };
        const fallbackList =
          fallbackKeywords[selectedCountry] || fallbackKeywords.all;
        const fallbackKeywordsFormatted: PopularKeyword[] = fallbackList.map(
          (kw) => ({
            translated: kw,
            original: kw,
          })
        );
        setPopularKeywords(fallbackKeywordsFormatted);

        // fallback 키워드 매핑도 생성
        const fallbackMap = new Map<string, string>();
        fallbackList.forEach((kw) => {
          fallbackMap.set(kw, kw);
        });
        setKeywordMap(fallbackMap);
      } finally {
        setKeywordsLoading(false);
      }
    };

    loadKeywords();
  }, [selectedCountry, language]);

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const procedureFavorites = savedFavorites
      .filter((f: any) => f.type === "procedure")
      .map((f: any) => f.id);
    setFavorites(new Set(procedureFavorites));
  }, []);

  // 로그인 상태 확인 및 리뷰 작성 이력 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);

      // 로그인 상태일 때 리뷰 작성 이력 확인
      if (loggedIn && session?.user) {
        const hasReview = await hasUserWrittenReview(session.user.id);
        setHasWrittenReview(hasReview);
      } else {
        setHasWrittenReview(false);
      }
    };
    checkAuth();
  }, []);

  const handleConcernClick = async (concern: string) => {
    if (selectedConcern === concern) {
      // 같은 해시태그를 다시 클릭하면 닫기
      setSelectedConcern(null);
      setRecommendedTreatments([]);
      return;
    }

    setSelectedConcern(concern);
    setLoading(true);

    try {
      // 번역된 키워드인 경우 한국어 키워드로 변환
      const originalKeyword = keywordMap.get(concern) || concern;

      // ✅ 간단한 해결책: 한국어 키워드로 category_mid 찾기 (언어 무관하게)
      // 1. 한국어 테이블에서 category_mid 찾기
      const categoryMid = await getCategoryMidByKeyword(originalKeyword, "KR");

      if (!categoryMid) {
        console.warn(
          `키워드 "${originalKeyword}"에 해당하는 category_mid를 찾을 수 없습니다.`
        );
        setRecommendedTreatments([]);
        return;
      }

      // 2. 한국어 테이블에서 해당 category_mid의 treatment_id 목록 가져오기
      const krResult = await loadTreatmentsPaginated(1, 200, {
        categoryMid: categoryMid,
        language: "KR", // 한국어 테이블에서 가져오기
      });

      if (!krResult.data || krResult.data.length === 0) {
        console.warn(`category_mid "${categoryMid}"에 해당하는 시술이 없습니다.`);
        setRecommendedTreatments([]);
        return;
      }

      // 3. treatment_id 목록 추출
      const treatmentIds = krResult.data
        .map((t) => t.treatment_id)
        .filter((id): id is number => id !== undefined && id !== null);

      if (treatmentIds.length === 0) {
        setRecommendedTreatments([]);
        return;
      }

      // 4. 현재 언어 테이블에서 해당 treatment_id들로 시술 가져오기
      const { supabase: client } = await import("@/lib/supabase");
      if (!client) {
        setRecommendedTreatments([]);
        return;
      }

      const treatmentTable = getTreatmentTableName(language);

      const { data: treatmentsData, error } = await client
        .from(treatmentTable)
        .select("*")
        .in("treatment_id", treatmentIds)
        .limit(200);

      if (error) {
        console.error("시술 데이터 로드 실패:", error);
        // fallback: 한국어 데이터 사용
        const sorted = krResult.data
          .map((treatment) => ({
            ...treatment,
            recommendationScore: calculateRecommendationScore(treatment),
          }))
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, 10);
        setRecommendedTreatments(sorted);
        return;
      }

      if (!treatmentsData || treatmentsData.length === 0) {
        // fallback: 한국어 데이터 사용
        const sorted = krResult.data
          .map((treatment) => ({
            ...treatment,
            recommendationScore: calculateRecommendationScore(treatment),
          }))
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, 10);
        setRecommendedTreatments(sorted);
        return;
      }

      // 5. 추천 점수로 정렬하고 상위 10개 선택
      const sorted = treatmentsData
        .map((treatment: any) => ({
          ...treatment,
          recommendationScore: calculateRecommendationScore(treatment as Treatment),
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10) as Treatment[];

      setRecommendedTreatments(sorted);
    } catch (error) {
      console.error("시술 추천 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = async (treatment: Treatment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!treatment.treatment_id) return;

    const result = await toggleProcedureFavorite(treatment.treatment_id);

    if (result.success) {
      // Supabase 업데이트 성공 시 로컬 상태 업데이트
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (result.isFavorite) {
          newSet.add(treatment.treatment_id!);
        } else {
          newSet.delete(treatment.treatment_id!);
        }
        return newSet;
      });
      window.dispatchEvent(new Event("favoritesUpdated"));
    } else {
      // 로그인이 필요한 경우 안내 팝업 표시
      if (result.error?.includes("로그인이 필요") || result.error?.includes("로그인")) {
        setIsInfoModalOpen(true);
      } else {
        console.error("찜하기 처리 실패:", result.error);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">
          {t("home.countrySearch")}
        </h3>
      </div>

      {/* 국가 필터 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 mb-3">
        {countries.map((country) => (
          <button
            key={country.id}
            onClick={() => {
              setSelectedCountry(country.id);
              setSelectedConcern(null);
              setRecommendedTreatments([]);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCountry === country.id
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t(country.key)}
          </button>
        ))}
      </div>

      {/* 인기 검색어 태그 */}
      {keywordsLoading ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-full bg-gray-200 animate-pulse"
              style={{ width: "80px", height: "36px" }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {popularKeywords.length > 0 ? (
            popularKeywords.map((keyword, index) => (
              <button
                key={index}
                onClick={(e) => {
                  // 일반 클릭: 현재 페이지에서 추천 시술 표시
                  // 번역된 키워드를 전달하되, 내부에서 한국어 키워드로 변환
                  handleConcernClick(keyword.translated);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedConcern === keyword.translated
                    ? "bg-primary-main text-white border-primary-main"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-primary-main hover:text-primary-main"
                }`}
              >
                #{keyword.translated}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              인기 검색어를 불러올 수 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 선택된 고민에 대한 시술 추천 */}
      {selectedConcern && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">
              #{selectedConcern} {t("home.recommendedProcedures") || "추천 시술"}
            </h4>
            <button
              onClick={() => {
                setSelectedConcern(null);
                setRecommendedTreatments([]);
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <FiX className="text-gray-600 text-lg" />
            </button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[150px] bg-gray-200 rounded-xl animate-pulse"
                  style={{ height: "200px" }}
                />
              ))}
            </div>
          ) : recommendedTreatments.length > 0 ? (
            <div className="relative">
              <div 
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                onClick={(e) => {
                  // 버튼 클릭이 아닌 경우에만 이벤트 전파 허용
                  const target = e.target as HTMLElement;
                  // 버튼이나 버튼의 자식 요소를 클릭한 경우 이벤트 전파 방지
                  if (target.closest('button')) {
                    e.stopPropagation();
                  }
                }}
              >
                {recommendedTreatments.map((treatment) => {
                const isFavorite = favorites.has(treatment.treatment_id || 0);
                const thumbnailUrl = getThumbnailUrl(treatment);
                // ✅ 환전된 가격 표시
                const price = formatPrice(treatment.selling_price, currency, t);
                const rating = treatment.rating || 0;
                const reviewCount = treatment.review_count || 0;
                const discountRate = treatment.dis_rate
                  ? `${treatment.dis_rate}%`
                  : "";

                return (
                  <div
                    key={treatment.treatment_id}
                    className="flex-shrink-0 w-[150px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                    onClick={() => {
                      if (treatment.treatment_id) {
                        // GTM: PDP 클릭 이벤트 (홈 페이지에서 클릭)
                        trackPdpClick("home");
                        router.push(
                          `/home/treatment/${treatment.treatment_id}`
                        );
                      }
                    }}
                  >
                    {/* 이미지 - 2:1 비율 */}
                    <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                      <img
                        src={thumbnailUrl}
                        alt={treatment.treatment_name || "시술 이미지"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.dataset.fallback === "true") {
                            target.style.display = "none";
                            return;
                          }
                          target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="24"%3E🏥%3C/text%3E%3C/svg%3E';
                          target.dataset.fallback = "true";
                        }}
                      />
                      {/* 할인율 배지 */}
                      {discountRate && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                          {discountRate}
                        </div>
                      )}
                    </div>

                    {/* 카드 내용 */}
                    <div className="p-3 flex flex-col h-full">
                      <div>
                        {/* 병원명 */}
                        {treatment.hospital_name && (
                          <p className="text-xs text-gray-500 mb-1 truncate">
                            {treatment.hospital_name}
                          </p>
                        )}

                        {/* 시술명 */}
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                          {treatment.treatment_name}
                        </h4>

                        {/* 평점 */}
                        {rating > 0 && (
                          <div className="flex items-center gap-1 mb-1">
                            <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
                            <span className="text-xs font-semibold">
                              {rating.toFixed(1)}
                            </span>
                            {reviewCount > 0 && (
                              <span className="text-xs text-gray-400">
                                ({reviewCount.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 가격과 버튼 - 하단 고정 */}
                      <div className="flex items-end justify-between mt-auto">
                        <div className="flex-1">
                          {/* 가격 */}
                          <p className="text-sm font-bold text-primary-main">
                            {price}
                          </p>
                        </div>

                        {/* 하트 버튼 - 세로 배치 */}
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavoriteClick(treatment, e);
                            }}
                            className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <FiHeart
                              className={`text-base ${
                                isFavorite
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              {/* 더보기 버튼 */}
              <button
                onClick={async (e) => {
                  // 이벤트 전파 방지 (카드 스크롤 방지)
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // 후기 작성 이력 다시 확인 (최신 상태 확인)
                  let currentHasWrittenReview = hasWrittenReview;
                  if (isLoggedIn) {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    if (session?.user) {
                      currentHasWrittenReview = await hasUserWrittenReview(session.user.id);
                      setHasWrittenReview(currentHasWrittenReview);
                    }
                  }
                  
                  // 비로그인 또는 후기 미작성: 팝업만 표시
                  if (!isLoggedIn || !currentHasWrittenReview) {
                    setPendingAction(null); // 더보기 동작 없음
                    setShowReviewRequiredPopup(true);
                    return; // 여기서 함수 종료 - 다른 동작 실행 안 함
                  }

                  // 로그인 상태이고 리뷰를 작성한 경우 더보기 동작 실행
                  // (현재는 더보기 기능이 없으므로 리뷰 작성 모달만 표시)
                  setShowCommunityWriteModal(true);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-lg rounded-full p-2.5 transition-all"
              >
                <FiChevronRight className="text-gray-700 text-xl" />
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">
              {selectedConcern}에 대한 추천 시술을 찾을 수 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 안내 팝업 모달 */}
      {isInfoModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setIsInfoModalOpen(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl pointer-events-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {t("common.loginRequired")}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t("common.loginRequiredMoreInfo")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsInfoModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      setIsInfoModalOpen(false);
                      setShowLoginRequiredPopup(true);
                    }}
                    className="flex-1 py-2.5 px-4 bg-primary-main hover:bg-primary-main/90 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.login")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
        }}
      />

      {/* 후기 작성 필요 팝업 */}
      <ReviewRequiredPopup
        isOpen={showReviewRequiredPopup}
        onClose={() => {
          setShowReviewRequiredPopup(false);
          setPendingAction(null); // 팝업 닫을 때 저장된 동작 초기화
        }}
        onWriteClick={() => {
          setShowCommunityWriteModal(true);
        }}
        onLoginSuccess={async () => {
          // 로그인 성공 후 리뷰 작성 이력 다시 확인
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const hasReview = await hasUserWrittenReview(session.user.id);
            setHasWrittenReview(hasReview);
            setIsLoggedIn(true);
            
            // 리뷰를 작성했으면 저장된 동작 실행
            if (hasReview && pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }
        }}
      />

      {/* 커뮤니티 글 작성 모달 */}
      <CommunityWriteModal
        isOpen={showCommunityWriteModal}
        onClose={() => setShowCommunityWriteModal(false)}
        entrySource="home"
      />
    </div>
  );
}
