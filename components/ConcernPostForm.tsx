"use client";

import { useState, useEffect } from "react";
import { FiArrowLeft, FiX, FiCamera } from "react-icons/fi";
import Image from "next/image";
import { saveConcernPost, updateConcernPost } from "@/lib/api/beautripApi";
import { supabase } from "@/lib/supabase";
import { uploadConcernImages } from "@/lib/api/imageUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackReviewSubmit } from "@/lib/gtm";

interface ConcernPostFormProps {
  onBack: () => void;
  onSubmit: () => void;
  onLoginRequired?: (data: any) => void; // 로그인 필요 시 콜백
  draftData?: any; // 중간 저장된 리뷰 데이터
  editData?: any; // 수정할 데이터 (선택적)
}

export default function ConcernPostForm({
  onBack,
  onSubmit,
  onLoginRequired,
  draftData,
  editData,
}: ConcernPostFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [concernCategory, setConcernCategory] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // editData가 있으면 폼 필드 채우기
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setConcernCategory(editData.concern_category || "");
      setContent(editData.content || "");
      // 기존 이미지가 있으면 표시 (URL 배열)
      if (editData.image_paths && Array.isArray(editData.image_paths)) {
        setImages(editData.image_paths);
      } else if (editData.images && Array.isArray(editData.images)) {
        setImages(editData.images);
      }
    }
  }, [editData]);

  // 중간 저장된 리뷰 불러오기
  useEffect(() => {
    if (draftData && !editData) {
      setTitle(draftData.title || "");
      setConcernCategory(draftData.concern_category || "");
      setContent(draftData.content || "");
      if (draftData.image_paths && Array.isArray(draftData.image_paths)) {
        setImages(draftData.image_paths);
      } else if (draftData.images && Array.isArray(draftData.images)) {
        setImages(draftData.images);
      }
      // 불러온 후 로컬 스토리지에서 삭제
      localStorage.removeItem("review_draft_concern");
    }
  }, [draftData, editData]);

  // 커뮤니티 - 고민상담소 카테고리 (번역 지원)
  const concernCategories = [
    { key: "concernCategory.skinConcern", value: "피부 고민" },
    { key: "concernCategory.procedureConcern", value: "시술 고민" },
    { key: "concernCategory.hospitalSelection", value: "병원 선택" },
    { key: "concernCategory.priceInquiry", value: "가격 문의" },
    { key: "concernCategory.recoveryPeriod", value: "회복 기간" },
    { key: "concernCategory.sideEffect", value: "부작용" },
    { key: "concernCategory.other", value: "기타" },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...files].slice(0, 4);
      setImageFiles(newFiles);
      const newImages = newFiles.map((file) => URL.createObjectURL(file));
      setImages(newImages);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    // URL 해제
    URL.revokeObjectURL(images[index]);
    const newImages = images.filter((_, i) => i !== index);
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
        title,
        concern_category: concernCategory,
        content,
        images,
      };
      
      if (onLoginRequired) {
        onLoginRequired(reviewData);
        return;
      } else {
        alert(t("form.loginRequiredConcern"));
        return;
      }
    }

    // 필수 항목 검증
    if (!title || !concernCategory || content.length < 10) {
      alert(t("form.requiredFields"));
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
            imageUrls = await uploadConcernImages(imageFiles, editData.id);
          } catch (imageError: any) {
            console.error("이미지 업로드 실패:", imageError);
            alert(`이미지 업로드에 실패했습니다: ${imageError.message}`);
            return;
          }
        } else {
          // 새 이미지가 없으면 기존 이미지 유지
          imageUrls = editData.image_paths || editData.images || undefined;
        }

        // 기존 이미지와 새 이미지 합치기
        const existingImageUrls = (editData.image_paths || editData.images || []).filter((img: string) => 
          img && (img.startsWith("http") || img.startsWith("/"))
        );
        const finalImageUrls = imageUrls || existingImageUrls;

        const result = await updateConcernPost(editData.id, {
          title,
          concern_category: concernCategory,
          content,
          image_paths: finalImageUrls,
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
        // 먼저 고민글 저장 (이미지 없이 빈 배열로 저장)
        const result = await saveConcernPost({
          title,
          concern_category: concernCategory,
          content,
          image_paths: [], // 이미지 없이 저장할 때는 빈 배열
          user_id: user.id, // Supabase Auth UUID
        });

        if (!result.success || !result.id) {
          alert(`${t("form.saveFailed")}: ${result.error}`);
          return;
        }

        // GTM: 후기 제출 이벤트 (일반 후기)
        trackReviewSubmit("general");

        // 이미지가 있으면 업로드 (concern-images 버킷 사용)
        let imageUrls: string[] | undefined = undefined;
        if (imageFiles.length > 0 && result.id) {
          try {
            imageUrls = await uploadConcernImages(imageFiles, result.id);

            // 이미지 URL로 업데이트
            const { error: updateError } = await supabase
              .from("concern_posts")
              .update({ image_paths: imageUrls })
              .eq("id", result.id);

            if (updateError) {
              console.error("이미지 URL 업데이트 실패:", updateError);
              // 이미지 업로드는 실패했지만 글은 저장되었으므로 경고만 표시
              alert(t("form.imageUploadFailed"));
            }
          } catch (imageError: any) {
            console.error("이미지 업로드 오류:", imageError);
            const errorMessage = imageError?.message || imageError?.toString() || "알 수 없는 오류";
            console.error("에러 상세:", {
              message: imageError?.message,
              error: imageError,
              stack: imageError?.stack,
            });
            alert(`고민글은 저장되었지만 이미지 업로드에 실패했습니다.\n오류: ${errorMessage}\n\nSupabase Storage의 concern-images 버킷이 존재하고 권한이 설정되어 있는지 확인해주세요.`);
          }
        }

        alert(t("form.saveSuccess"));
        onSubmit();
      }
    } catch (error: any) {
      console.error("고민글 저장 오류:", error);
      alert(`${t("form.errorOccurred")}: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.concernTitle")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("form.concernTitlePlaceholder")}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      {/* 고민 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.concernCategory")} <span className="text-red-500">*</span>
        </label>
        <select
          value={concernCategory}
          onChange={(e) => setConcernCategory(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="">{t("form.selectConcernCategory")}</option>
          {concernCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {t(cat.key)}
            </option>
          ))}
        </select>
      </div>

      {/* 고민 글 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("form.concernContent")} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("form.concernContentPlaceholder")}
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}
          {t("form.minCharacters")}
        </p>
      </div>

      {/* 사진첨부 (비필수) */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FiCamera className="text-primary-main" />
          {t("form.photoAttachmentOptional")}
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
                unoptimized
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
