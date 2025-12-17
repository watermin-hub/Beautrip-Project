"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  FiChevronRight,
  FiBookmark,
  FiHeart,
  FiEdit3,
  FiBell,
  FiGlobe,
  FiDollarSign,
  FiFileText,
  FiActivity,
  FiLogOut,
} from "react-icons/fi";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import LoginModal from "./LoginModal";
import { getFavoriteProcedures, getLikedPosts } from "@/lib/api/beautripApi";

interface UserInfo {
  username: string;
  provider?: string;
}

export default function MyPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Check if user is logged in (Supabase 세션 + localStorage 모두 확인)
  useEffect(() => {
    const checkAuth = async () => {
      // 1. localStorage 먼저 확인 (user_profiles 기반 로그인 지원)
      const savedIsLoggedIn = localStorage.getItem("isLoggedIn");
      const savedUserInfo = localStorage.getItem("userInfo");
      const savedUserId = localStorage.getItem("userId");

      // localStorage에 로그인 정보가 있으면 로그인 상태로 설정
      if (savedIsLoggedIn === "true" && savedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(savedUserInfo);
          setIsLoggedIn(true);
          setUserInfo(parsedUserInfo);
          setShowLogin(false);

          // Supabase 세션도 확인 (있으면 유지, 없어도 localStorage 기반으로 로그인 유지)
          const { supabase } = await import("@/lib/supabase");
          if (supabase) {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            // 세션이 없고 userId가 있으면 user_profiles에서 정보 다시 가져오기
            if (!session && savedUserId) {
              const { data: profile } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", savedUserId)
                .maybeSingle();

              if (profile) {
                // user_profiles 정보로 업데이트
                const updatedUserInfo = {
                  username:
                    profile.display_name || parsedUserInfo.username || "사용자",
                  provider:
                    profile.provider || parsedUserInfo.provider || "local",
                };
                setUserInfo(updatedUserInfo);
                localStorage.setItem(
                  "userInfo",
                  JSON.stringify(updatedUserInfo)
                );
              }
            } else if (session?.user) {
              // 세션이 있으면 세션 정보로 업데이트
              const sessionUserInfo = {
                username:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  session.user.email?.split("@")[0] ||
                  parsedUserInfo.username ||
                  "사용자",
                provider:
                  session.user.app_metadata?.provider ||
                  parsedUserInfo.provider ||
                  "local",
              };
              setUserInfo(sessionUserInfo);
              localStorage.setItem("userInfo", JSON.stringify(sessionUserInfo));
              if (session.user.id) {
                localStorage.setItem("userId", session.user.id);
              }
            }
          }
          return; // localStorage 기반 로그인 성공
        } catch (e) {
          console.error("Failed to parse user info", e);
        }
      }

      // 2. localStorage에 정보가 없으면 Supabase 세션 확인
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) {
        console.warn(
          "[MyPage] Supabase 클라이언트가 초기화되지 않았습니다. 환경변수를 확인하세요."
        );
        setIsLoggedIn(false);
        setUserInfo(null);
        setShowLogin(true);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Supabase 세션이 있으면 로그인 상태로 설정
      if (session?.user) {
        setIsLoggedIn(true);

        // localStorage에서 사용자 정보 확인
        if (savedUserInfo) {
          try {
            setUserInfo(JSON.parse(savedUserInfo));
          } catch (e) {
            console.error("Failed to parse user info", e);
            // 파싱 실패 시 세션에서 가져오기
            setUserInfo({
              username:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0] ||
                "사용자",
              provider: session.user.app_metadata?.provider || "google",
            });
          }
        } else {
          // 세션은 있지만 localStorage에 정보가 없으면 세션에서 가져오기
          setUserInfo({
            username:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "사용자",
            provider: session.user.app_metadata?.provider || "google",
          });
          // localStorage에도 저장
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userId", session.user.id);
          localStorage.setItem(
            "userInfo",
            JSON.stringify({
              username:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0] ||
                "사용자",
              provider: session.user.app_metadata?.provider || "google",
            })
          );
        }
        setShowLogin(false);
      } else {
        // 세션이 없고 localStorage에도 없으면 로그아웃 상태
        setIsLoggedIn(false);
        setUserInfo(null);
        setShowLogin(true);
        // localStorage도 정리
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("userId");
      }
    };

    checkAuth();

    // Auth 상태 변경 감지 (로그아웃 포함)
    const setupAuthListener = async () => {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) {
        console.warn(
          "[MyPage] Supabase 클라이언트가 초기화되지 않았습니다. 환경변수를 확인하세요."
        );
        return;
      }
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          if (event === "SIGNED_OUT" || !session) {
            // 로그아웃 감지
            setIsLoggedIn(false);
            setUserInfo(null);
            setShowLogin(true);
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userInfo");
          } else if (event === "SIGNED_IN" && session?.user) {
            // 로그인 감지
            setIsLoggedIn(true);
            setShowLogin(false);
          }
        }
      );
      subscriptionRef.current = subscription;
    };

    setupAuthListener();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
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

  const handleLogout = async () => {
    try {
      // Supabase 세션 로그아웃 (구글 로그인 포함)
      const { supabase } = await import("@/lib/supabase");

      // 먼저 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // 세션이 있으면 로그아웃
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Supabase 로그아웃 오류:", error);
        } else {
          console.log("Supabase 세션 로그아웃 성공");
        }
      }

      // localStorage 정리 (모든 로그인 관련 정보 제거)
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userId");
      localStorage.removeItem("autoLogin");

      // 상태 업데이트
      setIsLoggedIn(false);
      setUserInfo(null);
      setShowLogin(true);

      // 페이지 새로고침하여 완전히 로그아웃 상태로 만들기
      window.location.href = "/mypage";
    } catch (error) {
      console.error("로그아웃 처리 중 오류:", error);
      // 에러가 발생해도 로컬 상태는 정리
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userId");
      localStorage.removeItem("autoLogin");
      setIsLoggedIn(false);
      setUserInfo(null);
      setShowLogin(true);
      window.location.href = "/mypage";
    }
  };

  // 로그인하지 않았을 때는 로그인 화면만 표시
  if (!isLoggedIn) {
    return (
      <LoginModal
        isOpen={true}
        onClose={() => {
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

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
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
              <span className="text-lg font-bold text-primary-main">
                5,000 P
              </span>
              <FiChevronRight className="text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Content - All items in one list */}
      <div className="pb-20">
        <MainContent router={router} onLogout={handleLogout} />
      </div>

      <BottomNavigation />
    </div>
  );
}

// 통합된 메인 컨텐츠
function MainContent({
  router,
  onLogout,
}: {
  router: any;
  onLogout: () => void;
}) {
  const [favoriteCount, setFavoriteCount] = useState({
    procedures: 0,
    hospitals: 0,
  });
  const [scrapCount, setScrapCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [language, setLanguage] = useState("KR");
  const [currency, setCurrency] = useState("KRW");
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    sms: false,
  });

  useEffect(() => {
    // Supabase에서 찜한 시술 개수 로드
    const loadFavoriteCounts = async () => {
      try {
        const result = await getFavoriteProcedures();
        if (result.success && result.treatmentIds) {
          setFavoriteCount({
            procedures: result.treatmentIds.length,
            hospitals: 0, // 병원 찜하기는 추후 구현
          });
        }
      } catch (error) {
        console.error("찜한 시술 개수 로드 실패:", error);
        // 실패 시 localStorage에서 로드 (하위 호환성)
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const procedures = favorites.filter(
          (f: any) => f.type === "procedure" || typeof f === "number"
        ).length;
        setFavoriteCount({ procedures, hospitals: 0 });
      }
    };

    loadFavoriteCounts();

    // 스크랩 개수 로드 (로컬스토리지)
    const scraps = JSON.parse(localStorage.getItem("communityScraps") || "[]");
    setScrapCount(scraps.length);

    // 내가 쓴 후기 개수 로드 (로컬스토리지)
    const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    setReviewCount(reviews.length);

    // 설정 로드
    const savedLanguage = localStorage.getItem("language") || "KR";
    setLanguage(savedLanguage);

    const savedCurrency = localStorage.getItem("currency") || "KRW";
    setCurrency(savedCurrency);

    const savedNotifications = localStorage.getItem("notifications");
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  const handleLanguageChange = () => {
    const languages = ["KR", "EN", "JP", "CN"];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLanguage = languages[nextIndex];
    setLanguage(nextLanguage);
    localStorage.setItem("language", nextLanguage);
    window.dispatchEvent(new Event("languageChanged"));
  };

  const handleCurrencyChange = () => {
    const currencies = ["KRW", "USD", "JPY", "CNY"];
    const currentIndex = currencies.indexOf(currency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    const nextCurrency = currencies[nextIndex];
    setCurrency(nextCurrency);
    localStorage.setItem("currency", nextCurrency);
  };

  const handleNotificationToggle = (type: "push" | "email" | "sms") => {
    const updated = {
      ...notifications,
      [type]: !notifications[type],
    };
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* AI 리포트 & AI 피부분석 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <MenuItem
          icon={FiFileText}
          label="AI 리포트"
          onClick={() => {
            alert("AI 리포트 기능은 준비 중입니다.");
          }}
        />
        <MenuItem
          icon={FiActivity}
          label="AI 피부분석"
          onClick={() => {
            alert("AI 피부분석 기능은 준비 중입니다.");
          }}
          isButton
        />
      </div>

      {/* 찜목록 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">찜목록</h3>
        </div>
        <MenuItem
          icon={FiHeart}
          label="시술"
          badge={favoriteCount.procedures}
          onClick={() => router.push("/favorites?type=procedure")}
        />
        <MenuItem
          icon={FiHeart}
          label="병원"
          badge={favoriteCount.hospitals}
          onClick={() => router.push("/favorites?type=clinic")}
        />
        <MenuItem
          icon={FiBookmark}
          label="글 스크랩"
          badge={scrapCount}
          onClick={() => {
            alert("스크랩한 글 목록 기능은 준비 중입니다.");
          }}
        />
        <MenuItem
          icon={FiHeart}
          label="좋아요한 글"
          badge={0}
          onClick={async () => {
            try {
              const result = await getLikedPosts();
              if (result.success && result.likes) {
                const count = result.likes.length;
                alert(
                  `좋아요한 글: ${count}개\n\n목록 보기 기능은 준비 중입니다.`
                );
              } else {
                alert("좋아요한 글을 불러올 수 없습니다.");
              }
            } catch (error) {
              console.error("좋아요한 글 로드 실패:", error);
              alert("좋아요한 글을 불러오는 중 오류가 발생했습니다.");
            }
          }}
        />
      </div>

      {/* 내가 쓴 후기 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <MenuItem
          icon={FiEdit3}
          label="내가 쓴 후기"
          badge={reviewCount}
          onClick={() => {
            alert("내가 쓴 후기 목록 기능은 준비 중입니다.");
          }}
        />
        <MenuItem
          icon={FiEdit3}
          label="글 작성"
          onClick={() => {
            alert("글 작성 기능은 준비 중입니다.");
          }}
          isButton
        />
      </div>

      {/* 언어 / 통화 설정 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            언어 / 통화 설정
          </h3>
        </div>
        <MenuItem
          icon={FiGlobe}
          label="언어"
          value={
            language === "KR"
              ? "한국어"
              : language === "EN"
              ? "English"
              : language === "JP"
              ? "日本語"
              : "中文"
          }
          onClick={handleLanguageChange}
        />
        <MenuItem
          icon={FiDollarSign}
          label="통화"
          value={currency}
          onClick={handleCurrencyChange}
        />
      </div>

      {/* 알림 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">알림</h3>
        </div>
        <ToggleMenuItem
          icon={FiBell}
          label="푸시 알림"
          checked={notifications.push}
          onChange={() => handleNotificationToggle("push")}
        />
        <ToggleMenuItem
          icon={FiBell}
          label="이메일 알림"
          checked={notifications.email}
          onChange={() => handleNotificationToggle("email")}
        />
        <ToggleMenuItem
          icon={FiBell}
          label="SMS 알림"
          checked={notifications.sms}
          onChange={() => handleNotificationToggle("sms")}
        />
      </div>

      {/* 로그아웃 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <MenuItem
          icon={FiLogOut}
          label="로그아웃"
          onClick={async () => {
            if (confirm("정말 로그아웃 하시겠습니까?")) {
              await onLogout();
            }
          }}
          isButton
        />
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  badge,
  value,
  onClick,
  isButton = false,
}: {
  icon: any;
  label: string;
  badge?: number;
  value?: string;
  onClick?: () => void;
  isButton?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
        isButton ? "bg-primary-main/5" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`text-gray-600 text-xl ${
            isButton ? "text-primary-main" : ""
          }`}
        />
        <span
          className={`text-sm ${
            isButton ? "text-primary-main font-semibold" : "text-gray-900"
          }`}
        >
          {label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-primary-main text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-gray-500">{value}</span>}
        <FiChevronRight className="text-gray-400" />
      </div>
    </button>
  );
}

function ToggleMenuItem({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon className="text-gray-600 text-xl" />
        <span className="text-sm text-gray-900">{label}</span>
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary-main" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
