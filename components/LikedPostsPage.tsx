"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiUser } from "react-icons/fi";
import {
  getLikedPostsWithDetails,
  LikedPostDetail,
} from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LikedPostsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [likedPosts, setLikedPosts] = useState<LikedPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLikedPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getLikedPostsWithDetails();
        if (result.success && result.posts) {
          setLikedPosts(result.posts);
        } else {
          setError(result.error || "좋아요한 글을 불러올 수 없습니다.");
        }
      } catch (err) {
        console.error("좋아요한 글 로드 실패:", err);
        setError("좋아요한 글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadLikedPosts();
  }, []);

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case "후기":
        return "bg-blue-100 text-blue-700";
      case "가이드":
        return "bg-green-100 text-green-700";
      case "고민":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-gray-500">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-main text-white rounded-lg text-sm font-medium"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (likedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <FiHeart className="text-gray-300 text-6xl mb-4" />
        <p className="text-gray-500 text-lg font-medium mb-2">
          {t("common.noData")}
        </p>
        <p className="text-gray-400 text-sm text-center">
          마음에 드는 글에 좋아요를 눌러보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-16 pb-6">
      {/* 좋아요한 글 목록 */}
      <div className="space-y-4">
        {likedPosts.map((post) => (
          <div
            key={`${post.postType}-${post.id}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              // 글 타입에 따라 다른 상세 페이지로 이동
              if (post.postType === "treatment_review") {
                router.push(`/review/procedure/${post.id}`);
              } else if (post.postType === "hospital_review") {
                router.push(`/review/hospital/${post.id}`);
              } else if (post.postType === "concern_post") {
                router.push(`/community?tab=consultation`);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {/* 카테고리명 */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${getCategoryColor(
                      post.categoryName
                    )}`}
                  >
                    {post.categoryName}
                  </span>
                </div>
                {/* 글 제목 */}
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {post.title}
                </h3>
                {/* 작성자 이름 */}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <FiUser className="text-gray-400" />
                  <span>{post.authorName}</span>
                </div>
              </div>
              <FiHeart className="text-red-500 fill-red-500 text-xl flex-shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

