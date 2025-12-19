"use client";

import { FiArrowUp, FiMessageCircle, FiEye, FiHeart } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  loadProcedureReviews,
  loadHospitalReviews,
  loadConcernPosts,
  ProcedureReviewData,
  HospitalReviewData,
  ConcernPostData,
  togglePostLike,
  isPostLiked,
  getPostLikeCount,
} from "@/lib/api/beautripApi";

interface ReviewPost {
  id: string | number;
  category: string;
  username: string;
  avatar: string;
  content: string;
  images?: string[];
  timestamp: string;
  edited?: boolean;
  upvotes: number;
  comments: number;
  views: number;
  likes?: number;
  postType?: "procedure_review" | "hospital_review" | "concern_post"; // Supabase 글 타입
  isLiked?: boolean; // 현재 사용자가 좋아요를 눌렀는지
}

const reviewPosts: ReviewPost[] = [
  {
    id: 1,
    category: "자유수다",
    username: "베소통리소",
    avatar: "🐹",
    content:
      "원래 눈 라인이 마음에 들지 않아서 재수술을 고민하게 되었어요 첫 수술로 잡았던 라인이 너무 낮기도 하고 여전히 눈매가 흐릿해... 자연스럽게 바꾸고 싶다는 생각이 들었네...더 보기",
    images: ["eye1", "eye2", "eye3", "eye4"],
    timestamp: "18시간 전",
    edited: true,
    upvotes: 62,
    comments: 198,
    views: 5722,
  },
  {
    id: 2,
    category: "자유수다",
    username: "홀짝댄스",
    avatar: "🐱",
    content:
      "비티에서 윤곽3종이랑 무보형물로 코수술 하고 왔당 ㅎㅎㅎㅎ 코는 이승호원장님, 윤곽...더 보기",
    images: ["face1", "face2"],
    timestamp: "1일 전",
    edited: true,
    upvotes: 29,
    comments: 58,
    views: 2648,
  },
  {
    id: 3,
    category: "자유수다",
    username: "연말부뉘기",
    avatar: "🐧",
    content:
      "테이아의원 울쎄라 리프팅 받고 온 후기 남겨봅니다~~ >< 요즘 턱선이 흐려지고 팔자 쪽...더 보기",
    timestamp: "1일 전",
    upvotes: 30,
    comments: 45,
    views: 1820,
  },
  {
    id: 4,
    category: "자유수다",
    username: "춤추는아미고",
    avatar: "🦊",
    content:
      "와.. 티타늄 맛집은 테이아였네?? ;; 나 요즘 턱선이랑 볼살이 너무 축 처져서 테이아의원에서 티타늄리프팅 받아봤거...더 보기",
    images: ["before", "after"],
    timestamp: "1일 전",
    edited: true,
    upvotes: 29,
    comments: 50,
    views: 2604,
  },
  {
    id: 5,
    category: "후기",
    username: "뷰티러버",
    avatar: "✨",
    content:
      "강남역 근처 클리닉에서 리쥬란 힐러 받고 왔어요! 처음 받아보는 거라 조금 걱정됐는데 원장님이 친절하게 설명해주셔서 안심이 됐네요. 시술 후 관리도 꼼꼼히 알려주셨어요...더 보기",
    images: ["skin1", "skin2"],
    timestamp: "2일 전",
    upvotes: 45,
    comments: 72,
    views: 3200,
    likes: 120,
  },
  {
    id: 6,
    category: "후기",
    username: "민트향기",
    avatar: "🌿",
    content:
      "사각턱 때문에 고민이 많았는데 보톡스로 해결했어요! 가격도 합리적이고 효과도 좋아서 추천하고 싶네요. 3개월 정도 지나니까 더 자연스러워졌어요...더 보기",
    timestamp: "3일 전",
    upvotes: 38,
    comments: 55,
    views: 2100,
  },
];

// 시간 포맷팅 함수
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

