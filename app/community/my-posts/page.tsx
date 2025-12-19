"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiEdit3,
  FiCamera,
  FiHome,
  FiFileText,
  FiArrowUp,
  FiMessageCircle,
  FiEye,
} from "react-icons/fi";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  loadMyProcedureReviews,
  loadMyHospitalReviews,
  loadMyConcernPosts,
  ProcedureReviewData,
  HospitalReviewData,
  ConcernPostData,
} from "@/lib/api/beautripApi";

type PostType = "all" | "procedure" | "hospital" | "concern";

interface UnifiedPost {
  id: string;
  type: "procedure" | "hospital" | "concern";
  title?: string;
  category: string;
  content: string;
  images?: string[];
  timestamp: string;
  created_at: string;
}

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return "방금 전";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
};

export default function MyPostsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PostType>("all");
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPosts = async () => {
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

        const currentUserId = session.user.id;
        setUserId(currentUserId);

        // 모든 타입의 글 가져오기
        const [procedureReviews, hospitalReviews, concernPosts] =
          await Promise.all([
            loadMyProcedureReviews(currentUserId),
            loadMyHospitalReviews(currentUserId),
            loadMyConcernPosts(currentUserId),
          ]);

        // 통합 포스트 배열 생성
        const allPosts: UnifiedPost[] = [
          ...procedureReviews.map((review: ProcedureReviewData) => ({
            id: review.id!,
            type: "procedure" as const,
            category: review.category || "후기",
            content: review.content,
            images: review.images,
            timestamp: formatTimeAgo(review.created_at),
            created_at: review.created_at || "",
          })),
          ...hospitalReviews.map((review: HospitalReviewData) => ({
            id: review.id!,
            type: "hospital" as const,
            category: review.category_large || "병원후기",
            content: review.content,
            images: review.images,
            timestamp: formatTimeAgo(review.created_at),
            created_at: review.created_at || "",
          })),
          ...concernPosts.map((post: ConcernPostData) => ({
            id: post.id!,
            type: "concern" as const,
            title: post.title,
            category: post.concern_category || "고민글",
            content: post.content,
            timestamp: formatTimeAgo(post.created_at),
            created_at: post.created_at || "",
          })),
        ];

        // 최신순으로 정렬
        allPosts.sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        setPosts(allPosts);
      } catch (error) {
        console.error("내 글 로드 실패:", error);
        alert("글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadUserPosts();
  }, [router]);

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "all") return true;
    if (activeTab === "procedure") return post.type === "procedure";
    if (activeTab === "hospital") return post.type === "hospital";
    if (activeTab === "concern") return post.type === "concern";
    return true;
  });

  const handlePostClick = (post: UnifiedPost) => {
    if (post.type === "procedure") {
      router.push(`/review/procedure/${post.id}`);
    } else if (post.type === "hospital") {
      router.push(`/review/hospital/${post.id}`);
    } else if (post.type === "concern") {
      router.push(`/community?tab=consultation`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "procedure":
        return <FiCamera className="text-pink-500" />;
      case "hospital":
        return <FiHome className="text-blue-500" />;
      case "concern":
        return <FiFileText className="text-purple-500" />;
      default:
        return <FiEdit3 />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "procedure":
        return "시술 후기";
      case "hospital":
        return "병원 후기";
      case "concern":
        return "고민글";
      default:
        return "글";
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto w-full">
      <Header />

      {/* Header */}
      <div className="px-4 py-4 sticky top-[64px] bg-white z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">내 글 관리</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "all" as PostType, label: "전체" },
            { id: "procedure" as PostType, label: "시술 후기" },
            { id: "hospital" as PostType, label: "병원 후기" },
            { id: "concern" as PostType, label: "고민글" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List - 헤더 아래에서 시작하도록 여백 추가 */}
      <div className="px-4 pt-16 pb-24">
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <FiEdit3 className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">작성한 글이 없습니다</p>
            <button
              onClick={() => router.push("/community/write")}
              className="mt-4 px-6 py-2 bg-primary-main text-white rounded-lg font-medium hover:bg-[#2DB8A0] transition-colors"
            >
              글 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={`${post.type}-${post.id}`}
                onClick={() => handlePostClick(post)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer scroll-mt-[180px]"
              >
                {/* Type & Category */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(post.type)}
                    <span className="text-xs text-gray-500">
                      {getTypeLabel(post.type)}
                    </span>
                  </div>
                  <span className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                </div>

                {/* Title (고민글만) */}
                {post.title && (
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                )}

                {/* Content */}
                <p className="text-gray-800 text-sm mb-3 leading-relaxed line-clamp-3">
                  {post.content}
                </p>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {post.images.slice(0, 4).map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                      >
                        {img &&
                        (img.startsWith("http") ||
                          img.startsWith("blob:") ||
                          img.startsWith("/")) ? (
                          <Image
                            src={img}
                            alt={`이미지 ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            이미지
                          </div>
                        )}
                        {idx === 3 && post.images!.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-semibold text-xs z-10">
                            +{post.images!.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {post.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
