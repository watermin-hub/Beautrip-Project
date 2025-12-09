"use client";

import { useState } from "react";
import { FiArrowLeft, FiGlobe, FiEye, FiEyeOff } from "react-icons/fi";
import Image from "next/image";

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
  const [showIdLogin, setShowIdLogin] = useState(false);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const languages = [
    { code: "KR", name: "한국어", flag: "🇰🇷" },
    { code: "EN", name: "English", flag: "🇺🇸" },
    { code: "JP", name: "日本語", flag: "🇯🇵" },
    { code: "CN", name: "中文", flag: "🇨🇳" },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  if (!isOpen) return null;

  // 기본 화면에 보여줄 3개 버튼
  const mainProviders: SocialProvider[] = [
    {
      id: "line",
      name: "라인으로 시작하기",
      icon: "💚",
      iconUrl:
        "https://i.namu.wiki/i/kyDav6gHAV_U2HT8cNbKPAFRq_eVp9ejfpLUF6EuASKIdxrnS46Oyp-yTVcMxVizhNtv1sbAqFvPCqL6ZeeJ6gMKZEKYf539mxj2O6M0ualyJigebq1sX3TJK-MRJTjRGD3KxrXMDlTye-Jlyj_LZQ.svg",
      bgColor: "bg-green-500",
      textColor: "text-white",
      hoverColor: "hover:bg-green-600",
    },
    {
      id: "wechat",
      name: "위챗으로 시작하기",
      icon: "💬",
      iconUrl:
        "https://play-lh.googleusercontent.com/QbSSiRcodmWx6HlezOtNu3vmZeuFqkQZQQO5Y2-Zg_jBRm-mXjhlXX5yFj8iphfqzQ=w240-h480-rw",
      bgColor: "bg-green-600",
      textColor: "text-white",
      hoverColor: "hover:bg-green-700",
    },
    {
      id: "google",
      name: "구글로 시작하기",
      icon: "🔍",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/40px-Google_%22G%22_logo.svg.png",
      bgColor: "bg-white border-2 border-gray-200",
      textColor: "text-gray-900",
      hoverColor: "hover:bg-gray-50",
    },
  ];

  // "다른 방법으로 시작하기" 클릭 시 보여줄 나머지 5가지
  const otherProviders: SocialProvider[] = [
    {
      id: "kakao",
      name: "카카오로 시작하기",
      icon: "💬",
      iconUrl:
        "https://i.namu.wiki/i/rfSfq1PXHlLFftR7t2sdPghtMZC40CnXCX5CSJ8Y08AQyFk593III3tyqySD0MQmvpACZkLxAoIlxcN0tzUaicvKMsYQFLciXX9TIULCNAAZ2W85RohnkhEf32u_S8D-bcvx3mUwq8Qk9G9dpl7lsQ.svg",
      bgColor: "bg-yellow-400",
      textColor: "text-gray-900",
      hoverColor: "hover:bg-yellow-500",
    },
    {
      id: "line",
      name: "라인으로 시작하기",
      icon: "💚",
      iconUrl:
        "https://i.namu.wiki/i/kyDav6gHAV_U2HT8cNbKPAFRq_eVp9ejfpLUF6EuASKIdxrnS46Oyp-yTVcMxVizhNtv1sbAqFvPCqL6ZeeJ6gMKZEKYf539mxj2O6M0ualyJigebq1sX3TJK-MRJTjRGD3KxrXMDlTye-Jlyj_LZQ.svg",
      bgColor: "bg-green-500",
      textColor: "text-white",
      hoverColor: "hover:bg-green-600",
    },
    {
      id: "tiktok",
      name: "틱톡으로 시작하기",
      icon: "🎵",
      iconUrl:
        "https://i.namu.wiki/i/Nbsu5mYaDa69cyzg3u1AOKe1aehV2_ERa5gUhtfhXLKi5Xfd7qNK_8MtyMITAitHYkB0AC7mOERlBPqTBwSN0ymI4sT89Ww80mk_4dHg3muqVvAqEmoQXLDvxy32IBR7SDLDMbGBwLa5RTioD7UtHA.svg",
      bgColor: "bg-black",
      textColor: "text-white",
      hoverColor: "hover:bg-gray-900",
    },
    {
      id: "wechat",
      name: "위챗으로 시작하기",
      icon: "💬",
      iconUrl:
        "https://play-lh.googleusercontent.com/QbSSiRcodmWx6HlezOtNu3vmZeuFqkQZQQO5Y2-Zg_jBRm-mXjhlXX5yFj8iphfqzQ=w240-h480-rw",
      bgColor: "bg-green-600",
      textColor: "text-white",
      hoverColor: "hover:bg-green-700",
    },
    {
      id: "x",
      name: "X로 시작하기",
      icon: "✖️",
      iconUrl:
        "https://i.namu.wiki/i/gNfFK8soCFFM_s8auMRPPWzCEq57AiVdK-IMZDiCOLp72PeTqE119R_sSwFSG1ki_GS7SlWonE_xbKWHOzuxB6ZvvWoGdO9m1v_Ru-uiUXZw4-ti9UZ6VkUm0eIpIk_xk5YXJbAmZYOxWcceqGpbtw.svg",
      bgColor: "bg-black",
      textColor: "text-white",
      hoverColor: "hover:bg-gray-900",
    },
    {
      id: "google",
      name: "구글로 시작하기",
      icon: "🔍",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/40px-Google_%22G%22_logo.svg.png",
      bgColor: "bg-white border-2 border-gray-200",
      textColor: "text-gray-900",
      hoverColor: "hover:bg-gray-50",
    },
    {
      id: "apple",
      name: "APPLE로 시작하기",
      icon: "🍎",
      iconUrl:
        "https://i.namu.wiki/i/9tvgJgp73dHAbSbSYOFhw5QONVip7iMZk1EpkDIzrCPEJUHGL-0R78vZZJNdeXaX_31-UI8Qp35cMfWZoQrk2PpWwvornonrXvJNmmBPOcDa99Bu5mpTyu2S6VzRCg3EqQnb_5MtV31Qs4VqoR-WSw.svg",
      bgColor: "bg-black",
      textColor: "text-white",
      hoverColor: "hover:bg-gray-900",
    },
    {
      id: "facebook",
      name: "페이스북으로 시작하기",
      icon: "👤",
      iconUrl:
        "https://i.namu.wiki/i/gXdLw7t_gTL7CSyitlqoRJBFHeoX7tdCTZPymqNFs0b2W7dZO66PPE-qrojJkT58Zx_lUH0CLnhZneO5Bn9lpA.svg",
      bgColor: "bg-blue-600",
      textColor: "text-white",
      hoverColor: "hover:bg-blue-700",
    },
  ];

  const handleSocialLogin = (provider: string) => {
    // TODO: 실제 소셜 로그인 API 연동
    console.log(`Login with ${provider}`);
    // 임시로 사용자 정보 생성 (실제로는 API에서 받아옴)
    const mockUserInfo = {
      username: provider === "kakao" ? "카카오사용자" : `${provider}사용자`,
      provider,
    };
    onLoginSuccess(mockUserInfo);
  };

  const handleIdLogin = () => {
    if (!userId || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    // TODO: 실제 ID 로그인 API 연동
    console.log("ID Login:", { userId, password, autoLogin });
    const mockUserInfo = {
      username: userId,
      provider: "id",
    };
    onLoginSuccess(mockUserInfo);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white max-w-md mx-auto left-1/2 transform -translate-x-1/2 w-full flex flex-col">
      {/* Header with back button */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 z-10 flex items-center">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiArrowLeft className="text-gray-700 text-xl" />
        </button>
        <h2 className="flex-1 text-center text-lg font-semibold text-gray-900">
          로그인
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
                    className={`w-full ${provider.bgColor} ${provider.hoverColor} ${provider.textColor} py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3`}
                  >
                    {provider.iconUrl ? (
                      <Image
                        src={provider.iconUrl}
                        alt={provider.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-xl">{provider.icon}</span>
                    )}
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>

              {/* 아이디 또는 다른 방법으로 로그인 */}
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowOtherMethods(true)}
                  className="text-gray-600 text-sm hover:text-primary-main transition-colors underline"
                >
                  아이디 또는 다른 방법으로 로그인
                </button>
              </div>

              {/* 계정 찾기/문의하기 */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
                <button className="text-gray-600 text-sm hover:text-primary-main transition-colors">
                  회원가입
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-600 text-sm hover:text-primary-main transition-colors">
                  아이디 찾기
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-600 text-sm hover:text-primary-main transition-colors">
                  비밀번호 찾기
                </button>
              </div>
            </>
          )}

          {/* ID 로그인 폼 */}
          {showIdLogin && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이디
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent pr-12"
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
                  자동로그인
                </label>
              </div>

              <button
                onClick={handleIdLogin}
                className="w-full bg-primary-main hover:bg-primary-light text-white py-4 rounded-xl font-semibold transition-colors"
              >
                로그인
              </button>

              <button
                onClick={() => setShowIdLogin(false)}
                className="w-full text-gray-600 text-sm hover:text-primary-main transition-colors py-2"
              >
                다른 로그인 방법
              </button>

              {/* 계정 찾기/문의하기 */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
                <button className="text-gray-600 text-sm hover:text-primary-main transition-colors">
                  회원가입
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-600 text-sm hover:text-primary-main transition-colors">
                  아이디 찾기
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-600 text-sm hover:text-primary-main transition-colors">
                  비밀번호 찾기
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
                        <Image
                          src={provider.iconUrl}
                          alt={provider.name}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
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
                아이디로 로그인
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
                      setSelectedLanguage(lang);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      selectedLanguage.code === lang.code
                        ? "bg-primary-main/10"
                        : ""
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm text-gray-700">{lang.name}</span>
                    {selectedLanguage.code === lang.code && (
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
