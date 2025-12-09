"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiTrendingUp, FiHeart, FiClock, FiChevronRight } from "react-icons/fi";
import CommunityPostCard from "./CommunityPostCard";

interface Post {
  id: number;
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
  hospitalName?: string;
}

// 추천 게시글 샘플 데이터
const recommendedPosts: Post[] = [
  {
    id: 1,
    category: "포토후기",
    username: "뷰티러버",
    avatar: "✨",
    content:
      "인모드 리프팅 3개월 후기! 턱선이 확실히 올라간 게 보이시나요? 특히 팔자주름 개선이 대박이었어요. 시술 과정도 무척 편안했고 원장님이 친절하게 설명해주셨어요.",
    images: ["before1", "after1"],
    timestamp: "2시간 전",
    upvotes: 156,
    comments: 89,
    views: 3456,
    likes: 234,
    hospitalName: "강남 클리닉",
  },
  {
    id: 2,
    category: "수술후기",
    username: "코성형러버",
    avatar: "👃",
    content:
      "코 성형 후기 남겨요! 자연스러운 느낌으로 하고 싶었는데 완벽하게 원하는 대로 나왔어요. 회복 기간도 생각보다 빨랐고 관리도 어렵지 않았어요.",
    images: ["nose1", "nose2", "nose3"],
    timestamp: "5시간 전",
    upvotes: 203,
    comments: 145,
    views: 5678,
    likes: 312,
  },
  {
    id: 3,
    category: "회복수다",
    username: "회복중",
    avatar: "💪",
    content:
      "수술 후 일주일째에요. 붓기 많이 빠졌고 통증도 거의 없어졌어요. 마사지와 찜질 열심히 하고 있는데 효과가 있는 것 같아요!",
    timestamp: "1일 전",
    upvotes: 89,
    comments: 67,
    views: 2345,
    hospitalName: "서울 병원",
  },
];

export default function CommunityRecommendations() {
  const router = useRouter();
  const [scrappedPosts, setScrappedPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const scraps = JSON.parse(localStorage.getItem("communityScraps") || "[]");
    setScrappedPosts(new Set(scraps));
  }, []);

  const handleScrap = (postId: number) => {
    const newScraps = new Set(scrappedPosts);
    if (newScraps.has(postId)) {
      newScraps.delete(postId);
    } else {
      newScraps.add(postId);
    }
    setScrappedPosts(newScraps);
  };

  const handleHospitalInfo = (postId: number) => {
    router.push("/explore?tab=hospital");
  };

  return (
    <div className="px-4 py-6 bg-gradient-to-br from-primary-light/5 to-primary-main/5 rounded-2xl mx-4 mb-6 border border-primary-light/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary-main/10 p-2 rounded-lg">
            <FiTrendingUp className="text-primary-main text-lg" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">추천 게시글</h3>
            <p className="text-xs text-gray-500">지금 인기 있는 후기를 만나보세요</p>
          </div>
        </div>
        <button
          onClick={() => {
            router.push("/community?tab=recommended");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-primary-main text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          더보기
          <FiChevronRight />
        </button>
      </div>

      {/* Featured Post Cards */}
      <div className="space-y-3">
        {recommendedPosts.slice(0, 2).map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            onScrap={handleScrap}
            onHospitalInfo={handleHospitalInfo}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-primary-light/20 flex items-center justify-around">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary-main mb-1">
            <FiHeart className="text-sm" />
            <span className="text-xs font-semibold">이번 주</span>
          </div>
          <p className="text-xs text-gray-600">후기 등록 수</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">1,234</p>
        </div>
        <div className="w-px h-12 bg-primary-light/30"></div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary-main mb-1">
            <FiClock className="text-sm" />
            <span className="text-xs font-semibold">평균</span>
          </div>
          <p className="text-xs text-gray-600">체류 시간</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">12분</p>
        </div>
        <div className="w-px h-12 bg-primary-light/30"></div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary-main mb-1">
            <FiTrendingUp className="text-sm" />
            <span className="text-xs font-semibold">활성</span>
          </div>
          <p className="text-xs text-gray-600">활성 사용자</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">5,678</p>
        </div>
      </div>
    </div>
  );
}

