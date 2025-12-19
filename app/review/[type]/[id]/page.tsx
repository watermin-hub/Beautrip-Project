import ProcedureReviewDetailPage from "@/components/ProcedureReviewDetailPage";
import HospitalReviewDetailPage from "@/components/HospitalReviewDetailPage";

interface ReviewDetailRouteProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function ReviewDetailRoute({
  params,
}: ReviewDetailRouteProps) {
  const { type, id } = await params;

  if (type === "procedure") {
    return <ProcedureReviewDetailPage reviewId={id} />;
  } else if (type === "hospital") {
    return <HospitalReviewDetailPage reviewId={id} />;
  } else {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full flex items-center justify-center">
        <div className="text-gray-500">잘못된 후기 타입입니다.</div>
      </div>
    );
  }
}
