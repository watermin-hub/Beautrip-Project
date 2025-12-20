/**
 * DeepL API를 사용한 번역 유틸리티
 */

export type LanguageCode = "KR" | "EN" | "JP" | "CN";

// DeepL 언어 코드 매핑
const DEEPL_LANGUAGE_MAP: Record<LanguageCode, string> = {
  KR: "KO",
  EN: "EN",
  JP: "JA",
  CN: "ZH",
};

// DeepL API 엔드포인트
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

/**
 * 텍스트를 번역합니다
 * @param text 번역할 텍스트
 * @param targetLang 목표 언어 코드
 * @param sourceLang 원본 언어 코드 (자동 감지 시 null)
 * @returns 번역된 텍스트
 */
export async function translateText(
  text: string,
  targetLang: LanguageCode,
  sourceLang: LanguageCode | null = null
): Promise<string> {
  // API 키 확인
  const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
  if (!apiKey) {
    console.warn("DeepL API 키가 설정되지 않았습니다. 원본 텍스트를 반환합니다.");
    return text;
  }

  // 빈 텍스트는 그대로 반환
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    // DeepL 언어 코드로 변환
    const targetLangCode = DEEPL_LANGUAGE_MAP[targetLang];
    if (!targetLangCode) {
      console.warn(`지원하지 않는 언어 코드: ${targetLang}`);
      return text;
    }

    // 요청 파라미터 구성
    const params = new URLSearchParams({
      auth_key: apiKey,
      text: text,
      target_lang: targetLangCode,
    });

    // 소스 언어가 지정된 경우 추가
    if (sourceLang && sourceLang !== targetLang) {
      const sourceLangCode = DEEPL_LANGUAGE_MAP[sourceLang];
      if (sourceLangCode) {
        params.append("source_lang", sourceLangCode);
      }
    }

    // API 호출
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepL API 오류:", response.status, errorText);
      throw new Error(`번역 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // DeepL API 응답 형식: { translations: [{ text: "번역된 텍스트", detected_source_language: "KO" }] }
    if (data.translations && data.translations.length > 0) {
      return data.translations[0].text;
    }

    return text;
  } catch (error) {
    console.error("번역 중 오류 발생:", error);
    // 오류 발생 시 원본 텍스트 반환
    return text;
  }
}

/**
 * 여러 텍스트를 한 번에 번역합니다
 * @param texts 번역할 텍스트 배열
 * @param targetLang 목표 언어 코드
 * @param sourceLang 원본 언어 코드
 * @returns 번역된 텍스트 배열
 */
export async function translateMultiple(
  texts: string[],
  targetLang: LanguageCode,
  sourceLang: LanguageCode | null = null
): Promise<string[]> {
  // API 키 확인
  const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
  if (!apiKey) {
    console.warn("DeepL API 키가 설정되지 않았습니다. 원본 텍스트를 반환합니다.");
    return texts;
  }

  // 빈 배열은 그대로 반환
  if (texts.length === 0) {
    return texts;
  }

  try {
    // DeepL 언어 코드로 변환
    const targetLangCode = DEEPL_LANGUAGE_MAP[targetLang];
    if (!targetLangCode) {
      console.warn(`지원하지 않는 언어 코드: ${targetLang}`);
      return texts;
    }

    // 요청 파라미터 구성
    const params = new URLSearchParams({
      auth_key: apiKey,
      target_lang: targetLangCode,
    });

    // 소스 언어가 지정된 경우 추가
    if (sourceLang && sourceLang !== targetLang) {
      const sourceLangCode = DEEPL_LANGUAGE_MAP[sourceLang];
      if (sourceLangCode) {
        params.append("source_lang", sourceLangCode);
      }
    }

    // 여러 텍스트를 한 번에 전송
    texts.forEach((text) => {
      params.append("text", text);
    });

    // API 호출
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepL API 오류:", response.status, errorText);
      throw new Error(`번역 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // DeepL API 응답 형식: { translations: [{ text: "번역1" }, { text: "번역2" }] }
    if (data.translations && data.translations.length > 0) {
      return data.translations.map((t: any) => t.text);
    }

    return texts;
  } catch (error) {
    console.error("번역 중 오류 발생:", error);
    // 오류 발생 시 원본 텍스트 반환
    return texts;
  }
}

/**
 * 텍스트가 특정 언어로 작성되었는지 간단히 확인 (한국어 기준)
 * @param text 확인할 텍스트
 * @returns 한국어일 가능성이 높으면 true
 */
export function isKoreanText(text: string): boolean {
  // 한글이 포함되어 있는지 확인
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koreanRegex.test(text);
}

