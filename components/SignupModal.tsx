"use client";

import { useState } from "react";
import { FiArrowLeft, FiEye, FiEyeOff, FiChevronDown } from "react-icons/fi";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import type { LanguageCode } from "@/contexts/LanguageContext";
import { logCrmEventToSheet } from "@/lib/crmLogger";
import { normalizeLang } from "@/lib/utils/normalizeLang";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess?: () => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  onSignupSuccess,
}: SignupModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("KR");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return false;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Supabase 클라이언트 초기화 확인
      console.log("🔍 Supabase 클라이언트 확인:", {
        supabase_exists: !!supabase,
        auth_exists: !!supabase.auth,
        environment_vars: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "설정됨" : "없음",
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "설정됨" : "없음",
        },
      });

      // 디버깅: preferred_language 값 확인
      console.log("preferred_language 보내는 값:", selectedLanguage);
      console.log("raw metadata:", {
        preferred_language: selectedLanguage,
      });

      // ✅ 네트워크 요청 시작 로그
      console.log("📤 회원가입 요청 시작:", {
        email: email.trim(),
        has_password: !!password,
        preferred_language: selectedLanguage,
        timestamp: new Date().toISOString(),
      });

      // 1. Supabase Auth로 회원가입 (이메일 인증 없이 바로 세션 생성)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            login_id: email.trim(), // 이메일을 login_id로도 저장
            preferred_language: selectedLanguage, // 선호 언어 저장 (KR, EN, JP, CN)
          },
          // 이메일 인증 없이 바로 로그인되도록 설정
        },
      });

      // ✅ Auth 응답 확인
      console.log("📥 Auth 응답:", {
        has_user: !!authData?.user,
        has_session: !!authData?.session,
        has_error: !!authError,
        error: authError
          ? {
              message: authError.message,
              status: authError.status,
              name: authError.name,
            }
          : null,
      });

      if (authError) {
        console.error("❌ Auth 오류:", authError);
        console.error(
          "❌ Auth 오류 전체 객체:",
          JSON.stringify(authError, null, 2)
        );
        // 더 친절한 에러 메시지 제공
        if (authError.message.includes("already registered")) {
          throw new Error("이미 등록된 이메일입니다.");
        } else if (authError.message.includes("Invalid email")) {
          throw new Error("올바른 이메일 형식을 입력해주세요.");
        } else if (authError.message.includes("Password")) {
          throw new Error("비밀번호가 너무 짧습니다.");
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("회원가입에 실패했습니다.");
      }

      // ✅ Auth 성공 후 user 객체 확인
      console.log("✅ Auth 사용자 생성 성공:", {
        id: authData.user.id,
        email: authData.user.email,
        raw_user_meta_data: authData.user.user_metadata,
        session_exists: !!authData.session,
      });

      // 2. user_profiles 테이블에 프로필 정보 저장
      // nickname: 이메일의 @ 앞부분 (트리거가 있으면 자동 채워지지만, 명시적으로 설정)
      // timezone과 locale 자동 감지
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale =
        navigator.language || (selectedLanguage === "KR" ? "ko-KR" : "en-US");

      const profileData = {
        user_id: authData.user.id, // Supabase Auth의 UUID
        provider: "local",
        login_id: email.trim(),
        nickname: email.trim().split("@")[0], // ✅ nickname 추가
        preferred_language: selectedLanguage, // 선택한 언어 저장
        timezone: timezone, // ✅ timezone 추가
        locale: locale, // ✅ locale 추가
      };

      // ✅ 프로필 저장 전 확인
      console.log("프로필 저장 시도:", profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from("user_profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        });

      // ✅ 프로필 저장 결과 확인
      console.log("프로필 저장 결과:", {
        data: profileResult,
        error: profileError,
        error_code: profileError?.code,
        error_message: profileError?.message,
        error_details: profileError?.details,
        error_hint: profileError?.hint,
      });

      if (profileError) {
        // 프로필 저장 실패 시 Auth 사용자도 삭제해야 할 수 있지만,
        // 일단 에러만 표시 (실제로는 트랜잭션 처리 필요)
        console.error(
          "프로필 저장 실패 - 전체 에러 객체:",
          JSON.stringify(profileError, null, 2)
        );
        // 더 자세한 에러 메시지 제공
        if (profileError.code === "23505") {
          throw new Error("이미 존재하는 사용자입니다.");
        } else if (profileError.code === "23503") {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
        }
        throw new Error(`프로필 저장에 실패했습니다: ${profileError.message}`);
      }

      // 2-1. CRM 로그: 회원가입 이벤트를 스프레드시트에 기록
      // CRM은 비동기/보조 기능이므로 실패해도 UX를 막지 않음
      try {
        // 언어 코드 정규화 (selectedLanguage는 이미 LanguageCode 타입이지만 normalizeLang으로 정규화)
        const lang = normalizeLang(selectedLanguage);
        
        await logCrmEventToSheet({
          event_type: "signup",
          email: email.trim(),
          nickname: email.trim().split("@")[0], // 이메일 @ 앞부분을 nickname으로 사용
          lang,
        });
      } catch (crmError) {
        // CRM 전송 실패해도 회원가입은 성공한 것으로 처리
        console.warn("CRM webhook failed", crmError);
      }

      // 3. 세션이 없으면 (이메일 인증 필요 시) 자동으로 로그인 시도
      if (!authData.session && authData.user) {
        // 이메일 인증 없이 바로 로그인 시도
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          console.warn(
            "자동 로그인 실패 (이메일 인증 필요할 수 있음):",
            signInError
          );
          // 이메일 인증이 필요한 경우에도 user_profiles는 이미 생성되었으므로
          // 사용자에게 안내만 하고 계속 진행
        } else if (signInData.session) {
          // 세션 생성 성공
          authData.session = signInData.session;
        }
      }

      // 4. 선택한 언어를 localStorage에 저장 (즉시 적용)
      if (typeof window !== "undefined") {
        localStorage.setItem("language", selectedLanguage);
        window.dispatchEvent(new Event("languageChanged"));
      }

      // 5. 세션이 있으면 자동 로그인 처리
      if (authData.session) {
        // user_profiles에서 사용자 정보 가져오기
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        // nickname 우선 사용 (백엔드 트리거로 자동 채워짐)
        const userInfo = {
          username:
            profile?.nickname ||
            profile?.display_name ||
            authData.user.email?.split("@")[0] ||
            "사용자",
          provider: profile?.provider || "local",
        };

        // localStorage에 사용자 정보 저장 (세션 유지를 위해 userId도 저장)
        if (typeof window !== "undefined") {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          localStorage.setItem("userId", authData.user.id); // userId 저장 (세션 유지용)
        }

        // 로그인 성공 콜백 호출 (SignupModal이 LoginModal의 onLoginSuccess를 받을 수 있도록)
        if (onSignupSuccess) {
          onSignupSuccess();
        }

        alert(t("auth.signupSuccess"));
        onClose();
      } else {
        // 세션이 없는 경우 (이메일 인증 필요)
        alert(t("auth.signupEmailVerification"));
        if (onSignupSuccess) {
          onSignupSuccess();
        } else {
          router.push("/mypage");
        }
        onClose();
      }
    } catch (err: any) {
      console.error("회원가입 오류:", err);
      // ✅ 전체 에러 객체 출력
      console.error("전체 에러 객체:", JSON.stringify(err, null, 2));
      console.error("에러 코드:", err.code);
      console.error("에러 메시지:", err.message);
      // 더 자세한 에러 정보 로깅
      if (err.details) {
        console.error("에러 상세:", err.details);
      }
      if (err.hint) {
        console.error("에러 힌트:", err.hint);
      }
      if (err.error_description) {
        console.error("에러 설명:", err.error_description);
      }
      // 사용자에게 보여줄 에러 메시지
      const errorMessage =
        err.message ||
        err.error_description ||
        "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white max-w-md mx-auto left-1/2 transform -translate-x-1/2 w-full flex flex-col">
      {/* Header with back button */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 z-10 flex items-center">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          disabled={isLoading}
        >
          <FiArrowLeft className="text-gray-700 text-xl" />
        </button>
        <h2 className="flex-1 text-center text-lg font-semibold text-gray-900">
          회원가입
        </h2>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder={t("placeholder.email")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("placeholder.passwordMin")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-xl" />
                  ) : (
                    <FiEye className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("placeholder.passwordConfirm")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="text-xl" />
                  ) : (
                    <FiEye className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            {/* 언어 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선호 언어
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent text-left flex items-center justify-between bg-white"
                >
                  <span className="text-gray-900">
                    {selectedLanguage === "KR"
                      ? "한국어"
                      : selectedLanguage === "EN"
                      ? "English"
                      : selectedLanguage === "JP"
                      ? "日本語"
                      : "中文"}
                  </span>
                  <FiChevronDown
                    className={`text-gray-500 transition-transform ${
                      isLanguageDropdownOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {/* 드롭다운 메뉴 */}
                {isLanguageDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsLanguageDropdownOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {(
                        [
                          { code: "KR" as LanguageCode, label: "한국어" },
                          { code: "EN" as LanguageCode, label: "English" },
                          { code: "JP" as LanguageCode, label: "日本語" },
                          { code: "CN" as LanguageCode, label: "中文" },
                        ] as const
                      ).map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedLanguage === lang.code
                              ? "bg-primary-main/5 text-primary-main font-medium"
                              : "text-gray-900"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full bg-primary-main hover:bg-primary-light text-white py-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "처리 중..." : "회원가입"}
            </button>

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  onClose();
                  router.push("/mypage");
                }}
                className="text-gray-600 text-sm hover:text-primary-main transition-colors"
                disabled={isLoading}
              >
                이미 계정이 있으신가요? 로그인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
