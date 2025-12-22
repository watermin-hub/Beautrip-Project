const fs = require('fs');
const path = require('path');

// 한국어 문자를 포함하는 정규식 (한글, 공백, 구두점 포함)
const koreanRegex = /[가-힣]+[가-힣\s.,!?;:()]*/g;

// 번역 키 사용 패턴 (t("..."), t('...'))
const translationKeyPattern = /t\(["']([^"']+)["']\)/g;

// 제외할 패턴들 (주석, import, 타입 정의 등)
const excludePatterns = [
  /^[\s]*\/\//,  // 주석
  /^[\s]*\/\*/,  // 블록 주석 시작
  /^[\s]*\*/,    // 블록 주석 내부
  /^[\s]*import/, // import 문
  /^[\s]*export/, // export 문
  /^[\s]*type\s/, // type 정의
  /^[\s]*interface\s/, // interface 정의
  /console\.(log|error|warn)/, // console.log 등
  /\/\*[\s\S]*?\*\//, // 블록 주석 전체
  /\/\/.*/, // 라인 주석
];

// 제외할 파일/디렉토리
const excludeDirs = ['node_modules', '.next', 'scripts', 'sql', 'docs', 'types'];
const excludeFiles = ['LanguageContext.tsx']; // 번역 파일 자체는 제외

// 번역 키 목록 추출
function extractTranslationKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set();
  
  // KR 섹션에서 번역 키 추출
  const krSectionMatch = content.match(/KR:\s*\{([\s\S]*?)\},/);
  if (krSectionMatch) {
    const krSection = krSectionMatch[1];
    const keyMatches = krSection.matchAll(/"([^"]+)":\s*"[^"]*"/g);
    for (const match of keyMatches) {
      keys.add(match[1]);
    }
  }
  
  return keys;
}

// 파일에서 하드코딩된 한국어 텍스트 찾기
function findHardcodedKorean(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  // 사용된 번역 키 추출
  const usedKeys = new Set();
  let match;
  while ((match = translationKeyPattern.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
  
  lines.forEach((line, index) => {
    // 제외 패턴 체크
    const shouldExclude = excludePatterns.some(pattern => pattern.test(line));
    if (shouldExclude) return;
    
    // 문자열 리터럴 내의 한국어 찾기
    const stringMatches = line.matchAll(/(["'`])((?:(?=(\\?))\3.)*?)\1/g);
    
    for (const match of stringMatches) {
      const stringContent = match[2];
      const koreanMatches = stringContent.match(koreanRegex);
      
      if (koreanMatches) {
        // 번역 키 사용 여부 확인
        const hasTranslationKey = line.includes('t(') || line.includes('useLanguage');
        
        // 이미 번역 키로 사용된 경우는 제외
        const isTranslationKey = line.match(/["']([^"']+)["']\s*:\s*"/);
        
        if (!hasTranslationKey && !isTranslationKey) {
          koreanMatches.forEach(koreanText => {
            // 너무 짧은 텍스트는 제외 (1-2자)
            if (koreanText.trim().length < 2) return;
            
            // 일반적인 변수명이나 클래스명은 제외
            if (/^[가-힣]{1,2}$/.test(koreanText.trim())) return;
            
            issues.push({
              file: filePath,
              line: index + 1,
              text: koreanText.trim(),
              context: line.trim(),
            });
          });
        }
      }
    }
  });
  
  return issues;
}

// 모든 TypeScript/TSX 파일 찾기
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!excludeFiles.includes(file)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// 메인 실행
function main() {
  const projectRoot = path.join(__dirname, '..');
  const componentsDir = path.join(projectRoot, 'components');
  const appDir = path.join(projectRoot, 'app');
  const languageContextPath = path.join(projectRoot, 'contexts', 'LanguageContext.tsx');
  
  console.log('🔍 번역 키 누락 검사 시작...\n');
  
  // 번역 키 목록 로드
  const translationKeys = extractTranslationKeys(languageContextPath);
  console.log(`📚 등록된 번역 키: ${translationKeys.size}개\n`);
  
  // 파일 목록 수집
  const files = [
    ...findTsxFiles(componentsDir),
    ...findTsxFiles(appDir),
  ];
  
  console.log(`📁 검사할 파일: ${files.length}개\n`);
  
  // 모든 파일 검사
  const allIssues = [];
  files.forEach(file => {
    const issues = findHardcodedKorean(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
  });
  
  // 결과 출력
  console.log('='.repeat(80));
  console.log(`⚠️  발견된 하드코딩된 한국어 텍스트: ${allIssues.length}개\n`);
  
  if (allIssues.length === 0) {
    console.log('✅ 번역 키 누락이 없습니다!');
    return;
  }
  
  // 파일별로 그룹화
  const issuesByFile = {};
  allIssues.forEach(issue => {
    const relativePath = path.relative(projectRoot, issue.file);
    if (!issuesByFile[relativePath]) {
      issuesByFile[relativePath] = [];
    }
    issuesByFile[relativePath].push(issue);
  });
  
  // 리포트 출력
  Object.keys(issuesByFile).sort().forEach(file => {
    console.log(`\n📄 ${file}`);
    console.log('-'.repeat(80));
    
    issuesByFile[file].forEach(issue => {
      console.log(`  Line ${issue.line}: "${issue.text}"`);
      console.log(`  Context: ${issue.context.substring(0, 100)}${issue.context.length > 100 ? '...' : ''}`);
      console.log('');
    });
  });
  
  // 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 요약:');
  console.log(`  - 검사한 파일: ${files.length}개`);
  console.log(`  - 문제가 있는 파일: ${Object.keys(issuesByFile).length}개`);
  console.log(`  - 하드코딩된 텍스트: ${allIssues.length}개`);
  console.log('\n💡 제안:');
  console.log('  1. 발견된 텍스트를 LanguageContext.tsx에 번역 키로 추가하세요');
  console.log('  2. 하드코딩된 텍스트를 t("translation.key") 형태로 변경하세요');
  console.log('  3. 모든 언어(EN, JP, CN)에 번역을 추가하세요\n');
  
  // JSON 리포트 생성
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    totalIssues: allIssues.length,
    translationKeysCount: translationKeys.size,
    issues: issuesByFile,
  };
  
  const reportPath = path.join(projectRoot, 'translation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📝 상세 리포트 저장: ${reportPath}`);
}

main();

