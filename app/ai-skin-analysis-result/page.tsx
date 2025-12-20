"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AISkinAnalysisResultPage from "@/components/AISkinAnalysisResultPage";
import { supabase } from "@/lib/supabase";

function AISkinAnalysisResultContent() {
  const searchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // URL 파라미터에서 이미지 경로 가져오기
        const filePath = searchParams.get("image");
        console.log("이미지 경로:", filePath);

        if (filePath) {
          // Supabase Storage에서 공개 URL 가져오기
          const { data } = supabase.storage
            .from("face-images")
            .getPublicUrl(filePath);

          console.log("Supabase URL 데이터:", data);

          if (data?.publicUrl) {
            console.log("공개 URL:", data.publicUrl);
            // 이미지가 실제로 로드되는지 확인
            const img = new Image();
            img.onload = () => {
              console.log("이미지 로드 성공!");
              setImageUrl(data.publicUrl);
              setLoading(false);
            };
            img.onerror = () => {
              console.error("이미지 로드 실패:", data.publicUrl);
              // fallback으로 localStorage 확인
              const localImage = localStorage.getItem("capturedFaceImage");
              if (localImage) {
                console.log("localStorage에서 이미지 사용");
                setImageUrl(localImage);
              }
              setLoading(false);
            };
            img.src = data.publicUrl;
            return;
          }
        }

        // localStorage에서 임시 이미지 가져오기 (fallback)
        const localImage = localStorage.getItem("capturedFaceImage");
        if (localImage) {
          console.log("localStorage에서 이미지 사용 (fallback)");
          setImageUrl(localImage);
        }
      } catch (error) {
        console.error("이미지 로드 오류:", error);
        // 에러 발생 시 localStorage 확인
        const localImage = localStorage.getItem("capturedFaceImage");
        if (localImage) {
          setImageUrl(localImage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
          <p className="text-gray-600">분석 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return <AISkinAnalysisResultPage imageUrl={imageUrl} />;
}

export default function AISkinAnalysisResultPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
            <p className="text-gray-600">분석 결과를 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <AISkinAnalysisResultContent />
    </Suspense>
  );
}
