"use client";

import { Suspense } from "react";
import LikedPostsPage from "@/components/LikedPostsPage";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function LikedPosts() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full pb-20">
      <Header />
      <div className="sticky top-[48px] z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiArrowLeft className="text-gray-700 text-xl" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">좋아요한 글</h1>
        <div className="w-10"></div>
      </div>
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        }
      >
        <LikedPostsPage />
      </Suspense>
      <BottomNavigation />
    </div>
  );
}

