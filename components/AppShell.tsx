"use client";

import { useEffect, useState } from "react";
import { RankingDataProvider } from "@/contexts/RankingDataContext";
import { supabase } from "@/lib/supabase";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 700); // 0.7초 후 스플래시 종료

    return () => clearTimeout(timer);
  }, []);

  // 전역 세션 관리: 페이지 이동 시에도 세션 유지
  useEffect(() => {
    if (!supabase) return;

    // localStorage 사용 가능 여부 체크 (브라우저 호환성)
    const isLocalStorageAvailable = (): boolean => {
      try {
        if (typeof window === "undefined") return false;
        const test = "__localStorage_test__";
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        console.warn("⚠️ [AppShell] localStorage를 사용할 수 없습니다:", e);
        return false;
      }
    };

    // 1. 초기 세션 확인 및 localStorage 동기화
    const initializeSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ [AppShell] 세션 확인 에러:", error);
          return;
        }

        if (session?.user) {
          // 세션이 있으면 localStorage에 저장 (다른 페이지에서도 인식)
          const userId = session.user.id;
          const username =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "사용자";
          const provider = session.user.app_metadata?.provider || "local";

          if (isLocalStorageAvailable()) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userId", userId);
            localStorage.setItem(
              "userInfo",
              JSON.stringify({ username, provider })
            );
            console.log("✅ [AppShell] 세션 확인 및 localStorage 동기화 완료");
          } else {
            console.warn(
              "⚠️ [AppShell] localStorage를 사용할 수 없어 세션 정보를 저장하지 못했습니다."
            );
          }
        } else {
          // 세션이 없으면 localStorage도 정리
          if (isLocalStorageAvailable()) {
            const savedIsLoggedIn = localStorage.getItem("isLoggedIn");
            if (savedIsLoggedIn === "true") {
              // localStorage에는 있지만 세션이 없는 경우: 세션 복원 시도
              console.log(
                "⚠️ [AppShell] localStorage에는 로그인 정보가 있지만 세션이 없음"
              );
            }
          }
        }
      } catch (error) {
        console.error("❌ [AppShell] 세션 초기화 오류:", error);
      }
    };

    initializeSession();

    // 2. Auth 상태 변경 감지 (로그인/로그아웃 시 자동 동기화)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [AppShell] Auth 상태 변경:", event, session?.user?.email);

      // localStorage 사용 가능 여부 체크
      const canUseLocalStorage = isLocalStorageAvailable();

      if (event === "SIGNED_IN" && session?.user) {
        // 로그인 성공 시 localStorage 동기화
        const userId = session.user.id;
        const username =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "사용자";
        const provider = session.user.app_metadata?.provider || "local";

        if (canUseLocalStorage) {
          try {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userId", userId);
            localStorage.setItem(
              "userInfo",
              JSON.stringify({ username, provider })
            );
            console.log("✅ [AppShell] 로그인 성공 - localStorage 동기화 완료");
          } catch (e) {
            console.error("❌ [AppShell] localStorage 저장 실패:", e);
          }
        } else {
          console.warn(
            "⚠️ [AppShell] localStorage를 사용할 수 없어 로그인 정보를 저장하지 못했습니다."
          );
        }
      } else if (event === "SIGNED_OUT") {
        // 로그아웃 시 localStorage 정리
        if (canUseLocalStorage) {
          try {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userId");
            localStorage.removeItem("userInfo");
            console.log("✅ [AppShell] 로그아웃 - localStorage 정리 완료");
          } catch (e) {
            console.error("❌ [AppShell] localStorage 정리 실패:", e);
          }
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // 토큰 갱신 시에도 localStorage 업데이트
        if (canUseLocalStorage) {
          try {
            const userId = session.user.id;
            localStorage.setItem("userId", userId);
            console.log("✅ [AppShell] 토큰 갱신 - localStorage 업데이트 완료");
          } catch (e) {
            console.error("❌ [AppShell] localStorage 업데이트 실패:", e);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <RankingDataProvider>
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative">
        {children}
        {showSplash && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
            <img
              src="/beautrip-logo.png"
              alt="BeauTrip"
              className="w-40 h-auto object-contain"
            />
          </div>
        )}
      </div>
    </RankingDataProvider>
  );
}
