"use client";

import {
  FiArrowUp,
  FiMessageCircle,
  FiEye,
  FiHeart,
  FiStar,
  FiGlobe,
} from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
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
  getCommentCount,
  getViewCount,
} from "@/lib/api/beautripApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { maskNickname } from "@/lib/utils/nicknameMask";
import { translateText, type LanguageCode, detectLanguage } from "@/lib/utils/translation";
import { supabase } from "@/lib/supabase";
import LoginModal from "./LoginModal";

interface Post {
  id: number | string;
  category: string;
  username: string;
  avatar: string;
  content: string;
  title?: string; // 고민상담소 글 제목
  images?: string[];
  timestamp: string;
  edited?: boolean;
  upvotes: number;
  comments: number;
  views: number;
  likes?: number;
  reviewType?: "procedure" | "hospital" | "concern"; // 후기 타입 구분
  created_at?: string; // 정렬용 (Supabase에서 오는 데이터에 포함, 정렬 후 제거)
  // 후기 관련 필드
  procedure_name?: string; // 시술명
  hospital_name?: string; // 병원명
  procedure_rating?: number; // 시술 만족도
  hospital_rating?: number; // 병원 만족도
  overall_satisfaction?: number; // 전체 만족도 (병원 후기용)
}

const recommendedPosts: Post[] = [
  {
    id: 1,
    category: "정보공유",
    username: "뷰티매니아",
    avatar: "💎",
    content:
      "강남역 근처 추천 클리닉 리스트 공유해요! 가격대비 품질이 좋은 곳들만 골라봤어요. 특히 리쥬란 힐러 시술 받았을 때 만족도가 높았던 곳 위주로 정리했습니다...더 보기",
    images: ["clinic1", "clinic2"],
    timestamp: "5시간 전",
    upvotes: 142,
    comments: 89,
    views: 8234,
    likes: 256,
  },
  {
    id: 2,
    category: "질문답변",
    username: "시술초보자",
    avatar: "🌱",
    content:
      "처음으로 보톡스 맞으려는데 어떤 클리닉이 좋을까요? 강남 지역 위주로 추천 부탁드려요. 가격도 궁금하고 부작용 걱정도 되네요...더 보기",
    timestamp: "8시간 전",
    upvotes: 98,
    comments: 156,
    views: 6452,
  },
  {
    id: 3,
    category: "정보공유",
    username: "스킨케어러버",
    avatar: "✨",
    content:
      "인모드 리프팅 전후 비교 사진 공유합니다! 3개월 차인데 효과가 정말 만족스러워요. 특히 턱선이 확실히 올라간 게 보이시나요? ...더 보기",
    images: ["before1", "after1"],
    timestamp: "12시간 전",
    edited: true,
    upvotes: 203,
    comments: 234,
    views: 12345,
    likes: 512,
  },
  {
    id: 4,
    category: "자유수다",
    username: "코성형고민",
    avatar: "🎭",
    content:
      "코 재수술 고민 중인데 조언 구해요ㅠㅠ 첫 수술이 마음에 들지 않아서... 어떤 의원이 좋은지, 재수술 시 주의사항은 무엇인지 궁금합니다...더 보기",
    timestamp: "15시간 전",
    upvotes: 76,
    comments: 92,
    views: 5432,
  },
  {
    id: 5,
    category: "정보공유",
    username: "필러전문가",
    avatar: "💉",
    content:
      "2024년 필러 가격 정보 정리했어요! 지역별, 시술별로 비교해봤는데 참고하시면 좋을 것 같아요. 특히 리쥬란, 쥬베룩 가격대가 궁금하셨던 분들...더 보기",
    timestamp: "1일 전",
    edited: true,
    upvotes: 167,
    comments: 145,
    views: 9876,
    likes: 324,
  },
  {
    id: 6,
    category: "질문답변",
    username: "리프팅고민",
    avatar: "🌙",
    content:
      "울쎄라 vs 인모드 어떤 게 나을까요? 둘 다 받아보신 분들 의견 듣고 싶어요. 가격도 비교해주시면 감사하겠습니다! ...더 보기",
    timestamp: "1일 전",
    upvotes: 89,
    comments: 112,
    views: 7654,
  },
];

// 최신글 더미 데이터 (시술후기)
// ⚠️ 주의: 이 더미데이터는 Supabase에 저장되지 않고 프론트엔드에서만 표시되는 임시 데이터입니다.
// 실제 데이터가 충분해지면 제거할 수 있습니다.
const latestProcedurePosts: Post[] = [
  {
    id: "latest-procedure-1",
    category: "눈성형",
    username: "시술러버",
    avatar: "💖",
    content:
      "쌍수 재수술 받고 왔어요! 이번엔 정말 만족스럽습니다. 붓기도 예상보다 빨리 빠지고 자연스러워요.",
    images: ["procedure1"],
    timestamp: "15분 전",
    upvotes: 7,
    comments: 12,
    views: 345,
    reviewType: "procedure" as const,
    procedure_name: "쌍수 재수술",
    hospital_name: "강남 클리닉",
  },
  {
    id: "latest-procedure-2",
    category: "보톡스",
    username: "뷰티매니아",
    avatar: "💎",
    content:
      "이마 보톡스 맞고 왔는데 효과가 정말 좋아요! 주름이 많이 개선되었어요.",
    timestamp: "45분 전",
    upvotes: 14,
    comments: 7,
    views: 389,
    reviewType: "procedure" as const,
    procedure_name: "이마 보톡스",
    hospital_name: "서울 병원",
  },
  {
    id: "latest-procedure-3",
    category: "리프팅",
    username: "리프팅전문가",
    avatar: "✨",
    content:
      "인모드 리프팅 시술 받았어요! 시술 전 주의사항 정리해서 올려봅니다. 시술 받기 전에 꼭 확인하시면 좋을 것 같아요!",
    images: ["info1", "info2"],
    timestamp: "1시간 전",
    edited: true,
    upvotes: 25,
    comments: 31,
    views: 892,
    reviewType: "procedure" as const,
    procedure_name: "인모드 리프팅",
    hospital_name: "강남 뷰티센터",
  },
];

// 최신글 더미 데이터 (병원후기)
// ⚠️ 주의: 이 더미데이터는 Supabase에 저장되지 않고 프론트엔드에서만 표시되는 임시 데이터입니다.
// 실제 데이터가 충분해지면 제거할 수 있습니다.
const latestHospitalPosts: Post[] = [
  {
    id: "latest-hospital-1",
    category: "병원후기",
    username: "신규회원123",
    avatar: "🦋",
    content:
      "강남역 신규 오픈한 클리닉 다녀왔어요! 오픈 기념 이벤트 진행 중이고 직원분들도 친절하세요.",
    timestamp: "10분 전",
    upvotes: 12,
    comments: 15,
    views: 456,
    reviewType: "hospital" as const,
    hospital_name: "강남역 클리닉",
  },
  {
    id: "latest-hospital-2",
    category: "병원후기",
    username: "가격비교왕",
    avatar: "💰",
    content:
      "올해부터 필러 가격이 올랐다고 들었는데 실제로 어떠세요? 최근 시술 받으신 분들 가격 정보 공유해주세요!",
    timestamp: "20분 전",
    upvotes: 18,
    comments: 24,
    views: 567,
    reviewType: "hospital" as const,
    hospital_name: "서울 뷰티센터",
  },
];

