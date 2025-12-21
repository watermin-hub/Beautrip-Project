/**
 * DeepL API를 사용한 번역 유틸리티
 */

export type LanguageCode = "KR" | "EN" | "JP" | "CN";

/**
 * 텍스트를 번역합니다 (자동 언어 감지)
 * @param text 번역할 텍스트
 * @param targetLang 목표 언어 코드
 * @param sourceLang 원본 언어 코드 (null이면 자동 감지)
 * @returns 번역된 텍스트와 감지된 원본 언어
 */
export async function translateText(
  text: string,
  targetLang: LanguageCode,
  sourceLang: LanguageCode | null = null
): Promise<{ text: string; detectedSourceLang?: string }> {
  // 빈 텍스트는 그대로 반환
  if (!text || text.trim().length === 0) {
    return { text };
  }

  try {
    // Next.js API Route를 통해 서버 사이드에서 번역
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("번역 API 오류:", response.status, errorData);
      // 오류 발생 시 원본 텍스트 반환
      return { text };
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("번역 오류:", data.error);
      return { text };
    }

    return {
      text: data.text || text,
      detectedSourceLang: data.detectedSourceLang,
    };
  } catch (error) {
    console.error("번역 중 오류 발생:", error);
    // 오류 발생 시 원본 텍스트 반환
    return { text };
  }
}

/**
 * 여러 텍스트를 한 번에 번역합니다
 * @param texts 번역할 텍스트 배열
 * @param targetLang 목표 언어 코드
 * @param sourceLang 원본 언어 코드 (null이면 자동 감지)
 * @returns 번역된 텍스트 배열
 */
export async function translateMultiple(
  texts: string[],
  targetLang: LanguageCode,
  sourceLang: LanguageCode | null = null
): Promise<string[]> {
  // 빈 배열은 그대로 반환
  if (texts.length === 0) {
    return texts;
  }

  try {
    // Next.js API Route를 통해 여러 텍스트를 한 번에 번역
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts,
        targetLang,
        sourceLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("번역 API 오류:", response.status, errorData);
      // 오류 발생 시 원본 텍스트 반환
      return texts;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("번역 오류:", data.error);
      return texts;
    }

    return data.texts || texts;
  } catch (error) {
    console.error("번역 중 오류 발생:", error);
    // 오류 발생 시 원본 텍스트 반환
    return texts;
  }
}

/**
 * 텍스트가 특정 언어로 작성되었는지 간단히 확인
 * @param text 확인할 텍스트
 * @returns 감지된 언어 코드 (KR, EN, JP, CN 중 하나 또는 null)
 */
export function detectLanguage(text: string): LanguageCode | null {
  if (!text || text.trim().length === 0) return null;

  // 한국어 감지
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  if (koreanRegex.test(text)) return "KR";

  // 일본어 감지 (히라가나, 가타카나, 한자)
  const japaneseRegex = /[ひらがなカタカナ一-龯]/;
  if (japaneseRegex.test(text)) return "JP";

  // 중국어 감지 (간체/번체 한자)
  const chineseRegex = /[一-龯]/;
  if (chineseRegex.test(text) && !koreanRegex.test(text)) return "CN";

  // 영어 (기본값, 다른 언어가 감지되지 않으면)
  // 주의: 영어는 다른 언어와 혼합될 수 있으므로 정확하지 않을 수 있음
  return "EN";
}

/**
 * 텍스트가 특정 언어로 작성되었는지 간단히 확인 (한국어 기준)
 * @param text 확인할 텍스트
 * @returns 한국어일 가능성이 높으면 true
 */
export function isKoreanText(text: string): boolean {
  return detectLanguage(text) === "KR";
}

/**
 * DeepL 감지 언어 코드를 우리 LanguageCode로 변환
 */
export function mapDeepLLangToLanguageCode(deepLLang: string): LanguageCode | null {
  const langMap: Record<string, LanguageCode> = {
    KO: "KR",
    EN: "EN",
    JA: "JP",
    ZH: "CN",
  };
  return langMap[deepLLang] || null;
}

