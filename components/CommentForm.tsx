"use client";

import { useState, useEffect } from "react";
import { FiSend, FiX } from "react-icons/fi";
import { saveComment } from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import LoginModal from "./LoginModal";

interface CommentFormProps {
  postId: string;
  postType: "procedure" | "hospital" | "concern" | "guide";
  parentCommentId?: string | null;
  initialContent?: string;
  commentId?: string; // 수정 모드
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CommentForm({
  postId,
  postType,
  parentCommentId = null,
  initialContent = "",
  commentId,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginRequiredPopup(true);
      return;
    }

    if (!content.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await saveComment({
        post_id: postId,
        post_type: postType,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      });

      if (result.success) {
        setContent("");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(result.error || "댓글 작성에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("댓글 작성 중 오류:", error);
      alert("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 items-start">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comment.placeholder") || "댓글을 입력하세요..."}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent text-sm"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex flex-col gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
              disabled={isSubmitting}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 bg-primary-main text-white rounded-lg text-sm font-medium hover:bg-[#2DB8A0] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <FiSend className="text-sm" />
            {commentId ? "수정" : "등록"}
          </button>
        </div>
      </div>
      
      {/* 로그인 필요 팝업 */}
      {showLoginRequiredPopup && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setShowLoginRequiredPopup(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl pointer-events-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {t("common.loginRequired")}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t("common.loginRequiredMoreInfo")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginRequiredPopup(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginRequiredPopup(false);
                      setShowLoginModal(true);
                    }}
                    className="flex-1 py-2.5 px-4 bg-primary-main hover:bg-primary-main/90 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t("common.login")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          setIsLoggedIn(true);
        }}
      />
    </form>
  );
}

