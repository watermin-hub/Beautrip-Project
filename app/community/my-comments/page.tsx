"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import {
  loadMyComments,
  CommentWithUser,
  deleteComment,
  loadProcedureReviews,
  loadHospitalReviews,
  loadConcernPosts,
} from "@/lib/api/beautripApi";
import { formatTimeAgo } from "@/lib/utils/timeFormat";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function MyCommentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [postTitles, setPostTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUserComments();
  }, []);

  const loadUserComments = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 사용자 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("로그인이 필요합니다.");
        router.push("/mypage");
        return;
      }

        const currentUserId = session.user.id; // ✅ UUID
        const myComments = await loadMyComments(currentUserId);

      // 최신순으로 정렬
      myComments.sort((a, b) => {
        const aDate = a.created_at || "";
        const bDate = b.created_at || "";
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setComments(myComments);

      // 게시글 제목 가져오기
      const titles: Record<string, string> = {};
      await Promise.all(
        myComments.map(async (comment) => {
          const key = `${comment.post_type}-${comment.post_id}`;
          if (titles[key]) return;

          try {
            if (comment.post_type === "procedure") {
              const reviews = await loadProcedureReviews(100);
              const post = reviews.find((r: any) => r.id === comment.post_id);
              if (post) {
                titles[key] = post.procedure_name || "시술 후기";
              }
            } else if (comment.post_type === "hospital") {
              const reviews = await loadHospitalReviews(100);
              const post = reviews.find((r: any) => r.id === comment.post_id);
              if (post) {
                titles[key] = post.hospital_name || "병원 후기";
              }
            } else if (comment.post_type === "concern") {
              const posts = await loadConcernPosts(100);
              const post = posts.find((p: any) => p.id === comment.post_id);
              if (post) {
                titles[key] = post.title || "고민글";
              }
            }
          } catch (error) {
            console.error("게시글 제목 로드 실패:", error);
          }
        })
      );
      setPostTitles(titles);
    } catch (error) {
      console.error("내 댓글 로드 실패:", error);
      alert("댓글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t("comment.deleteConfirm") || "댓글을 삭제하시겠습니까?")) {
      return;
    }

    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter((c) => c.id !== commentId));
      alert("댓글이 삭제되었습니다.");
    } else {
      alert(result.error || "댓글 삭제에 실패했습니다.");
    }
  };

  const handleCommentClick = (comment: CommentWithUser) => {
    router.push(`/community/posts/${comment.post_id}?type=${comment.post_type}`);
  };

  const getPostTitle = (comment: CommentWithUser): string => {
    const key = `${comment.post_type}-${comment.post_id}`;
    return (
      postTitles[key] ||
      (comment.post_type === "procedure"
        ? "시술 후기"
        : comment.post_type === "hospital"
        ? "병원 후기"
        : "고민글")
    );
  };

  const getDisplayName = (comment: CommentWithUser): string => {
    return comment.user_display_name || comment.user_nickname || "익명";
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-4 py-4 sticky top-[48px] bg-white z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {t("comment.myComments") || "내 댓글"}
          </h2>
        </div>
      </div>

      {/* Comments List */}
      <div className="px-4 pt-16 pb-24">
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <FiMessageCircle className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {t("comment.noComments") || "작성한 댓글이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                {/* 게시글 정보 */}
                <div
                  onClick={() => handleCommentClick(comment)}
                  className="mb-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {comment.post_type === "procedure"
                        ? "시술 후기"
                        : comment.post_type === "hospital"
                        ? "병원 후기"
                        : "고민글"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {getPostTitle(comment)}
                  </p>
                </div>

                {/* 댓글 내용 */}
                <div className="mb-3">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {comment.content}
                  </p>
                </div>

                {/* 댓글 정보 및 삭제 버튼 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {comment.created_at ? formatTimeAgo(comment.created_at) : ""}
                  </span>
                  <button
                    onClick={() => handleDelete(comment.id!)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
                    title={t("comment.delete") || "삭제"}
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

