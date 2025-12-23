"use client";

import { Suspense } from "react";
import HospitalDetailPage from "@/components/HospitalDetailPage";
import { useSearchParams } from "next/navigation";

function HospitalDetailContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("hospital_id_rd") || searchParams.get("id");
  const hospitalIdRd = idParam ? parseInt(idParam, 10) : NaN;

  if (!hospitalIdRd || Number.isNaN(hospitalIdRd)) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">
        <div className="text-gray-500">잘못된 병원 ID입니다.</div>
      </div>
    );
  }

  return <HospitalDetailPage hospitalIdRd={hospitalIdRd} />;
}

export default function HospitalDetailQueryRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      }
    >
      <HospitalDetailContent />
    </Suspense>
  );
}

