"use client";

import { Suspense } from "react";
import HomePage from "@/components/HomePage";

function HomeContent() {
  return <HomePage />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
