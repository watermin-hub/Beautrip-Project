"use client";

import { useState } from "react";
import { FiArrowLeft, FiHeart, FiStar } from "react-icons/fi";
import { IoCheckmarkCircle } from "react-icons/io5";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

const clinicMarkers = [
  { id: 1, x: 15, y: 20, count: 12, label: "12개의 병원" },
  { id: 2, x: 75, y: 30, count: 4, label: "4개의 병원" },
  { id: 3, x: 40, y: 50, count: 22, label: "22개의 병원" },
  { id: 4, x: 60, y: 45, count: 9, label: "9개의 병원" },
  { id: 5, x: 25, y: 65, count: 15, label: "15개의 병원" },
  { id: 6, x: 80, y: 70, count: 7, label: "7개의 병원" },
];

const clinics = [
  {
    id: 1,
    name: "셀이즈연세메디컬의원",
    location: "남부터미널역",
    procedure: "피부미백 백옥주사",
    price: "5.5만원",
    rating: "10",
    reviewCount: "10+",
    likes: 2,
    image: "",
  },
  {
    id: 2,
    name: "장덕한방병원",
    location: "신사역",
    procedure: "재생/탄력",
    price: "16.5만원",
    rating: "10",
    reviewCount: "1+",
    likes: 3,
    image: "",
  },
  {
    id: 3,
    name: "비비의원",
    location: "강남역",
    procedure: "리쥬란 힐러",
    price: "12만원",
    rating: "9.8",
    reviewCount: "50+",
    likes: 45,
    image: "",
  },
  {
    id: 4,
    name: "다이아의원",
    location: "압구정역",
    procedure: "주름보톡스",
    price: "3.5만원",
    rating: "9.6",
    reviewCount: "100+",
    likes: 120,
    image: "",
  },
];

export default function NearbyPage() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">주변</h1>
      </div>

      {/* Map Header */}
      <div className="sticky top-[96px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <div className="flex gap-2">
            {/* <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFilters.includes("goddess")
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <IoCheckmarkCircle className="inline mr-1" />
              ㅇㅇㅇ
            </button> */}
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFilters.includes("appointment")
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <IoCheckmarkCircle className="inline mr-1" />앱 예약 가능
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[60vh] bg-gray-100 overflow-hidden">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        {/* Subway Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-green-500 opacity-60"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-red-500 opacity-60"></div>

        {/* Station Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">신사역</span>
          </div>
        </div>

        {/* Clinic Cluster Markers */}
        {clinicMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute bg-primary-main text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer hover:bg-primary-light transition-colors"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {marker.label}
          </div>
        ))}

        {/* Road Labels */}
        <div className="absolute top-10 left-4 text-xs text-gray-600 font-medium">
          강남대로
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
          도산대로
        </div>
        <div className="absolute top-1/2 right-4 text-xs text-gray-600 font-medium">
          3호선
        </div>

        {/* Additional POIs */}
        <div className="absolute top-20 right-10 text-xs text-gray-500">
          GS25
        </div>
        <div className="absolute bottom-20 left-20 text-xs text-gray-500">
          스타벅스
        </div>
      </div>

      {/* Location Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">강남구 신사동</h3>
      </div>

      {/* Clinic Cards */}
      <div className="px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Image */}
              <div className="w-full h-40 bg-gradient-to-br from-primary-light/20 to-primary-main/30 relative">
                {/* Placeholder for profile image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-primary-main text-3xl">👤</span>
                  </div>
                </div>
                {/* Procedure name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white font-semibold text-sm">
                    {clinic.procedure}
                  </p>
                </div>
                <button className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full z-10 shadow-sm hover:bg-opacity-100 transition-colors relative">
                  {clinic.likes ? (
                    <>
                      <FiHeart className="text-primary-main fill-primary-main text-lg" />
                      {clinic.likes > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-main text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                          {clinic.likes}
                        </span>
                      )}
                    </>
                  ) : (
                    <FiHeart className="text-gray-700 text-lg" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-900 font-semibold text-sm mb-1">
                  {clinic.name}
                </p>
                {clinic.location && (
                  <p className="text-gray-500 text-xs mb-2">
                    {clinic.location}
                  </p>
                )}
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {clinic.procedure}
                </p>
                <p className="text-gray-900 font-bold text-lg mb-3">
                  {clinic.price} VAT 포함
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                    <span className="text-gray-900 font-semibold text-sm">
                      {clinic.rating}
                    </span>
                    <span className="text-gray-500 text-xs">
                      ({clinic.reviewCount})
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-primary-main hover:bg-[#2DB8A0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                    상세보기
                  </button>
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                    문의하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-20">
        <BottomNavigation />
      </div>
    </div>
  );
}
