import { createClient } from "@supabase/supabase-js";

console.log(
  "🔎 NEXT_PUBLIC_SUPABASE_URL =",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);
console.log(
  "🔎 NEXT_PUBLIC_SUPABASE_ANON_KEY =",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10)
);

// Supabase 클라이언트 생성
// 1순위: 환경 변수
// 2순위: 기존에 사용하던 하드코딩 값 (로컬/데모용 fallback)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jkvwtdjkylzxjzvgbwud.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprdnd0ZGpreWx6eGp6dmdid3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDMwNzgsImV4cCI6MjA4MTAxOTA3OH0.XdyU1XtDFY2Vauj_ddQ1mKqAjxjnNJts5pdW_Ob1TDI";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    "⚠️ Supabase 환경 변수가 설정되지 않아 기본값(데모용 키)으로 동작합니다. .env.local 및 Vercel 환경변수를 설정하는 것이 안전합니다."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
