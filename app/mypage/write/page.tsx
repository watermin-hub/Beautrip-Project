"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiCamera,
  FiFileText,
  FiHome,
  FiUser,
  FiArrowLeft,
  FiMessageCircle,
} from "react-icons/fi";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import LoginRequiredPopup from "@/components/LoginRequiredPopup";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function WritePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsLoggedIn(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  // 버튼 클릭 핸들러 (로그인 체크 후 이동)
  const handleButtonClick = (path: string) => {
    if (isLoggedIn) {
      router.push(path);
    } else {
      setPendingPath(path);
      setShowLoginRequiredPopup(true);
    }
  };

  const writeOptions = [
    {
      id: "procedure-review",
      icon: FiCamera,
      title: t("writePage.procedureReview"),
      description: t("writePage.procedureReviewDesc"),
      color: "from-pink-500 to-rose-500",
      path: "/mypage/write/procedure",
    },
    {
      id: "hospital-review",
      icon: FiHome,
      title: t("writePage.hospitalReview"),
      description: t("writePage.hospitalReviewDesc"),
      color: "from-blue-500 to-cyan-500",
      path: "/mypage/write/hospital",
    },
    {
      id: "concern-post",
      icon: FiFileText,
      title: t("writePage.concernPost"),
      description: t("writePage.concernPostDesc"),
      color: "from-purple-500 to-pink-500",
      path: "/mypage/write/concern",
    },
  ];

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-6 py-4 sticky top-[48px] bg-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("writePage.title")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("writePage.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Options - 상단 여백 추가 */}
      <div className="px-6 pt-16 pb-24 space-y-3">
        {writeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleButtonClick(option.path)}
              className="w-full p-4 bg-gradient-to-r rounded-xl border-2 border-gray-100 hover:border-primary-main/30 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`bg-gradient-to-br ${option.color} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform`}
                >
                  <Icon className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                <div className="text-gray-400 group-hover:text-primary-main transition-colors">
                  →
                </div>
              </div>
            </button>
          );
        })}

        {/* 내 글 관리 & 내 댓글 관리 */}
        <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
          <button
            onClick={() => handleButtonClick("/community/my-posts")}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-gray-200 hover:border-primary-main/30 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <FiUser className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {t("writePage.managePosts")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("writePage.managePostsDesc")}
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-primary-main transition-colors">
                →
              </div>
            </div>
          </button>

          <button
            onClick={() => handleButtonClick("/community/my-comments")}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-gray-200 hover:border-primary-main/30 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <FiMessageCircle className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {t("writePage.manageComments")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("writePage.manageCommentsDesc")}
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-primary-main transition-colors">
                →
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => {
          setShowLoginRequiredPopup(false);
          setPendingPath(null);
        }}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
          setIsLoggedIn(true);
          // 로그인 성공 후 대기 중인 경로로 이동
          if (pendingPath) {
            router.push(pendingPath);
            setPendingPath(null);
          }
        }}
      />
    </div>
  );
}

