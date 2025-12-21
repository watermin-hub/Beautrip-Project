// Supabase에 더미데이터 삽입 스크립트
// 사용법: node scripts/insertDummyData.js

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Supabase 클라이언트 생성
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jkvwtdjkylzxjzvgbwud.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprdnd0ZGpreWx6eGp6dmdid3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDMwNzgsImV4cCI6MjA4MTAxOTA3OH0.XdyU1XtDFY2Vauj_ddQ1mKqAjxjnNJts5pdW_Ob1TDI";

const supabase = createClient(supabaseUrl, supabaseKey);

// JSON 파일 읽기
const dummyDataPath = path.join(
  __dirname,
  "../lib/dummyData/reviewDummyData.json"
);
const dummyData = JSON.parse(fs.readFileSync(dummyDataPath, "utf8"));

async function insertDummyData() {
  console.log("🚀 더미데이터 삽입 시작...\n");

  // 1. 시술후기 삽입
  console.log("📝 시술후기 삽입 중...");
  const { data: procedureData, error: procedureError } = await supabase
    .from("procedure_reviews")
    .insert(dummyData.procedure_reviews)
    .select();

  if (procedureError) {
    console.error("❌ 시술후기 삽입 실패:", procedureError);
  } else {
    console.log(`✅ 시술후기 ${procedureData.length}개 삽입 완료`);
  }

  // 2. 병원후기 삽입
  console.log("\n🏥 병원후기 삽입 중...");
  const { data: hospitalData, error: hospitalError } = await supabase
    .from("hospital_reviews")
    .insert(dummyData.hospital_reviews)
    .select();

  if (hospitalError) {
    console.error("❌ 병원후기 삽입 실패:", hospitalError);
  } else {
    console.log(`✅ 병원후기 ${hospitalData.length}개 삽입 완료`);
  }

  // 3. 고민글 삽입
  console.log("\n💭 고민글 삽입 중...");
  const { data: concernData, error: concernError } = await supabase
    .from("concern_posts")
    .insert(dummyData.concern_posts)
    .select();

  if (concernError) {
    console.error("❌ 고민글 삽입 실패:", concernError);
  } else {
    console.log(`✅ 고민글 ${concernData.length}개 삽입 완료`);
  }

  console.log("\n🎉 모든 더미데이터 삽입 완료!");
  console.log(`\n📊 삽입 요약:`);
  console.log(`   - 시술후기: ${procedureData?.length || 0}개`);
  console.log(`   - 병원후기: ${hospitalData?.length || 0}개`);
  console.log(`   - 고민글: ${concernData?.length || 0}개`);
}

// 스크립트 실행
insertDummyData().catch(console.error);
