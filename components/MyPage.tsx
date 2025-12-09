"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiChevronRight,
  FiSettings,
  FiBookmark,
  FiCheckSquare,
  FiHeart,
  FiGift,
  FiEdit3,
  FiBell,
  FiCamera,
  FiMapPin,
  FiHelpCircle,
  FiFileText,
} from "react-icons/fi";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import LoginModal from "./LoginModal";

interface UserInfo {
  username: string;
  provider?: string;
}

export default function MyPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Check if user is logged in (you can use localStorage or context)
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedUserInfo = localStorage.getItem("userInfo");
    
    setIsLoggedIn(loggedIn);
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo));
      } catch (e) {
        console.error("Failed to parse user info", e);
      }
    }
    
    if (!loggedIn) {
      setShowLogin(true);
    }
  }, []);

  const handleLoginSuccess = (userInfo?: UserInfo) => {
    localStorage.setItem("isLoggedIn", "true");
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      setUserInfo(userInfo);
    }
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userInfo");
    setIsLoggedIn(false);
    setUserInfo(null);
    setShowLogin(true);
  };

  // 로그인하지 않았을 때는 로그인 화면만 표시
  if (!isLoggedIn) {
    return (
      <LoginModal
        isOpen={true}
        onClose={() => {
          // 로그인 모달을 닫으려고 하면 홈으로 이동
          router.push("/");
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 로그인했을 때만 마이페이지 내용 표시
  return (
      <div className="min-h-screen bg-white max-w-md mx-auto w-full">
        <Header />

      {/* Header with Settings */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
        <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <FiSettings className="text-gray-700 text-xl" />
        </button>
      </div>

      {/* User Profile Card */}
      {isLoggedIn && userInfo && (
        <div className="mx-4 mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-light to-primary-main rounded-full flex items-center justify-center text-3xl">
              😊
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {userInfo.username}
                </h2>
                <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-xs font-semibold">
                  Lv.1
                </span>
              </div>
              {userInfo.provider && (
                <p className="text-xs text-gray-500">
                  {userInfo.provider === "id"
                    ? "일반 로그인"
                    : `${userInfo.provider.toUpperCase()} 로그인`}
                </p>
              )}
            </div>
            <FiChevronRight className="text-gray-400" />
          </div>

          {/* Points Section */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-main rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="text-sm text-gray-700">내 포인트</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary-main">5,000 P</span>
              <FiChevronRight className="text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Main Menu */}
      <div className="mx-4 mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <MenuItem icon={FiBookmark} label="활동·저장내역" />
        <MenuItem icon={FiCheckSquare} label="내 예약·결제 내역" />
        <MenuItem 
          icon={FiHeart} 
          label="찜 목록" 
          onClick={() => router.push("/favorites")}
        />
        <MenuItem icon={FiGift} label="혜택" />
        <MenuItem icon={FiEdit3} label="후기" />
        <MenuItem icon={FiBell} label="알림" />
      </div>

      {/* Activity Section */}
      <div className="mx-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 mb-2 px-1">활동</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <MenuItem icon={FiCamera} label="시술 전후 사진" />
        </div>
      </div>

      {/* Settings Section */}
      <div className="mx-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 mb-2 px-1">설정</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <MenuItem icon={FiHeart} label="관심 시술 설정" />
          <MenuItem icon={FiMapPin} label="관심 지역 설정" />
        </div>
      </div>

      {/* Inquiry Section */}
      <div className="mx-4 mt-4 mb-4">
        <h3 className="text-xs font-medium text-gray-500 mb-2 px-1">문의</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <MenuItem icon={FiHelpCircle} label="고객센터" />
          <MenuItem icon={FiFileText} label="공지사항" />
        </div>
      </div>

      {/* Logout Button */}
      {isLoggedIn && (
        <div className="mx-4 mt-4 mb-4">
          <button
            onClick={handleLogout}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}

      <div className="pb-20">
        <BottomNavigation />
      </div>
    </div>
  );
}

function MenuItem({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <Icon className="text-gray-600 text-xl" />
        <span className="text-sm text-gray-900">{label}</span>
      </div>
      <FiChevronRight className="text-gray-400" />
    </button>
  );
}
