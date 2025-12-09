"use client";

import { useState, useEffect } from "react";
import { FiHeart, FiMapPin, FiStar, FiPhone, FiClock, FiGlobe } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

export default function FavoritesPage() {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "procedure" | "clinic">("all");

  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    setFavorites(savedFavorites);

    const handleFavoritesUpdate = () => {
      const updated = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavorites(updated);
    };

    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () =>
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, []);

  const removeFavorite = (id: number) => {
    const updated = favorites.filter((item) => item.id !== id);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setFavorites(updated);
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  const procedures = favorites.filter((item) => item.type === "procedure");
  const clinics = favorites.filter((item) => item.type === "clinic");

  const displayedItems =
    activeTab === "all"
      ? favorites
      : activeTab === "procedure"
      ? procedures
      : clinics;

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
          onClick={() => setActiveTab("all")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-primary-main text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          전체 ({favorites.length})
        </button>
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
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
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
                      <p className="text-sm text-gray-600 mb-2">{item.address}</p>
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
