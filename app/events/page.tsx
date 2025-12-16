"use client";

import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import EventsPage from "@/components/EventsPage";

export default function EventsRoute() {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <EventsPage />
      <BottomNavigation />
    </div>
  );
}
