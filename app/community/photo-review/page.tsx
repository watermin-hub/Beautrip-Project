"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryPhotoReviewPage from "@/components/CategoryPhotoReviewPage";

export default function PhotoReviewPage() {
  // 페이지 마운트 시 상단으로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <CategoryPhotoReviewPage />
      <div className="pb-20">
        <BottomNavigation />
      </div>
    </div>
  );
}

