import { supabase } from "../supabase";

/**
 * DataURL(base64)를 Blob으로 변환
 */
function dataURLToBlob(dataURL: string): Blob {
  const [header, base64] = dataURL.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * 얼굴 이미지를 Supabase Storage에 업로드
 * @param imageData - DataURL 형식의 이미지 데이터
 * @returns 업로드된 파일 경로
 */
export async function uploadFaceImageToStorage(
  imageData: string
): Promise<{ filePath: string }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error("로그인이 필요합니다.");

  const blob = dataURLToBlob(imageData);

  // 필수 규칙: ${uid}/... 형식으로 경로 생성
  const filePath = `${userId}/face_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("face-images")
    .upload(filePath, blob, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;

  return { filePath };
}











