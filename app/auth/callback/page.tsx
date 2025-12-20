"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      const code = searchParams.get("code");
      const oauthError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // 디버깅: URL 파라미터 확인
      console.log("콜백 페이지 도달:", {
        code: code ? "있음" : "없음",
        oauthError,
        errorDescription,
        allParams: Object.fromEntries(searchParams.entries()),
        url: typeof window !== "undefined" ? window.location.href : "N/A",
      });

      // 에러가 있으면 에러 메시지와 함께 홈으로 리다이렉트
      if (oauthError) {
        console.error("OAuth 에러:", oauthError, errorDescription);
        const errorMessage = errorDescription || "로그인 중 오류가 발생했습니다.";
        if (isMounted) {
          setError(errorMessage);
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }
        return;
      }

      try {
        let session = null;

        // 코드가 있으면 코드를 세션으로 교환
        if (code) {
          console.log("코드 교환 시작...", code.substring(0, 20) + "...");
          
          // 코드를 세션으로 교환 (PKCE flow - code verifier는 sessionStorage에 저장되어 있음)
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Code exchange 에러:", exchangeError);
            if (isMounted) {
              setError(`로그인 처리 중 오류가 발생했습니다: ${exchangeError.message}`);
              setTimeout(() => {
                router.push("/");
              }, 5000);
            }
            return;
          }

          session = data.session;
        } else {
          // 코드가 없으면 기존 세션 확인 (Supabase가 자동으로 처리했을 수 있음)
          console.log("⚠️ 코드가 없음. getSession()으로 세션 확인 중...");
          const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("❌ 세션 확인 에러:", sessionError);
          }
          
          session = existingSession;
          
          if (session) {
            console.log("✅ getSession()으로 세션 확인됨:", session.user.email);
          } else {
            console.warn("⚠️ getSession()에서 세션을 찾을 수 없음");
          }
        }

        if (!session) {
          console.error("❌ 세션이 없습니다. 코드도 없고 기존 세션도 없음.");
          if (isMounted) {
            setError("로그인 세션을 생성할 수 없습니다. 다시 시도해주세요.");
            setTimeout(() => {
              router.push("/");
            }, 5000);
          }
          return;
        }

        console.log("✅ 세션 확인 성공:", {
          email: session.user.email,
          userId: session.user.id,
          provider: session.user.app_metadata?.provider,
        });

        // user_profiles 테이블에 프로필이 있는지 확인하고, 없으면 생성 (보험용 upsert)
        const user = session.user;
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          console.log("📝 [보험용] user_profiles가 없음. upsert 실행...");
          const provider = user.app_metadata?.provider || "google";

          // Google provider_user_id 가져오기
          let providerUserId: string | null = null;
          if (provider === "google") {
            const googleIdentity = user.identities?.find(
              (identity: any) => identity.provider === "google"
            );
            providerUserId =
              googleIdentity?.id ||
              user.user_metadata?.sub ||
              user.user_metadata?.provider_id ||
              null;
          }

          const displayName =
            user.user_metadata?.full_name || user.user_metadata?.name || null;
          const email = user.email || "";
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const locale = navigator.language || "ko-KR";

          const profileData: any = {
            user_id: user.id,
            provider: provider,
            display_name: displayName,
            nickname: displayName || (email ? email.split("@")[0] : null),
            avatar_url:
              user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            preferred_language: "KR",
            timezone: timezone,
            locale: locale,
          };

          if (provider === "google" && providerUserId) {
            profileData.provider_user_id = providerUserId;
          }

          const { error: profileError } = await supabase
            .from("user_profiles")
            .upsert(profileData, {
              onConflict: "user_id",
            });

          if (profileError) {
            console.error("❌ 프로필 생성 실패:", profileError);
            // 프로필 생성 실패해도 로그인은 계속 진행 (백엔드 트리거가 있을 수 있음)
          } else {
            console.log("✅ 프로필 생성 성공 (보험용 upsert 완료)");
          }
        } else {
          console.log("✅ user_profiles 이미 존재:", existingProfile.nickname || existingProfile.display_name);
        }

        // localStorage에 로그인 정보 저장 (MyPage에서 즉시 인식할 수 있도록)
        // 프로필이 새로 생성되었으면 다시 조회
        let finalProfile = existingProfile;
        if (!finalProfile) {
          const { data: newlyCreatedProfile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          finalProfile = newlyCreatedProfile;
        }

        const username =
          finalProfile?.nickname ||
          finalProfile?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "사용자";

        const userInfo = {
          username,
          provider: user.app_metadata?.provider || "google",
        };

        // localStorage에 로그인 정보 저장 (MyPage에서 즉시 인식할 수 있도록)
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        localStorage.setItem("userId", user.id);

        // ✅ 최종 세션 확인 (Supabase 세션이 제대로 저장되었는지)
        const { data: { session: finalSession }, error: finalSessionError } = await supabase.auth.getSession();
        
        if (finalSessionError) {
          console.error("❌ 최종 세션 확인 에러:", finalSessionError);
        }
        
        if (!finalSession) {
          console.error("❌ 최종 세션 확인 실패: 세션이 없습니다");
          if (isMounted) {
            setError("세션이 저장되지 않았습니다. 다시 시도해주세요.");
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }
          return;
        }

        console.log("✅ 로그인 성공 - 최종 세션 확인됨:", {
          userId: finalSession.user.id,
          email: finalSession.user.email,
          hasAccessToken: !!finalSession.access_token,
        });
        console.log("🔗 마이페이지로 리다이렉트 중...");

        // 세션이 성공적으로 생성되었으면 마이페이지로 리다이렉트
        if (isMounted) {
          // 약간의 딜레이를 두어 모든 저장 작업이 완료되도록 함
          setTimeout(() => {
            // router.replace 사용 (뒤로가기 방지 및 히스토리에 콜백 페이지 남기지 않음)
            router.replace("/mypage");
          }, 200);
        }
      } catch (err: any) {
        console.error("콜백 처리 중 오류:", err);
        if (isMounted) {
          setError(`로그인 처리 중 오류가 발생했습니다: ${err.message || "알 수 없는 오류"}`);
          setTimeout(() => {
            router.push("/");
          }, 5000);
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  // 에러 표시
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">잠시 후 자동으로 홈으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  // 로딩 중 표시
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