export default function ReviewList() {
  const router = useRouter();
  const [supabaseReviews, setSupabaseReviews] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);

        // Supabase에서 모든 후기 가져오기
        const [procedureReviews, hospitalReviews, concernPosts] =
          await Promise.all([
            loadProcedureReviews(20),
            loadHospitalReviews(20),
            loadConcernPosts(20),
          ]);

        // 시술 후기 변환 (created_at 포함)
        const formattedProcedureReviews: (ReviewPost & {
          created_at?: string;
        })[] = procedureReviews
          .filter((review: ProcedureReviewData) => review.id) // id가 있는 것만 필터링
          .map((review: ProcedureReviewData) => {
            const nickname = (review as any).nickname;
            console.log("[ReviewList] 시술 후기 닉네임:", {
              reviewId: review.id,
              userId: review.user_id,
              nickname,
              hasNickname: !!nickname,
            });
            return {
              id: review.id!, // id가 있음을 보장
              category: review.category || "후기",
              username: nickname || "익명", // nickname이 없으면 "익명"만 표시
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              created_at: review.created_at, // 정렬을 위해 원본 날짜 보관
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              postType: "procedure_review" as const,
            };
          });

        // 병원 후기 변환 (created_at 포함)
        const formattedHospitalReviews: (ReviewPost & {
          created_at?: string;
        })[] = hospitalReviews
          .filter((review: HospitalReviewData) => review.id) // id가 있는 것만 필터링
          .map((review: HospitalReviewData) => {
            const nickname = (review as any).nickname;
            console.log("[ReviewList] 병원 후기 닉네임:", {
              reviewId: review.id,
              userId: review.user_id,
              nickname,
              hasNickname: !!nickname,
            });
            return {
              id: review.id!, // id가 있음을 보장
              category: review.category_large || "병원후기",
              username: nickname || "익명", // nickname이 없으면 "익명"만 표시
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              created_at: review.created_at, // 정렬을 위해 원본 날짜 보관
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              postType: "hospital_review" as const,
            };
          });

        // 고민글 변환 (created_at 포함)
        const formattedConcernPosts: (ReviewPost & { created_at?: string })[] =
          concernPosts
            .filter((post: ConcernPostData) => post.id) // id가 있는 것만 필터링
            .map((post: ConcernPostData) => {
              const nickname = (post as any).nickname;
              console.log("[ReviewList] 고민글 닉네임:", {
                postId: post.id,
                userId: post.user_id,
                nickname,
                hasNickname: !!nickname,
              });
              return {
                id: post.id!, // id가 있음을 보장
                category: post.concern_category || "고민글",
                username: nickname || "익명", // nickname이 없으면 "익명"만 표시
                avatar: "👤",
                content: post.content,
                timestamp: formatTimeAgo(post.created_at),
                created_at: post.created_at, // 정렬을 위해 원본 날짜 보관
                edited: false,
                upvotes: 0,
                comments: 0,
                views: 0,
                postType: "concern_post" as const,
              };
            });

        // 최신순으로 정렬 (created_at 기준, 모든 후기 통합)
        const allSupabaseReviews = [
          ...formattedProcedureReviews,
          ...formattedHospitalReviews,
          ...formattedConcernPosts,
        ]
          .sort((a, b) => {
            // created_at이 없으면 맨 뒤로
            if (!a.created_at && !b.created_at) return 0;
            if (!a.created_at) return 1;
            if (!b.created_at) return -1;
            // 최신순 (내림차순)
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          })
          .map(({ created_at, ...rest }) => rest); // created_at 제거

        setSupabaseReviews(allSupabaseReviews);

        // 좋아요 상태 및 개수 로드
        const postIds = allSupabaseReviews
          .filter((post) => post.postType && typeof post.id === "string")
          .map((post) => ({
            id: post.id as string,
            type: post.postType!,
          }));

        // 좋아요 상태 일괄 확인
        const likedSet = new Set<string>();
        const countsMap = new Map<string, number>();

        await Promise.all(
          postIds.map(async ({ id, type }) => {
            const [isLiked, count] = await Promise.all([
              isPostLiked(id, type),
              getPostLikeCount(id, type),
            ]);
            if (isLiked) {
              likedSet.add(`${id}-${type}`);
            }
            countsMap.set(`${id}-${type}`, count);
          })
        );

        setLikedPosts(likedSet);
        setLikeCounts(countsMap);
      } catch (error) {
        console.error("후기 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();

    // 후기 추가 이벤트 리스너
    const handleReviewAdded = () => {
      loadReviews();
    };

    window.addEventListener("reviewAdded", handleReviewAdded);
    return () => window.removeEventListener("reviewAdded", handleReviewAdded);
  }, []);

  // Supabase 후기와 기존 하드코딩된 후기 합치기 (Supabase 후기가 먼저)
  // Supabase 후기는 이미 최신순으로 정렬되어 있음
  const allReviews = [...supabaseReviews, ...reviewPosts];

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-gray-500">
        후기를 불러오는 중...
      </div>
    );
  }

  const handlePostClick = (post: ReviewPost) => {
    console.log("[ReviewList] 카드 클릭:", {
      postId: post.id,
      postType: post.postType,
      idType: typeof post.id,
      hasPostType: !!post.postType,
      hasId: !!post.id,
    });

    // postType이 있고, id가 실제로 존재할 때만 클릭 가능
    if (post.postType && post.id) {
      const postId = String(post.id); // 숫자든 문자열이든 문자열로 변환
      console.log("[ReviewList] 라우팅 시도:", {
        postType: post.postType,
        postId,
        path:
          post.postType === "procedure_review"
            ? `/review/procedure/${postId}`
            : post.postType === "hospital_review"
            ? `/review/hospital/${postId}`
            : `/community?tab=consultation`,
      });

      if (post.postType === "procedure_review") {
        router.push(`/review/procedure/${postId}`);
      } else if (post.postType === "hospital_review") {
        router.push(`/review/hospital/${postId}`);
      } else if (post.postType === "concern_post") {
        // 고민글 상세보기는 추후 구현
        router.push(`/community?tab=consultation`);
      }
    } else {
      // 디버깅: 왜 클릭이 안 되는지 확인
      console.warn("[ReviewList] 클릭 불가:", {
        postType: post.postType,
        id: post.id,
        idType: typeof post.id,
        post: post,
      });
    }
  };

  return (
    <div className="px-4 space-y-4 pb-4">
      {allReviews.map((post) => (
        <div
          key={post.id}
          onClick={() => {
            handlePostClick(post);
          }}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          {/* Category Tag */}
          <div className="mb-3">
            <span className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-xs font-medium">
              {post.category}
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
              {post.avatar}
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {post.username}
            </span>
          </div>

          {/* Post Content */}
          <p className="text-gray-800 text-sm mb-3 leading-relaxed line-clamp-3">
            {post.content}
          </p>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div
              className={`grid gap-2 mb-3 ${
                post.images.length === 1
                  ? "grid-cols-1"
                  : post.images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2"
              }`}
            >
              {post.images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                    post.images!.length === 1 ? "max-h-96" : ""
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {img.startsWith("http") || img.startsWith("blob:") ? (
                    <Image
                      src={img}
                      alt={`후기 이미지 ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      이미지
                    </div>
                  )}
                  {idx === 3 && post.images!.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-semibold text-lg">
                      +{post.images!.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mb-3">
            {post.timestamp} {post.edited && "(수정됨)"}
          </p>

          {/* Engagement Metrics */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-600">
              <FiArrowUp className="text-primary-main" />
              <span className="text-xs">{post.upvotes}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <FiMessageCircle className="text-primary-main" />
              <span className="text-xs">{post.comments}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <FiEye className="text-gray-400" />
              <span className="text-xs text-gray-400">
                {post.views.toLocaleString()}
              </span>
            </div>
            {/* 좋아요 버튼 */}
            {post.postType && typeof post.id === "string" && (
              <button
                onClick={async (e) => {
                  e.stopPropagation(); // 카드 클릭 이벤트 방지
                  const postId = post.id as string;
                  const postType = post.postType!;
                  const key = `${postId}-${postType}`;

                  try {
                    const result = await togglePostLike(postId, postType);
                    if (result.success) {
                      // 좋아요 상태 업데이트
                      setLikedPosts((prev) => {
                        const newSet = new Set(prev);
                        if (result.isLiked) {
                          newSet.add(key);
                        } else {
                          newSet.delete(key);
                        }
                        return newSet;
                      });

                      // 좋아요 개수 업데이트
                      const newCount = await getPostLikeCount(postId, postType);
                      setLikeCounts((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(key, newCount);
                        return newMap;
                      });
                    } else {
                      if (result.error?.includes("로그인이 필요")) {
                        alert("로그인이 필요합니다.");
                      } else {
                        alert(result.error || "좋아요 처리에 실패했습니다.");
                      }
                    }
                  } catch (error) {
                    console.error("좋아요 토글 실패:", error);
                    alert("좋아요 처리 중 오류가 발생했습니다.");
                  }
                }}
                className={`flex items-center gap-1 ml-auto transition-colors ${
                  likedPosts.has(`${post.id}-${post.postType}`)
                    ? "text-red-500"
                    : "text-gray-600 hover:text-red-500"
                }`}
              >
                <FiHeart
                  className={`text-lg ${
                    likedPosts.has(`${post.id}-${post.postType}`)
                      ? "fill-red-500"
                      : ""
                  }`}
                />
                <span className="text-xs">
                  {likeCounts.get(`${post.id}-${post.postType}`) || 0}
                </span>
              </button>
            )}
            {/* 기존 하드코딩된 좋아요 표시 (postType이 없는 경우) */}
            {!post.postType && post.likes && (
              <div className="flex items-center gap-1 text-gray-600 ml-auto">
                <FiHeart className="text-primary-main fill-primary-main" />
                <span className="text-xs">{post.likes}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
