"use client";

import { useState, useEffect } from "react";
import { FiSend, FiX } from "react-icons/fi";
import { saveComment } from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import LoginRequiredPopup from "./LoginRequiredPopup";

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
      alert(t("comment.contentRequired"));
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
        alert(result.error || t("comment.writeFailed"));
      }
    } catch (error: any) {
      console.error("댓글 작성 중 오류:", error);
      alert(t("comment.writeError"));
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
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 bg-primary-main text-white rounded-lg text-sm font-medium hover:bg-[#2DB8A0] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <FiSend className="text-sm" />
            {commentId ? t('comment.edit') : t('comment.submit')}
          </button>
        </div>
      </div>
      
      {/* 로그인 필요 팝업 */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={() => setShowLoginRequiredPopup(false)}
        onLoginSuccess={() => {
          setShowLoginRequiredPopup(false);
          setIsLoggedIn(true);
        }}
      />
    </form>
  );
}

