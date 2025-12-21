"use client";

import { useState, useEffect } from "react";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import {
  CommentWithUser,
  loadComments,
  deleteComment,
} from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimeAgo } from "@/lib/utils/timeFormat";
import { maskNickname } from "@/lib/utils/nicknameMask";
import CommentForm from "./CommentForm";

interface CommentListProps {
  postId: string;
  postType: "procedure" | "hospital" | "concern" | "guide";
  onCommentAdded?: () => void;
  refreshKey?: number; // 댓글 추가 시 변경되어 리렌더링 트리거
}

export default function CommentList({
  postId,
  postType,
  onCommentAdded,
  refreshKey,
}: CommentListProps) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  useEffect(() => {
    loadCommentsData();
  }, [postId, postType, refreshKey]);

  const loadCommentsData = async () => {
    setLoading(true);
    const data = await loadComments(postId, postType);
    setComments(data);
    setLoading(false);
  };

  const handleCommentAdded = () => {
    loadCommentsData();
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter((c) => c.id !== commentId));
    } else {
      alert(result.error || "댓글 삭제에 실패했습니다.");
    }
  };

  const getDisplayName = (comment: CommentWithUser): string => {
    const nickname = comment.user_nickname || comment.user_display_name || null;
    return maskNickname(nickname); // ✅ 뒷글자 마스킹 적용
  };

  const getAvatar = (comment: CommentWithUser): string => {
    if (comment.user_avatar_url) {
      return comment.user_avatar_url;
    }
    // 원본 닉네임의 첫 글자로 아바타 생성 (마스킹 전)
    const originalName =
      comment.user_nickname || comment.user_display_name || "익";
    return originalName.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {t("common.loading") || "로딩 중..."}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        {t("comment.empty") || "아직 댓글이 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          {editingCommentId === comment.id ? (
            <CommentForm
              postId={postId}
              postType={postType}
              parentCommentId={comment.parent_comment_id || null}
              initialContent={comment.content}
              commentId={comment.id}
              onSuccess={() => {
                setEditingCommentId(null);
                loadCommentsData();
              }}
              onCancel={() => setEditingCommentId(null)}
            />
          ) : (
            <>
              <div className="flex items-start gap-3">
                {/* 아바타 */}
                <div className="w-8 h-8 bg-primary-main/20 rounded-full flex items-center justify-center text-sm font-semibold text-primary-main flex-shrink-0">
                  {comment.user_avatar_url ? (
                    <img
                      src={comment.user_avatar_url}
                      alt={getDisplayName(comment)}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getAvatar(comment)
                  )}
                </div>

                {/* 댓글 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {getDisplayName(comment)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {comment.created_at
                        ? formatTimeAgo(comment.created_at)
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>

                {/* 삭제 버튼 (본인 댓글만) */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(comment.id!)}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-red-500"
                    title="삭제"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
