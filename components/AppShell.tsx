"use client";

import { useEffect, useState } from "react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2초 후 스플래시 종료

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative overflow-hidden">
      {children}
      {showSplash && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <img
            src="/beautrip-logo.png"
            alt="BeauTrip"
            className="w-40 h-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}


