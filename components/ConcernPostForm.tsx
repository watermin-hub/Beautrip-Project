"use client";

import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { saveConcernPost } from "@/lib/api/beautripApi";

interface ConcernPostFormProps {
  onBack: () => void;
  onSubmit: () => void;
}

export default function ConcernPostForm({
  onBack,
  onSubmit,
}: ConcernPostFormProps) {
  const [title, setTitle] = useState("");
  const [concernCategory, setConcernCategory] = useState("");
  const [content, setContent] = useState("");

  // 커뮤니티 - 고민상담소 카테고리 (현재 선택 가능한 카테고리대로)
  const concernCategories = [
    "피부 고민",
    "시술 고민",
    "병원 선택",
    "가격 문의",
    "회복 기간",
    "부작용",
    "기타",
  ];

  const handleSubmit = async () => {
    // 필수 항목 검증
    if (!title || !concernCategory || content.length < 10) {
      alert("필수 항목을 모두 입력하고 글을 10자 이상 작성해주세요.");
      return;
    }

    try {
      // 데이터 저장
      const result = await saveConcernPost({
        title,
        concern_category: concernCategory,
        content,
        user_id: 0, // 현재는 로그인 기능이 없으므로 0으로 통일
      });

      if (result.success) {
        alert("고민글이 성공적으로 작성되었습니다!");
        onSubmit();
      } else {
        alert(`고민글 작성에 실패했습니다: ${result.error}`);
      }
    } catch (error: any) {
      console.error("고민글 저장 오류:", error);
      alert(`고민글 작성 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiArrowLeft className="text-gray-700 text-xl" />
        </button>
        <h3 className="text-lg font-bold text-gray-900">고민글 작성</h3>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="고민글 제목을 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 고민 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          고민 카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          value={concernCategory}
          onChange={(e) => setConcernCategory(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="">고민 카테고리를 선택하세요</option>
          {concernCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 고민 글 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          고민 글 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="고민이나 질문을 자세히 작성해주세요 (10자 이상)"
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}자 / 최소 10자 이상 작성해주세요
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-4 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-3 bg-primary-main hover:bg-primary-light text-white rounded-xl font-semibold transition-colors"
        >
          작성완료
        </button>
      </div>
    </div>
  );
}

