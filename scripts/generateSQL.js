// JSON 데이터를 SQL INSERT 문으로 변환하는 스크립트
// 사용법: node scripts/generateSQL.js

const fs = require("fs");
const path = require("path");

// JSON 파일 읽기
const dummyDataPath = path.join(
  __dirname,
  "../lib/dummyData/reviewDummyData.json"
);
const dummyData = JSON.parse(fs.readFileSync(dummyDataPath, "utf8"));

// SQL 이스케이프 함수
function escapeSQL(str) {
  if (str === null || str === undefined) return "NULL";
  return "'" + String(str).replace(/'/g, "''").replace(/\n/g, "\\n") + "'";
}

// 날짜 변환 함수
function formatDate(dateStr) {
  if (!dateStr) return "NULL";
  return `'${dateStr}'`;
}

// 배열 변환 함수
function formatArray(arr) {
  if (!arr || arr.length === 0) return "NULL";
  return `ARRAY[${arr.map((item) => escapeSQL(item)).join(", ")}]`;
}

let sql = `-- =========================================================
-- 더미데이터 삽입 SQL 스크립트
-- 생성일: ${new Date().toISOString()}
-- =========================================================
-- 
-- 사용 방법:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 아래 전체 SQL 복사하여 붙여넣기
-- 4. Run 버튼 클릭
--
-- =========================================================\n\n`;

// 1. 시술후기 삽입
sql += `-- =========================================================\n`;
sql += `-- 1. procedure_reviews (시술후기) 삽입\n`;
sql += `-- =========================================================\n\n`;

sql += `INSERT INTO procedure_reviews (user_id, category, procedure_name, hospital_name, cost, procedure_rating, hospital_rating, gender, age_group, surgery_date, content, images, created_at) VALUES\n`;

dummyData.procedure_reviews.forEach((item, index) => {
  const values = [
    item.user_id,
    escapeSQL(item.category),
    escapeSQL(item.procedure_name),
    item.hospital_name ? escapeSQL(item.hospital_name) : "NULL",
    item.cost,
    item.procedure_rating,
    item.hospital_rating,
    escapeSQL(item.gender),
    escapeSQL(item.age_group),
    item.surgery_date ? formatDate(item.surgery_date) : "NULL",
    escapeSQL(item.content),
    item.images ? formatArray(item.images) : "NULL",
    formatDate(item.created_at),
  ].join(", ");

  sql += `  (${values})`;
  if (index < dummyData.procedure_reviews.length - 1) {
    sql += ",\n";
  } else {
    sql += ";\n\n";
  }
});

// 2. 병원후기 삽입
sql += `-- =========================================================\n`;
sql += `-- 2. hospital_reviews (병원후기) 삽입\n`;
sql += `-- =========================================================\n\n`;

sql += `INSERT INTO hospital_reviews (user_id, hospital_name, category_large, procedure_name, visit_date, overall_satisfaction, hospital_kindness, has_translation, translation_satisfaction, content, images, created_at) VALUES\n`;

dummyData.hospital_reviews.forEach((item, index) => {
  const values = [
    item.user_id,
    escapeSQL(item.hospital_name),
    escapeSQL(item.category_large),
    item.procedure_name ? escapeSQL(item.procedure_name) : "NULL",
    item.visit_date ? formatDate(item.visit_date) : "NULL",
    item.overall_satisfaction !== null ? item.overall_satisfaction : "NULL",
    item.hospital_kindness !== null ? item.hospital_kindness : "NULL",
    item.has_translation ? "true" : "false",
    item.translation_satisfaction !== null
      ? item.translation_satisfaction
      : "NULL",
    escapeSQL(item.content),
    item.images ? formatArray(item.images) : "NULL",
    formatDate(item.created_at),
  ].join(", ");

  sql += `  (${values})`;
  if (index < dummyData.hospital_reviews.length - 1) {
    sql += ",\n";
  } else {
    sql += ";\n\n";
  }
});

// 3. 고민글 삽입
sql += `-- =========================================================\n`;
sql += `-- 3. concern_posts (고민글) 삽입\n`;
sql += `-- =========================================================\n\n`;

sql += `INSERT INTO concern_posts (user_id, title, concern_category, content, created_at) VALUES\n`;

dummyData.concern_posts.forEach((item, index) => {
  const values = [
    item.user_id,
    escapeSQL(item.title),
    escapeSQL(item.concern_category),
    escapeSQL(item.content),
    formatDate(item.created_at),
  ].join(", ");

  sql += `  (${values})`;
  if (index < dummyData.concern_posts.length - 1) {
    sql += ",\n";
  } else {
    sql += ";\n\n";
  }
});

sql += `-- =========================================================\n`;
sql += `-- 삽입 완료!\n`;
sql += `-- =========================================================\n`;
sql += `-- 시술후기: ${dummyData.procedure_reviews.length}개\n`;
sql += `-- 병원후기: ${dummyData.hospital_reviews.length}개\n`;
sql += `-- 고민글: ${dummyData.concern_posts.length}개\n`;
sql += `-- =========================================================\n`;

// SQL 파일 저장
const outputPath = path.join(__dirname, "../sql/insert_dummy_data.sql");
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, sql, "utf8");

console.log("✅ SQL 파일 생성 완료!");
console.log(`📁 파일 위치: ${outputPath}`);
console.log(`\n📊 삽입될 데이터:`);
console.log(`   - 시술후기: ${dummyData.procedure_reviews.length}개`);
console.log(`   - 병원후기: ${dummyData.hospital_reviews.length}개`);
console.log(`   - 고민글: ${dummyData.concern_posts.length}개`);
console.log(`\n💡 사용 방법:`);
console.log(`   1. Supabase 대시보드 > SQL Editor 접속`);
console.log(`   2. 생성된 SQL 파일 내용 복사`);
console.log(`   3. SQL Editor에 붙여넣기 후 Run 클릭`);
