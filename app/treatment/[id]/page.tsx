import TreatmentDetailPage from "@/components/TreatmentDetailPage";

// 동적 렌더링 강제: 요청 시마다 서버에서 렌더링
// 17,000개 이상의 정적 페이지 생성으로 인한 배포 실패 방지
export const dynamic = "force-dynamic";

interface TreatmentDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TreatmentDetailRoute({
  params,
}: TreatmentDetailRouteProps) {
  const { id } = await params;
  const treatmentId = id ? parseInt(id, 10) : 0;

  if (!treatmentId || isNaN(treatmentId)) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">
        <div className="text-gray-500">잘못된 시술 ID입니다.</div>
      </div>
    );
  }

  return <TreatmentDetailPage treatmentId={treatmentId} />;
}
