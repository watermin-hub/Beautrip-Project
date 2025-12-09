"use client";

import { useState, useEffect } from "react";
import { FiHeart, FiStar } from "react-icons/fi";
import { IoFlashSharp } from "react-icons/io5";
import { GiLipstick } from "react-icons/gi";
import { BsHourglassSplit } from "react-icons/bs";

interface Card {
  id: number;
  title: string;
  clinic: string;
  location: string;
  description: string;
  price: string;
  rating: string;
  reviewCount: string;
  likes: string;
  isNew?: boolean;
}

interface ThemeSectionProps {
  theme: {
    id: string;
    title: string;
    bgColor: string;
    bgGradient: string;
    cards: Card[];
  };
}

const getThemeIcon = (themeId: string) => {
  switch (themeId) {
    case "easy":
      return (
        <div className="relative">
          <GiLipstick className="text-white text-7xl opacity-90" />
        </div>
      );
    case "weekend":
      return (
        <div className="relative">
          <BsHourglassSplit className="text-white text-7xl opacity-90" />
          <IoFlashSharp className="absolute -top-2 -right-2 text-yellow-300 text-3xl" />
        </div>
      );
    case "skin":
      return (
        <div className="relative">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <IoFlashSharp className="text-yellow-500 text-2xl" />
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default function ThemeSection({ theme }: ThemeSectionProps) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    setFavorites(new Set(savedFavorites.map((f: any) => f.id)));
  }, []);

  const handleFavoriteClick = (card: Card, e: React.MouseEvent) => {
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
        location: card.location,
        price: card.price,
        rating: card.rating,
        type: "procedure" as const,
      };
      localStorage.setItem(
        "favorites",
        JSON.stringify([...savedFavorites, newFavorite])
      );
      setFavorites(new Set(Array.from(favorites).concat(card.id)));
    }
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  return (
    <div className={`bg-gradient-to-r ${theme.bgGradient} pb-8`}>
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold leading-tight">
            {theme.title}
          </h2>
          <div className="flex items-center justify-center ml-4">
            {getThemeIcon(theme.id)}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide pb-2">
        {theme.cards.map((card) => (
          <div
            key={card.id}
            className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Image Placeholder */}
            <div className="relative w-full h-52 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-50">
              {card.isNew && (
                <div className="absolute top-3 left-3 bg-primary-main text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                  NEW
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

              {/* Placeholder for person image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gray-300 rounded-full opacity-50"></div>
              </div>

              {/* Overlay Text */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-8">
                <p className="text-white font-bold text-base drop-shadow-lg">
                  {card.title}
                </p>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
              {/* Clinic Info */}
              <div className="mb-2">
                <p className="text-gray-900 font-semibold text-sm">
                  {card.clinic}
                </p>
                {card.location && (
                  <p className="text-gray-500 text-xs">{card.location}</p>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {card.description}
              </p>

              {/* Price */}
              <p className="text-gray-900 font-bold text-lg mb-3">
                {card.price} VAT 포함
              </p>

              {/* Rating & Likes */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                  <span className="text-gray-900 font-semibold text-sm">
                    {card.rating}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ({card.reviewCount})
                  </span>
                </div>
                {card.likes && (
                  <div className="flex items-center gap-1">
                    <FiHeart className="text-primary-main fill-primary-main text-sm" />
                    <span className="text-gray-600 text-xs">{card.likes}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 bg-primary-main hover:bg-[#2DB8A0] active:bg-primary-light text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
                  상세보기
                </button>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition-all">
                  문의하기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