// 최신글 전체 (시술 후기 + 병원 후기)
const latestPosts: Post[] = [...latestProcedurePosts, ...latestHospitalPosts];

// 고민상담소 더미 데이터 (카테고리별 5~10개 정도)
const concernDummyPosts: Post[] = [
  {
    id: "concern-1",
    category: "피부 고민",
    username: "트러블폭발",
    avatar: "🌋",
    content:
      "여드름 흉터가 너무 심한데 해외에서 잠깐 들어오는 동안 할 수 있는 치료가 있을까요? 다운타임이 길지 않았으면 좋겠어요.",
    timestamp: "3시간 전",
    upvotes: 12,
    comments: 8,
    views: 324,
    reviewType: "concern",
  },
  {
    id: "concern-2",
    category: "피부 고민",
    username: "건성인간",
    avatar: "💧",
    content:
      "겨울만 되면 각질+당김이 너무 심해요. 레이저를 해야 할지, 관리 위주로 가야 할지 헷갈립니다. 비슷한 분들 어떤 시술 받으셨나요?",
    timestamp: "5시간 전",
    upvotes: 7,
    comments: 5,
    views: 198,
    reviewType: "concern",
  },
  {
    id: "concern-3",
    category: "시술 고민",
    username: "첫보톡스도전",
    avatar: "😳",
    content:
      "이마+미간 보톡스를 처음 맞아보려는데 표정이 너무 안 어색했으면 좋겠어요. 용량이나 병원 고를 때 꼭 봐야 할 포인트가 있을까요?",
    timestamp: "1일 전",
    upvotes: 15,
    comments: 21,
    views: 512,
    reviewType: "concern",
  },
  {
    id: "concern-4",
    category: "시술 고민",
    username: "리프팅궁금",
    avatar: "✨",
    content:
      "인모드랑 슈링크 중에 어떤 걸 먼저 해보는 게 좋을까요? 통증이랑 붓기, 효과 지속기간 차이가 궁금합니다.",
    timestamp: "2일 전",
    upvotes: 9,
    comments: 11,
    views: 389,
    reviewType: "concern",
  },
  {
    id: "concern-5",
    category: "병원 선택",
    username: "어디가좋을까",
    avatar: "📍",
    content:
      "강남/신사 쪽 리프팅 잘하는 병원 어디가 괜찮을까요? 후기를 봐도 다 좋아 보여서 실제로 받아보신 분들 의견이 궁금해요.",
    timestamp: "6시간 전",
    upvotes: 6,
    comments: 9,
    views: 245,
    reviewType: "concern",
  },
  {
    id: "concern-6",
    category: "가격 문의",
    username: "예산50",
    avatar: "💸",
    content:
      "50만 원 안쪽으로 할 수 있는 시술 추천 부탁드려요! 얼굴 전체 분위기만 조금 상큼해졌으면 좋겠어요.",
    timestamp: "8시간 전",
    upvotes: 4,
    comments: 6,
    views: 173,
    reviewType: "concern",
  },
  {
    id: "concern-7",
    category: "회복 기간",
    username: "직장인휴가3일",
    avatar: "🏃",
    content:
      "휴가가 딱 3일인데, 이 기간 안에 회복 가능한 시술이 뭐가 있을까요? 붓기 심한 건 피하고 싶어요.",
    timestamp: "12시간 전",
    upvotes: 10,
    comments: 13,
    views: 301,
    reviewType: "concern",
  },
  {
    id: "concern-8",
    category: "부작용",
    username: "붓기안빠짐",
    avatar: "😥",
    content:
      "턱 보톡스를 맞은 지 2주가 지났는데 아직도 씹을 때 불편한 느낌이 있어요. 이런 경우 병원에 다시 가봐야 할까요?",
    timestamp: "3일 전",
    upvotes: 5,
    comments: 14,
    views: 267,
    reviewType: "concern",
  },
  {
    id: "concern-9",
    category: "기타",
    username: "해외거주자",
    avatar: "✈️",
    content:
      "해외에서 들어와서 시술+여행 같이 하려는데, 공항에서 가까운 지역 추천해주실 수 있나요? 일정 짜는 팁도 궁금해요.",
    timestamp: "4일 전",
    upvotes: 8,
    comments: 7,
    views: 221,
    reviewType: "concern",
  },
];

