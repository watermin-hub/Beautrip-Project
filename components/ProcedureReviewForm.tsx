"use client";

import { useState, useEffect, useMemo } from "react";
import { FiArrowLeft, FiX, FiCamera, FiStar } from "react-icons/fi";
import Image from "next/image";
import {
  loadTreatmentsPaginated,
  Treatment,
  saveProcedureReview,
  updateProcedureReview,
  getTreatmentAutocomplete,
  getTreatmentTableName,
  getCategoryLargeList,
} from "@/lib/api/beautripApi";
import { supabase } from "@/lib/supabase";
import { uploadReviewImages } from "@/lib/api/imageUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  trackReviewStart,
  trackReviewSubmit,
  type EntrySource,
} from "@/lib/gtm";
import {
  getCurrencyFromLanguage,
  getCurrencySymbol,
  getCurrencyUnitText,
  convertToKRWManwon,
  convertFromKRWManwon,
} from "@/lib/utils/currencyConverter";
import { convertCategoryToKorean } from "@/lib/utils/categoryMapper";

interface ProcedureReviewFormProps {
  onBack: () => void;
  onSubmit: () => void;
  onLoginRequired?: (data: any) => void; // 로그인 필요 시 콜백
  draftData?: any; // 중간 저장된 리뷰 데이터
  editData?: any; // 수정할 데이터 (선택적)
}

