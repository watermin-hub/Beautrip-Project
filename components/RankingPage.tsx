"use client";

import { useState, useEffect } from "react";
import { FiHeart, FiStar } from "react-icons/fi";
import { IoChevronForward } from "react-icons/io5";

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface RankingCard {
  id: number;
  title: string;
  clinic: string;
  location?: string;
  description: string;
  price: string;
  rating: string;
  reviewCount: string;
  likes: string;
  isNew?: boolean;
  badge?: string;
  tags?: string[];
}

const categories: Category[] = [
  { id: "skin", label: "피부", icon: "⭐" },
  { id: "face", label: "얼굴ㆍ헤어", icon: "✨" },
  { id: "eyes", label: "눈", icon: "👁️" },
  { id: "nose", label: "코", icon: "👃" },
  { id: "mouth", label: "입", icon: "👄" },
  { id: "teeth", label: "치아", icon: "🦷" },
  { id: "body", label: "체형", icon: "💪" },
  { id: "hair", label: "제모", icon: "✂️" },
];

const rankingSections = [
  {
    rank: 1,
    title: "주름보톡스",
    description:
      "주름이 많은 부위에 주사하여 톡! 하고 주름을 펴주고 주름 예방 효과도 기대할 수 있어요.",
    cards: [
      {
        id: 1,
        title: "국산 보톡스",
        clinic: "벨로의원 신사역",
        location: "",
        description: "국산보톡스",
        price: "2만원",
        rating: "9.5",
        reviewCount: "10+",
        likes: "200+",
        isNew: false,
      },
      {
        id: 2,
        title: "제오민 주름보톡스",
        clinic: "다이아의원 강남역",
        location: "",
        description: "내성 적은 제오민 주름보톡스",
        price: "5.9만원",
        rating: "9.1",
        reviewCount: "10+",
        likes: "200+",
        tags: ["주름예방", "내성적은", "수입톡신"],
        badge: "단독",
        isNew: false,
      },
      {
        id: 3,
        title: "내성 Do 톡스 코",
        clinic: "뷰티블라썸",
        location: "",
        description: "내성 Do 톡스 코",
        price: "2.8만원",
        rating: "9.3",
        reviewCount: "",
        likes: "",
        tags: ["내성 코어"],
        isNew: false,
      },
    ],
  },
  {
    rank: 2,
    title: "사각턱보톡스",
    description:
      "턱 근육의 발달로 각져 보이는 사각 턱을 갸름한 턱선라인으로 만들어주는 시술이에요.",
    cards: [
      {
        id: 4,
        title: "사각턱 보톡스",
        clinic: "페이브피부과의원(용산)",
        location: "용산역",
        description: "사각턱 보톡스",
        price: "3.4만원",
        rating: "10",
        reviewCount: "1+",
        likes: "",
        isNew: false,
      },
    ],
  },
  {
    rank: 3,
    title: "백옥주사",
    description:
      "피부 미백과 항산화 효과가 있어 노화 예방에 도움이 되는 주사예요.",
    cards: [
      {
        id: 5,
        title: "리블룸 백옥주사",
        clinic: "Begin to Bloom",
        location: "",
        description: "리블룸 백옥주사",
        price: "3.3만원",
        rating: "9.8",
        reviewCount: "10+",
        likes: "100+",
        isNew: false,
      },
      {
        id: 6,
        title: "백옥주사",
        clinic: "CCH",
        location: "",
        description: "백옥주사",
        price: "2.7만원",
        rating: "9.7",
        reviewCount: "10+",
        likes: "100+",
        tags: ["#미백", "#항산화", "#피로회복"],
        isNew: false,
      },
      {
        id: 7,
        title: "빛나는 피부를 위한 백옥주사",
        clinic: "",
        location: "",
        description: "빛나는 피부를 위한 백옥주사",
        price: "6만원",
        rating: "",
        reviewCount: "",
        likes: "50+",
        badge: "단독",
        isNew: false,
      },
    ],
  },
  {
    rank: 4,
    title: "점제거",
    description:
      "돌연변이 멜라닌 세포로 인해 생긴 점을 레이저로 제거하여 깨끗한 피부를 만들어요.",
    cards: [
      {
        id: 8,
        title: "풀페이스 전제거",
        clinic: "",
        location: "",
        description: "점, 쥐젖, 사마귀, 검버섯",
        price: "",
        rating: "",
        reviewCount: "",
        likes: "",
        tags: ["점, 쥐젖, 사마귀, 검버섯"],
        isNew: false,
      },
    ],
  },
];

