"use client";

import { useState } from "react";
import { FiArrowLeft, FiX, FiCamera, FiTag, FiStar } from "react-icons/fi";
import Image from "next/image";

interface HospitalReviewFormProps {
  onBack: () => void;
  onSubmit: () => void;
}

export default function HospitalReviewForm({
  onBack,
  onSubmit,
}: HospitalReviewFormProps) {
  const [visitDate, setVisitDate] = useState("");
  const [categoryLarge, setCategoryLarge] = useState("");
  const [categoryMid, setCategoryMid] = useState("");
  const [categorySmall, setCategorySmall] = useState("");
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);
  const [hospitalKindness, setHospitalKindness] = useState(0);
  const [hasTranslation, setHasTranslation] = useState(false);
  const [translationSatisfaction, setTranslationSatisfaction] = useState(0);
  const [appSatisfaction, setAppSatisfaction] = useState(0);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const categories = ["피부관리", "흉터/자국", "윤곽/리프팅", "코성형", "눈성형", "보톡스/필러", "체형/지방", "기타"];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const StarRating = ({
    rating,
    onRatingChange,
    label,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="p-1"
          >
            <FiStar
              className={`text-2xl ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = () => {
    if (!visitDate || !categoryLarge || content.length < 30) {
      alert("필수 항목을 모두 입력하고 글을 30자 이상 작성해주세요.");
      return;
    }
    onSubmit();
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
        <h3 className="text-lg font-bold text-gray-900">병원 후기 작성</h3>
      </div>

      {/* 병원 방문일 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          병원 방문일 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 시술 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술 카테고리 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <select
            value={categoryLarge}
            onChange={(e) => setCategoryLarge(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
          >
            <option value="">대분류 선택</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {categoryLarge && (
            <select
              value={categoryMid}
              onChange={(e) => setCategoryMid(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="">중분류 선택</option>
              <option value="중분류1">중분류1</option>
              <option value="중분류2">중분류2</option>
            </select>
          )}
          {categoryMid && (
            <select
              value={categorySmall}
              onChange={(e) => setCategorySmall(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="">소분류 선택</option>
              <option value="소분류1">소분류1</option>
              <option value="소분류2">소분류2</option>
            </select>
          )}
        </div>
      </div>

      {/* 전체적인 수술 만족도 */}
      <StarRating
        rating={overallSatisfaction}
        onRatingChange={setOverallSatisfaction}
        label="전체적인 수술 만족도 (1~5)"
      />

      {/* 병원 친절도 */}
      <StarRating
        rating={hospitalKindness}
        onRatingChange={setHospitalKindness}
        label="병원 친절도 (1~5)"
      />

      {/* 통역 여부 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          통역 여부
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setHasTranslation(true)}
            className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
              hasTranslation
                ? "border-primary-main bg-primary-main/10 text-primary-main"
                : "border-gray-300 text-gray-700"
            }`}
          >
            있음
          </button>
          <button
            type="button"
            onClick={() => setHasTranslation(false)}
            className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
              !hasTranslation
                ? "border-primary-main bg-primary-main/10 text-primary-main"
                : "border-gray-300 text-gray-700"
            }`}
          >
            없음
          </button>
        </div>
      </div>

      {/* 통역 만족도 */}
      {hasTranslation && (
        <StarRating
          rating={translationSatisfaction}
          onRatingChange={setTranslationSatisfaction}
          label="통역 만족도 (1~5)"
        />
      )}

      {/* 앱사용만족도 */}
      <StarRating
        rating={appSatisfaction}
        onRatingChange={setAppSatisfaction}
        label="앱사용만족도 (1~5)"
      />

      {/* 글 작성 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          글 작성 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="병원 방문 경험을 자세히 작성해주세요 (30자 이상)"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}자 / 최소 30자 이상 작성해주세요
        </p>
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FiTag className="text-primary-main" />
          태그
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="#태그를 입력하세요 (쉼표로 구분)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 사진첨부 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FiCamera className="text-primary-main" />
          사진첨부 (최대 4장)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-300">
              <Image
                src={img}
                alt={`Uploaded ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-main transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="text-center">
                <FiCamera className="text-2xl text-gray-400 mx-auto mb-2" />
                <span className="text-xs text-gray-500">사진 추가</span>
              </div>
            </label>
          )}
        </div>
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

