"use client";

import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import TravelRecommendationPage from "@/components/TravelRecommendationPage";

export default function TravelRecommendationRoute() {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <TravelRecommendationPage />
      <BottomNavigation />
    </div>
  );
}
