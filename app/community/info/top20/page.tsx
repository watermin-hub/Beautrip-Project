"use client";

import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Top20InfoPage from "@/components/Top20InfoPage";

export default function Top20InfoRoute() {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <Top20InfoPage />
      <BottomNavigation />
    </div>
  );
}
