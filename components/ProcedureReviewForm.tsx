"use client";

import { useState, useEffect, useMemo } from "react";
import { FiArrowLeft, FiX, FiCamera, FiStar } from "react-icons/fi";
import Image from "next/image";
import {
  loadTreatmentsPaginated,
  Treatment,
  saveProcedureReview,
  getTreatmentAutocomplete,
} from "@/lib/api/beautripApi";
import { supabase } from "@/lib/supabase";
import { uploadReviewImages } from "@/lib/api/imageUpload";

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
  const [procedureSearchTerm, setProcedureSearchTerm] = useState("");
  const [showProcedureSuggestions, setShowProcedureSuggestions] =
    useState(false);
  const [procedureSuggestions, setProcedureSuggestions] = useState<string[]>(
    []
  );
  const [cost, setCost] = useState("");
  const [procedureRating, setProcedureRating] = useState(0);
  const [hospitalRating, setHospitalRating] = useState(0);
  const [gender, setGender] = useState<"여" | "남" | "">("");
  const [ageGroup, setAgeGroup] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // 대분류 카테고리 10개 (고정)
  const categories = [
    "눈성형",
    "리프팅",
    "보톡스",
    "안면윤곽/양악",
    "제모",
    "지방성형",
    "코성형",
    "피부",
    "필러",
    "가슴성형",
  ];
  const ageGroups = ["20대", "30대", "40대", "50대"];

  // 한국어 완성형 글자 체크 (자음만 입력 방지)
  const hasCompleteCharacter = (text: string): boolean => {
    // 완성형 한글(가-힣), 영문, 숫자가 1자 이상 포함되어 있는지 확인
    return /[가-힣a-zA-Z0-9]/.test(text);
  };

  // 시술명 자동완성 데이터 로드 (서버 사이드 검색)
  useEffect(() => {
    const loadAutocomplete = async () => {
      if (!procedureSearchTerm || procedureSearchTerm.trim().length < 1) {
        setProcedureSuggestions([]);
        setShowProcedureSuggestions(false);
        return;
      }

      // 완성형 글자가 1자 이상 있어야 자동완성 표시 (자음만 입력 방지)
      if (!hasCompleteCharacter(procedureSearchTerm)) {
        setProcedureSuggestions([]);
        setShowProcedureSuggestions(false);
        return;
      }

      try {
        // 카테고리가 선택되었으면 해당 카테고리의 시술 데이터를 로드해서 category_small 추출
        if (category) {
          // category_small 검색을 위해 직접 Supabase 쿼리 사용
          let query = supabase
            .from("treatment_master")
            .select("category_small")
            .eq("category_large", category)
            .not("category_small", "is", null);

          const { data, error } = await query.limit(1000);

          if (error) {
            throw new Error(`Supabase 오류: ${error.message}`);
          }

          // category_small 추출 및 중복 제거
          const allCategorySmall: string[] = Array.from(
            new Set(
              (data || [])
                .map((t: any) => t.category_small)
                .filter(
                  (small: any): small is string =>
                    typeof small === "string" && small.trim() !== ""
                )
            )
          );

          // 검색어로 필터링
          const searchTermLower = procedureSearchTerm.toLowerCase();
          const suggestions: string[] = allCategorySmall
            .filter((small: string) =>
              small.toLowerCase().includes(searchTermLower)
            )
            .slice(0, 10);

          setProcedureSuggestions(suggestions);
          // 검색 결과가 있으면 자동완성 표시
          if (suggestions.length > 0) {
            setShowProcedureSuggestions(true);
          }

          console.log("🔍 검색어:", procedureSearchTerm);
          console.log("🔍 선택된 카테고리:", category);
          console.log("🔍 전체 데이터 개수:", allCategorySmall.length);
          console.log("🔍 검색 결과 개수:", suggestions.length);
          if (suggestions.length > 0) {
            console.log("🔍 검색 결과:", suggestions);
          } else {
            console.log(
              "🔍 해당 카테고리의 모든 category_small:",
              allCategorySmall
            );
          }
        } else {
          // 카테고리가 선택되지 않았으면 기존 함수 사용
          const result = await getTreatmentAutocomplete(
            procedureSearchTerm,
            10
          );

          setProcedureSuggestions(result.treatmentNames);
          // 검색 결과가 있으면 자동완성 표시
          if (result.treatmentNames.length > 0) {
            setShowProcedureSuggestions(true);
          }

          console.log("🔍 검색어:", procedureSearchTerm);
          console.log("🔍 선택된 카테고리: 전체");
          console.log("🔍 검색 결과 개수:", result.treatmentNames.length);
          if (result.treatmentNames.length > 0) {
            console.log("🔍 검색 결과:", result.treatmentNames);
          }
        }
      } catch (error) {
        console.error("자동완성 데이터 로드 실패:", error);
        setProcedureSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      loadAutocomplete();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [procedureSearchTerm, category]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...files].slice(0, 4);
      setImageFiles(newFiles);
      // 미리보기용 URL 생성
      const newImages = newFiles.map((file) => URL.createObjectURL(file));
      setImages(newImages);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    // 미리보기 URL도 정리
    const newImages = newFiles.map((file) => URL.createObjectURL(file));
    // 기존 URL 해제
    images.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    setImages(newImages);
  };

  const handleSubmit = async () => {
    // 로그인 여부 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("로그인 후에만 시술 후기를 작성할 수 있습니다.");
      return;
    }

    // 필수 항목 검증
    // procedureName은 procedureSearchTerm에서 가져오거나 직접 입력된 값 사용
    const finalProcedureName = procedureName || procedureSearchTerm.trim();
    if (!category || !finalProcedureName || content.length < 10) {
      alert("필수 항목을 모두 입력하고 글을 10자 이상 작성해주세요.");
      return;
    }

    // 성별, 연령대 검증
    if (!gender || !ageGroup) {
      alert("성별과 연령대를 선택해주세요.");
      return;
    }

    // 만족도 검증
    if (procedureRating === 0 || hospitalRating === 0) {
      alert("시술 만족도와 병원 만족도를 모두 선택해주세요.");
      return;
    }

    try {
      // 먼저 후기 저장 (이미지 없이)
      const result = await saveProcedureReview({
        category,
        procedure_name: finalProcedureName,
        hospital_name: hospitalName || undefined,
        cost: cost ? parseInt(cost) : undefined,
        procedure_rating: procedureRating,
        hospital_rating: hospitalRating,
        gender,
        age_group: ageGroup,
        surgery_date: surgeryDate || undefined,
        content,
        images: undefined, // 먼저 이미지 없이 저장
        user_id: user.id, // Supabase Auth UUID
      });

      if (!result.success || !result.id) {
        alert(`시술후기 작성에 실패했습니다: ${result.error}`);
        return;
      }

      // 이미지가 있으면 업로드
      let imageUrls: string[] | undefined = undefined;
      if (imageFiles.length > 0 && result.id) {
        try {
          imageUrls = await uploadReviewImages(imageFiles, result.id);

          // 업로드된 이미지 URL로 후기 업데이트
          const { error: updateError } = await supabase
            .from("procedure_reviews")
            .update({ images: imageUrls })
            .eq("id", result.id);

          if (updateError) {
            console.error("이미지 URL 업데이트 실패:", updateError);
            // 이미지는 업로드되었지만 URL 업데이트 실패 - 경고만 표시
          }
        } catch (imageError: any) {
          console.error("이미지 업로드 실패:", imageError);
          alert(`이미지 업로드에 실패했습니다: ${imageError.message}`);
          // 이미지 업로드 실패해도 후기는 저장됨
        }
      }

      alert("시술후기가 성공적으로 작성되었습니다!");
      onSubmit();
    } catch (error: any) {
      console.error("시술후기 저장 오류:", error);
      alert(`시술후기 작성 중 오류가 발생했습니다: ${error.message}`);
    }
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
        {label} <span className="text-red-500">*</span>
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

      {/* 시술 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술 카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setProcedureSearchTerm(""); // 카테고리 변경 시 검색어 초기화
            setProcedureName("");
            setShowProcedureSuggestions(false); // 자동완성 닫기
            setProcedureSuggestions([]); // 자동완성 목록 초기화
          }}
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

      {/* 시술명(수술명) (자동완성 - 소분류) */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술명(수술명) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={procedureSearchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setProcedureSearchTerm(value);
            // 완성형 글자가 있을 때만 자동완성 표시
            if (hasCompleteCharacter(value)) {
              setShowProcedureSuggestions(true);
            } else {
              setShowProcedureSuggestions(false);
            }
            // 직접 입력 허용: 입력한 값이 자동완성 목록에 없어도 procedureName에 저장
            setProcedureName(value);
          }}
          onFocus={() => {
            if (
              procedureSearchTerm &&
              hasCompleteCharacter(procedureSearchTerm)
            ) {
              setShowProcedureSuggestions(true);
            }
          }}
          onBlur={() => {
            // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록
            setTimeout(() => {
              setShowProcedureSuggestions(false);
              // blur 시 현재 입력값을 procedureName에 저장 (직접 입력 허용)
              if (procedureSearchTerm) {
                setProcedureName(procedureSearchTerm);
              }
            }, 200);
          }}
          placeholder="시술명을 입력해 주세요."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
        {showProcedureSuggestions &&
          procedureSearchTerm &&
          hasCompleteCharacter(procedureSearchTerm) &&
          procedureSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {procedureSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setProcedureName(suggestion);
                    setProcedureSearchTerm(suggestion);
                    setShowProcedureSuggestions(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
      </div>

      {/* 전체적인 시술 만족도 */}
      <StarRating
        rating={procedureRating}
        onRatingChange={setProcedureRating}
        label="전체적인 시술 만족도 (1~5)"
      />

      {/* 병원 만족도 */}
      <StarRating
        rating={hospitalRating}
        onRatingChange={setHospitalRating}
        label="병원 만족도 (1~5)"
      />

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

      {/* 비용(선택사항) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          비용(선택사항)
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

      {/* 병원명 (선택사항) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          병원명(선택사항)
        </label>
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="병원명을 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 시술 날짜 (선택사항) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          시술 날짜(선택사항)
        </label>
        <input
          type="date"
          value={surgeryDate}
          onChange={(e) => setSurgeryDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 글 작성 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          글 작성 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="시술 경험을 자세히 작성해주세요 (10자 이상)"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}자 / 최소 10자 이상 작성해주세요
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
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-300"
            >
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