const popularPosts: Post[] = [
  {
    id: 1,
    category: "정보공유",
    username: "인기작가",
    avatar: "🔥",
    content:
      "2024년 최고의 클리닉 랭킹 공유합니다! 직접 다녀본 곳들만 추천하는 리스트예요. 가격, 품질, 서비스 모두 고려해서 작성했습니다...더 보기",
    images: ["ranking1", "ranking2", "ranking3"],
    timestamp: "2일 전",
    edited: true,
    upvotes: 523,
    comments: 456,
    views: 45234,
    likes: 1245,
  },
  {
    id: 2,
    category: "후기",
    username: "만족러버",
    avatar: "⭐",
    content:
      "슈링크 유니버스 시술 받고 완전 만족해서 후기 남겨요! 효과가 정말 놀라웠고 원장님도 너무 친절하셨어요. 전후 사진 공유합니다! ...더 보기",
    images: ["before2", "after2"],
    timestamp: "3일 전",
    edited: true,
    upvotes: 412,
    comments: 389,
    views: 38921,
    likes: 987,
  },
  {
    id: 3,
    category: "정보공유",
    username: "가격정보왕",
    avatar: "💎",
    content:
      "시술별 가격대 비교표 업데이트했습니다! 지역별, 클리닉별 가격 정보를 한눈에 비교할 수 있도록 정리했어요. 많은 분들께 도움이 되면 좋겠습니다...더 보기",
    timestamp: "4일 전",
    edited: true,
    upvotes: 387,
    comments: 298,
    views: 34123,
    likes: 756,
  },
  {
    id: 4,
    category: "자유수다",
    username: "화제의인물",
    avatar: "🎯",
    content:
      "이 클리닉 정말 추천합니다! 제가 받은 시술 중에서 최고였어요. 직원분들도 친절하고 시술도 깔끔하게 잘 끝났습니다. 여러분도 한번 가보세요! ...더 보기",
    timestamp: "5일 전",
    upvotes: 298,
    comments: 234,
    views: 28765,
    likes: 634,
  },
  {
    id: 5,
    category: "질문답변",
    username: "베테랑",
    avatar: "👑",
    content:
      "시술 관련 질문 받아요! 여러 번 경험한 입장에서 솔직하게 답변드리겠습니다. 어떤 질문이든 환영입니다~ ...더 보기",
    timestamp: "6일 전",
    upvotes: 267,
    comments: 512,
    views: 24567,
    likes: 523,
  },
  {
    id: 6,
    category: "정보공유",
    username: "리뷰마스터",
    avatar: "📸",
    content:
      "강남역 클리닉 투어 후기 올려요! 5곳을 직접 방문해서 비교해봤는데 각각의 특징과 장단점을 정리했습니다. 참고하시면 좋을 것 같아요...더 보기",
    images: ["tour1", "tour2", "tour3", "tour4"],
    timestamp: "1주일 전",
    edited: true,
    upvotes: 445,
    comments: 367,
    views: 38945,
    likes: 892,
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

export default function PostList({
  activeTab,
  concernCategory,
}: {
  activeTab: "recommended" | "latest" | "popular" | "consultation";
  concernCategory?: string | null;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [supabaseReviews, setSupabaseReviews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularSection, setPopularSection] = useState<
    "procedure" | "hospital"
  >("procedure");
  const [latestSection, setLatestSection] = useState<
    "procedure" | "hospital"
  >("procedure");
  // 좋아요 상태 관리: { postId: { isLiked: boolean, likeCount: number } }
  const [likesState, setLikesState] = useState<
    Record<string, { isLiked: boolean; likeCount: number }>
  >({});
  // 댓글 수 관리: { postId: number }
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  // 조회수 관리: { postId: number }
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  // 번역 상태 관리: { postId: { title: string | null, content: string | null, isTranslating: boolean } }
  const [translationState, setTranslationState] = useState<
    Record<
      string,
      {
        title: string | null;
        content: string | null;
        isTranslating: boolean;
        isTranslated: boolean;
      }
    >
  >({});
  // 로그인 관련 상태
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 좋아요 상태 로드 함수
  const loadLikesForPosts = async (posts: Post[]): Promise<Record<string, { isLiked: boolean; likeCount: number }>> => {
    const newLikesState: Record<
      string,
      { isLiked: boolean; likeCount: number }
    > = {};

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 모든 게시글의 좋아요 데이터를 병렬로 로드
    const likePromises = posts
      .filter((post) => post.reviewType && post.id)
      .map(async (post) => {
        const postId = String(post.id);

        // UUID 형식이 아니면 스킵 (더미 데이터)
        if (!uuidRegex.test(postId)) {
          return { postId, result: null };
        }

        const postType =
          post.reviewType === "procedure"
            ? "treatment_review"
            : post.reviewType === "hospital"
            ? "hospital_review"
            : "concern_post";

        try {
          const [liked, count] = await Promise.all([
            isPostLiked(postId, postType),
            getPostLikeCount(postId, postType),
          ]);

          return {
            postId,
            result: {
              isLiked: liked,
              likeCount: count,
            },
          };
        } catch (error) {
          console.error(`좋아요 상태 로드 실패 (${postId}):`, error);
          return {
            postId,
            result: {
              isLiked: false,
              likeCount: 0,
            },
          };
        }
      });

    // 모든 Promise를 병렬로 실행
    const results = await Promise.all(likePromises);
    
    // 결과를 객체로 변환
    results.forEach(({ postId, result }) => {
      if (result) {
        newLikesState[postId] = result;
      }
    });

    setLikesState((prev) => ({ ...prev, ...newLikesState }));
    return newLikesState;
  };

  // 댓글 수 로드 함수
  const loadCommentsForPosts = async (posts: Post[]): Promise<Record<string, number>> => {
    const newCommentCounts: Record<string, number> = {};

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 모든 게시글의 댓글 수를 병렬로 로드
    const commentPromises = posts
      .filter((post) => post.reviewType && post.id)
      .map(async (post) => {
        const postId = String(post.id);

        // UUID 형식이 아니면 스킵 (더미 데이터)
        if (!uuidRegex.test(postId)) {
          return { postId, count: null };
        }

        // reviewType을 comment API에 맞게 변환
        const commentPostType =
          post.reviewType === "procedure"
            ? "procedure"
            : post.reviewType === "hospital"
            ? "hospital"
            : "concern";

        try {
          const count = await getCommentCount(postId, commentPostType);
          return { postId, count };
        } catch (error) {
          console.error(`댓글 수 로드 실패 (${postId}):`, error);
          return { postId, count: 0 };
        }
      });

    // 모든 Promise를 병렬로 실행
    const results = await Promise.all(commentPromises);
    
    // 결과를 객체로 변환
    results.forEach(({ postId, count }) => {
      if (count !== null) {
        newCommentCounts[postId] = count;
      }
    });

    setCommentCounts((prev) => ({ ...prev, ...newCommentCounts }));
    return newCommentCounts;
  };

  // 조회수 로드 함수
  const loadViewsForPosts = async (posts: Post[]): Promise<Record<string, number>> => {
    const newViewCounts: Record<string, number> = {};

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 모든 게시글의 조회수를 병렬로 로드
    const viewPromises = posts
      .filter((post) => post.reviewType && post.id)
      .map(async (post) => {
        const postId = String(post.id);

        // UUID 형식이 아니면 스킵 (더미 데이터)
        if (!uuidRegex.test(postId)) {
          return { postId, count: null };
        }

        // reviewType을 view API에 맞게 변환
        const viewPostType =
          post.reviewType === "procedure"
            ? "procedure"
            : post.reviewType === "hospital"
            ? "hospital"
            : "concern";

        try {
          const count = await getViewCount(postId, viewPostType);
          return { postId, count };
        } catch (error) {
          console.error(`조회수 로드 실패 (${postId}):`, error);
          return { postId, count: 0 };
        }
      });

    // 모든 Promise를 병렬로 실행
    const results = await Promise.all(viewPromises);
    
    // 결과를 객체로 변환
    results.forEach(({ postId, count }) => {
      if (count !== null) {
        newViewCounts[postId] = count;
      }
    });

    setViewCounts((prev) => ({ ...prev, ...newViewCounts }));
    return newViewCounts;
  };

  // 인기글 점수 계산 함수
  const calculatePopularityScore = (
    post: Post,
    viewCount: number,
    likeCount: number,
    commentCount: number,
    createdAt?: string
  ): number => {
    const postId = String(post.id);
    
    // 기본 점수 계산 (가중치 적용)
    // 조회수: 가중치 1, 좋아요: 가중치 3, 댓글: 가중치 2
    const baseScore = 
      viewCount * 1 + 
      likeCount * 3 + 
      commentCount * 2;

    // 시간 가중치: 최근 글일수록 가산점
    // 24시간 이내: +50%, 7일 이내: +30%, 30일 이내: +10%
    let timeMultiplier = 1.0;
    if (createdAt) {
      const postDate = new Date(createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff <= 24) {
        timeMultiplier = 1.5; // 24시간 이내: 50% 가산점
      } else if (hoursDiff <= 168) { // 7일
        timeMultiplier = 1.3; // 7일 이내: 30% 가산점
      } else if (hoursDiff <= 720) { // 30일
        timeMultiplier = 1.1; // 30일 이내: 10% 가산점
      }
    }

    return baseScore * timeMultiplier;
  };

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

  // 좋아요 버튼 클릭 핸들러
  const handleLikeClick = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();

    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginRequiredPopup(true);
      return;
    }

    if (!post.reviewType || !post.id) {
      console.warn("좋아요 불가: reviewType 또는 id가 없습니다", post);
      return;
    }

    const postId = String(post.id);
    const postType =
      post.reviewType === "procedure"
        ? "treatment_review"
        : post.reviewType === "hospital"
        ? "hospital_review"
        : "concern_post";

    // UUID 형식 검증 (더미 데이터는 좋아요 불가)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      console.warn("더미 데이터는 좋아요할 수 없습니다:", postId);
      alert(t("alert.cannotLikeDummy"));
      return;
    }

    console.log("좋아요 클릭:", {
      postId,
      postType,
      reviewType: post.reviewType,
    });

    // 낙관적 업데이트
    const currentState = likesState[postId] || { isLiked: false, likeCount: 0 };
    const newIsLiked = !currentState.isLiked;
    const newLikeCount = newIsLiked
      ? currentState.likeCount + 1
      : Math.max(0, currentState.likeCount - 1);

    setLikesState((prev) => ({
      ...prev,
      [postId]: {
        isLiked: newIsLiked,
        likeCount: newLikeCount,
      },
    }));

    // 실제 API 호출
    try {
      const result = await togglePostLike(postId, postType);
      if (!result.success) {
        // 실패 시 원래 상태로 복구
        setLikesState((prev) => ({
          ...prev,
          [postId]: currentState,
        }));
        alert(result.error || "좋아요 처리에 실패했습니다.");
      } else {
        // 성공 시 최신 개수 다시 가져오기
        const count = await getPostLikeCount(postId, postType);
        setLikesState((prev) => ({
          ...prev,
          [postId]: {
            isLiked: result.isLiked,
            likeCount: count,
          },
        }));
      }
    } catch (error) {
      console.error("좋아요 처리 중 오류:", error);
      // 실패 시 원래 상태로 복구
      setLikesState((prev) => ({
        ...prev,
        [postId]: currentState,
      }));
      alert(t("alert.likeError"));
    }
  };

  // 카드 클릭 핸들러
  const handlePostClick = (post: Post) => {
    console.log("[PostList] 카드 클릭:", {
      postId: post.id,
      reviewType: post.reviewType,
      idType: typeof post.id,
    });

    // reviewType과 id가 있으면 상세페이지로 이동
    if (post.reviewType && post.id) {
      const postId = String(post.id);
      // 시술 후기와 병원 후기는 전용 상세 페이지로, 고민글은 통합 상세 페이지로
      if (post.reviewType === "procedure") {
        router.push(`/review/procedure/${postId}`);
      } else if (post.reviewType === "hospital") {
        router.push(`/review/hospital/${postId}`);
      } else {
        // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
        const fromTab = activeTab === "consultation" ? "consultation" : activeTab;
        router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
      }
    } else {
      console.warn("[PostList] 클릭 불가:", {
        reviewType: post.reviewType,
        id: post.id,
        post: post,
      });
    }
  };

  // 최신글: Supabase에서 데이터 가져오기
  useEffect(() => {
    if (activeTab === "latest") {
      const loadLatestReviews = async () => {
        try {
          setLoading(true);

          // Supabase에서 모든 후기 가져오기
          const [procedureReviews, hospitalReviews, concernPosts] =
            await Promise.all([
              loadProcedureReviews(50),
              loadHospitalReviews(50),
              loadConcernPosts(50),
            ]);

          // 시술 후기 변환
          const formattedProcedureReviews: Post[] = procedureReviews.map(
            (review: ProcedureReviewData) => ({
              id: review.id || `procedure-${Math.random()}`,
              category: review.category || "후기",
              username: maskNickname((review as any).nickname), // nickname 마스킹
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              created_at: review.created_at, // 정렬용
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "procedure" as const,
              procedure_name: review.procedure_name,
              hospital_name: review.hospital_name,
              procedure_rating: review.procedure_rating,
              hospital_rating: review.hospital_rating,
            })
          );

          // 병원 후기 변환
          const formattedHospitalReviews: Post[] = hospitalReviews.map(
            (review: HospitalReviewData) => ({
              id: review.id || `hospital-${Math.random()}`,
              category: review.category_large || "병원후기",
              username: maskNickname((review as any).nickname), // nickname 마스킹
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              created_at: review.created_at, // 정렬용
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "hospital" as const,
              hospital_name: review.hospital_name,
              procedure_name: review.procedure_name,
              overall_satisfaction: review.overall_satisfaction,
              hospital_rating: review.hospital_kindness,
            })
          );

          // 고민글 변환
          const formattedConcernPosts: Post[] = concernPosts.map(
            (post: ConcernPostData) => ({
              id: post.id || `concern-${Math.random()}`,
              category: post.concern_category || "고민글",
              username: maskNickname((post as any).nickname), // nickname 마스킹
              avatar: "👤",
              title: post.title, // 제목 추가
              content: post.content,
              timestamp: formatTimeAgo(post.created_at),
              created_at: post.created_at, // 정렬용
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "concern" as const,
            })
          );

          // 최신순으로 정렬 (created_at 기준, 모든 후기 통합)
          const allReviews = [
            ...formattedProcedureReviews,
            ...formattedHospitalReviews,
            ...formattedConcernPosts,
          ]
            .sort((a, b) => {
              const aDate = (a as any).created_at;
              const bDate = (b as any).created_at;
              if (!aDate && !bDate) return 0;
              if (!aDate) return 1;
              if (!bDate) return -1;
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            })
            .map(({ created_at, ...rest }) => rest); // created_at 제거

          setSupabaseReviews(allReviews);

          // 좋아요 상태, 댓글 수, 조회수 로드
          await Promise.all([
            loadLikesForPosts(allReviews),
            loadCommentsForPosts(allReviews),
            loadViewsForPosts(allReviews),
          ]);
        } catch (error) {
          console.error("❌ 최신글 데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      };

      loadLatestReviews();

      // 후기 추가 이벤트 리스너
      const handleReviewAdded = () => {
        loadLatestReviews();
      };

      window.addEventListener("reviewAdded", handleReviewAdded);
      return () => window.removeEventListener("reviewAdded", handleReviewAdded);
    }
  }, [activeTab]);

  // 인기글: 시술 후기/병원 후기 섹션으로 나누기
  useEffect(() => {
    if (activeTab === "popular") {
      const loadPopularReviews = async () => {
        try {
          setLoading(true);

          // Supabase에서 모든 후기 가져오기 (인기글은 추후 좋아요/조회수 기준으로 정렬 예정)
          const [procedureReviews, hospitalReviews] = await Promise.all([
            loadProcedureReviews(20),
            loadHospitalReviews(20),
          ]);

          // 시술 후기 변환
          const formattedProcedureReviews: Post[] = procedureReviews.map(
            (review: ProcedureReviewData) => ({
              id: review.id || `procedure-${Math.random()}`,
              category: review.category || "후기",
              username: maskNickname((review as any).nickname), // nickname 마스킹
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "procedure" as const,
              procedure_name: review.procedure_name,
              hospital_name: review.hospital_name,
              procedure_rating: review.procedure_rating,
              hospital_rating: review.hospital_rating,
              created_at: review.created_at, // 인기글 점수 계산용
            })
          );

          // 병원 후기 변환
          const formattedHospitalReviews: Post[] = hospitalReviews.map(
            (review: HospitalReviewData) => ({
              id: review.id || `hospital-${Math.random()}`,
              category: review.category_large || "병원후기",
              username: maskNickname((review as any).nickname), // nickname 마스킹
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "hospital" as const,
              hospital_name: review.hospital_name,
              procedure_name: review.procedure_name,
              overall_satisfaction: review.overall_satisfaction,
              hospital_rating: review.hospital_kindness,
              created_at: review.created_at, // 인기글 점수 계산용
            })
          );

          // 시술 후기와 병원 후기를 별도로 저장 (섹션으로 나누기 위해)
          const allPopularReviews = [
            ...formattedProcedureReviews,
            ...formattedHospitalReviews,
          ];

          // 좋아요 상태, 댓글 수, 조회수 로드 (결과를 직접 받아서 사용)
          const [loadedLikesState, loadedCommentCounts, loadedViewCounts] = await Promise.all([
            loadLikesForPosts(allPopularReviews),
            loadCommentsForPosts(allPopularReviews),
            loadViewsForPosts(allPopularReviews),
          ]);

          // 인기글 점수 계산 및 정렬
          const sortedPopularReviews = allPopularReviews
            .map((post) => {
              const postId = String(post.id);
              const viewCount = loadedViewCounts[postId] ?? 0;
              const likeCount = loadedLikesState[postId]?.likeCount ?? 0;
              const commentCount = loadedCommentCounts[postId] ?? 0;
              const createdAt = (post as any).created_at;

              const score = calculatePopularityScore(
                post,
                viewCount,
                likeCount,
                commentCount,
                createdAt
              );

              return {
                ...post,
                popularityScore: score,
              };
            })
            .sort((a, b) => {
              // 점수가 높은 순으로 정렬
              return (b as any).popularityScore - (a as any).popularityScore;
            })
            .map(({ popularityScore, ...rest }) => rest); // popularityScore 제거

          setSupabaseReviews(sortedPopularReviews);
        } catch (error) {
          console.error("❌ 인기글 데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      };

      loadPopularReviews();
    }
  }, [activeTab]);

  // 언어 변경 시 번역 상태 초기화
  useEffect(() => {
    setTranslationState({});
  }, [language]);

  // 고민상담소: Supabase 실제 데이터 + 더미 데이터 함께 사용
  // - Supabase에서 고민글을 불러오고
  // - 아직 데이터가 적거나 없으면 concernDummyPosts를 뒤에 붙여서 보여줌
  useEffect(() => {
    if (activeTab === "consultation") {
      const fetchConcernPosts = async () => {
        try {
          setLoading(true);

          let formattedConcernPosts: Post[] = [];
          try {
            const concernPosts = await loadConcernPosts(100);
            formattedConcernPosts = concernPosts.map(
              (post: ConcernPostData) => ({
                id: post.id || `concern-${Math.random()}`,
                category: post.concern_category || "고민글",
                username: maskNickname((post as any).nickname), // nickname 마스킹
                avatar: "👤",
                title: post.title, // 제목 추가
                content: post.content,
                images: (post as any).image_paths || undefined, // image_paths를 images로 매핑
                timestamp: formatTimeAgo(post.created_at),
                upvotes: 0,
                comments: 0,
                views: 0,
                reviewType: "concern" as const,
              })
            );
          } catch (error) {
            console.warn(
              "고민상담소 Supabase 데이터 로드 실패, 더미 데이터만 사용:",
              error
            );
          }

          // 실제 고민글 + 더미데이터를 함께 사용 (실제 데이터가 먼저, 부족한 부분은 더미로 보완)
          const combinedConcernPosts: Post[] = [
            ...formattedConcernPosts,
            ...concernDummyPosts,
          ];

          const filteredConcernPosts = combinedConcernPosts.filter((post) => {
            if (concernCategory === null) return true; // "전체" 선택 시 모두 표시
            if (!concernCategory) return true;
            return post.category === concernCategory;
          });

          setSupabaseReviews(filteredConcernPosts);

          // 좋아요 상태, 댓글 수, 조회수 로드
          await Promise.all([
            loadLikesForPosts(filteredConcernPosts),
            loadCommentsForPosts(filteredConcernPosts),
            loadViewsForPosts(filteredConcernPosts),
          ]);
        } finally {
          setLoading(false);
        }
      };

      fetchConcernPosts();
    }
  }, [activeTab, concernCategory]);

  let posts: Post[] = [];
  let procedurePosts: Post[] = [];
  let hospitalPosts: Post[] = [];

  if (activeTab === "recommended") {
    posts = recommendedPosts;
  } else if (activeTab === "latest") {
    // 최신글: 시술 후기와 병원 후기를 섹션으로 나누기
    procedurePosts = supabaseReviews.filter(
      (p) => p.reviewType === "procedure"
    );
    hospitalPosts = supabaseReviews.filter((p) => p.reviewType === "hospital");
    // 최신글: Supabase 데이터 + 기존 하드코딩된 데이터 (섞여서 표시)
    posts = [...supabaseReviews, ...latestPosts];
  } else if (activeTab === "popular") {
    // 인기글: 시술 후기와 병원 후기를 섹션으로 나누기
    procedurePosts = supabaseReviews.filter(
      (p) => p.reviewType === "procedure"
    );
    hospitalPosts = supabaseReviews.filter((p) => p.reviewType === "hospital");
    // 기존 하드코딩된 인기글도 추가 (섹션 구분 없이)
    posts = [...supabaseReviews, ...popularPosts];
  } else if (activeTab === "consultation") {
    // 고민상담소: 고민글만 표시 (이미 필터링되어 있음)
    posts = supabaseReviews;
  }

  if (loading && (activeTab === "latest" || activeTab === "consultation")) {
    return (
      <div className="px-4 py-8 text-center text-gray-500">
        {activeTab === "consultation"
          ? "고민글을 불러오는 중..."
          : "최신글을 불러오는 중..."}
      </div>
    );
  }

  // 최신글: 시술 후기/병원 후기 섹션으로 나누기 (탭 전환 방식)
  if (activeTab === "latest") {
    const switchSection = (section: "procedure" | "hospital") => {
      setLatestSection(section);
    };

    // 공통 포스트 렌더링 함수
    const handlePostClick = (post: Post) => {
      console.log("[PostList] 카드 클릭:", {
        postId: post.id,
        reviewType: post.reviewType,
        idType: typeof post.id,
      });

      // reviewType과 id가 있으면 상세페이지로 이동
      if (post.reviewType && post.id) {
        const postId = String(post.id);
        // 시술 후기와 병원 후기는 전용 상세 페이지로, 고민글은 통합 상세 페이지로
        if (post.reviewType === "procedure") {
          router.push(`/review/procedure/${postId}`);
        } else if (post.reviewType === "hospital") {
          router.push(`/review/hospital/${postId}`);
        } else {
          // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
          // activeTab은 이미 "latest"로 좁혀져 있으므로 "latest"를 사용
          const fromTab: "recommended" | "latest" | "popular" | "consultation" = "latest";
          router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
        }
      } else {
        console.warn("[PostList] 클릭 불가:", {
          reviewType: post.reviewType,
          id: post.id,
          post: post,
        });
      }
    };

    // 번역 핸들러
    const handleTranslate = async (e: React.MouseEvent, post: Post) => {
      e.stopPropagation();
      
      if (!post.id) return;
      const postId = String(post.id);
      const targetLang = language as LanguageCode;

      // 원본 텍스트의 언어 감지
      const contentText = post.content || "";
      const titleText = post.reviewType === "concern" && post.title ? post.title : "";
      const detectedSourceLang = detectLanguage(contentText || titleText);

      // 원본 언어와 목표 언어가 같으면 번역 불필요
      if (detectedSourceLang === targetLang) {
        return;
      }

      // 이미 번역 중이면 스킵
      if (translationState[postId]?.isTranslating) {
        return;
      }

      // 번역 상태 업데이트
      setTranslationState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isTranslating: true,
        },
      }));

      try {
        const translationPromises: Promise<{ text: string; detectedSourceLang?: string }>[] = [];
        
        if (post.reviewType === "concern" && post.title) {
          translationPromises.push(translateText(post.title, targetLang, null));
        } else {
          translationPromises.push(Promise.resolve({ text: "" }));
        }
        
        translationPromises.push(translateText(contentText, targetLang, null));

        const [translatedTitleResult, translatedContentResult] = await Promise.all(translationPromises);

        setTranslationState((prev) => ({
          ...prev,
          [postId]: {
            title: post.reviewType === "concern" && post.title ? translatedTitleResult.text : null,
            content: translatedContentResult.text,
            isTranslating: false,
            isTranslated: true,
          },
        }));
      } catch (error) {
        console.error("번역 실패:", error);
        setTranslationState((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isTranslating: false,
          },
        }));
      }
    };

    const handleShowOriginal = (e: React.MouseEvent, post: Post) => {
      e.stopPropagation();
      if (!post.id) return;
      const postId = String(post.id);
      setTranslationState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isTranslated: false,
        },
      }));
    };

    const renderPost = (post: Post) => {
      const postId = String(post.id);
      const translation = translationState[postId];
      const isTranslated = translation?.isTranslated || false;
      const isTranslating = translation?.isTranslating || false;
      const displayTitle = isTranslated && translation?.title ? translation.title : post.title;
      const displayContent = isTranslated && translation?.content ? translation.content : post.content;
      
      // 원본 텍스트의 언어 감지
      const contentText = post.content || "";
      const titleText = post.reviewType === "concern" && post.title ? post.title : "";
      const detectedSourceLang = detectLanguage(contentText || titleText);
      const targetLang = language as LanguageCode;
      const needsTranslation = detectedSourceLang && detectedSourceLang !== targetLang;

      return (
      <div
        key={post.id}
        onClick={() => handlePostClick(post)}
        className={`bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:border-primary-main/20 transition-all duration-300 cursor-pointer overflow-hidden group ${
          post.reviewType === "concern" ? "p-5" : "p-5"
        }`}
      >
        {/* 카테고리 */}
        <div className="mb-3">
          <span className="inline-flex items-center bg-gradient-to-r from-primary-light/20 to-primary-main/10 text-primary-main px-3 py-1.5 rounded-full text-xs font-semibold border border-primary-main/20">
            {post.category}
          </span>
        </div>

        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary-main flex items-center justify-center text-white font-semibold text-sm">
              {post.avatar || "👤"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {post.username || "익명"}
              </span>
              <span className="text-xs text-gray-500">{post.timestamp}</span>
              {post.edited && (
                <span className="text-xs text-gray-400">(수정됨)</span>
              )}
            </div>
          </div>
        </div>

        {/* 제목 (고민글만) */}
        {post.reviewType === "concern" && displayTitle && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-relaxed">
              <span className="bg-yellow-200/60 px-2 py-1 rounded-sm">
                {displayTitle}
              </span>
            </h3>
            {/* 번역 버튼 */}
            {needsTranslation && (
              <button
                onClick={(e) => isTranslated ? handleShowOriginal(e, post) : handleTranslate(e, post)}
                disabled={isTranslating}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isTranslated
                    ? "bg-primary-main/10 text-primary-main hover:bg-primary-main/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FiGlobe className="text-xs" />
                <span>{isTranslating ? "번역 중..." : isTranslated ? "원문" : "번역"}</span>
              </button>
            )}
          </div>
        )}

        {/* 시술 후기: 시술명과 별점 표시 */}
        {post.reviewType === "procedure" && post.procedure_name && (
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {post.procedure_name}
            </h3>
            {post.procedure_rating && (
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                <span className="text-sm font-semibold text-gray-700">
                  {post.procedure_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 병원 후기: 병원명과 별점 표시 */}
        {post.reviewType === "hospital" && post.hospital_name && (
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {post.hospital_name}
            </h3>
            {(post.overall_satisfaction || post.hospital_rating) && (
              <div className="flex items-center gap-3">
                {post.overall_satisfaction && (
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                    <span className="text-sm font-semibold text-gray-700">
                      시술 {post.overall_satisfaction.toFixed(1)}
                    </span>
                  </div>
                )}
                {post.hospital_rating && (
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                    <span className="text-sm font-semibold text-gray-700">
                      병원 {post.hospital_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 내용 */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {displayContent}
        </p>

        {/* 이미지 */}
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {post.images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                {typeof img === "string" &&
                (img.startsWith("http") ||
                  img.startsWith("blob:") ||
                  img.startsWith("/")) ? (
                  <Image
                    src={img}
                    alt={`게시글 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-5">
            {post.reviewType &&
              post.id &&
              (() => {
                const postId = String(post.id);
                const uuidRegex =
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                // UUID 형식인 경우에만 좋아요 버튼 표시 (실제 Supabase 데이터만)
                if (!uuidRegex.test(postId)) return null;
                return (
                  <button
                    onClick={(e) => handleLikeClick(e, post)}
                    className={`flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 ${
                      likesState[postId]?.isLiked
                        ? "text-red-500"
                        : "text-gray-600 hover:text-red-500"
                    }`}
                  >
                    <FiHeart
                      className={`text-lg ${
                        likesState[postId]?.isLiked ? "fill-red-500" : ""
                      }`}
                    />
                    <span className="text-xs font-semibold">
                      {likesState[postId]?.likeCount || 0}
                    </span>
                  </button>
                );
              })()}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (post.reviewType && post.id) {
                  const postId = String(post.id);
                  // 시술 후기와 병원 후기는 전용 상세 페이지로, 고민글은 통합 상세 페이지로
                  if (post.reviewType === "procedure") {
                    router.push(`/review/procedure/${postId}`);
                  } else if (post.reviewType === "hospital") {
                    router.push(`/review/hospital/${postId}`);
                  } else {
                    // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
                    const fromTab = activeTab === "consultation" ? "consultation" : activeTab;
                    router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
                  }
                }
              }}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-all hover:scale-110 active:scale-95"
            >
              <FiMessageCircle className="text-lg" />
              <span className="text-xs font-semibold">
                {post.reviewType && post.id
                  ? commentCounts[String(post.id)] ?? 0
                  : post.comments}
              </span>
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-all hover:scale-110 active:scale-95"
            >
              <FiEye className="text-base" />
              <span className="text-xs font-medium">
                {post.reviewType && post.id
                  ? viewCounts[String(post.id)] ?? 0
                  : post.views}
              </span>
            </button>
          </div>
          {needsTranslation && (
            <div className="flex items-center gap-2">
              {isTranslated ? (
                <button
                  onClick={(e) => handleShowOriginal(e, post)}
                  className="text-xs text-primary-main hover:underline"
                >
                  원문 보기
                </button>
              ) : (
                <button
                  onClick={(e) => handleTranslate(e, post)}
                  disabled={isTranslating}
                  className="flex items-center gap-1 text-xs text-primary-main hover:underline disabled:opacity-50"
                >
                  {isTranslating ? "번역 중..." : <><FiGlobe className="text-xs" /> 번역</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      );
    };

    return (
      <div className="px-4 pt-4 pb-4">
        {/* 섹션 전환 버튼 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => switchSection("procedure")}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              latestSection === "procedure"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            시술 후기
          </button>
          <button
            onClick={() => switchSection("hospital")}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              latestSection === "hospital"
                ? "bg-primary-main text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            병원 후기
          </button>
        </div>

        {/* 섹션별 게시글 표시 */}
        {latestSection === "procedure" ? (
          <div>
            <div className="space-y-4">
              {/* 실제 데이터 + 더미 데이터 합치기 */}
              {procedurePosts.length > 0 || latestProcedurePosts.length > 0 ? (
                <>
                  {procedurePosts.map(renderPost)}
                  {latestProcedurePosts.map(renderPost)}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  시술 후기가 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              {/* 실제 데이터 + 더미 데이터 합치기 */}
              {hospitalPosts.length > 0 || latestHospitalPosts.length > 0 ? (
                <>
                  {hospitalPosts.map(renderPost)}
                  {latestHospitalPosts.map(renderPost)}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  병원 후기가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
        
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
      </div>
    );
  }

  // 인기글: 시술 후기/병원 후기 섹션으로 나누기 (탭 전환 방식)
  if (activeTab === "popular") {
    const switchSection = (section: "procedure" | "hospital") => {
      setPopularSection(section);
    };

    // 공통 포스트 렌더링 함수
    const handlePostClick = (post: Post) => {
      console.log("[PostList] 카드 클릭:", {
        postId: post.id,
        reviewType: post.reviewType,
        idType: typeof post.id,
      });

      // reviewType과 id가 있으면 상세페이지로 이동
      if (post.reviewType && post.id) {
        const postId = String(post.id);
        // 시술 후기와 병원 후기는 전용 상세 페이지로, 고민글은 통합 상세 페이지로
        if (post.reviewType === "procedure") {
          router.push(`/review/procedure/${postId}`);
        } else if (post.reviewType === "hospital") {
          router.push(`/review/hospital/${postId}`);
        } else {
          // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
          const fromTab = activeTab === "consultation" ? "consultation" : activeTab;
          router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
        }
      } else {
        console.warn("[PostList] 클릭 불가:", {
          reviewType: post.reviewType,
          id: post.id,
          post: post,
        });
      }
    };

    // 번역 핸들러
    const handleTranslate = async (e: React.MouseEvent, post: Post) => {
      e.stopPropagation();
      
      if (!post.id) return;
      const postId = String(post.id);
      const targetLang = language as LanguageCode;

      // 원본 텍스트의 언어 감지
      const contentText = post.content || "";
      const titleText = post.reviewType === "concern" && post.title ? post.title : "";
      const detectedSourceLang = detectLanguage(contentText || titleText);

      // 원본 언어와 목표 언어가 같으면 번역 불필요
      if (detectedSourceLang === targetLang) {
        return;
      }

      // 이미 번역 중이면 스킵
      if (translationState[postId]?.isTranslating) {
        return;
      }

      // 번역 상태 업데이트
      setTranslationState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isTranslating: true,
        },
      }));

      try {
        const translationPromises: Promise<{ text: string; detectedSourceLang?: string }>[] = [];
        
        if (post.reviewType === "concern" && post.title) {
          translationPromises.push(translateText(post.title, targetLang, null));
        } else {
          translationPromises.push(Promise.resolve({ text: "" }));
        }
        
        translationPromises.push(translateText(contentText, targetLang, null));

        const [translatedTitleResult, translatedContentResult] = await Promise.all(translationPromises);

        setTranslationState((prev) => ({
          ...prev,
          [postId]: {
            title: post.reviewType === "concern" && post.title ? translatedTitleResult.text : null,
            content: translatedContentResult.text,
            isTranslating: false,
            isTranslated: true,
          },
        }));
      } catch (error) {
        console.error("번역 실패:", error);
        setTranslationState((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isTranslating: false,
          },
        }));
      }
    };

    const handleShowOriginal = (e: React.MouseEvent, post: Post) => {
      e.stopPropagation();
      if (!post.id) return;
      const postId = String(post.id);
      setTranslationState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isTranslated: false,
        },
      }));
    };

    const renderPost = (post: Post) => {
      const postId = String(post.id);
      const translation = translationState[postId];
      const isTranslated = translation?.isTranslated || false;
      const isTranslating = translation?.isTranslating || false;
      const displayTitle = isTranslated && translation?.title ? translation.title : post.title;
      const displayContent = isTranslated && translation?.content ? translation.content : post.content;
      
      // 원본 텍스트의 언어 감지
      const contentText = post.content || "";
      const titleText = post.reviewType === "concern" && post.title ? post.title : "";
      const detectedSourceLang = detectLanguage(contentText || titleText);
      const targetLang = language as LanguageCode;
      const needsTranslation = detectedSourceLang && detectedSourceLang !== targetLang;

      return (
      <div
        key={post.id}
        onClick={() => handlePostClick(post)}
        className={`bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:border-primary-main/20 transition-all duration-300 cursor-pointer overflow-hidden group ${
          post.reviewType === "concern" ? "p-5" : "p-5"
        }`}
      >
        {/* Category Tag */}
        <div className="mb-4">
          <span className="inline-flex items-center bg-gradient-to-r from-primary-light/20 to-primary-main/10 text-primary-main px-3 py-1.5 rounded-full text-xs font-semibold border border-primary-main/20">
            {post.category}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-light/30 to-primary-main/20 rounded-full flex items-center justify-center text-2xl shadow-sm ring-2 ring-white">
              {post.avatar}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">
                {post.username}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{post.timestamp}</span>
              {post.edited && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  수정됨
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title - 고민상담소 글에만 표시 */}
        {post.reviewType === "concern" && displayTitle && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-relaxed">
              <span className="bg-yellow-200/60 px-2 py-1 rounded-sm">
                {displayTitle}
              </span>
            </h3>
            {/* 번역 버튼 */}
            {needsTranslation && (
              <button
                onClick={(e) => isTranslated ? handleShowOriginal(e, post) : handleTranslate(e, post)}
                disabled={isTranslating}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isTranslated
                    ? "bg-primary-main/10 text-primary-main hover:bg-primary-main/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FiGlobe className="text-xs" />
                <span>{isTranslating ? "번역 중..." : isTranslated ? "원문" : "번역"}</span>
              </button>
            )}
          </div>
        )}

        {/* 시술 후기: 시술명과 별점 표시 */}
        {post.reviewType === "procedure" && post.procedure_name && (
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {post.procedure_name}
            </h3>
            {post.procedure_rating && (
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                <span className="text-sm font-semibold text-gray-700">
                  {post.procedure_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 병원 후기: 병원명과 별점 표시 */}
        {post.reviewType === "hospital" && post.hospital_name && (
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {post.hospital_name}
            </h3>
            {(post.overall_satisfaction || post.hospital_rating) && (
              <div className="flex items-center gap-3">
                {post.overall_satisfaction && (
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                    <span className="text-sm font-semibold text-gray-700">
                      시술 {post.overall_satisfaction.toFixed(1)}
                    </span>
                  </div>
                )}
                {post.hospital_rating && (
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                    <span className="text-sm font-semibold text-gray-700">
                      병원 {post.hospital_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Post Content */}
        <div className={post.reviewType === "concern" ? "mb-4" : "mb-4"}>
          <p
            className={`text-gray-800 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all`}
          >
            {displayContent}
          </p>
          {/* 번역 버튼 (고민글이 아닌 경우) */}
          {post.reviewType !== "concern" && needsTranslation && (
            <button
              onClick={(e) => isTranslated ? handleShowOriginal(e, post) : handleTranslate(e, post)}
              disabled={isTranslating}
              className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isTranslated
                  ? "bg-primary-main/10 text-primary-main hover:bg-primary-main/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } ${isTranslating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FiGlobe className="text-xs" />
              <span>{isTranslating ? "번역 중..." : isTranslated ? "원문" : "번역"}</span>
            </button>
          )}
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div
            className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${
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
                className={`relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden group/image ${
                  post.images!.length === 1 ? "aspect-video" : "aspect-square"
                }`}
              >
                {img &&
                (img.startsWith("http") ||
                  img.startsWith("blob:") ||
                  img.startsWith("/")) ? (
                  <Image
                    src={img}
                    alt={`후기 이미지 ${idx + 1}`}
                    fill
                    className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지
                  </div>
                )}
                {idx === 3 && post.images!.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm z-10">
                    +{post.images!.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-5">
            {post.reviewType &&
              post.id &&
              (() => {
                const postId = String(post.id);
                const uuidRegex =
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                // UUID 형식인 경우에만 좋아요 버튼 표시 (실제 Supabase 데이터만)
                if (!uuidRegex.test(postId)) return null;
                return (
                  <button
                    onClick={(e) => handleLikeClick(e, post)}
                    className={`flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 ${
                      likesState[postId]?.isLiked
                        ? "text-red-500"
                        : "text-gray-600 hover:text-red-500"
                    }`}
                  >
                    <FiHeart
                      className={`text-lg ${
                        likesState[postId]?.isLiked ? "fill-red-500" : ""
                      }`}
                    />
                    <span className="text-xs font-semibold">
                      {likesState[postId]?.likeCount || 0}
                    </span>
                  </button>
                );
              })()}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (post.reviewType && post.id) {
                  const postId = String(post.id);
                  // 시술 후기와 병원 후기는 전용 상세 페이지로, 고민글은 통합 상세 페이지로
                  if (post.reviewType === "procedure") {
                    router.push(`/review/procedure/${postId}`);
                  } else if (post.reviewType === "hospital") {
                    router.push(`/review/hospital/${postId}`);
                  } else {
                    // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
                    const fromTab = activeTab === "consultation" ? "consultation" : activeTab;
                    router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
                  }
                }
              }}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-all hover:scale-110 active:scale-95"
            >
              <FiMessageCircle className="text-lg" />
              <span className="text-xs font-semibold">
                {post.reviewType && post.id
                  ? commentCounts[String(post.id)] ?? 0
                  : post.comments}
              </span>
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-all hover:scale-110 active:scale-95"
            >
              <FiEye className="text-base" />
              <span className="text-xs font-medium">
                {post.reviewType && post.id
                  ? viewCounts[String(post.id)] ?? 0
                  : post.views}
              </span>
            </button>
          </div>
        </div>
      </div>
      );
    };

    return (
      <div className="pb-4">
        {/* 탭 메뉴 */}
        <div className="sticky top-[104px] z-30 bg-white px-4">
          <div className="flex gap-2 py-3">
            <button
              onClick={() => switchSection("procedure")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                popularSection === "procedure"
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("community.tab.procedureReview")}
            </button>
            <button
              onClick={() => switchSection("hospital")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                popularSection === "hospital"
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("community.tab.hospitalReview")}
            </button>
          </div>
        </div>

        {/* 선택된 섹션만 표시 */}
        <div className="px-4 pt-4">
          {popularSection === "procedure" ? (
            <div>
              <div className="space-y-4">
                {procedurePosts.length > 0 ? (
                  procedurePosts.map(renderPost)
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {t("common.noData")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                {hospitalPosts.length > 0 ? (
                  hospitalPosts.map(renderPost)
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {t("common.noData")}
                  </div>
                )}
              </div>
            </div>
          )}
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
      </div>
    );
  }

  // 최신글/추천글: 섞여서 표시
  return (
    <div className="px-4 pt-4 space-y-4 pb-4">
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => {
            // reviewType과 id가 있으면 상세페이지로 이동
            if (post.reviewType && post.id) {
              const postId = String(post.id);
              // 시술 후기와 병원 후기는 전용 상세 페이지로, 고민글은 통합 상세 페이지로
              if (post.reviewType === "procedure") {
                router.push(`/review/procedure/${postId}`);
              } else if (post.reviewType === "hospital") {
                router.push(`/review/hospital/${postId}`);
              } else {
                // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
                const fromTab = activeTab === "consultation" ? "consultation" : activeTab;
                router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
              }
            }
          }}
          className={`bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer ${
            post.reviewType === "concern" ? "p-5" : "p-4"
          }`}
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
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">
                {post.username}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{post.timestamp}</span>
                {post.edited && (
                  <span className="text-xs text-gray-400">
                    {t("label.edited")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Title - 고민상담소 글에만 표시 */}
          {post.reviewType === "concern" && post.title && (
            <h3 className="text-lg font-bold text-gray-900 mb-4 leading-relaxed">
              <span className="bg-yellow-200/60 px-2 py-1 rounded-sm">
                {post.title}
              </span>
            </h3>
          )}

          {/* 시술 후기: 시술명과 별점 표시 */}
          {post.reviewType === "procedure" && post.procedure_name && (
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {post.procedure_name}
              </h3>
              {post.procedure_rating && (
                <div className="flex items-center gap-1">
                  <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                  <span className="text-sm font-semibold text-gray-700">
                    {post.procedure_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 병원 후기: 병원명과 별점 표시 */}
          {post.reviewType === "hospital" && post.hospital_name && (
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {post.hospital_name}
              </h3>
              {(post.overall_satisfaction || post.hospital_rating) && (
                <div className="flex items-center gap-3">
                  {post.overall_satisfaction && (
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                      <span className="text-sm font-semibold text-gray-700">
                        시술 {post.overall_satisfaction.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {post.hospital_rating && (
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                      <span className="text-sm font-semibold text-gray-700">
                        병원 {post.hospital_rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Post Content */}
          <p
            className={`text-gray-800 text-sm leading-[1.8] line-clamp-3 ${
              post.reviewType === "concern" ? "mb-4" : "mb-3"
            }`}
          >
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
                      alt={`후기 이미지 ${idx + 1}`}
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {post.reviewType && post.id && (
                <button
                  onClick={(e) => handleLikeClick(e, post)}
                  className={`flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 ${
                    likesState[String(post.id)]?.isLiked
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                >
                  <FiHeart
                    className={`text-lg ${
                      likesState[String(post.id)]?.isLiked ? "fill-red-500" : ""
                    }`}
                  />
                  <span className="text-xs font-medium">
                    {likesState[String(post.id)]?.likeCount || 0}
                  </span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (post.reviewType && post.id) {
                    const postId = String(post.id);
                    // 고민글은 통합 상세 페이지로, 현재 탭 정보를 쿼리 파라미터로 전달
                    const fromTab = activeTab === "consultation" ? "consultation" : activeTab;
                    router.push(`/community/posts/${postId}?type=${post.reviewType}&fromTab=${fromTab}`);
                  }
                }}
                className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
              >
                <FiMessageCircle className="text-lg" />
                <span className="text-xs font-medium">
                  {post.reviewType && post.id
                    ? commentCounts[String(post.id)] ?? 0
                    : post.comments}
                </span>
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
              >
                <FiEye className="text-lg" />
                <span className="text-xs font-medium">
                  {post.reviewType && post.id
                    ? viewCounts[String(post.id)] ?? 0
                    : post.views}
                </span>
              </button>
            </div>
          </div>
        </div>
      ))}
      
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
    </div>
  );
}
