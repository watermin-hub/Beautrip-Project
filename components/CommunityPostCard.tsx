"use client";

import { useState } from "react";
import {
  FiArrowUp,
  FiMessageCircle,
  FiEye,
  FiHeart,
  FiBookmark,
  FiMapPin,
  FiCamera,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

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

interface CommunityPostCardProps {
  post: Post;
  onScrap?: (postId: number) => void;
  onHospitalInfo?: (postId: number) => void;
}

export default function CommunityPostCard({
  post,
  onScrap,
  onHospitalInfo,
}: CommunityPostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setUpvotes(isLiked ? upvotes - 1 : upvotes + 1);
  };

  const handleScrap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScrapped(!isScrapped);
    if (onScrap) onScrap(post.id);
    
    // localStorage에 저장
    const scraps = JSON.parse(localStorage.getItem("communityScraps") || "[]");
    if (isScrapped) {
      const updated = scraps.filter((id: number) => id !== post.id);
      localStorage.setItem("communityScraps", JSON.stringify(updated));
    } else {
      localStorage.setItem("communityScraps", JSON.stringify([...scraps, post.id]));
    }
  };

  const handleHospitalInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHospitalInfo) onHospitalInfo(post.id);
    router.push("/explore?tab=hospital");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group">
      {/* Category Tag */}
      <div className="mb-3 flex items-center justify-between">
        <span className="bg-primary-light/20 text-primary-main px-3 py-1 rounded-full text-xs font-medium">
          {post.category}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleScrap}
            className={`p-1.5 rounded-full transition-colors ${
              isScrapped
                ? "bg-primary-main/10 text-primary-main"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FiBookmark className={`text-sm ${isScrapped ? "fill-primary-main" : ""}`} />
          </button>
          {post.hospitalName && (
            <button
              onClick={handleHospitalInfo}
              className="p-1.5 bg-primary-main/10 text-primary-main rounded-full hover:bg-primary-main/20 transition-colors"
            >
              <FiMapPin className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-light/30 to-primary-main/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {post.username}
            </span>
            {post.hospitalName && (
              <span className="text-xs text-gray-500 truncate">
                @ {post.hospitalName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{post.timestamp}</span>
            {post.edited && (
              <span className="text-xs text-gray-400">수정됨</span>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-gray-800 text-sm mb-3 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
        {post.content}
      </p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div
          className={`grid gap-2 mb-3 rounded-lg overflow-hidden ${
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
              className={`relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden group/image ${
                post.images!.length === 1 ? "max-h-96" : ""
              }`}
            >
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                <FiCamera className="text-2xl mb-1" />
              </div>
              {post.images!.length > 1 && idx === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-lg">
                  +{post.images!.length - 4}
                </div>
              )}
              {idx === 0 && post.images!.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <FiCamera className="text-xs" />
                  {post.images!.length}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${
            isLiked ? "text-primary-main" : "text-gray-600 hover:text-primary-main"
          }`}
        >
          <FiArrowUp className={`text-base ${isLiked ? "fill-primary-main" : ""}`} />
          <span className="text-xs font-medium">{upvotes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary-main transition-colors">
          <FiMessageCircle className="text-base" />
          <span className="text-xs font-medium">{post.comments}</span>
        </button>
        <div className="flex items-center gap-1.5 text-gray-400">
          <FiEye className="text-sm" />
          <span className="text-xs">{post.views.toLocaleString()}</span>
        </div>
        {post.likes && (
          <div className="flex items-center gap-1.5 text-gray-600 ml-auto">
            <FiHeart className="text-base text-primary-main fill-primary-main" />
            <span className="text-xs font-medium">{post.likes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

