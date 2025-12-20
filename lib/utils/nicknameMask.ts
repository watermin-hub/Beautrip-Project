/**
 * 닉네임 마스킹 함수
 * 뒷글자 3자리를 "*"로 처리합니다.
 * 
 * @param nickname - 마스킹할 닉네임
 * @returns 마스킹된 닉네임 (예: "홍길동" -> "홍***", "user123" -> "user***")
 */
export function maskNickname(nickname: string | null | undefined): string {
  if (!nickname || nickname === "익명") {
    return "익명";
  }

  // 닉네임이 3자 이하인 경우 전체를 마스킹
  if (nickname.length <= 3) {
    return "*".repeat(nickname.length);
  }

  // 뒷글자 3자리를 "*"로 마스킹
  const visiblePart = nickname.slice(0, nickname.length - 3);
  const maskedPart = "***";
  
  return visiblePart + maskedPart;
}

