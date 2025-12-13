"use client";

import { useParams } from "next/navigation";
import HospitalDetailPage from "@/components/HospitalDetailPage";

export default function HospitalDetailRoute() {
  const params = useParams();
  const hospitalId = params.id ? parseInt(params.id as string, 10) : 0;

  if (!hospitalId || isNaN(hospitalId)) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">
        <div className="text-gray-500">잘못된 병원 ID입니다.</div>
      </div>
    );
  }

  return <HospitalDetailPage hospitalId={hospitalId} />;
}

