"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import RecoveryGuideDetailPage from "@/components/RecoveryGuideDetailPage";
import RecoveryGuidePostDetailPage from "@/components/RecoveryGuidePostDetailPage";
import { RecoveryGroupKey } from "@/lib/content/recoveryGuideContent";
import { findRecoveryGuideById } from "@/lib/content/recoveryGuidePosts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RecoveryGuideDetailRoute() {
  const params = useParams();
  const param = params.groupKey as string;
  const { language } = useLanguage();
  const [isPost, setIsPost] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const validGroupKeys: RecoveryGroupKey[] = [
    "jaw",
    "breast",
    "body",
    "upperFace",
    "nose",
    "eyeSurgery",
    "eyeVolume",
    "faceFat",
    "lifting",
    "procedures",
  ];

  // 먼저 19개 회복 가이드 글(post)인지 비동기로 확인
  useEffect(() => {
    // param이 없으면 실행하지 않음
    if (!param) {
      setLoading(false);
      setIsPost(null);
      return;
    }

    const checkPost = async () => {
      setLoading(true);
      try {
        console.log(
          "[RecoveryGuideDetailRoute] Checking param:",
          param,
          "language:",
          language
        );
        const recoveryPost = await findRecoveryGuideById(param, language);
        console.log(
          "[RecoveryGuideDetailRoute] Recovery post result:",
          recoveryPost ? "Found" : "Not found"
        );
        if (recoveryPost) {
          console.log("[RecoveryGuideDetailRoute] Setting isPost to true");
          setIsPost(true);
        } else {
          // 그 다음 10개 그룹(groupKey)인지 확인
          const groupKey = param as RecoveryGroupKey;
          if (groupKey && validGroupKeys.includes(groupKey)) {
            console.log(
              "[RecoveryGuideDetailRoute] Setting isPost to false (groupKey)"
            );
            setIsPost(false);
          } else {
            console.log(
              "[RecoveryGuideDetailRoute] Setting isPost to null (not found)"
            );
            setIsPost(null);
          }
        }
      } catch (error) {
        console.error(
          "[RecoveryGuideDetailRoute] Failed to check recovery guide:",
          error
        );
        setIsPost(null);
      } finally {
        setLoading(false);
      }
    };
    checkPost();
  }, [param, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <div className="px-4 py-8 text-center text-gray-500">読み込み中...</div>
        <BottomNavigation />
      </div>
    );
  }

  if (isPost === true) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <RecoveryGuidePostDetailPage postId={param} />
        <BottomNavigation />
      </div>
    );
  }

  if (isPost === false) {
    const groupKey = param as RecoveryGroupKey;
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />
        <RecoveryGuideDetailPage groupKey={groupKey} />
        <BottomNavigation />
      </div>
    );
  }

  // 둘 다 아니면 에러
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />
      <div className="px-4 py-8 text-center text-gray-500">
        잘못된 회복 가이드입니다.
      </div>
      <BottomNavigation />
    </div>
  );
}
