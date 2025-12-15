import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성
// 환경 변수에서 URL과 API Key를 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요."
  );
}

// 환경 변수가 없을 때는 createClient를 호출하지 않아 런타임 에러를 막고,
// 대신 supabase를 null(any)로 내보냅니다. 실제 Supabase 기능을 쓰려면
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 반드시 설정해야 합니다.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any);
