import HospitalDetailPage from "@/components/HospitalDetailPage";

// 동적 렌더링 강제: 요청 시마다 서버에서 렌더링
export const dynamic = "force-dynamic";

interface HospitalDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function HospitalDetailRoute({
  params,
}: HospitalDetailRouteProps) {
  const { id } = await params;
  const hospitalIdRd = id ? parseInt(id, 10) : 0;

  if (!hospitalIdRd || isNaN(hospitalIdRd)) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">
        <div className="text-gray-500">잘못된 병원 ID입니다.</div>
      </div>
    );
  }

  // platform 없이 hospital_id_rd만 전달 (내부에서 자동 감지)
  return <HospitalDetailPage hospitalIdRd={hospitalIdRd} />;
}
