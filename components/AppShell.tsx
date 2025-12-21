"use client";

import { useEffect, useState } from "react";
import { RankingDataProvider } from "@/contexts/RankingDataContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      image.png;
    }, 700); // 0.7초 후 스플래시 종료

    return () => clearTimeout(timer);
  }, []);

  return (
    <RankingDataProvider>
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative">
        {children}
        {showSplash && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
            <img
              src="/beautrip-logo.png"
              alt="BeauTrip"
              className="w-40 h-auto object-contain"
            />
          </div>
        )}
      </div>
    </RankingDataProvider>
  );
}
