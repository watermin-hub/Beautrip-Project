"use client";

import { useState } from "react";
import { FiArrowLeft, FiX, FiCamera, FiTag } from "react-icons/fi";
import Image from "next/image";

interface ProcedureReviewFormProps {
  onBack: () => void;
  onSubmit: () => void;
}

export default function ProcedureReviewForm({
  onBack,
  onSubmit,
}: ProcedureReviewFormProps) {
  const [surgeryDate, setSurgeryDate] = useState("");
  const [category, setCategory] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [cost, setCost] = useState("");
  const [surgeryTime, setSurgeryTime] = useState("");
  const [recoveryPeriod, setRecoveryPeriod] = useState("");
  const [gender, setGender] = useState<"여" | "남" | "">("");
  const [ageGroup, setAgeGroup] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const categories = ["피부관리", "흉터/자국", "윤곽/리프팅", "코성형", "눈성형", "보톡스/필러", "체형/지방", "기타"];
  const ageGroups = ["20대", "30대", "40대", "50대"];
  const procedureOptions = ["리프팅", "보톡스", "필러", "레이저", "주사", "기타"];

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

  const handleSubmit = () => {
    if (!surgeryDate || !category || !hospitalName || !procedureName || content.length < 30) {
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
        <h3 className="text-lg font-bold text-gray-900">시술 후기 작성</h3>
      </div>

      {/* 시술 날짜 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술 날짜 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={surgeryDate}
          onChange={(e) => setSurgeryDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="">카테고리를 선택하세요</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 병원명 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          병원명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="병원명의 2글자 이상 입력"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
        <p className="text-xs text-gray-500 mt-1">
          ※ 일부(2글자 이상)를 입력하시면 해당 병원명을 선택하실 수 있습니다.
        </p>
      </div>

      {/* 시술, 수술 명 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술, 수술 명 <span className="text-red-500">*</span>
        </label>
        <select
          value={procedureName}
          onChange={(e) => setProcedureName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="">시술, 수술 명을 선택하세요</option>
          {procedureOptions.map((proc) => (
            <option key={proc} value={proc}>
              {proc}
            </option>
          ))}
        </select>
      </div>

      {/* 시술, 수술 비용 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술, 수술 비용 (만원)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-700">₩</span>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="수술 비용"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
          />
          <span className="text-gray-700">만원</span>
        </div>
      </div>

      {/* 시술, 수술 시간 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술, 수술 시간 (분)
        </label>
        <input
          type="number"
          value={surgeryTime}
          onChange={(e) => setSurgeryTime(e.target.value)}
          placeholder="시술 시간"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 회복기간 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          회복기간 (일)
        </label>
        <input
          type="number"
          value={recoveryPeriod}
          onChange={(e) => setRecoveryPeriod(e.target.value)}
          placeholder="회복기간"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 성별 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          성별 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setGender("여")}
            className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
              gender === "여"
                ? "border-primary-main bg-primary-main/10 text-primary-main"
                : "border-gray-300 text-gray-700"
            }`}
          >
            여
          </button>
          <button
            type="button"
            onClick={() => setGender("남")}
            className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
              gender === "남"
                ? "border-primary-main bg-primary-main/10 text-primary-main"
                : "border-gray-300 text-gray-700"
            }`}
          >
            남
          </button>
        </div>
      </div>

      {/* 연령 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          연령 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ageGroups.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => setAgeGroup(age)}
              className={`py-3 rounded-xl border-2 transition-colors ${
                ageGroup === age
                  ? "border-primary-main bg-primary-main/10 text-primary-main"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {age}
            </button>
          ))}
        </div>
      </div>

      {/* 글 작성 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          글 작성 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="시술 경험을 자세히 작성해주세요 (30자 이상)"
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
        <p className="text-xs text-gray-500 mt-1">
          태그는 한글, 숫자, 영어, 쉼표만 입력 가능합니다.
        </p>
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

