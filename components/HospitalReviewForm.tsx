"use client";

import { useState, useEffect, useMemo } from "react";
import { FiArrowLeft, FiX, FiCamera, FiStar } from "react-icons/fi";
import Image from "next/image";
import {
  loadTreatmentsPaginated,
  Treatment,
  saveHospitalReview,
  updateHospitalReview,
  getTreatmentAutocomplete,
  getTreatmentTableName,
  getCategoryLargeList,
} from "@/lib/api/beautripApi";
import { supabase } from "@/lib/supabase";
import { uploadReviewImages } from "@/lib/api/imageUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackReviewStart, trackReviewSubmit } from "@/lib/gtm";

interface HospitalReviewFormProps {
  onBack: () => void;
  onSubmit: () => void;
  editData?: any; // 수정할 데이터 (선택적)
}

export default function HospitalReviewForm({
  onBack,
  onSubmit,
  editData,
}: HospitalReviewFormProps) {
  const { t, language } = useLanguage();
  const [hospitalName, setHospitalName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [categoryLarge, setCategoryLarge] = useState("");
  const [procedureSearchTerm, setProcedureSearchTerm] = useState("");
  const [showProcedureSuggestions, setShowProcedureSuggestions] =
    useState(false);
  const [procedureSuggestions, setProcedureSuggestions] = useState<string[]>(
    []
  );
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);
  const [hospitalKindness, setHospitalKindness] = useState(0);
  const [hasTranslation, setHasTranslation] = useState<boolean | null>(null);
  const [translationSatisfaction, setTranslationSatisfaction] = useState(0);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // 언어별 카테고리 목록 로드
  useEffect(() => {
    const loadCategories = async () => {
      const categoryList = await getCategoryLargeList(language);
      setCategories(categoryList);
    };
    loadCategories();
  }, [language]);

  // editData가 있으면 폼 필드 채우기
  useEffect(() => {
    if (editData) {
      setHospitalName(editData.hospital_name || "");
      setVisitDate(editData.visit_date || "");
      setCategoryLarge(editData.category_large || "");
      setProcedureSearchTerm(editData.procedure_name || "");
      setSelectedProcedure(editData.procedure_name || "");
      setOverallSatisfaction(editData.overall_satisfaction || 0);
      setHospitalKindness(editData.hospital_kindness || 0);
      setHasTranslation(editData.has_translation ?? null);
      setTranslationSatisfaction(editData.translation_satisfaction || 0);
      setContent(editData.content || "");
      // 기존 이미지가 있으면 표시 (URL 배열)
      if (editData.images && Array.isArray(editData.images)) {
        setImages(editData.images);
      }
    }
  }, [editData]);

  // GTM 이벤트: review_start (후기 작성 화면 진입 완료 시점)
  useEffect(() => {
    // entry_source는 대부분 "mypage" 또는 "community"에서 진입
    // URL 경로를 확인하여 정확한 진입 경로 판단
    const entrySource = window.location.pathname.includes("/mypage") 
      ? "mypage" 
      : "community";
    trackReviewStart(entrySource);
  }, []);

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
        if (categoryLarge) {
          // category_small 검색을 위해 직접 Supabase 쿼리 사용
          const treatmentTable = getTreatmentTableName();
          let query = supabase
            .from(treatmentTable)
            .select("category_small")
            .eq("category_large", categoryLarge)
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
          } else {
            setShowProcedureSuggestions(false);
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
          } else {
            setShowProcedureSuggestions(false);
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
  }, [procedureSearchTerm, categoryLarge]);

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

  const handleSubmit = async () => {
    // 로그인 여부 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert(t("form.loginRequiredReview"));
      return;
    }

    // 필수 항목 검증
    if (
      !hospitalName ||
      !categoryLarge ||
      hasTranslation === null ||
      content.length < 10
    ) {
      alert(t("form.requiredFields"));
      return;
    }

    try {
      // procedure_name은 selectedProcedure 또는 procedureSearchTerm에서 가져오기
      const finalProcedureName =
        selectedProcedure || procedureSearchTerm.trim() || undefined;

      // 수정 모드인지 확인
      const isEditMode = editData && editData.id;

      if (isEditMode) {
        // 수정 모드
        let imageUrls: string[] | undefined = undefined;

        // 새로 업로드한 이미지가 있으면 업로드
        if (imageFiles.length > 0) {
          try {
            imageUrls = await uploadReviewImages(imageFiles, editData.id);
          } catch (imageError: any) {
            console.error("이미지 업로드 실패:", imageError);
            alert(`${t("form.imageUploadFailed")}: ${imageError.message}`);
            return;
          }
        } else {
          // 새 이미지가 없으면 기존 이미지 유지
          imageUrls = editData.images || undefined;
        }

        // 기존 이미지와 새 이미지 합치기
        const existingImageUrls = editData.images?.filter((img: string) => 
          img && (img.startsWith("http") || img.startsWith("/"))
        ) || [];
        const finalImageUrls = imageUrls || existingImageUrls;

        const result = await updateHospitalReview(editData.id, {
          hospital_name: hospitalName,
          category_large: categoryLarge,
          procedure_name: finalProcedureName,
          visit_date: visitDate || undefined,
          overall_satisfaction:
            overallSatisfaction > 0 ? overallSatisfaction : undefined,
          hospital_kindness: hospitalKindness > 0 ? hospitalKindness : undefined,
          has_translation: hasTranslation ?? false,
          translation_satisfaction:
            hasTranslation && translationSatisfaction > 0
              ? translationSatisfaction
              : undefined,
          content,
          images: finalImageUrls,
          user_id: user.id,
        });

        if (!result.success) {
          alert(`${t("form.saveFailed")}: ${result.error}`);
          return;
        }

        alert(t("form.saveSuccess"));
        onSubmit();
      } else {
        // 작성 모드
        // 먼저 후기 저장 (이미지 없이)
        const result = await saveHospitalReview({
          hospital_name: hospitalName,
          category_large: categoryLarge,
          procedure_name: finalProcedureName,
          visit_date: visitDate || undefined,
          overall_satisfaction:
            overallSatisfaction > 0 ? overallSatisfaction : undefined,
          hospital_kindness: hospitalKindness > 0 ? hospitalKindness : undefined,
          has_translation: hasTranslation ?? false,
          translation_satisfaction:
            hasTranslation && translationSatisfaction > 0
              ? translationSatisfaction
              : undefined,
          content,
          images: undefined, // 먼저 이미지 없이 저장
          user_id: user.id, // Supabase Auth UUID
        });

        if (!result.success || !result.id) {
          alert(`${t("form.saveFailed")}: ${result.error}`);
          return;
        }

        // 이미지가 있으면 업로드
        let imageUrls: string[] | undefined = undefined;
        if (imageFiles.length > 0 && result.id) {
          try {
            console.log("=== 이미지 업로드 시작 ===");
            console.log("imageFiles 개수:", imageFiles.length);
            console.log("reviewId:", result.id);
            imageUrls = await uploadReviewImages(imageFiles, result.id);
            console.log("=== 이미지 업로드 완료 ===");
            console.log("업로드된 이미지 URL들:", imageUrls);

            // 업로드된 이미지 URL로 후기 업데이트
            const { error: updateError } = await supabase
              .from("hospital_reviews")
              .update({ images: imageUrls })
              .eq("id", result.id);

            if (updateError) {
              console.error("이미지 URL 업데이트 실패:", updateError);
              // 이미지는 업로드되었지만 URL 업데이트 실패 - 경고만 표시
            }
          } catch (imageError: any) {
            console.error("이미지 업로드 실패:", imageError);
            alert(`${t("form.imageUploadFailed")}: ${imageError.message}`);
            // 이미지 업로드 실패해도 후기는 저장됨
          }
        }

        // GTM 이벤트: review_submit (후기 저장 API 성공 응답 이후)
        trackReviewSubmit("hospital");
        
        alert(t("form.saveSuccess"));
        onSubmit();
      }
    } catch (error: any) {
      console.error("병원후기 저장 오류:", error);
      alert(`${t("form.errorOccurred")}: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 병원명 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.hospitalName")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder={t("form.hospitalNamePlaceholder")}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 시술 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.procedureCategory")} <span className="text-red-500">*</span>
        </label>
        <select
          value={categoryLarge}
          onChange={(e) => {
            setCategoryLarge(e.target.value);
            setProcedureSearchTerm(""); // 카테고리 변경 시 검색어 초기화
            setSelectedProcedure("");
            setShowProcedureSuggestions(false); // 자동완성 닫기
            setProcedureSuggestions([]); // 자동완성 목록 초기화
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="">{t("form.selectCategory")}</option>
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
          {t("form.procedureNameOptional")}
        </label>
        <input
          type="text"
          value={procedureSearchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setProcedureSearchTerm(value);
            // 완성형 글자가 없으면 자동완성 숨기기
            if (!hasCompleteCharacter(value)) {
              setShowProcedureSuggestions(false);
              setProcedureSuggestions([]);
            }
            // onChange에서는 selectedProcedure를 업데이트하지 않음
            // 자동완성 선택 시에만 selectedProcedure 업데이트
            // showProcedureSuggestions는 loadAutocomplete에서 검색 결과가 있을 때만 true로 설정
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
              // blur 시 selectedProcedure가 없으면 현재 입력값을 저장 (직접 입력 허용)
              // 하지만 자동완성에서 선택한 경우에는 이미 selectedProcedure가 설정되어 있으므로 덮어쓰지 않음
              if (procedureSearchTerm && !selectedProcedure) {
                setSelectedProcedure(procedureSearchTerm);
              }
            }, 200);
          }}
          placeholder={
            t("form.procedureNamePlaceholder") || "시술명을 입력해 주세요."
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
        {showProcedureSuggestions &&
          procedureSearchTerm &&
          hasCompleteCharacter(procedureSearchTerm) &&
          procedureSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {procedureSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(e) => {
                    // onMouseDown을 사용하여 onBlur보다 먼저 실행되도록
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedProcedure(suggestion);
                    setProcedureSearchTerm(suggestion);
                    setShowProcedureSuggestions(false);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedProcedure(suggestion);
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
        rating={overallSatisfaction}
        onRatingChange={setOverallSatisfaction}
        label={t("form.overallSatisfactionLabel")}
      />

      {/* 병원 만족도 */}
      <StarRating
        rating={hospitalKindness}
        onRatingChange={setHospitalKindness}
        label={t("form.hospitalSatisfactionLabel")}
      />

      {/* 통역 여부 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.translationAvailable")}{" "}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setHasTranslation(true)}
            className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
              hasTranslation === true
                ? "border-primary-main bg-primary-main/10 text-primary-main"
                : "border-gray-300 text-gray-700"
            }`}
          >
            {t("form.translationYes")}
          </button>
          <button
            type="button"
            onClick={() => setHasTranslation(false)}
            className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
              hasTranslation === false
                ? "border-primary-main bg-primary-main/10 text-primary-main"
                : "border-gray-300 text-gray-700"
            }`}
          >
            {t("form.translationNo")}
          </button>
        </div>
      </div>

      {/* 통역 만족도 */}
      {hasTranslation === true && (
        <StarRating
          rating={translationSatisfaction}
          onRatingChange={setTranslationSatisfaction}
          label={t("form.translationSatisfactionLabel")}
        />
      )}

      {/* 병원 방문일 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.visitDateLabel")}
        </label>
        <div className="relative">
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            onClick={(e) => {
              const input = e.currentTarget as HTMLInputElement;
              if (input.showPicker) {
                input.showPicker();
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main cursor-pointer"
            style={{
              color: visitDate ? "inherit" : "transparent",
            }}
            placeholder=""
          />
          {!visitDate && (
            <div className="absolute inset-0 flex items-center px-4 pointer-events-none text-gray-500">
              {t("placeholder.selectDate")}
            </div>
          )}
        </div>
      </div>

      {/* 글 작성 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.writeReview")} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("form.visitDatePlaceholder")}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}
          {t("form.minCharacters")}
        </p>
      </div>

      {/* 사진첨부 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FiCamera className="text-primary-main" />
          {t("form.photoAttachmentMax")}
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
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-3 bg-primary-main hover:bg-primary-light text-white rounded-xl font-semibold transition-colors"
        >
          {t("common.writeComplete")}
        </button>
      </div>
    </div>
  );
}
