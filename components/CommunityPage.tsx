"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import CommunityHeader from "./CommunityHeader";
import PostList from "./PostList";
import CommunityFloatingButton from "./CommunityFloatingButton";
import InformationalContentSection from "./InformationalContentSection";
import ConsultationPage from "./ConsultationPage";

type CommunityTab = "popular" | "latest" | "info" | "consultation";

export default function CommunityPage() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<CommunityTab>("popular");

  useEffect(() => {
    const tab = searchParams.get("tab") as CommunityTab | null;
    // URL에 tab 파라미터가 있고 유효한 값이면 설정, 없으면 기본값 "popular" 유지
    if (tab && ["popular", "latest", "info", "consultation"].includes(tab)) {
      setActiveTab(tab);
      // 탭 변경 시 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (!tab) {
      // URL에 tab 파라미터가 없으면 기본값 "popular"로 설정
      setActiveTab("popular");
    }
  }, [searchParams]);

  const handleTabChange = (tab: CommunityTab) => {
    setActiveTab(tab);
    // 탭 변경 시 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <CommunityHeader activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Content */}
      <div className="pt-[104px]">
        {activeTab === "popular" ? (
          <PostList activeTab="popular" />
        ) : activeTab === "latest" ? (
          <PostList activeTab="latest" />
        ) : activeTab === "info" ? (
          <div className="px-4">
            <InformationalContentSection />
          </div>
        ) : activeTab === "consultation" ? (
          <ConsultationPage />
        ) : null}
      </div>

      <div className="pb-20">
        <BottomNavigation />
      </div>

      {/* 커뮤니티 플로팅 버튼 (글 쓰기 / 내 글 관리) */}
      <CommunityFloatingButton />
    </div>
  );
}
