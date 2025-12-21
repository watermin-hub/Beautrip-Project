"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiChevronRight, FiEdit3, FiBell, FiCamera } from "react-icons/fi";
import SearchModal from "./SearchModal";

interface Category {
  id: string;
  label: string;
}

// 대분류 카테고리 (메인 카테고리)
const mainCategories: Category[] = [
  { id: "nose", label: "코성형수술후기" },
  { id: "eye", label: "눈성형수술후기" },
  { id: "vision", label: "시력교정후기" },
  { id: "contour", label: "윤곽/FACE후기" },
  { id: "jaw", label: "양악교정치과후기" },
  { id: "breast", label: "가슴성형수술후기" },
  { id: "body", label: "체형바디성형후기" },
  { id: "petit", label: "쁘띠레이저후기" },
  { id: "nose-removal", label: "코제거/재건후기" },
  { id: "male", label: "남자성형수술후기" },
  { id: "integrated", label: "통합발품후기" },
  { id: "failure", label: "실패&부작용" },
  { id: "hospital-reg", label: "병원등록후기" },
  { id: "chat", label: "성형수다" },
];

// 중분류 카테고리 (코성형의 경우 예시)
const subCategoriesByMain: Record<string, Category[]> = {
  nose: [
    { id: "all", label: "전체" },
    { id: "low-nose", label: "낮은코" },
    { id: "crooked-nose", label: "휜코" },
    { id: "bulbous-nose", label: "복코" },
    { id: "aquiline-nose", label: "매부리코" },
  ],
  eye: [
    { id: "all", label: "전체" },
    { id: "double-eyelid", label: "쌍꺼풀" },
    { id: "ptosis", label: "눈매교정" },
    { id: "undereye", label: "눈밑지방" },
  ],
  default: [{ id: "all", label: "전체" }],
};

interface Post {
  id: number;
  title: string;
  author: string;
  views: number;
  comments: number;
  timestamp: string;
  tags: string[];
  thumbnail?: string;
}

// 샘플 게시글 데이터
const samplePosts: Post[] = [
  {
    id: 1,
    title: "AB성형외과 자가늑코재수술 4개월차 후기 공유해요",
    author: "뷰티러버123",
    views: 1250,
    comments: 23,
    timestamp: "2시간 전",
    tags: ["#재수술", "#자가늑연골"],
    thumbnail: "thumb1",
  },
  {
    id: 2,
    title: "코 성형 후 자연스러운 결과 만족해요! 원장님 추천",
    author: "만족회원",
    views: 892,
    comments: 15,
    timestamp: "5시간 전",
    tags: ["#첫수술", "#자연스러움"],
    thumbnail: "thumb2",
  },
  {
    id: 3,
    title: "휜코 교정 수술 받고 왔어요 - 3개월 후기",
    author: "코고민중",
    views: 634,
    comments: 8,
    timestamp: "1일 전",
    tags: ["#휜코", "#교정"],
    thumbnail: "thumb3",
  },
  {
    id: 4,
    title: "복코 수술 후기입니다. 사진 첨부했어요!",
    author: "사진러버",
    views: 1567,
    comments: 42,
    timestamp: "1일 전",
    tags: ["#복코", "#비돌기"],
    thumbnail: "thumb4",
  },
  {
    id: 5,
    title: "매부리코 수술 만족 후기 남겨요",
    author: "만족중",
    views: 723,
    comments: 12,
    timestamp: "2일 전",
    tags: ["#매부리코", "#코끝"],
    thumbnail: "thumb5",
  },
];

export default function CategoryPhotoReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mainCategoryId = searchParams.get("category") || "nose";
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const currentMainCategory = mainCategories.find((c) => c.id === mainCategoryId) || mainCategories[0];
  const subCategories = subCategoriesByMain[mainCategoryId] || subCategoriesByMain.default;

  const handleMainCategoryClick = (categoryId: string) => {
    router.push(`/community/photo-review?category=${categoryId}`);
    setSelectedSubCategory("all");
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubCategoryClick = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(samplePosts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPosts = samplePosts.slice(startIndex, endIndex);

  return (
    <div className="bg-white min-h-screen">
      {/* 검색 바 */}
      <div className="sticky top-[48px] z-20 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-3 transition-colors"
          >
            <FiSearch className="text-gray-400 text-lg" />
            <span className="text-sm text-gray-500 flex-1 text-left">
              검색어를 입력해주세요
            </span>
          </button>
        </div>
      </div>

      {/* 대분류 카테고리 명 */}
      <div className="px-4 pt-16 pb-3 bg-white border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">
          {currentMainCategory.label}
        </h1>
      </div>

      {/* 다른 카테고리 목록 */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {mainCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleMainCategoryClick(category.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                mainCategoryId === category.id
                  ? "bg-primary-main text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 전체 게시글 수 / 알림 / 글쓰기 */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">130,990</span>건
        </span>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors relative">
            <FiBell className="text-gray-600 text-lg" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <FiEdit3 className="text-gray-600 text-lg" />
          </button>
        </div>
      </div>

      {/* 전체 / 중분류 카테고리 */}
      {subCategories.length > 1 && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {subCategories.map((subCategory) => (
              <button
                key={subCategory.id}
                onClick={() => handleSubCategoryClick(subCategory.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSubCategory === subCategory.id
                    ? "bg-primary-main text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {subCategory.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="px-4 py-4 space-y-3">
        {currentPosts.map((post) => (
          <div
            key={post.id}
            className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
          >
            {/* 썸네일 */}
            {post.thumbnail && (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex-shrink-0 flex items-center justify-center">
                <FiCamera className="text-gray-400 text-xl" />
              </div>
            )}

            {/* 게시글 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2">
                {post.title}
              </h3>

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-primary-main font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span className="font-medium text-gray-700">{post.author}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
                <span>•</span>
                <span>조회 {post.views.toLocaleString()}</span>
                <span>•</span>
                <span>댓글 {post.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            이전 페이지
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 text-sm rounded ${
                    currentPage === pageNum
                      ? "bg-primary-main text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                {currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                {currentPage < totalPages - 2 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 text-sm rounded bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors"
                  >
                    {totalPages}
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            다음 페이지
          </button>
        </div>
      </div>

      {/* 페이지 목록 (컬럼별) - Before&After 섹션 */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            브랜드 병원 등록 Before&After
          </h2>
          <button className="text-xs text-primary-main font-medium hover:text-primary-light transition-colors flex items-center gap-1">
            MORE
            <FiChevronRight className="text-xs" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Before/After 이미지 */}
              <div className="relative aspect-square">
                <div className="absolute inset-0 grid grid-cols-2 gap-0">
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-500">전</span>
                  </div>
                  <div className="bg-gradient-to-br from-primary-light/30 to-primary-main/20 flex items-center justify-center">
                    <span className="text-xs text-gray-500">후</span>
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-2">
                <h3 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">
                  [병원명] 시술명
                </h3>
                <div className="flex flex-wrap gap-1 mb-1">
                  {["키워드1", "키워드2"].map((keyword, idx) => (
                    <span
                      key={idx}
                      className="bg-primary-light/20 text-primary-main px-1.5 py-0.5 rounded text-[10px] font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500">
                  DX. 병원명 Dr.의사명
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

