"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PostList from "@/components/PostList";
import ReviewList from "@/components/ReviewList";

function CommunityPostsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const section = searchParams.get("section");
  const category = searchParams.get("category");
  const subCategory = searchParams.get("subCategory");

  // 페이지 마운트 시 상단으로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [section, category, subCategory]);

  const getPageTitle = () => {
    if (subCategory) return subCategory;
    if (category) return category;
    return "커뮤니티";
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      
      {/* Header */}
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-20">
        {/* 임시로 ReviewList 사용 (추후 카테고리별 필터링 구현) */}
        <ReviewList />
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function CommunityPostsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <CommunityPostsContent />
    </Suspense>
  );
}

