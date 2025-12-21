import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "review_images"; // Supabase 버킷 이름과 정확히 일치해야 함

/**
 * 후기 이미지를 Supabase Storage에 업로드
 * @param file 업로드할 이미지 파일
 * @param reviewId 후기 ID (UUID)
 * @param imageIndex 이미지 인덱스 (0부터 시작)
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadReviewImage(
  file: File,
  reviewId: string,
  imageIndex: number
): Promise<string> {
  try {
    // Supabase 연결 확인
    console.log("=== Supabase 연결 확인 ===");
    console.log(
      "SUPABASE_URL =",
      process.env.NEXT_PUBLIC_SUPABASE_URL || "기본값 사용"
    );
    console.log("BUCKET_NAME =", BUCKET_NAME);

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop();
    if (!fileExt) {
      throw new Error("파일 확장자를 찾을 수 없습니다.");
    }

    // 파일명 생성: {reviewId}/{imageIndex}.{ext}
    const fileName = `${reviewId}/${imageIndex}.${fileExt}`;

    // 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false, // 중복 방지
        contentType: file.type, // 파일 타입 명시
      });

    // 업로드 결과 콘솔 출력 (디버깅용)
    console.log("=== 이미지 업로드 결과 ===");
    console.log("upload data:", uploadData);
    console.log("upload error:", uploadError);
    console.log("file name:", fileName);
    console.log("reviewId:", reviewId);
    console.log("imageIndex:", imageIndex);

    if (uploadError) {
      // 에러 상세 정보 출력 (JSON으로 변환하여 모든 속성 확인)
      console.error("=== 업로드 에러 상세 ===");
      console.error("uploadError raw =", uploadError);
      console.error("uploadError message =", uploadError.message);
      const statusCode = (uploadError as unknown as { statusCode?: number })
        ?.statusCode;
      if (statusCode !== undefined) {
        console.error("uploadError statusCode =", statusCode);
      }
      console.error("uploadError json =", JSON.stringify(uploadError, null, 2));
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    }

    if (uploadData?.path) {
      console.log("✅ 업로드 성공! 경로:", uploadData.path);
    } else {
      console.warn("⚠️ 업로드 데이터에 path가 없습니다:", uploadData);
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error("이미지 업로드 오류:", error);
    throw error;
  }
}

/**
 * 여러 이미지를 한 번에 업로드
 * @param files 업로드할 이미지 파일 배열
 * @param reviewId 후기 ID (UUID)
 * @returns 업로드된 이미지들의 공개 URL 배열
 */
export async function uploadReviewImages(
  files: File[],
  reviewId: string
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadReviewImage(file, reviewId, index)
    );

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error: any) {
    console.error("이미지 일괄 업로드 오류:", error);
    throw error;
  }
}

/**
 * 이미지 삭제
 * @param reviewId 후기 ID
 * @param imageIndex 이미지 인덱스 (선택사항, 없으면 모든 이미지 삭제)
 */
export async function deleteReviewImage(
  reviewId: string,
  imageIndex?: number
): Promise<void> {
  try {
    if (imageIndex !== undefined) {
      // 특정 이미지만 삭제
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list(reviewId);

      if (files && files.length > imageIndex) {
        const fileName = `${reviewId}/${imageIndex}.${files[imageIndex].name
          .split(".")
          .pop()}`;
        await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      }
    } else {
      // 모든 이미지 삭제
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list(reviewId);

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${reviewId}/${file.name}`);
        await supabase.storage.from(BUCKET_NAME).remove(filePaths);
      }
    }
  } catch (error: any) {
    console.error("이미지 삭제 오류:", error);
    throw error;
  }
}

/**
 * 이미지 URL이 Supabase Storage URL인지 확인
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes("supabase.co/storage");
}

/**
 * 이미지 URL에서 파일명 추출
 */
export function getImageFileName(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split("/").pop() || null;
  } catch {
    return null;
  }
}

/**
 * 고민글 이미지를 Supabase Storage에 업로드 (concern-images 버킷 사용)
 * @param file 업로드할 이미지 파일
 * @param postId 고민글 ID (UUID)
 * @param imageIndex 이미지 인덱스 (0부터 시작)
 * @returns 업로드된 이미지의 공개 URL (getPublicUrl 사용)
 */
export async function uploadConcernImage(
  file: File,
  postId: string,
  imageIndex: number
): Promise<string> {
  try {
    const CONCERN_BUCKET_NAME = "concern-images";

    console.log("=== 고민글 이미지 업로드 시작 ===");
    console.log("버킷 이름:", CONCERN_BUCKET_NAME);
    console.log("postId:", postId);
    console.log("imageIndex:", imageIndex);
    console.log("파일 이름:", file.name);
    console.log("파일 크기:", file.size);
    console.log("파일 타입:", file.type);

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop();
    if (!fileExt) {
      throw new Error("파일 확장자를 찾을 수 없습니다.");
    }

    // 파일명 생성: {postId}/{imageIndex}.{ext}
    const fileName = `${postId}/${imageIndex}.${fileExt}`;
    console.log("생성된 파일명:", fileName);

    // 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CONCERN_BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false, // 중복 방지
        contentType: file.type, // 파일 타입 명시
      });

    console.log("업로드 결과:", { uploadData, uploadError });

    if (uploadError) {
      console.error("=== 고민글 이미지 업로드 실패 상세 ===");
      console.error("에러 객체:", uploadError);
      console.error("에러 메시지:", uploadError.message);
      console.error("에러 상태 코드:", (uploadError as any)?.statusCode);
      console.error("에러 JSON:", JSON.stringify(uploadError, null, 2));
      
      // 버킷 존재 여부 확인을 위한 에러 메시지 추가
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        throw new Error(`Storage 버킷 '${CONCERN_BUCKET_NAME}'을(를) 찾을 수 없습니다. Supabase 대시보드에서 버킷을 생성해주세요.`);
      }
      
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    }

    if (uploadData?.path) {
      console.log("✅ 고민글 이미지 업로드 성공! 경로:", uploadData.path);
    } else {
      console.warn("⚠️ 업로드 데이터에 path가 없습니다:", uploadData);
    }

    // 공개 URL 가져오기 (반드시 getPublicUrl 사용 - 백엔드 요구사항)
    const {
      data: { publicUrl },
    } = supabase.storage.from(CONCERN_BUCKET_NAME).getPublicUrl(fileName);

    console.log("생성된 공개 URL:", publicUrl);
    console.log("=== 고민글 이미지 업로드 완료 ===");

    return publicUrl;
  } catch (error: any) {
    console.error("=== 고민글 이미지 업로드 오류 (catch 블록) ===");
    console.error("에러 타입:", typeof error);
    console.error("에러 객체:", error);
    console.error("에러 메시지:", error?.message);
    console.error("에러 스택:", error?.stack);
    throw error;
  }
}

/**
 * 여러 고민글 이미지를 한 번에 업로드 (concern-images 버킷 사용)
 * @param files 업로드할 이미지 파일 배열
 * @param postId 고민글 ID (UUID)
 * @returns 업로드된 이미지들의 공개 URL 배열 (getPublicUrl 사용)
 */
export async function uploadConcernImages(
  files: File[],
  postId: string
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadConcernImage(file, postId, index)
    );

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error: any) {
    console.error("고민글 이미지 일괄 업로드 오류:", error);
    throw error;
  }
}
