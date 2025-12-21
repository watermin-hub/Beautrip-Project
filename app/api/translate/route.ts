import { NextRequest, NextResponse } from "next/server";

// DeepL 언어 코드 매핑
const DEEPL_LANGUAGE_MAP: Record<string, string> = {
  KR: "KO",
  EN: "EN",
  JP: "JA",
  CN: "ZH",
};

// DeepL API 엔드포인트
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLang, sourceLang } = body;

    // API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DeepL API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 여러 텍스트 번역 모드
    if (texts && Array.isArray(texts)) {
      // 빈 배열은 그대로 반환
      if (texts.length === 0) {
        return NextResponse.json({ texts: [] });
      }

      // DeepL 언어 코드로 변환
      const targetLangCode = DEEPL_LANGUAGE_MAP[targetLang];
      if (!targetLangCode) {
        return NextResponse.json(
          { error: `지원하지 않는 언어 코드: ${targetLang}` },
          { status: 400 }
        );
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
      texts.forEach((t: string) => {
        if (t && t.trim().length > 0) {
          params.append("text", t);
        }
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
        return NextResponse.json(
          { error: `번역 실패: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();

      // DeepL API 응답 형식: { translations: [{ text: "번역1" }, { text: "번역2" }] }
      if (data.translations && data.translations.length > 0) {
        return NextResponse.json({
          texts: data.translations.map((t: any) => t.text),
        });
      }

      return NextResponse.json({ texts });
    }

    // 단일 텍스트 번역 모드
    // 빈 텍스트는 그대로 반환
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ text, detectedSourceLang: null });
    }

    // DeepL 언어 코드로 변환
    const targetLangCode = DEEPL_LANGUAGE_MAP[targetLang];
    if (!targetLangCode) {
      return NextResponse.json(
        { error: `지원하지 않는 언어 코드: ${targetLang}` },
        { status: 400 }
      );
    }

    // 요청 파라미터 구성
    const params = new URLSearchParams({
      auth_key: apiKey,
      text: text,
      target_lang: targetLangCode,
    });

    // 소스 언어가 지정된 경우에만 추가 (null이면 자동 감지)
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
      return NextResponse.json(
        { error: `번역 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // DeepL API 응답 형식: { translations: [{ text: "번역된 텍스트", detected_source_language: "KO" }] }
    if (data.translations && data.translations.length > 0) {
      const translation = data.translations[0];
      return NextResponse.json({
        text: translation.text,
        detectedSourceLang: translation.detected_source_language,
      });
    }

    return NextResponse.json({ text, detectedSourceLang: null });
  } catch (error) {
    console.error("번역 중 오류 발생:", error);
    return NextResponse.json(
      { error: "번역 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

