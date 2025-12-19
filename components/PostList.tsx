"use client";

import { FiArrowUp, FiMessageCircle, FiEye, FiHeart } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  loadProcedureReviews,
  loadHospitalReviews,
  loadConcernPosts,
  ProcedureReviewData,
  HospitalReviewData,
  ConcernPostData,
} from "@/lib/api/beautripApi";

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

const latestPosts: Post[] = [
  {
    id: 1,
    category: "자유수다",
    username: "신규회원123",
    avatar: "🦋",
    content:
      "안녕하세요! 처음 가입했는데 정보가 많아서 좋네요. 앞으로 잘 부탁드려요~",
    timestamp: "방금 전",
    upvotes: 5,
    comments: 2,
    views: 123,
  },
  {
    id: 2,
    category: "질문답변",
    username: "궁금한이",
    avatar: "🤔",
    content:
      "리쥬란 힐러 시술 받은 지 일주일인데 아직 효과가 안 보여요. 정상인가요?",
    timestamp: "5분 전",
    upvotes: 3,
    comments: 8,
    views: 234,
  },
  {
    id: 3,
    category: "정보공유",
    username: "정보나눔",
    avatar: "📚",
    content:
      "강남역 신규 오픈한 클리닉 정보 공유해요! 오픈 기념 이벤트 진행 중이라고 하네요",
    timestamp: "10분 전",
    upvotes: 12,
    comments: 15,
    views: 456,
  },
  {
    id: 4,
    category: "자유수다",
    username: "시술러버",
    avatar: "💖",
    content:
      "오늘 보톡스 맞고 왔는데 얼굴이 좀 붓네요ㅠㅠ 정상인 거 맞죠? 첫 시술이라 걱정돼요",
    images: ["swollen1"],
    timestamp: "15분 전",
    upvotes: 7,
    comments: 12,
    views: 345,
  },
  {
    id: 5,
    category: "정보공유",
    username: "가격비교왕",
    avatar: "💰",
    content:
      "올해부터 필러 가격이 올랐다고 들었는데 실제로 어떠세요? 최근 시술 받으신 분들 가격 정보 공유해주세요!",
    timestamp: "20분 전",
    upvotes: 18,
    comments: 24,
    views: 567,
  },
  {
    id: 6,
    category: "질문답변",
    username: "초보자",
    avatar: "🌿",
    content:
      "눈 재수술 생각 중인데 어떤 의원 추천받을 수 있을까요? 첫 수술 실패한 경험이 있어서 더 신중하게 선택하고 싶어요",
    timestamp: "30분 전",
    upvotes: 9,
    comments: 18,
    views: 412,
  },
  {
    id: 7,
    category: "자유수다",
    username: "뷰티매니아",
    avatar: "💎",
    content:
      "오늘 클리닉 다녀왔는데 직원분들 친절하시고 분위기도 좋았어요! 만족스러운 시술이었습니다",
    timestamp: "45분 전",
    upvotes: 14,
    comments: 7,
    views: 389,
  },
  {
    id: 8,
    category: "정보공유",
    username: "리프팅전문가",
    avatar: "✨",
    content:
      "인모드 리프팅 시술 전 주의사항 정리해서 올려봅니다. 시술 받기 전에 꼭 확인하시면 좋을 것 같아요!",
    images: ["info1", "info2"],
    timestamp: "1시간 전",
    edited: true,
    upvotes: 25,
    comments: 31,
    views: 892,
  },
];

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
  const router = useRouter();
  const [supabaseReviews, setSupabaseReviews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularSection, setPopularSection] = useState<
    "procedure" | "hospital"
  >("procedure");

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

      if (post.reviewType === "procedure") {
        router.push(`/review/procedure/${postId}`);
      } else if (post.reviewType === "hospital") {
        router.push(`/review/hospital/${postId}`);
      } else if (post.reviewType === "concern") {
        // 고민글 상세보기는 추후 구현
        router.push(`/community?tab=consultation`);
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
              username: (review as any).nickname || "익명", // nickname 사용
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
            })
          );

          // 병원 후기 변환
          const formattedHospitalReviews: Post[] = hospitalReviews.map(
            (review: HospitalReviewData) => ({
              id: review.id || `hospital-${Math.random()}`,
              category: review.category_large || "병원후기",
              username: (review as any).nickname || "익명", // nickname 사용
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
            })
          );

          // 고민글 변환
          const formattedConcernPosts: Post[] = concernPosts.map(
            (post: ConcernPostData) => ({
              id: post.id || `concern-${Math.random()}`,
              category: post.concern_category || "고민글",
              username: (post as any).nickname || "익명", // nickname 사용
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
              username: (review as any).nickname || "익명", // nickname 사용
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "procedure" as const,
            })
          );

          // 병원 후기 변환
          const formattedHospitalReviews: Post[] = hospitalReviews.map(
            (review: HospitalReviewData) => ({
              id: review.id || `hospital-${Math.random()}`,
              category: review.category_large || "병원후기",
              username: (review as any).nickname || "익명", // nickname 사용
              avatar: "👤",
              content: review.content,
              images: review.images,
              timestamp: formatTimeAgo(review.created_at),
              edited: false,
              upvotes: 0,
              comments: 0,
              views: 0,
              reviewType: "hospital" as const,
            })
          );

          // 시술 후기와 병원 후기를 별도로 저장 (섹션으로 나누기 위해)
          setSupabaseReviews([
            ...formattedProcedureReviews,
            ...formattedHospitalReviews,
          ]);
        } catch (error) {
          console.error("❌ 인기글 데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      };

      loadPopularReviews();
    }
  }, [activeTab]);

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
                username: (post as any).nickname || "익명", // nickname 사용
                avatar: "👤",
                title: post.title, // 제목 추가
                content: post.content,
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

        if (post.reviewType === "procedure") {
          router.push(`/review/procedure/${postId}`);
        } else if (post.reviewType === "hospital") {
          router.push(`/review/hospital/${postId}`);
        } else if (post.reviewType === "concern") {
          // 고민글 상세보기는 추후 구현
          router.push(`/community?tab=consultation`);
        }
      } else {
        console.warn("[PostList] 클릭 불가:", {
          reviewType: post.reviewType,
          id: post.id,
          post: post,
        });
      }
    };

    const renderPost = (post: Post) => (
      <div
        key={post.id}
        onClick={() => handlePostClick(post)}
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
                <span className="text-xs text-gray-400">수정됨</span>
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
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  이미지
                </div>
                {idx === 3 && post.images!.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-semibold text-xs">
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
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
            >
              <FiArrowUp className="text-lg" />
              <span className="text-xs font-medium">{post.upvotes}</span>
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
            >
              <FiMessageCircle className="text-lg" />
              <span className="text-xs font-medium">{post.comments}</span>
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
            >
              <FiEye className="text-lg" />
              <span className="text-xs font-medium">{post.views}</span>
            </button>
            {post.likes && (
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
              >
                <FiHeart className="text-lg" />
                <span className="text-xs font-medium">{post.likes}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );

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
              시술 후기
            </button>
            <button
              onClick={() => switchSection("hospital")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                popularSection === "hospital"
                  ? "bg-primary-main text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              병원 후기
            </button>
          </div>
        </div>

        {/* 선택된 섹션만 표시 */}
        <div className="px-4 pt-4">
          {popularSection === "procedure" ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                시술 후기
              </h2>
              <div className="space-y-4">
                {procedurePosts.length > 0 ? (
                  procedurePosts.map(renderPost)
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    시술 후기가 없습니다.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                병원 후기
              </h2>
              <div className="space-y-4">
                {hospitalPosts.length > 0 ? (
                  hospitalPosts.map(renderPost)
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    병원 후기가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
              if (post.reviewType === "procedure") {
                router.push(`/review/procedure/${postId}`);
              } else if (post.reviewType === "hospital") {
                router.push(`/review/hospital/${postId}`);
              } else if (post.reviewType === "concern") {
                router.push(`/community?tab=consultation`);
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
                  <span className="text-xs text-gray-400">수정됨</span>
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지
                  </div>
                  {idx === 3 && post.images!.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-semibold text-xs">
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
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
              >
                <FiArrowUp className="text-lg" />
                <span className="text-xs font-medium">{post.upvotes}</span>
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
              >
                <FiMessageCircle className="text-lg" />
                <span className="text-xs font-medium">{post.comments}</span>
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
              >
                <FiEye className="text-lg" />
                <span className="text-xs font-medium">{post.views}</span>
              </button>
              {post.likes && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors"
                >
                  <FiHeart className="text-lg" />
                  <span className="text-xs font-medium">{post.likes}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