export default function RankingPage() {
  const [selectedCategory, setSelectedCategory] = useState("skin");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    setFavorites(new Set(savedFavorites.map((f: any) => f.id)));
  }, []);

  const handleFavoriteClick = (card: RankingCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = favorites.has(card.id);

    if (isFavorite) {
      const updated = savedFavorites.filter((f: any) => f.id !== card.id);
      localStorage.setItem("favorites", JSON.stringify(updated));
      setFavorites(new Set(updated.map((f: any) => f.id)));
    } else {
      const newFavorite = {
        id: card.id,
        title: card.title,
        clinic: card.clinic,
        location: card.location || "",
        price: card.price,
        rating: card.rating,
        type: "procedure" as const,
      };
      localStorage.setItem(
        "favorites",
        JSON.stringify([...savedFavorites, newFavorite])
      );
      setFavorites(new Set([...favorites, card.id]));
    }
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Category Filter Tags */}
      <div className="sticky top-[92px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary-light/20 text-primary-main"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-sm">{category.icon}</span>
              <span className="text-xs font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ranking Sections */}
      <div className="px-4 py-6 space-y-8">
        {rankingSections.map((section) => (
          <div key={section.rank} className="space-y-4">
            {/* Section Header */}
            <div className="flex items-start gap-4">
              <span className="text-primary-main text-4xl font-bold leading-none">
                {section.rank}
              </span>
              <div className="flex-1 pt-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>

            {/* Cards */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {section.cards.map((card) => (
                <div
                  key={card.id}
                  className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  {/* Image Placeholder */}
                  <div className="relative w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200">
                    {card.isNew && (
                      <div className="absolute top-3 left-3 bg-primary-main text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                        NEW
                      </div>
                    )}
                    {card.badge && (
                      <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                        {card.badge}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      <button
                        onClick={(e) => handleFavoriteClick(card, e)}
                        className="bg-white bg-opacity-90 p-2 rounded-full shadow-sm hover:bg-opacity-100 transition-colors"
                      >
                        <FiHeart
                          className={`text-lg ${
                            favorites.has(card.id)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-700"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tags Overlay */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-8">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {card.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-white font-bold text-base drop-shadow-lg">
                          {card.title}
                        </p>
                      </div>
                    )}

                    {!card.tags && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-8">
                        <p className="text-white font-bold text-base drop-shadow-lg">
                          {card.title}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Clinic Info */}
                    {card.clinic && (
                      <div className="mb-2">
                        <p className="text-gray-900 font-semibold text-sm">
                          {card.clinic}
                        </p>
                        {card.location && (
                          <p className="text-gray-500 text-xs">
                            {card.location}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {card.description && (
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {card.description}
                      </p>
                    )}

                    {/* Price */}
                    {card.price && (
                      <p className="text-gray-900 font-bold text-lg mb-3">
                        {card.price} VAT 포함
                      </p>
                    )}

                    {/* Rating & Likes */}
                    {(card.rating || card.likes) && (
                      <div className="flex items-center justify-between mb-4">
                        {card.rating && (
                          <div className="flex items-center gap-1">
                            <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                            <span className="text-gray-900 font-semibold text-sm">
                              {card.rating}
                            </span>
                            {card.reviewCount && (
                              <span className="text-gray-500 text-xs">
                                ({card.reviewCount})
                              </span>
                            )}
                          </div>
                        )}
                        {card.likes && (
                          <div className="flex items-center gap-1">
                            <FiHeart className="text-primary-main fill-primary-main text-sm" />
                            <span className="text-gray-600 text-xs">
                              {card.likes}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {card.price && (
                      <div className="flex gap-2">
                        <button className="flex-1 bg-primary-main hover:bg-[#2DB8A0] active:bg-primary-light text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
                          상세보기
                        </button>
                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition-all">
                          문의하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* More indicator */}
              <div className="flex-shrink-0 w-12 flex items-center justify-center">
                <IoChevronForward className="text-gray-400 text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
