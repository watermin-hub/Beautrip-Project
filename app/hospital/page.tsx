"use client";

import HospitalDetailPage from "@/components/HospitalDetailPage";
import { useSearchParams } from "next/navigation";

export default function HospitalDetailQueryRoute() {
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