export default function ProcedureReviewForm({
  onBack,
  onSubmit,
  onLoginRequired,
  draftData,
  editData,
}: ProcedureReviewFormProps) {
  const { t, language } = useLanguage();
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

  // 화폐 관련
  const currency = getCurrencyFromLanguage(language);
  const currencySymbol = getCurrencySymbol(currency);
  const currencyUnitText = getCurrencyUnitText(currency, language);
  const [procedureRating, setProcedureRating] = useState(0);
  const [hospitalRating, setHospitalRating] = useState(0);
  const [gender, setGender] = useState<"여" | "남" | "">("");
  const [ageGroup, setAgeGroup] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const ageGroups = [
    { value: "20대", label: t("label.age20s") },
    { value: "30대", label: t("label.age30s") },
    { value: "40대", label: t("label.age40s") },
    { value: "50대", label: t("label.age50s") },
  ];

  // 언어별 카테고리 목록 로드
  useEffect(() => {
    const loadCategories = async () => {
      console.log(
        `[ProcedureReviewForm] 카테고리 로드 시작 - 언어: ${language}`
      );
      const categoryList = await getCategoryLargeList(language);
      console.log(`[ProcedureReviewForm] 받은 카테고리 목록:`, categoryList);
      setCategories(categoryList);
    };
    loadCategories();
  }, [language]);

  // editData가 있으면 폼 필드 채우기
  useEffect(() => {
    if (editData) {
      setCategory(editData.category || "");
      setProcedureName(editData.procedure_name || "");
      setProcedureSearchTerm(editData.procedure_name || "");
      setHospitalName(editData.hospital_name || "");
      // 원화 만원 단위를 사용자 화폐로 변환해서 표시
      const costInUserCurrency = convertFromKRWManwon(editData.cost, currency);
      setCost(costInUserCurrency);
      setProcedureRating(editData.procedure_rating || 0);
      setHospitalRating(editData.hospital_rating || 0);
      setGender(editData.gender || "");
      setAgeGroup(editData.age_group || "");
      setSurgeryDate(editData.surgery_date || "");
      setContent(editData.content || "");
      // 기존 이미지가 있으면 표시 (URL 배열)
      if (editData.images && Array.isArray(editData.images)) {
        setImages(editData.images);
      }
    }
  }, [editData, currency]);

  // 중간 저장된 리뷰 불러오기
  useEffect(() => {
    if (draftData && !editData) {
      setCategory(draftData.category || "");
      setProcedureName(draftData.procedure_name || "");
      setProcedureSearchTerm(draftData.procedure_name || "");
      setHospitalName(draftData.hospital_name || "");
      // 원화 만원 단위를 사용자 화폐로 변환해서 표시
      const costInUserCurrency = convertFromKRWManwon(draftData.cost, currency);
      setCost(costInUserCurrency);
      setProcedureRating(draftData.procedure_rating || 0);
      setHospitalRating(draftData.hospital_rating || 0);
      setGender(draftData.gender || "");
      setAgeGroup(draftData.age_group || "");
      setSurgeryDate(draftData.surgery_date || "");
      setContent(draftData.content || "");
      if (draftData.images && Array.isArray(draftData.images)) {
        setImages(draftData.images);
      }
      // 불러온 후 로컬 스토리지에서 삭제
      localStorage.removeItem("review_draft_procedure");
    }
  }, [draftData, editData, currency]);

  // GTM 이벤트: review_start (페이지에서 열릴 때만 호출, 로그인 상태에서만, 모달은 CommunityWriteModal에서 처리)
  useEffect(() => {
    // 모달이 아닌 페이지에서 열릴 때만 호출 (onLoginRequired가 없으면 페이지)
    if (!onLoginRequired) {
      const checkAuthAndTrack = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // 로그인 상태에서만 GTM 이벤트 발생
        if (session?.user) {
          const searchParams = new URLSearchParams(window.location.search);
          const qsSource =
            searchParams.get("entry_source") || searchParams.get("entrySource");

          let fallbackByPath: EntrySource = "unknown";
          const path = window.location.pathname;
          if (path.includes("/mypage")) fallbackByPath = "mypage";
          else if (path.includes("/explore")) fallbackByPath = "explore";
          else if (path === "/" || path === "/home") fallbackByPath = "home";
          else if (path.includes("/community")) fallbackByPath = "community";

          const entrySource: EntrySource =
            qsSource &&
            ["home", "explore", "community", "mypage"].includes(qsSource)
              ? (qsSource as EntrySource)
              : fallbackByPath;

          console.log("[GTM] review_start 이벤트 트리거 (페이지):", {
            entrySource,
            qsSource,
            fallbackByPath,
            path,
          });
          trackReviewStart(entrySource);
        }
      };

      checkAuthAndTrack();
    }
  }, [onLoginRequired]);

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
          // 언어별 테이블을 사용하므로 lang 필터 불필요
          const treatmentTable = getTreatmentTableName(language);
          let query = supabase
            .from(treatmentTable)
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
          } else {
            setShowProcedureSuggestions(false);
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
            10,
            language
          );

          setProcedureSuggestions(result.treatmentNames);
          // 검색 결과가 있으면 자동완성 표시
          if (result.treatmentNames.length > 0) {
            setShowProcedureSuggestions(true);
          } else {
            setShowProcedureSuggestions(false);
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
      // 비로그인 시 중간 저장하고 로그인 팝업 표시
      const reviewData = {
        category,
        procedure_name: procedureName || procedureSearchTerm.trim(),
        hospital_name: hospitalName,
        cost: cost ? parseInt(cost) : undefined,
        procedure_rating: procedureRating,
        hospital_rating: hospitalRating,
        gender,
        age_group: ageGroup,
        surgery_date: surgeryDate,
        content,
        images,
      };

      if (onLoginRequired) {
        onLoginRequired(reviewData);
        return;
      } else {
        alert(t("form.loginRequiredProcedure"));
        return;
      }
    }

    // 필수 항목 검증
    // procedureName은 procedureSearchTerm에서 가져오거나 직접 입력된 값 사용
    const finalProcedureName = procedureName || procedureSearchTerm.trim();
    if (!category || !finalProcedureName || content.length < 10) {
      alert(t("form.requiredFields"));
      return;
    }

    // 성별, 연령대 검증
    if (!gender || !ageGroup) {
      alert(t("form.selectGenderAge"));
      return;
    }

    // 만족도 검증
    if (procedureRating === 0 || hospitalRating === 0) {
      alert(t("form.selectSatisfaction"));
      return;
    }

    try {
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
            alert(
              t("form.imageUploadError").replace(
                "{message}",
                imageError.message
              )
            );
            return;
          }
        } else {
          // 새 이미지가 없으면 기존 이미지 유지
          imageUrls = editData.images || undefined;
        }

        // 기존 이미지와 새 이미지 합치기 (기존 이미지가 URL이고 새 이미지가 blob인 경우)
        const existingImageUrls =
          editData.images?.filter(
            (img: string) =>
              img && (img.startsWith("http") || img.startsWith("/"))
          ) || [];
        const finalImageUrls = imageUrls || existingImageUrls;

        // 사용자 화폐를 원화 만원 단위로 변환
        const costInKRWManwon = convertToKRWManwon(cost, currency);
        // 번역된 카테고리를 한국어 원본값으로 변환 (CHECK 제약조건 위반 방지)
        const koreanCategory = convertCategoryToKorean(category);

        const result = await updateProcedureReview(editData.id, {
          category: koreanCategory,
          procedure_name: finalProcedureName,
          hospital_name: hospitalName || undefined,
          cost: costInKRWManwon || undefined,
          procedure_rating: procedureRating,
          hospital_rating: hospitalRating,
          gender,
          age_group: ageGroup,
          surgery_date: surgeryDate || undefined,
          content,
          images: finalImageUrls,
          user_id: user.id,
        });

        if (!result.success) {
          alert(
            t("form.procedureReviewUpdateFailed").replace(
              "{error}",
              result.error || ""
            )
          );
          return;
        }

        alert(t("form.procedureReviewUpdateSuccess"));
        onSubmit();
      } else {
        // 작성 모드
        // 먼저 후기 저장 (이미지 없이)
        // 사용자 화폐를 원화 만원 단위로 변환
        const costInKRWManwon = convertToKRWManwon(cost, currency);
        // 번역된 카테고리를 한국어 원본값으로 변환 (CHECK 제약조건 위반 방지)
        const koreanCategory = convertCategoryToKorean(category);

        console.log("=== [ProcedureReviewForm] category 변환 ===");
        console.log("원본 category (선택된 값):", category);
        console.log("변환된 koreanCategory:", koreanCategory);
        console.log("==========================================");

        const result = await saveProcedureReview({
          category: koreanCategory,
          procedure_name: finalProcedureName,
          hospital_name: hospitalName || undefined,
          cost: costInKRWManwon || undefined,
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
          alert(
            t("form.procedureReviewWriteFailed").replace(
              "{error}",
              result.error || ""
            )
          );
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
              .from("procedure_reviews")
              .update({ images: imageUrls })
              .eq("id", result.id);

            if (updateError) {
              console.error("이미지 URL 업데이트 실패:", updateError);
              // 이미지는 업로드되었지만 URL 업데이트 실패 - 경고만 표시
            }
          } catch (imageError: any) {
            console.error("이미지 업로드 실패:", imageError);
            alert(
              t("form.imageUploadError").replace(
                "{message}",
                imageError.message
              )
            );
            // 이미지 업로드 실패해도 후기는 저장됨
          }
        }

        // GTM 이벤트: review_submit (후기 저장 API 성공 응답 이후)
        trackReviewSubmit("treatment");

        alert(t("form.procedureReviewWriteSuccess"));
        onSubmit();
      }
    } catch (error: any) {
      console.error("시술후기 저장 오류:", error);
      alert(
        t("form.procedureReviewWriteError").replace(
          "{message}",
          error.message || ""
        )
      );
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
      {/* 시술 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.procedureCategory")} <span className="text-red-500">*</span>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main truncate"
          title={category || t("form.selectCategoryPlaceholder")}
        >
          <option value="">{t("form.selectCategoryPlaceholder")}</option>
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
          {t("form.procedureName")} <span className="text-red-500">*</span>
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
            // onChange에서는 procedureName을 업데이트하지 않음
            // 자동완성 선택 시에만 procedureName 업데이트
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
              // blur 시 procedureName이 없으면 현재 입력값을 저장 (직접 입력 허용)
              // 하지만 자동완성에서 선택한 경우에는 이미 procedureName이 설정되어 있으므로 덮어쓰지 않음
              if (procedureSearchTerm && !procedureName) {
                setProcedureName(procedureSearchTerm);
              }
            }, 200);
          }}
          placeholder={t("placeholder.procedureNameOnly")}
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
                    setProcedureName(suggestion);
                    setProcedureSearchTerm(suggestion);
                    setShowProcedureSuggestions(false);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
        label={t("form.overallSatisfactionLabel")}
      />

      {/* 병원 만족도 */}
      <StarRating
        rating={hospitalRating}
        onRatingChange={setHospitalRating}
        label={t("form.hospitalSatisfactionLabel")}
      />

      {/* 성별 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("label.gender")} <span className="text-red-500">*</span>
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
            {t("label.genderFemale")}
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
            {t("label.genderMale")}
          </button>
        </div>
      </div>

      {/* 연령 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("label.age")} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ageGroups.map((age) => (
            <button
              key={age.value}
              type="button"
              onClick={() => setAgeGroup(age.value)}
              className={`py-3 rounded-xl border-2 transition-colors ${
                ageGroup === age.value
                  ? "border-primary-main bg-primary-main/10 text-primary-main"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {age.label}
            </button>
          ))}
        </div>
      </div>

      {/* 비용(선택사항) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.costOptional")}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 text-lg font-medium">
            {currencySymbol}
          </span>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder={
              currency === "KRW"
                ? t("placeholder.surgeryCost")
                : language === "EN"
                ? "e.g., 1000"
                : language === "JP"
                ? "例: 100000"
                : "例如: 5000"
            }
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
            step={currency === "KRW" ? "1" : "0.01"}
          />
          <span className="text-gray-700 text-sm whitespace-nowrap">
            {currencyUnitText}
          </span>
        </div>
        {currency !== "KRW" && cost && (
          <p className="text-xs text-gray-500 mt-1">
            ≈ {convertToKRWManwon(cost, currency) || 0}만원 (
            {(
              (convertToKRWManwon(cost, currency) || 0) * 10000
            ).toLocaleString()}
            원)
          </p>
        )}
      </div>

      {/* 병원명 (선택사항) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.hospitalNameOptional")}
        </label>
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder={t("placeholder.hospitalNameInput")}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 시술 날짜 (선택사항) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.surgeryDateOptional")}
        </label>
        <div className="relative">
          <input
            type="date"
            value={surgeryDate}
            onChange={(e) => setSurgeryDate(e.target.value)}
            onClick={(e) => {
              const input = e.currentTarget as HTMLInputElement;
              if (input.showPicker) {
                input.showPicker();
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main cursor-pointer"
            style={{
              color: surgeryDate ? "inherit" : "transparent",
            }}
            placeholder=""
          />
          {!surgeryDate && (
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
          placeholder={t("placeholder.reviewContent")}
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
                <span className="text-xs text-gray-500">
                  {t("form.addPhoto")}
                </span>
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
