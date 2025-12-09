"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FiChevronRight,
  FiBookmark,
  FiMapPin,
  FiCamera,
  FiHeart,
  FiTrendingUp,
} from "react-icons/fi";
import CommunityRecommendations from "./CommunityRecommendations";

interface CategorySection {
  id: string;
  titleKey: string;
  icon: string;
  color: string;
  items: CategoryItem[];
}

interface CategoryItem {
  id: string;
  labelKey: string;
  hasButton?: boolean;
  buttonLabelKey?: string;
  subItems?: string[];
}

export default function CommunityCategoriesPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const categorySections: CategorySection[] = [
    {
      id: "recommended",
      titleKey: "community.section.recommended",
      icon: "⭐",
      color: "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200",
      items: [],
    },
    {
      id: "popular",
      titleKey: "community.section.popular",
      icon: "🔥",
      color: "bg-gradient-to-br from-red-50 to-orange-50 border-red-200",
      items: [
        {
          id: "by-category",
          labelKey: "community.item.byCategory",
        },
        {
          id: "photo-review",
          labelKey: "community.item.photoReview",
          subItems: [
            "전체",
            "피부",
            "피부주사",
            "고주파",
            "초음파",
            "여드름 & 흉터",
            "색소 & 제거",
            "보톡스",
            "필러",
            "비만",
            "지방분해주사",
            "두피탈모",
            "가슴보형물",
            "코보형물",
            "부위별",
            "기타",
          ],
          hasButton: true,
          buttonLabelKey: "community.hospitalInfo",
        },
      ],
    },
    {
      id: "recovery",
      titleKey: "community.section.recovery",
      icon: "💬",
      color: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
      items: [
        {
          id: "surgery-done",
          labelKey: "community.item.surgeryDone",
          subItems: [
            "수술경과사진",
            "부작용",
            "염증 & 발열",
            "마사지 & 찜질",
            "성형메이크업",
          ],
          hasButton: true,
          buttonLabelKey: "community.hospitalInfo",
        },
        {
          id: "recovery-chat",
          labelKey: "community.item.recoveryChat",
        },
      ],
    },
    {
      id: "questions",
      titleKey: "community.section.questions",
      icon: "❓",
      color: "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200",
      items: [
        {
          id: "ask-surgery",
          labelKey: "community.item.askSurgery",
          subItems: ["후기글 작성자 DM"],
        },
      ],
    },
    {
      id: "skin-concerns",
      titleKey: "community.section.skinConcerns",
      icon: "😟",
      color: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
      items: [
        {
          id: "skin-diseases",
          labelKey: "community.item.skinDiseases",
          subItems: [
            "지루성",
            "아토피",
            "건선",
            "여드름",
            "안면홍조",
            "한포진",
            "사마귀",
            "광알러지",
            "피부건조",
            "점기미주근깨",
            "여성탈모",
          ],
          hasButton: true,
          buttonLabelKey: "community.hospitalInfo",
        },
      ],
    },
    {
      id: "travel",
      titleKey: "community.section.travel",
      icon: "✈️",
      color: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
      items: [
        {
          id: "popular-itinerary",
          labelKey: "community.item.popularItinerary",
        },
        {
          id: "ask-itinerary",
          labelKey: "community.item.askItinerary",
        },
      ],
    },
  ];

  // 부위별 하위 카테고리
  const bodyPartSubCategories = [
    "코 성형수술후기",
    "눈 성형수술후기",
    "윤곽 / Face 후기",
    "양악교정 후기",
    "가슴성형수술후기",
    "쁘띠레이저후기",
    "코제거 / 재건후기",
    "실패 & 부작용",
  ];

  // 첫 번째 섹션을 기본 선택
  const [selectedSection, setSelectedSection] = useState<string>(
    categorySections[0].id
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleCategoryClick = (
    sectionId: string,
    itemId: string,
    subItem?: string
  ) => {
    // "카테고리별 포토 & 후기" 섹션인 경우 특별 처리
    if (sectionId === "popular" && itemId === "photo-review") {
      // 기본 카테고리로 포토 후기 페이지로 이동
      router.push("/community/photo-review?category=nose");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 다른 카테고리별 게시글 페이지로 이동 (쿼리 파라미터 사용)
    const params = new URLSearchParams();
    params.set("section", sectionId);
    params.set("category", itemId);
    if (subItem) {
      params.set("subCategory", subItem);
    }
    router.push(`/community/posts?${params.toString()}`);
    // 페이지 이동 시 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHospitalInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/explore?tab=hospital");
    // 페이지 이동 시 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 스크랩 기능 (추후 구현)
    alert("스크랩 기능은 추후 구현 예정입니다.");
  };

  // 현재 선택된 섹션 찾기
  const currentSection =
    categorySections.find((s) => s.id === selectedSection) ??
    categorySections[0];

  return (
    <div className="bg-white">
      {/* 상단 섹션 탭 */}
      <div className="sticky top-[48px] z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {categorySections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedSection === section.id
                  ? "bg-primary-main text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-base">{section.icon}</span>
              <span className="text-sm font-medium">{t(section.titleKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 함께 만드는 따뜻한 커뮤니티 배너 */}
        <div className="bg-gradient-to-r from-primary-light/10 to-primary-main/10 rounded-xl p-4 border border-primary-light/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💚</span>
              <h3 className="text-primary-main font-bold text-sm">
                {t("community.warmCommunity")}
              </h3>
            </div>
            <p className="text-gray-700 text-xs leading-relaxed">
              {t("community.warmCommunityDesc")}{" "}
              <span className="text-primary-main">♥</span>
            </p>
          </div>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-20">
            <div className="w-16 h-16 bg-primary-main rounded-full"></div>
          </div>
        </div>

        {/* 추천 게시글 섹션 (별도 처리) */}
        {selectedSection === "recommended" ? (
          <CommunityRecommendations />
        ) : (
          <>
            {/* 선택된 섹션의 내용 표시 */}
            <div
              className={`${currentSection.color} border-2 rounded-2xl overflow-hidden shadow-sm`}
            >
              <div className="px-4 py-4 bg-white/50">
                <div className="space-y-2">
                  {currentSection.items.length > 0 ? (
                    currentSection.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        {/* 메인 아이템 */}
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => {
                              if (item.subItems && item.subItems.length > 0) {
                                toggleItem(item.id);
                              } else {
                                handleCategoryClick(currentSection.id, item.id);
                              }
                            }}
                            className="flex-1 text-left"
                          >
                            <span className="text-sm font-semibold text-gray-900 hover:text-primary-main transition-colors">
                              {t(item.labelKey)}
                            </span>
                          </button>
                          <div className="flex items-center gap-2">
                            {item.hasButton && (
                              <>
                                <button
                                  onClick={handleScrapClick}
                                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                  title="스크랩"
                                >
                                  <FiBookmark className="text-gray-600 text-sm" />
                                </button>
                                <button
                                  onClick={handleHospitalInfoClick}
                                  className="bg-primary-main hover:bg-[#2DB8A0] text-white text-[10px] px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap"
                                >
                                  {item.buttonLabelKey
                                    ? t(item.buttonLabelKey)
                                    : ""}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 하위 카테고리 */}
                        {expandedItems.has(item.id) && item.subItems && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                            {item.id === "photo-review" &&
                            item.subItems.includes("부위별") ? (
                              <>
                                {/* "부위별" 제외한 일반 하위 카테고리 */}
                                {item.subItems
                                  .filter((sub) => sub !== "부위별")
                                  .map((subItem, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() =>
                                        handleCategoryClick(
                                          currentSection.id,
                                          item.id,
                                          subItem
                                        )
                                      }
                                      className="w-full text-left text-xs text-gray-700 hover:text-primary-main hover:bg-primary-main/5 pl-3 py-1.5 rounded transition-colors flex items-center justify-between group"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-1 h-1 bg-primary-main rounded-full"></span>
                                        {subItem}
                                      </span>
                                      <FiChevronRight className="text-xs text-gray-400 group-hover:text-primary-main transition-colors opacity-0 group-hover:opacity-100" />
                                    </button>
                                  ))}

                                {/* 부위별 카테고리 전용 블록 */}
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1.5 px-3">
                                    부위별
                                  </p>
                                  {bodyPartSubCategories.map((subItem, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() =>
                                        handleCategoryClick(
                                          currentSection.id,
                                          "body-part",
                                          subItem
                                        )
                                      }
                                      className="w-full text-left text-xs text-gray-700 hover:text-primary-main hover:bg-primary-main/5 pl-5 py-1.5 rounded transition-colors flex items-center justify-between group"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-1 h-1 bg-primary-main rounded-full"></span>
                                        {subItem}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleScrapClick(e);
                                          }}
                                          className="p-1 hover:bg-primary-main/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <FiBookmark className="text-xs text-gray-500" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleHospitalInfoClick(e);
                                          }}
                                          className="p-1 hover:bg-primary-main/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <FiMapPin className="text-xs text-gray-500" />
                                        </button>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              // 일반 하위 카테고리
                              item.subItems.map((subItem, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    handleCategoryClick(
                                      currentSection.id,
                                      item.id,
                                      subItem
                                    )
                                  }
                                  className="w-full text-left text-xs text-gray-700 hover:text-primary-main hover:bg-primary-main/5 pl-3 py-1.5 rounded transition-colors flex items-center justify-between group"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-primary-main rounded-full"></span>
                                    {subItem}
                                  </span>
                                  {item.hasButton && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleScrapClick(e);
                                        }}
                                        className="p-1 hover:bg-primary-main/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <FiBookmark className="text-xs text-gray-500" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleHospitalInfoClick(e);
                                        }}
                                        className="p-1 hover:bg-primary-main/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <FiMapPin className="text-xs text-gray-500" />
                                      </button>
                                    </div>
                                  )}
                                  <FiChevronRight className="text-xs text-gray-400 group-hover:text-primary-main transition-colors opacity-0 group-hover:opacity-100" />
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {t("community.noItems")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 글 작성 유도 카드 */}
        <div className="bg-gradient-to-br from-primary-main to-primary-light rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <FiTrendingUp className="text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">
                {t("community.storySharing")}
              </h3>
              <p className="text-sm text-white/90 mb-4">
                {t("community.storySharingDesc")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-white text-primary-main py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
              <FiCamera className="inline mr-1" />
              {t("community.photoReviewWrite")}
            </button>
            <button className="flex-1 bg-white/20 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors border border-white/30">
              <FiTrendingUp className="inline mr-1" />
              {t("community.writePost")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
