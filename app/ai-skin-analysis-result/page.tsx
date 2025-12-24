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
        // 현재 로그인한 사용자 확인
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || localStorage.getItem("userId");

        // URL 파라미터에서 이미지 경로 가져오기 (Supabase 업로드된 이미지 우선)
        const filePath = searchParams.get("image");
        console.log("이미지 경로:", filePath);

        if (filePath) {
          try {
            // Supabase Storage에서 공개 URL 가져오기 (우선 사용)
            const { data } = supabase.storage
              .from("face-images")
              .getPublicUrl(filePath);

            console.log("Supabase URL 데이터:", data);

            if (data?.publicUrl) {
              console.log("공개 URL:", data.publicUrl);

              // URL이 유효한지 검증 (Supabase 도메인인지 확인)
              if (
                !data.publicUrl.includes("supabase.co") &&
                !data.publicUrl.includes("supabase.in")
              ) {
                console.warn("의심스러운 URL 형식:", data.publicUrl);
                throw new Error("유효하지 않은 이미지 URL");
              }

              // 이미지가 실제로 로드되는지 확인
              const img = new Image();
              img.onload = () => {
                console.log("Supabase 이미지 로드 성공!");
                setImageUrl(data.publicUrl);
                setLoading(false);
              };
              img.onerror = (error) => {
                console.error("Supabase 이미지 로드 실패:", data.publicUrl, error);
                // fallback으로 localStorage 확인 (본인 사진만)
                loadLocalImage(currentUserId);
              };
              img.src = data.publicUrl;
              return;
            } else {
              console.error(
                "공개 URL이 생성되지 않았습니다. filePath:",
                filePath
              );
              throw new Error("공개 URL 생성 실패");
            }
          } catch (urlError) {
            console.error("URL 생성 중 오류:", urlError);
            // fallback으로 localStorage 확인 (본인 사진만)
            loadLocalImage(currentUserId);
            return;
          }
        }

        // URL 파라미터가 없으면 localStorage에서 본인 사진 확인
        console.log("🔍 URL 파라미터에 이미지 없음, localStorage 확인 시작");
        loadLocalImage(currentUserId);

        function loadLocalImage(userId: string | null) {
          console.log("🔍 loadLocalImage 호출 - userId:", userId);
          // 먼저 최근 분석 결과 확인 (userId 일치 확인)
          const lastAnalysis = localStorage.getItem("lastAIAnalysisResult");
          if (lastAnalysis) {
            try {
              const parsed = JSON.parse(lastAnalysis);
              // 본인의 사진인지 확인
              if (parsed.imageData && parsed.userId === userId) {
                console.log("최근 분석 결과에서 본인 이미지 사용");
                setImageUrl(parsed.imageData);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error("최근 분석 결과 파싱 실패:", e);
            }
          }

          // localStorage에서 직접 저장된 이미지 확인 (userId 확인 불가하므로 마지막 fallback)
          const localImage = localStorage.getItem("capturedFaceImage");
          if (localImage) {
            console.log("✅ localStorage에서 이미지 사용 (fallback):", localImage.substring(0, 50) + "...");
            setImageUrl(localImage);
            setLoading(false);
            return;
          }

          console.log("⚠️ 이미지를 찾을 수 없음 - 이미지 없이 결과 표시");
          setLoading(false);
        }
      } catch (error) {
        console.error("이미지 로드 오류:", error);
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
