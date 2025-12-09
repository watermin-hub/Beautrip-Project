"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiChevronRight, FiEdit3 } from "react-icons/fi";
import SearchModal from "./SearchModal";

interface Category {
  id: string;
  label: string;
}

const reviewCategories: Category[] = [
  { id: "all", label: "전체" },
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

export default function ReviewTabPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getCurrentCategoryLabel = () => {
    const category = reviewCategories.find((c) => c.id === selectedCategory);
    return category ? category.label : "전체 포토후기";
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 카테고리 변경 시 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white">
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
      
      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* 현재 카테고리 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">BeauTrip</span>
          <FiChevronRight className="text-gray-400 text-xs" />
          <span className="text-sm font-semibold text-gray-900">
            {getCurrentCategoryLabel()}
          </span>
        </div>
      </div>

      {/* 카테고리 목록 */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {reviewCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === category.id
                  ? "bg-primary-main text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 최근 게시물 총 목록 */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">브랜드 병원 게시글</h2>
          <button className="text-xs text-gray-500 hover:text-primary-main transition-colors">
            더보기
          </button>
        </div>
        
        {/* 간결한 게시글 목록 */}
        <div className="space-y-3">
          {[
            {
              id: 1,
              title: "자연스러운 코 수술 후기",
              content: "자연스러운 코 수술 결과를 원했는데 정말 만족스러워요. 원장님께서 정말 세심하게 진행해주셔서...",
              tag: "낮은코",
              likes: 46,
            },
            {
              id: 2,
              title: "세미아웃줘~~~ (2개월됐어)",
              likes: 46,
            },
            {
              id: 3,
              title: "두줄따기 재수술 한달차후기 (소세지눈)",
              likes: 31,
            },
          ].map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {/* 썸네일 이미지 */}
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex-shrink-0 flex items-center justify-center">
                <span className="text-xs text-gray-400">IMG</span>
              </div>
              
              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {post.title}
                  </h3>
                  {post.tag && (
                    <span className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                      {post.tag}
                    </span>
                  )}
                </div>
                {post.content && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {post.content}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">
                    {post.likes}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지 목록 (컬럼별) - Before&After */}
      <div className="px-4 py-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            브랜드 병원 등록 Before&After
          </h2>
          <button className="text-xs text-primary-main font-medium hover:text-primary-light transition-colors flex items-center gap-1">
            MORE
            <FiChevronRight className="text-xs" />
          </button>
        </div>
        
        {/* Before&After 컬럼 리스트 */}
        <div className="space-y-4">
          {/* 샘플 Before&After 카드들 */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex gap-3">
                {/* Before/After 이미지 */}
                <div className="flex gap-2 flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400">전</span>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-light/30 to-primary-main/20 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400">후</span>
                  </div>
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                    [병원명] 시술명 후기 제목이 여기에 표시됩니다
                  </h3>
                  
                  {/* 키워드 태그 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {["키워드1", "키워드2", "키워드3"].map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-primary-light/20 text-primary-main px-2 py-0.5 rounded text-[10px] font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  {/* 병원 정보 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">DX.</span>
                    <span className="text-[10px] text-gray-700 font-medium">
                      병원명의원
                    </span>
                    <span className="text-[10px] text-gray-500">Dr.의사명</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 총 게시글 수 */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            총 게시글 <span className="font-semibold text-gray-900">130,990</span>건
          </span>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <FiEdit3 className="text-gray-600 text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

