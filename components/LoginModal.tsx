"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiGlobe, FiEye, FiEyeOff } from "react-icons/fi";
import Image from "next/image";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackLoginStart, trackLoginSuccess } from "@/lib/gtm";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userInfo?: { username: string; provider?: string }) => void;
}

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string; // 실제 아이콘 이미지 URL
  bgColor: string;
  textColor: string;
  hoverColor: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [showIdLogin, setShowIdLogin] = useState(false);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const languages = [
    { code: "KR" as const, name: t("header.language.korean"), flag: "🇰🇷" },
    { code: "EN" as const, name: t("header.language.english"), flag: "🇺🇸" },
    { code: "JP" as const, name: t("header.language.japanese"), flag: "🇯🇵" },
    { code: "CN" as const, name: t("header.language.chinese"), flag: "🇨🇳" },
  ];

  const [isLoading, setIsLoading] = useState(false);

  // Supabase Auth 상태 감지 (OAuth 콜백 처리)
  useEffect(() => {
    if (!isOpen) return; // 모달이 닫혀있으면 실행하지 않음
    if (!supabase) {
      console.warn(
        "[LoginModal] Supabase 클라이언트가 초기화되지 않았습니다. 환경변수를 확인하세요."
      );
      return;
    }

    let isProcessing = false; // 중복 처리 방지

    // Auth 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // SIGNED_IN 이벤트이고, 모달이 열려있고, 아직 처리 중이 아닐 때만 실행
        if (event === "SIGNED_IN" && session?.user && isOpen && !isProcessing) {
          isProcessing = true;
          try {
            await handleOAuthSuccess(session.user);
          } finally {
            // 약간의 딜레이 후 플래그 리셋 (같은 세션으로 재호출 방지)
            setTimeout(() => {
              isProcessing = false;
            }, 1000);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen]); // isOpen이 변경될 때마다 재구독

  // OAuth 로그인 성공 후 처리
  const handleOAuthSuccess = async (user: any) => {
    // 이미 처리 중이거나 모달이 닫혀있으면 실행하지 않음
    if (isLoading || !isOpen) {
      return;
    }

    try {
      setIsLoading(true);

      // user_profiles 테이블에 데이터가 있는지 확인
      const { data: existingProfile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // maybeSingle: 없으면 null 반환, 에러 없음

      // 프로필이 이미 존재하면 바로 로그인 성공 처리
      if (existingProfile) {
        console.log("기존 프로필 발견:", existingProfile);
        const userInfo = {
          username:
            existingProfile.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "사용자",
          provider: existingProfile.provider || "google",
        };

        onLoginSuccess(userInfo);
        onClose();
        return;
      }

      // 새 사용자: user_profiles에 데이터 저장
      const provider = user.app_metadata?.provider || "google";

      // Google provider_user_id 가져오기
      // Supabase Auth의 identities 배열에서 Google identity 찾기
      let providerUserId: string | null = null;
      if (provider === "google") {
        // identities 배열에서 Google identity 찾기
        const googleIdentity = user.identities?.find(
          (identity: any) => identity.provider === "google"
        );
        providerUserId =
          googleIdentity?.id ||
          user.user_metadata?.sub ||
          user.user_metadata?.provider_id ||
          null;

        // provider가 'google'이면 provider_user_id는 필수
        if (!providerUserId) {
          console.error("Google provider_user_id를 찾을 수 없습니다.", {
            identities: user.identities,
            user_metadata: user.user_metadata,
          });
          throw new Error("Google 로그인 정보를 가져올 수 없습니다.");
        }
      }

      // display_name과 nickname 설정
      const displayName =
        user.user_metadata?.full_name || user.user_metadata?.name || null;
      const email = user.email || "";

      // timezone과 locale 자동 감지
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = navigator.language || "ko-KR";

      const profileData: any = {
        user_id: user.id,
        provider: provider,
        display_name: displayName,
        nickname: displayName || (email ? email.split("@")[0] : null), // ✅ nickname 추가 (display_name 우선, 없으면 이메일 앞부분)
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        preferred_language: "KR",
        timezone: timezone, // ✅ timezone 추가
        locale: locale, // ✅ locale 추가
      };

      // provider가 'google'일 때만 provider_user_id 추가
      if (provider === "google" && providerUserId) {
        profileData.provider_user_id = providerUserId;
      }

      // upsert 사용 (기존 프로필이 있으면 업데이트, 없으면 생성)
      const { data: insertedProfile, error: profileError } = await supabase
        .from("user_profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        })
        .select()
        .single();

      if (profileError) {
        // 에러 상세 정보 로깅
        console.error("프로필 저장 실패:", {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });

        // 중복 에러 체크 (다양한 에러 코드 확인)
        const isDuplicateError =
          profileError.code === "23505" || // unique violation
          profileError.code === "PGRST116" || // no rows returned (이상하지만)
          profileError.message?.includes("duplicate") ||
          profileError.message?.includes("unique") ||
          profileError.message?.includes("already exists");

        if (isDuplicateError) {
          // 중복 에러인 경우: 다시 한 번 조회해서 기존 프로필 사용
          console.log("중복 에러 감지, 기존 프로필 조회 중...");
          const { data: retryProfile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (retryProfile) {
            // 기존 프로필이 있으면 로그인 성공 처리
            const userInfo = {
              username:
                retryProfile.display_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "사용자",
              provider: retryProfile.provider || "google",
            };

            onLoginSuccess(userInfo);
            onClose();
            return;
          }
        }

        // 다른 에러인 경우에만 throw
        throw new Error(
          profileError.message ||
            "프로필 저장에 실패했습니다. 다시 시도해주세요."
        );
      }

      // 프로필 저장 성공
      console.log("프로필 저장 성공:", insertedProfile);

      // 로그인 성공 처리
      // nickname 우선 사용 (백엔드 트리거로 자동 채워짐)
      const userInfo = {
        username:
          insertedProfile?.nickname ||
          insertedProfile?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "사용자",
        provider: insertedProfile?.provider || provider,
      };

      onLoginSuccess(userInfo);
      onClose();
    } catch (error: any) {
      console.error("OAuth 로그인 처리 오류:", error);
      alert(
        error.message ||
          "로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // 기본 화면에 보여줄 버튼 (구글만 활성화)
  const mainProviders: SocialProvider[] = [
    // {
    //   id: "line",
    //   name: "라인으로 시작하기",
    //   icon: "💚",
    //   iconUrl:
    //     "https://i.namu.wiki/i/mU6yRnXSPflsykrHcGNLFTeACBRlt_SYyA-8sGMwbEPukr5mXlRER5wMyQ1kkr8H4rOplYTxVGLKsKxkbn67jXtRfU62nphxOc7hJEWssLJk9lQA8hWgSaE5R3TnMpsq8UXkGXOEl8FcsrxW_GE0zg.svg",
    //   bgColor: "bg-green-500",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-green-600",
    // },
    // {
    //   id: "wechat",
    //   name: "위챗으로 시작하기",
    //   icon: "💬",
    //   iconUrl:
    //     "https://play-lh.googleusercontent.com/QbSSiRcodmWx6HlezOtNu3vmZeuFqkQZQQO5Y2-Zg_jBRm-mXjhlXX5yFj8iphfqzQ=w240-h480-rw",
    //   bgColor: "bg-green-600",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-green-700",
    // },
    {
      id: "google",
      name: t("auth.loginWithGoogle"),
      icon: "🔍",
      iconUrl:
        "https://noticon-static.tammolo.com/dgggcrkxq/image/upload/v1566791548/noticon/zxi0bnl5h66bszdpjaet.jpg",
      bgColor: "bg-white border-2 border-gray-200",
      textColor: "text-gray-900",
      hoverColor: "hover:bg-gray-50",
    },
  ];

  // "다른 방법으로 시작하기" 클릭 시 보여줄 나머지 소셜 로그인들 (구글 제외 모두 주석처리)
  const otherProviders: SocialProvider[] = [
    // {
    //   id: "kakao",
    //   name: "카카오로 시작하기",
    //   icon: "💬",
    //   iconUrl:
    //     "https://i.namu.wiki/i/rfSfq1PXHlLFftR7t2sdPghtMZC40CnXCX5CSJ8Y08AQyFk593III3tyqySD0MQmvpACZkLxAoIlxcN0tzUaicvKMsYQFLciXX9TIULCNAAZ2W85RohnkhEf32u_S8D-bcvx3mUwq8Qk9G9dpl7lsQ.svg",
    //   bgColor: "bg-yellow-400",
    //   textColor: "text-gray-900",
    //   hoverColor: "hover:bg-yellow-500",
    // },
    // {
    //   id: "line",
    //   name: "라인으로 시작하기",
    //   icon: "💚",
    //   iconUrl:
    //     "https://i.namu.wiki/i/mU6yRnXSPflsykrHcGNLFTeACBRlt_SYyA-8sGMwbEPukr5mXlRER5wMyQ1kkr8H4rOplYTxVGLKsKxkbn67jXtRfU62nphxOc7hJEWssLJk9lQA8hWgSaE5R3TnMpsq8UXkGXOEl8FcsrxW_GE0zg.svg",
    //   bgColor: "bg-green-500",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-green-600",
    // },
    // {
    //   id: "tiktok",
    //   name: "틱톡으로 시작하기",
    //   icon: "🎵",
    //   iconUrl:
    //     "https://i.namu.wiki/i/Nbsu5mYaDa69cyzg3u1AOKe1aehV2_ERa5gUhtfhXLKi5Xfd7qNK_8MtyMITAitHYkB0AC7mOERlBPqTBwSN0ymI4sT89Ww80mk_4dHg3muqVvAqEmoQXLDvxy32IBR7SDLDMbGBwLa5RTioD7UtHA.svg",
    //   bgColor: "bg-black",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-gray-900",
    // },
    // {
    //   id: "wechat",
    //   name: "위챗으로 시작하기",
    //   icon: "💬",
    //   iconUrl:
    //     "https://play-lh.googleusercontent.com/QbSSiRcodmWx6HlezOtNu3vmZeuFqkQZQQO5Y2-Zg_jBRm-mXjhlXX5yFj8iphfqzQ=w240-h480-rw",
    //   bgColor: "bg-green-600",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-green-700",
    // },
    // {
    //   id: "x",
    //   name: "X로 시작하기",
    //   icon: "✖️",
    //   iconUrl:
    //     "https://i.namu.wiki/i/gNfFK8soCFFM_s8auMRPPWzCEq57AiVdK-IMZDiCOLp72PeTqE119R_sSwFSG1ki_GS7SlWonE_xbKWHOzuxB6ZvvWoGdO9m1v_Ru-uiUXZw4-ti9UZ6VkUm0eIpIk_xk5YXJbAmZYOxWcceqGpbtw.svg",
    //   bgColor: "bg-black",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-gray-900",
    // },
    // {
    //   id: "google",
    //   name: "구글로 시작하기",
    //   icon: "🔍",
    //   iconUrl:
    //     "https://noticon-static.tammolo.com/dgggcrkxq/image/upload/v1566791548/noticon/zxi0bnl5h66bszdpjaet.jpg",
    //   bgColor: "bg-white border-2 border-gray-200",
    //   textColor: "text-gray-900",
    //   hoverColor: "hover:bg-gray-50",
    // },
    // {
    //   id: "apple",
    //   name: "APPLE로 시작하기",
    //   icon: "🍎",
    //   iconUrl:
    //     "https://i.namu.wiki/i/9tvgJgp73dHAbSbSYOFhw5QONVip7iMZk1EpkDIzrCPEJUHGL-0R78vZZJNdeXaX_31-UI8Qp35cMfWZoQrk2PpWwvornonrXvJNmmBPOcDa99Bu5mpTyu2S6VzRCg3EqQnb_5MtV31Qs4VqoR-WSw.svg",
    //   bgColor: "bg-black",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-gray-900",
    // },
    // {
    //   id: "facebook",
    //   name: "페이스북으로 시작하기",
    //   icon: "👤",
    //   iconUrl:
    //     "https://i.namu.wiki/i/gXdLw7t_gTL7CSyitlqoRJBFHeoX7tdCTZPymqNFs0b2W7dZO66PPE-qrojJkT58Zx_lUH0CLnhZneO5Bn9lpA.svg",
    //   bgColor: "bg-blue-600",
    //   textColor: "text-white",
    //   hoverColor: "hover:bg-blue-700",
    // },
  ];

  const handleSocialLogin = async (provider: string) => {
    // GTM: 로그인 시작 이벤트
    trackLoginStart(provider === "google" ? "google" : "local");

    setIsLoading(true);

    try {
      if (provider === "google") {
        // 리다이렉트 URL 설정 (window.location.origin 사용으로 포트 변경에도 안전)
        const redirectUrl = `${window.location.origin}/auth/callback`;
        console.log("🔗 [Google OAuth] 리다이렉트 URL:", redirectUrl);
        console.log("🔗 [Google OAuth] 현재 origin:", window.location.origin);

        // Supabase Google OAuth 로그인 (queryParams 제거 - Supabase가 자동 처리)
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            // queryParams 제거: Supabase가 자동으로 처리하며, 잘못된 파라미터가 400 에러를 일으킬 수 있음
          },
        });

        if (error) {
          console.error("❌ [Google OAuth] Supabase 요청 에러:", error);
          throw error;
        }

        // ✅ 성공 확인: 첫 이동 URL이 Supabase URL이어야 함
        // 정상: https://[PROJECT_REF].supabase.co/auth/v1/authorize?provider=google...
        // 비정상: accounts.google.com/signin/oauth/consent?... (직접 Google로 보내는 경우)
        if (data?.url) {
          console.log("✅ [Google OAuth] 리다이렉트 URL 생성됨:", data.url);
          const isSupabaseUrl = data.url.includes(
            ".supabase.co/auth/v1/authorize"
          );
          if (isSupabaseUrl) {
            console.log("✅ [Google OAuth] 정상: Supabase URL로 이동합니다");
          } else {
            console.warn(
              "⚠️ [Google OAuth] 경고: Supabase URL이 아닙니다. 확인 필요:",
              data.url
            );
          }
        }

        // OAuth는 리다이렉트되므로 여기서는 로딩만 표시
        // 실제 로그인 처리는 /auth/callback 페이지에서 처리됨
      } else {
        // 다른 소셜 로그인은 추후 구현
        console.log(`${provider} 로그인은 아직 구현되지 않았습니다.`);
        alert(`${provider} 로그인은 아직 구현되지 않았습니다.`);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error(`${provider} 로그인 오류:`, error);
      alert(`${provider} 로그인 중 오류가 발생했습니다: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleIdLogin = async () => {
    if (!userId || !password) {
      alert(t("auth.enterEmailPassword"));
      return;
    }

    // GTM: 로그인 시작 이벤트
    trackLoginStart("local");

    setIsLoading(true);

    try {
      // 1. 먼저 user_profiles 테이블에서 이메일로 사용자 확인
      const { data: profileByEmail, error: profileSearchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("login_id", userId.trim())
        .maybeSingle();

      if (profileSearchError) {
        console.error("user_profiles 조회 오류:", profileSearchError);
      }

      // 2. Supabase 이메일/비밀번호 로그인 시도
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: userId.trim(), // 이메일을 아이디로 사용
          password,
        });

      // 3. 로그인 에러 처리: user_profiles 테이블 확인 후 우회 처리
      if (authError) {
        // user_profiles에 사용자가 있는 경우
        if (profileByEmail) {
          // 이메일 인증 에러인 경우: user_profiles 기반으로 로그인 허용
          if (authError.message.includes("Email not confirmed")) {
            console.log(
              "이메일 인증 미완료이지만 user_profiles에 사용자 존재, 로그인 허용"
            );

            // user_profiles 정보로 로그인 처리
            const userInfo = {
              username:
                profileByEmail.display_name ||
                userId.trim().split("@")[0] ||
                "사용자",
              provider: profileByEmail.provider || "local",
            };

            // localStorage에 사용자 정보 저장
            if (typeof window !== "undefined") {
              localStorage.setItem("isLoggedIn", "true");
              localStorage.setItem("userInfo", JSON.stringify(userInfo));
              localStorage.setItem("userId", profileByEmail.user_id); // user_id 저장
            }

            // 자동 로그인 설정
            if (autoLogin && typeof window !== "undefined") {
              localStorage.setItem("autoLogin", "true");
            }

            // GTM: 로그인 성공 이벤트
            trackLoginSuccess("local", profileByEmail.user_id);

            onLoginSuccess(userInfo);
            onClose();
            return;
          }

          // Invalid login credentials 에러인 경우: 비밀번호가 틀렸거나 사용자가 없음
          // 보안상 비밀번호 검증은 필수이므로 로그인 허용하지 않음
          if (authError.message.includes("Invalid login credentials")) {
            // user_profiles에 사용자가 있어도 비밀번호가 틀렸으면 로그인 거부
            alert(t("auth.invalidCredentials"));
            setIsLoading(false);
            return;
          }
        }

        // user_profiles에 사용자가 없는 경우에만 에러 표시
        if (authError.message.includes("Invalid login credentials")) {
          alert(t("auth.invalidCredentials"));
          setIsLoading(false);
          return;
        } else if (authError.message.includes("Email not confirmed")) {
          alert(t("auth.emailNotVerified"));
          setIsLoading(false);
          return;
        }
        // 예상치 못한 에러인 경우에만 콘솔에 표시
        console.error("로그인 오류:", authError);
        alert(t("auth.loginError"));
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        alert(t("auth.loginFailed"));
        setIsLoading(false);
        return;
      }

      // 4. user_profiles에서 사용자 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("프로필 조회 실패:", profileError);
        // 프로필이 없어도 로그인은 성공 처리
      }

      // 5. 자동 로그인 설정 (localStorage)
      if (autoLogin && typeof window !== "undefined") {
        localStorage.setItem("autoLogin", "true");
      }

      // 6. 로그인 성공 처리
      const userInfo = {
        username:
          profile?.display_name ||
          authData.user.user_metadata?.full_name ||
          authData.user.user_metadata?.name ||
          authData.user.email?.split("@")[0] ||
          "사용자",
        provider: profile?.provider || "local",
      };

      // localStorage에 사용자 정보 저장
      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        localStorage.setItem("userId", authData.user.id); // user_id 저장 (항상 저장)
      }

      // GTM: 로그인 성공 이벤트
      trackLoginSuccess("local", authData.user.id);

      onLoginSuccess(userInfo);
      onClose();
    } catch (error: any) {
      // 예상치 못한 에러만 콘솔에 표시 (사용자 입력 오류는 이미 처리됨)
      console.error("예상치 못한 로그인 오류:", error);
      alert(
        error.message || "로그인 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white max-w-md mx-auto left-1/2 transform -translate-x-1/2 w-full md:max-w-md flex flex-col">
      {/* Header with back button */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 z-10 flex items-center">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiArrowLeft className="text-gray-700 text-xl" />
        </button>
        <h2 className="flex-1 text-center text-lg font-semibold text-gray-900">
          {t("auth.loginTitle")}
        </h2>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content - 세로 중앙 정렬 */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full px-6 py-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/beautrip-logo.png"
                alt="BeauTrip"
                width={180}
                height={60}
                className="object-contain"
              />
            </div>
          </div>

          {/* 연동 계정으로 시작하기 버튼 리스트 */}
          {!showIdLogin && (
            <>
              <div className="space-y-3 mb-6">
                {mainProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSocialLogin(provider.id)}
                    disabled={isLoading}
                    className={`w-full ${provider.bgColor} ${provider.hoverColor} ${provider.textColor} py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {provider.iconUrl ? (
                      provider.iconUrl.endsWith(".svg") ? (
                        <img
                          src={provider.iconUrl}
                          alt={provider.name}
                          className="w-6 h-6 object-contain flex-shrink-0"
                        />
                      ) : (
                        <Image
                          src={provider.iconUrl}
                          alt={provider.name}
                          width={24}
                          height={24}
                          className="object-contain flex-shrink-0"
                          unoptimized
                        />
                      )
                    ) : (
                      <span className="text-xl">{provider.icon}</span>
                    )}
                    <span>{provider.name}</span>
                  </button>
                ))}

                {/* 아이디로 로그인 버튼 (구글과 같은 사이즈, 아이콘 없음) */}
                <button
                  onClick={() => setShowIdLogin(true)}
                  disabled={isLoading}
                  className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-900 py-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("auth.loginWithId")}
                </button>
              </div>

              {/* 회원가입 */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    router.push("/signup");
                  }}
                  className="text-gray-600 text-sm hover:text-primary-main transition-colors"
                >
                  {t("auth.signup")}
                </button>
              </div>
            </>
          )}

          {/* ID 로그인 폼 */}
          {showIdLogin && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={t("placeholder.email")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("placeholder.password")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent pr-12"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleIdLogin();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-xl" />
                    ) : (
                      <FiEye className="text-xl" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoLogin"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                  className="w-4 h-4 text-primary-main border-gray-300 rounded focus:ring-primary-main"
                />
                <label
                  htmlFor="autoLogin"
                  className="ml-2 text-sm text-gray-700"
                >
                  {t("auth.autoLogin")}
                </label>
              </div>

              <button
                onClick={handleIdLogin}
                disabled={isLoading}
                className="w-full bg-primary-main hover:bg-primary-light text-white py-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t("auth.loggingIn") : t("auth.login")}
              </button>

              <button
                onClick={() => setShowIdLogin(false)}
                className="w-full text-gray-600 text-sm hover:text-primary-main transition-colors py-2"
              >
                {t("auth.otherLoginMethods")}
              </button>

              {/* 회원가입 */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    router.push("/signup");
                  }}
                  className="text-gray-600 text-sm hover:text-primary-main transition-colors"
                >
                  {t("auth.signup")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 다른 로그인 방법 바텀시트 */}
      {showOtherMethods && !showIdLogin && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 bg-black/50 z-[110] transition-opacity"
            onClick={() => setShowOtherMethods(false)}
          />

          {/* 바텀시트 */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-[120] shadow-2xl transition-transform duration-300 ease-out">
            <div className="px-6 py-6">
              {/* 소셜 로그인 아이콘 버튼들 (원형) - 나머지 5가지 */}
              <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                {otherProviders
                  .filter((p) => !mainProviders.some((mp) => mp.id === p.id))
                  .map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        handleSocialLogin(provider.id);
                        setShowOtherMethods(false);
                      }}
                      className={`w-14 h-14 rounded-full ${provider.bgColor} ${provider.hoverColor} flex items-center justify-center transition-colors`}
                    >
                      {provider.iconUrl ? (
                        provider.iconUrl.endsWith(".svg") ? (
                          <img
                            src={provider.iconUrl}
                            alt={provider.name}
                            className="w-6 h-6 object-contain flex-shrink-0"
                          />
                        ) : (
                          <Image
                            src={provider.iconUrl}
                            alt={provider.name}
                            width={24}
                            height={24}
                            className="object-contain flex-shrink-0"
                            unoptimized
                          />
                        )
                      ) : (
                        <span className="text-xl">{provider.icon}</span>
                      )}
                    </button>
                  ))}
              </div>

              {/* 아이디로 로그인 버튼 */}
              <button
                onClick={() => {
                  setShowOtherMethods(false);
                  setShowIdLogin(true);
                }}
                className="w-full bg-white border border-gray-300 rounded-xl text-gray-700 py-3 hover:bg-gray-50 transition-colors text-sm"
              >
                {t("auth.loginWithId")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Language Selector - Fixed at bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="bg-primary-main text-white p-3 rounded-full shadow-lg hover:bg-primary-light transition-colors"
          >
            <FiGlobe className="text-xl" />
          </button>
          {isLanguageOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsLanguageOpen(false)}
              />
              <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      language === lang.code ? "bg-primary-main/10" : ""
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm text-gray-700">{lang.name}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-primary-main">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
