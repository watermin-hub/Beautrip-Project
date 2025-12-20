"use client";

import { useState } from "react";
import { FiSend, FiX } from "react-icons/fi";
import { saveComment } from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentFormProps {
  postId: string;
  postType: "procedure" | "hospital" | "concern";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comment.placeholder") || "댓글을 입력하세요..."}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent text-sm"
          rows={3}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-primary-main text-white rounded-lg text-sm font-medium hover:bg-[#2DB8A0] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiSend className="text-sm" />
          {commentId ? "수정" : "등록"}
        </button>
      </div>
    </form>
  );
}

